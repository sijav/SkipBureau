#!/usr/bin/env python3
"""Ask another model to tear this work apart, honestly.

Three kinds of roast, one script:

  task       what was just built, by codex/terra, falling back to claude
  technical  the shape of the codebase after a run of big tasks, by claude/opus
  search     a question about the outside world, by codex/terra

Each kind keeps its own conversation, so the reviewer remembers what it already
said about this project instead of meeting it fresh every time.

  python .claude/skills/roast/roast.py task \
      --title "SB-002 Web app scaffold" \
      --did "what I actually did, honestly" \
      --files "$(git diff --name-only HEAD~1)" \
      --ask "does the vitest storybook project actually run the stories?" \
      --ask "is the theme wired so a component cannot reach a raw hex?"

  python .claude/skills/roast/roast.py technical --did "..." --ask "..."
  python .claude/skills/roast/roast.py search --ask "which free hosts run a NestJS API in 2026?"

The answer lands in .claude/roast-result.md, rewritten every run. Session ids
live in .claude/roast-sessions.json. Both are ignored by git.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CLAUDE_DIR = REPO / ".claude"
RESULT = CLAUDE_DIR / "roast-result.md"
SESSIONS = CLAUDE_DIR / "roast-sessions.json"

# How long to stop trying codex after it has told us it is out of quota. Codex
# limits reset on a rolling window, so there is no point asking again for a
# while, and every attempt costs a slow round trip before it fails.
CODEX_COOLDOWN_SECONDS = 30 * 60

TIMEOUT_SECONDS = 900


# --------------------------------------------------------------------------
# What each kind of roast is for, and who does it
# --------------------------------------------------------------------------

MODES = {
    "task": {
        "session": "task",
        # terra medium is the default reviewer. gpt high, then sonnet medium,
        # are the reserves, in that order.
        "chain": [
            ("codex", "gpt-5.6-terra", "medium"),
            ("codex", "gpt-5.6", "high"),
            ("claude", "sonnet", "medium"),
        ],
        "role": (
            "You are reviewing one unit of work in the SkipBureau repository, which is a "
            "step-by-step guide to bureaucracy abroad for travellers and expats. Be adversarial "
            "and specific. Your job is to find what is WRONG, not to summarise what was done."
        ),
        "standing_questions": [
            "Is this implemented correctly against the logic it was supposed to follow?",
            "Is it written DRY, or is it repeating itself? And where it is DRY, has it been "
            "abstracted too early, so that it should be broken apart instead?",
            "What does it claim, in comments, names, docs or commit message, that is not true?",
        ],
    },
    "technical": {
        "session": "technical",
        # Claude, opus, and no fallback. If opus is unavailable this fails
        # rather than quietly answering with something smaller, because the
        # whole point of this kind is the depth of the reviewer.
        "chain": [("claude", "opus", "high")],
        "role": (
            "You are reviewing the SkipBureau codebase as a whole, after a run of large tasks, "
            "not one change in isolation. Judge the technical shape of it: architecture, "
            "boundaries, data flow, coupling, the cost of the next change. Be adversarial."
        ),
        "standing_questions": [
            "Where is this codebase going to hurt in three months, and what is the cheapest "
            "change now that avoids it?",
            "Which abstractions are earning their keep, and which are ceremony?",
            "Where do the boundaries leak: does the UI know about the database, does the "
            "transport shape leak into components, does country leak in as a constant?",
            "What would a competent engineer joining this repository misunderstand first?",
        ],
    },
    "search": {
        "session": "search",
        "chain": [
            ("codex", "gpt-5.6-terra", "medium"),
            ("codex", "gpt-5.6", "high"),
            ("claude", "sonnet", "medium"),
        ],
        "role": (
            "You are answering a research question for the SkipBureau project. Answer the "
            "question and nothing else. Do not review code, do not suggest work, do not "
            "comment on the repository."
        ),
        "standing_questions": [],
    },
}

# The instruction that makes the answer worth reading. Without it the reply is
# the first plausible thing the model thought of.
SELF_ROAST = """
Before you answer, roast your own draft, and do it privately.

1. Write your findings.
2. Then attack them. Which did you assert without opening the file? Which are
   style dressed up as defects? Which would you have written about any codebase,
   without reading this one? Which did you soften because it sounded harsh?
3. Throw those out, and keep only what survives.

Report only what survived. A short honest review beats a long thorough-looking
one. If you genuinely found nothing, say so and say exactly what you checked and
how you tried to break it, so someone can tell the difference between nothing
being wrong and you not having looked.

