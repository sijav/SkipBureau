#!/usr/bin/env python3
"""One conversation with GPT per rule case, until both sides are satisfied.

The owner's order of 2026-09-12, corrected the same day:

    "you give research, gpt research, you roast the research and give it back
    to gpt, gpt either has to came up with different results or honest excuses
    and you roast those result and excuses this process happens until you both
    satisfy on a rule case on a task, it's like talking to each other until
    satisfaction ... It's a one on one talk session with Astra"

So this is not a batch of questions and it is not the roast skill. It is a
**talk**: one conversation per rule case, resumed every time, with the whole
exchange kept in the project where anyone can read what was said and what was
answered.

    python research.py ask   --case turkey/address-registration --file ask.txt
    python research.py ask   --case turkey/address-registration --message "..."
    python research.py show  --case turkey/address-registration
    python research.py cases

A case is `<country>/<rule>`. Its session id lives in `sessions.json` beside
this file and its transcript in `talk/<country>/<rule>.md`, both committed:
the conversation IS the research record, and a reviewer who wants to know why a
guide says what it says should be able to read the argument that got there.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
SESSIONS = HERE / "sessions.json"
TALK = HERE / "talk"

# The owner named the model and the effort. Web search on, because the whole
# question is what a government requires THIS year, and a model answering that
# from training data is guessing in a confident voice.
MODEL = "gpt-6-astra"
EFFORT = "high"
TIMEOUT_SECONDS = 3600

CASE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*/[a-z0-9]+(?:-[a-z0-9]+)*$")

# What the other side is told once, at the start of a case, and never again:
# resuming a conversation carries it. It is the standard every answer in this
# project is judged against, so it is stated rather than implied.
STANDING = """You and I are researching one rule, together, until we are both satisfied with it.

This is for SkipBureau, a step-by-step guide to bureaucracy for people who have just arrived in a country. Somebody standing in a government office acts on what we publish, so a confident wrong answer is worse than no answer.

How this works. You answer. I read your answer against what the product needs and send you back what is wrong, thin, or overstated in it. You then either come back with a better answer, or tell me honestly that you cannot verify it and why. I do the same to that. We stop when a pass raises nothing new.

Four rules that hold for every answer you give in this conversation:

1. If something is the same everywhere in the country, say so plainly. "No regional variation" is an answer I need as much as a difference. Never invent variation to look thorough.
2. If you cannot verify something from an official source, say that you could not. Do not fill the gap from memory.
3. Keep a rule that differs IN LAW separate from an office that behaves differently. Both matter to a reader; they are stored differently.
4. End every answer with the URLs you actually opened, one per line, and say plainly if you opened none.

