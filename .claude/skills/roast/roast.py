#!/usr/bin/env python3
"""Ask another model to check this work, honestly.

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

# A reviewer writes arrows, dashes and quotes, and the Windows console is cp1252
# by default, so printing a perfectly good answer killed the script with an
# encoding error after the work was already paid for. The answer was safely on
# disk and the exit code still said failure.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError, ValueError):
        pass

REPO = Path(__file__).resolve().parents[3]
CLAUDE_DIR = REPO / ".claude"
RESULT = CLAUDE_DIR / "roast-result.md"
SESSIONS = CLAUDE_DIR / "roast-sessions.json"

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
            "You are CHECKING one unit of work in the SkipBureau repository, which is a "
            "step-by-step guide to bureaucracy abroad for travellers and expats. The question is "
            "whether it does what it was meant to do. Be specific and concrete. Where it is "
            "wrong, say exactly what and why. Where it is right, say so and move on. You are not "
            "here to find fault; you are here to find out."
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
            "You are CHECKING the SkipBureau codebase as a whole, after a run of large tasks, "
            "not one change in isolation. The question is whether its technical shape holds: "
            "architecture, boundaries, data flow, coupling, the cost of the next change. Where it "
            "holds, say so. Where it does not, say exactly where and what it will cost."
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
## How to answer: three passes, and only the third is shown

**Pass one. Work through the questions above and reach a conclusion.** Go and
look. Open the files. Say what you actually found.

**Pass two. Now check that conclusion, as if someone else had written it.** This
is the pass that makes the answer worth reading, so do it properly, and do it
privately. Ask of every point you just made:

- Did I open the file, or did I assume? If I assumed, it does not survive.
- Is this a defect, or a preference wearing a defect's clothes?
- Would I have written this about any codebase, without reading this one?
- If someone asks "so what actually breaks, and when?", do I have an answer?
- Did I soften this because it sounded harsh, or sharpen it because it sounded
  thin? Both are dishonest.
- Am I saying this because it is true, or because I have been asked to review
  something and an empty answer feels like failure?

Throw out everything that fails. Keep what survives, in the words that survive
it.

**Pass three. Write the final answer, and only that.** Do not show your working
from passes one and two. Do not list what you discarded.

**Finding nothing wrong is a correct and complete answer.** If that is the honest
result of the two passes, say so, and say exactly what you checked and how you
tried to break it, so the reader can tell the difference between nothing being
wrong and you not having looked. A short honest check beats a long
thorough-looking one every time.

Never invent a problem to seem useful. Never inflate a small one to seem
thorough. A false finding costs more than a missed one, because someone will go
and act on it.
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


RATE_LIMITED = re.compile(
    r"rate.?limit|quota|too many requests|429|usage limit|try again (later|in)", re.IGNORECASE
)

# A recorded session id that the tool no longer knows about. Only this means the
# id is worthless; every other failure leaves it alone.
SESSION_GONE = re.compile(
    r"(session|thread|conversation)\s+\S*\s*(not found|does not exist|unknown|no longer)"
    r"|no (such )?(session|thread|conversation)",
    re.IGNORECASE,
)

# When a model is out of usage it says until when. These pull that out, so the
# block lasts exactly as long as the model says and not a guessed interval.
RESET_ABSOLUTE = re.compile(
    r"(?:reset|available|try again|retry)\w*\s*(?:at|on|after)?\s*"
    r"(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)",
    re.IGNORECASE,
)
# The word boundary matters more than it looks. Without it, "in" matches inside
# "again", and because both groups here are optional the whole pattern then
# matches emptily at that earlier position and wins, so "try again in 2h 30m"
# silently fell through to the assumed hour. The lookahead is belt and braces:
# there has to be a digit for this to be a duration at all.
RESET_COMPOUND = re.compile(r"\b(?:in|for)\s+(?=\d)(?:(\d+)\s*h\w*)?\s*(?:(\d+)\s*m\w*)?", re.IGNORECASE)
RESET_SINGLE = re.compile(r"\b(?:in|after|for)\s+(\d+)\s*(second|minute|hour|day)s?", re.IGNORECASE)

# Only used when the model refuses without saying when it will be back.
UNSTATED_BLOCK_SECONDS = 60 * 60


def parse_reset(text: str) -> tuple[float, str]:
    """When this model will be usable again, as (epoch, how we know)."""
    found = RESET_ABSOLUTE.search(text)
    if found:
        stamp = found.group(1).replace(" ", "T").replace("Z", "+00:00")
        try:
            when = datetime.fromisoformat(stamp)
            if when.tzinfo is None:
                when = when.replace(tzinfo=timezone.utc)
            return when.timestamp(), f"it said it resets at {found.group(1)}"
        except ValueError:
            pass

    found = RESET_SINGLE.search(text)
    if found:
        amount = int(found.group(1))
        unit = found.group(2).lower()
        seconds = amount * {"second": 1, "minute": 60, "hour": 3600, "day": 86400}[unit]
        return time.time() + seconds, f"it said to try again in {amount} {unit}(s)"

    found = RESET_COMPOUND.search(text)
    if found and (found.group(1) or found.group(2)):
        seconds = int(found.group(1) or 0) * 3600 + int(found.group(2) or 0) * 60
        if seconds:
            spoken = re.sub(r"^(?:in|for)\s+", "", found.group(0).strip(), flags=re.IGNORECASE)
            return time.time() + seconds, f"it said to try again in {spoken}"

    return time.time() + UNSTATED_BLOCK_SECONDS, "it did not say when, so an hour is assumed"


def prune_expired(state: dict) -> list[str]:
    """Drop every block whose time has passed. This is the clock check the owner
    asked for, and it happens before anything else: a model whose window has
    come round again is simply usable, with no record left behind."""
    blocked = state.get("blocked", {})
    now = time.time()
    expired = [model for model, until in blocked.items() if until <= now]
    for model in expired:
        del blocked[model]
    if not blocked:
        state.pop("blocked", None)
    return expired


def blocked_for(state: dict, model: str) -> str:
    """Empty string if the model is usable, otherwise why it is not."""
    until = state.get("blocked", {}).get(model)
    if not until:
        return ""
    minutes = int((until - time.time()) // 60) + 1
    when = datetime.fromtimestamp(until, timezone.utc).isoformat(timespec="minutes")
    return f"out of usage until {when} ({minutes} minute(s) away)"


def block_model(state: dict, model: str, output: str) -> str:
    until, how = parse_reset(output)
    state.setdefault("blocked", {})[model] = until
    return how


def codex_installed() -> bool:
    try:
        subprocess.run(["codex", "--version"], capture_output=True, timeout=30, shell=True, check=True)
        return True
    except (OSError, subprocess.SubprocessError):
        return False


# --------------------------------------------------------------------------
# Running a reviewer
# --------------------------------------------------------------------------


def run_codex(model: str, effort: str, prompt: str, session_id: str | None) -> tuple[bool, str, str | None]:
    """Returns (ok, output, session_id)."""
    last_message = CLAUDE_DIR / "roast-last-message.tmp"
    last_message.unlink(missing_ok=True)

    options = [
        "-m",
        model,
        "-c",
        f'model_reasoning_effort="{effort}"',
        "--skip-git-repo-check",
        "-o",
        str(last_message),
    ]

    # `codex exec resume` takes a different option set from `codex exec`: it has
    # no -s/--sandbox, and passing one is a hard argument error. The sandbox is
    # set through config there instead. Options go before the positionals in
    # both, which is what the usage line says.
    if session_id:
        argv = ["codex", "exec", "resume", *options, "-c", 'sandbox_mode="read-only"', session_id, "-"]
    else:
        argv = ["codex", "exec", *options, "-s", "read-only", "-"]

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
    parser = argparse.ArgumentParser(description="Ask another model to check this work.")
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

    # Before anything else: check the clock. Any block whose reset time has
    # passed is removed, so a model whose window has come round is simply usable
    # again with no stale record left behind.
    for model in prune_expired(state):
        print(f"{model} is out of its usage window and usable again", file=sys.stderr)
    save_sessions(state)

    have_codex = codex_installed()
    attempts: list[str] = []

    for brand, model, effort in chain:
        if brand == "codex" and not have_codex:
            attempts.append(f"skipped codex/{model}: the codex CLI is not on PATH")
            continue

        # Per model, not per brand. Terra being out of usage says nothing about
        # the reserved gpt model, which is the whole point of it being reserved.
        why_not = blocked_for(state, model)
        if why_not:
            attempts.append(f"skipped {brand}/{model}: {why_not}")
            print(f"skipping {brand}/{model}, {why_not}", file=sys.stderr)
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
            if RATE_LIMITED.search(output):
                how = block_model(state, model, output)
                attempts.append(f"{brand}/{model} is out of usage: {how}")
                print(f"{model} is out of usage, {how}. Falling back.", file=sys.stderr)
            else:
                attempts.append(f"{brand}/{model} failed: {output[:300]}")
            # A resume can fail because the recorded session is gone, and then
            # the id is worthless and should go. But it can also fail for a
            # reason that has nothing to do with the session, and throwing the
            # id away then loses a conversation for no reason: that is exactly
            # what happened when a bad argument was mistaken for a dead session.
            if session_id and SESSION_GONE.search(output):
                print(f"the recorded {brand} session is gone, forgetting it", file=sys.stderr)
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