Never invent a problem to look useful. A false finding costs more than a missed
one, because someone will go and fix it.
"""


# --------------------------------------------------------------------------
# Sessions
# --------------------------------------------------------------------------


def load_sessions() -> dict:
    try:
        return json.loads(SESSIONS.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def save_sessions(state: dict) -> None:
    CLAUDE_DIR.mkdir(parents=True, exist_ok=True)
    SESSIONS.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


def codex_is_available(state: dict) -> tuple[bool, str]:
    """Whether it is worth trying codex at all, right now.

    Two questions: is the binary here, and did it recently tell us we are out of
    quota. The second is the one the owner asked for: check the clock before
    burning a slow round trip on a call that will be refused.
    """
    blocked_until = state.get("codex_blocked_until", 0)
    if blocked_until > time.time():
        minutes = int((blocked_until - time.time()) // 60) + 1
        return False, f"codex was rate limited recently, {minutes} minute(s) left on the cooldown"

    try:
        subprocess.run(["codex", "--version"], capture_output=True, timeout=30, shell=True, check=True)
    except (OSError, subprocess.SubprocessError):
        return False, "the codex CLI is not on PATH"

    return True, ""


RATE_LIMITED = re.compile(
    r"rate.?limit|quota|too many requests|429|usage limit|try again (later|in)", re.IGNORECASE
)


# --------------------------------------------------------------------------
# Running a reviewer
# --------------------------------------------------------------------------


def run_codex(model: str, effort: str, prompt: str, session_id: str | None) -> tuple[bool, str, str | None]:
    """Returns (ok, output, session_id)."""
    last_message = CLAUDE_DIR / "roast-last-message.tmp"
    last_message.unlink(missing_ok=True)

    if session_id:
        argv = ["codex", "exec", "resume", session_id, "-"]
    else:
        argv = ["codex", "exec", "-"]

    argv += [
        "-m",
        model,
        "-c",
        f'model_reasoning_effort="{effort}"',
        "-s",
        "read-only",
        "--skip-git-repo-check",
        "-o",
        str(last_message),
    ]

    # The prompt goes in on stdin. Passing it as an argument breaks on Windows
    # once it is longer than the command line limit, and a real roast prompt
    # carrying a diff is always longer than that.
    done = subprocess.run(
        argv, input=prompt, capture_output=True, text=True, timeout=TIMEOUT_SECONDS, shell=True, encoding="utf-8", errors="replace"
    )

    combined = (done.stdout or "") + (done.stderr or "")
    answer = ""
    if last_message.exists():
        answer = last_message.read_text(encoding="utf-8", errors="replace").strip()
        last_message.unlink(missing_ok=True)

    found = re.search(r"session id:\s*([0-9a-fA-F-]{36})", combined)
    new_session = found.group(1) if found else session_id

    if done.returncode != 0 or not answer:
        return False, combined.strip() or "codex produced no output", new_session

    return True, answer, new_session


def run_claude(model: str, effort: str, prompt: str, session_id: str | None) -> tuple[bool, str, str | None]:
    """Returns (ok, output, session_id)."""
    if session_id:
        argv = ["claude", "-p", "--resume", session_id]
    else:
        session_id = str(uuid.uuid4())
        argv = ["claude", "-p", "--session-id", session_id]

    argv += [
        "--model",
        model,
        "--effort",
        effort,
        "--permission-mode",
        "manual",
        "--output-format",
        "text",
    ]

    done = subprocess.run(
        argv, input=prompt, capture_output=True, text=True, timeout=TIMEOUT_SECONDS, shell=True, encoding="utf-8", errors="replace"
    )

    answer = (done.stdout or "").strip()
    if done.returncode != 0 or not answer:
        return False, ((done.stderr or "") + (done.stdout or "")).strip() or "claude produced no output", session_id

    return True, answer, session_id


# --------------------------------------------------------------------------
# The prompt
# --------------------------------------------------------------------------


def build_prompt(mode: str, args: argparse.Namespace) -> str:
    spec = MODES[mode]
    parts = [spec["role"], ""]

    if mode == "search":
        parts += ["## The question", "", args.ask[0] if args.ask else "(none given)", ""]
        for extra in args.ask[1:]:
            parts += [extra, ""]
        parts += [SELF_ROAST]
        return "\n".join(parts)

    if args.title:
        parts += [f"## What this was meant to be", "", args.title, ""]
    if args.why:
        parts += ["## Why it matters", "", args.why, ""]
    if args.exit_condition:
        parts += ["## The exit condition it has to meet", "", args.exit_condition, ""]
    if args.did:
        parts += ["## What was actually done, in the author's words", "", args.did, ""]
    if args.files:
        parts += ["## Files that changed", "", "```", args.files.strip(), "```", ""]
    if args.diff:
        parts += ["## The diff", "", "```diff", args.diff.strip(), "```", ""]

    parts += ["## Answer these"]
    parts += [""]
    asked = list(args.ask or [])
    for question in asked + spec["standing_questions"]:
        parts += [f"- {question}"]
    parts += ["", SELF_ROAST]

    return "\n".join(parts)


# --------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description="Ask another model to tear this work apart.")
    parser.add_argument("mode", choices=sorted(MODES))
    parser.add_argument("--title", default="", help="the task, as the board states it")
    parser.add_argument("--why", default="", help="the task's why, so the reviewer judges against intent")
    parser.add_argument("--exit-condition", dest="exit_condition", default="", help="the task's exit condition")
    parser.add_argument("--did", default="", help="what you actually did, honestly")
    parser.add_argument("--files", default="", help="changed file list, usually from git diff --name-only")
    parser.add_argument("--diff", default="", help="the diff itself, if it is small enough to be worth sending")
    parser.add_argument("--ask", action="append", default=[], help="a specific question; repeatable")
    parser.add_argument("--model", default="", help="force a model, skipping the usual chain")
    parser.add_argument("--fresh", action="store_true", help="start a new conversation rather than resuming")
    args = parser.parse_args()

    if args.mode == "search" and not args.ask:
        print("search needs at least one --ask", file=sys.stderr)
        return 2

    spec = MODES[args.mode]
    state = load_sessions()
    key = spec["session"]
    sessions = state.setdefault("sessions", {})

    prompt = build_prompt(args.mode, args)

    chain = spec["chain"]
    if args.model:
        brand = "claude" if args.model in {"opus", "sonnet", "haiku", "fable"} else "codex"
        chain = [(brand, args.model, "medium")]

    codex_ok, codex_reason = codex_is_available(state)
    attempts: list[str] = []

    for brand, model, effort in chain:
        if brand == "codex" and not codex_ok:
            attempts.append(f"skipped codex/{model}: {codex_reason}")
            continue

        # The session belongs to the brand, not the model: a codex thread cannot
        # be resumed by claude.
        session_key = f"{key}:{brand}"
        session_id = None if args.fresh else sessions.get(session_key)
        fresh = session_id is None

        print(
            f"roasting with {brand}/{model} ({effort}), "
            f"{'a fresh conversation' if fresh else 'resuming ' + session_id}...",
            file=sys.stderr,
        )

        runner = run_codex if brand == "codex" else run_claude
        try:
            ok, output, new_session = runner(model, effort, prompt, session_id)
        except subprocess.TimeoutExpired:
            attempts.append(f"{brand}/{model} timed out after {TIMEOUT_SECONDS}s")
            continue
        except (OSError, subprocess.SubprocessError) as error:
            attempts.append(f"{brand}/{model} would not start: {error}")
            continue

        if not ok:
            attempts.append(f"{brand}/{model} failed: {output[:300]}")
            if brand == "codex" and RATE_LIMITED.search(output):
                state["codex_blocked_until"] = time.time() + CODEX_COOLDOWN_SECONDS
                codex_ok, codex_reason = False, "codex reported a rate limit during this run"
            # A resume can fail because the recorded session is gone. Drop it and
            # let the next attempt start clean rather than failing forever.
            if session_id:
                sessions.pop(session_key, None)
            save_sessions(state)
            continue

        if new_session:
            sessions[session_key] = new_session
        state.setdefault("last", {})[args.mode] = {
            "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "brand": brand,
            "model": model,
            "effort": effort,
            "session": new_session,
            "fresh": fresh,
        }
        save_sessions(state)

        CLAUDE_DIR.mkdir(parents=True, exist_ok=True)
        RESULT.write_text(
            "\n".join(
                [
                    f"# Roast: {args.mode}",
                    "",
                    f"- when: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
                    f"- reviewer: {brand} {model}, effort {effort}",
                    f"- session: {new_session} ({'new' if fresh else 'resumed'})",
                    f"- subject: {args.title or args.ask[0] if args.ask else '(unstated)'}",
                    "",
                    *( [f"- earlier attempts: {'; '.join(attempts)}", ""] if attempts else [] ),
                    "---",
                    "",
                    output,
                    "",
                ]
            ),
            encoding="utf-8",
        )

        print(f"\nwritten to {RESULT.relative_to(REPO)}", file=sys.stderr)
        print(output)
        return 0

    print("Every reviewer failed:", file=sys.stderr)
    for attempt in attempts:
        print(f"  {attempt}", file=sys.stderr)
    if args.mode == "technical":
        print(
            "\nThis kind is opus with no fallback on purpose. Do not rerun it as a smaller model:\n"
            "wait, or run it as an agent instead.",
            file=sys.stderr,
        )
    return 1


if __name__ == "__main__":
    sys.exit(main())