An honest "I could not verify this" is a complete and useful answer here, and it is worth more than a plausible paragraph. Do not pad."""


# The answers carry Turkish and German characters, and a Windows console is not
# UTF-8 by default: printing one there turns them into question marks. The
# transcript file is written as UTF-8 either way and is the authority; this just
# stops the console copy being misread as damage.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


def load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def transcript_of(case: str) -> Path:
    country, rule = case.split("/", 1)
    return TALK / country / f"{rule}.md"


def run_codex(prompt: str, session_id: str | None) -> tuple[bool, str, str | None]:
    """Returns (ok, answer, session id). Copied in shape from the roast skill, which works."""
    last = HERE / ".last-message.tmp"
    last.unlink(missing_ok=True)

    options = [
        "-m", MODEL,
        "-c", f'model_reasoning_effort="{EFFORT}"',
        "-c", "tools.web_search=true",
        "--skip-git-repo-check",
        "-o", str(last),
    ]

    # `codex exec resume` has no -s/--sandbox and rejects one; it takes the
    # sandbox through config instead. Options come before the positionals.
    if session_id:
        argv = ["codex", "exec", "resume", *options, "-c", 'sandbox_mode="read-only"', session_id, "-"]
    else:
        argv = ["codex", "exec", *options, "-s", "read-only", "-"]

    # The prompt goes in on stdin: as an argument it breaks on Windows the
    # moment it is longer than the command line limit, and these are long.
    done = subprocess.run(
        argv, input=prompt, capture_output=True, text=True,
        timeout=TIMEOUT_SECONDS, shell=True, encoding="utf-8", errors="replace",
    )

    combined = (done.stdout or "") + (done.stderr or "")
    answer = ""
    if last.exists():
        answer = last.read_text(encoding="utf-8", errors="replace").strip()
        last.unlink(missing_ok=True)

    found = re.search(r"session id:\s*([0-9a-fA-F-]{36})", combined)
    new_session = found.group(1) if found else session_id

    if done.returncode != 0 or not answer:
        return False, combined.strip() or "codex produced no output", new_session
    return True, answer, new_session


def append(case: str, said: str, answer: str, session_id: str | None, opened: bool) -> Path:
    path = transcript_of(case)
    path.parent.mkdir(parents=True, exist_ok=True)
    when = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    if not path.exists():
        country, rule = case.split("/", 1)
        path.write_text(
            f"# {rule.replace('-', ' ')}, in {country}\n\n"
            f"One conversation, resumed, until both sides are satisfied. SB-167, and the\n"
            f"owner's order of 2026-09-12. Model `{MODEL}`, effort {EFFORT}, web search on.\n\n"
            f"Session `{session_id or 'unknown'}`.\n",
            encoding="utf-8",
        )

    with path.open("a", encoding="utf-8") as file:
        file.write(f"\n---\n\n## Asked, {when}{' (first)' if opened else ''}\n\n{said.strip()}\n")
        file.write(f"\n## Answered\n\n{answer.strip()}\n")
    return path


def ask(case: str, message: str) -> int:
    if not CASE.match(case):
        print(f"a case is <country>/<rule>, in lower case with dashes, not {case!r}", file=sys.stderr)
        return 2
    if not message.strip():
        print("nothing to ask", file=sys.stderr)
        return 2

    sessions = load(SESSIONS)
    session_id = sessions.get(case)
    opened = session_id is None

    # The standing rules open a case and are never repeated: a resumed
    # conversation already carries them, and restating them every time would
    # teach it that they are noise.
    prompt = f"{STANDING}\n\n---\n\n{message}" if opened else message

    where = "opening" if opened else f"resuming {session_id}"
    print(f"{case}: {where} with {MODEL}, effort {EFFORT}...", flush=True)

    ok, answer, new_session = run_codex(prompt, session_id)

    if new_session:
        sessions[case] = new_session
        SESSIONS.write_text(json.dumps(sessions, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    if not ok:
        print(answer, file=sys.stderr)
        return 1

    path = append(case, message, answer, new_session, opened)
    print(answer)
    print(f"\n[{case} -> {path.relative_to(HERE)}]", file=sys.stderr)
    return 0


def show(case: str) -> int:
    path = transcript_of(case)
    if not path.exists():
        print(f"nothing said yet in {case}", file=sys.stderr)
        return 1
    print(path.read_text(encoding="utf-8"))
    return 0


def cases() -> int:
    sessions = load(SESSIONS)
    if not sessions:
        print("no cases yet")
        return 0
    for case in sorted(sessions):
        path = transcript_of(case)
        turns = path.read_text(encoding="utf-8").count("\n## Asked, ") if path.exists() else 0
        print(f"  {case:44} {turns:2} turn(s)  {sessions[case]}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    talk = sub.add_parser("ask", help="say something in a case, opening it if it is new")
    talk.add_argument("--case", required=True, help="<country>/<rule>, e.g. turkey/address-registration")
    group = talk.add_mutually_exclusive_group(required=True)
    group.add_argument("--message", help="what to say")
    group.add_argument("--file", type=Path, help="a file holding what to say")

    read = sub.add_parser("show", help="the whole conversation for a case")
    read.add_argument("--case", required=True)

    sub.add_parser("cases", help="every case, how many turns, and its session")

    args = parser.parse_args()

    if args.command == "ask":
        message = args.file.read_text(encoding="utf-8") if args.file else args.message
        return ask(args.case, message)
    if args.command == "show":
        return show(args.case)
    return cases()


if __name__ == "__main__":
    sys.exit(main())
