---
name: roast
description: Get another model to check work. Use after finishing a board task (task roast, codex/terra), after a run of large tasks (technical roast, claude/opus), or when a question needs looking up (search, codex/terra). Runs .claude/skills/roast/roast.py, which keeps a separate conversation per kind and writes the answer to .claude/roast-result.md.
---

# Roast

**It is a check, not an attack.** The question is always "does this do what it was
meant to do", never "what can I find wrong with it". A reviewer told to tear
something apart will always produce something, because that is what it was asked
for, and a finding produced to fill a quota is worse than silence. "This does
what it should, here is what I checked" is a complete and useful answer.

You do not score your own work. You know what you meant, so you read the code as
the thing you intended rather than the thing you wrote. A different model with a
clean context does not have that problem.

```bash
python .claude/skills/roast/roast.py <task|technical|search> [options]
```

The answer is printed and written to `.claude/roast-result.md`, overwritten every
run. Session ids live in `.claude/roast-sessions.json`. Both are gitignored: they
are this machine's state, not the project's.

## The three kinds

| kind | reviewer | when |
|---|---|---|
| `task` | codex terra medium, falling back to gpt high, then claude sonnet medium | one board task is finished |
| `technical` | claude opus, **no fallback** | a run of large tasks is finished |
| `search` | codex terra medium, same fallbacks | a question needs answering, nothing to review |

Each keeps **its own conversation**, so the reviewer remembers what it has
already said about this project rather than meeting it fresh each time. The
first run of a kind starts that conversation; every later run resumes it.
`--fresh` forces a new one.

## After finishing a task

```bash
python .claude/skills/roast/roast.py task \
  --title "SB-002 Web app scaffold" \
  --why "$(npm run todo -- show SB-002 | sed -n 's/^  why  : //p')" \
  --exit-condition "the exit condition from the board" \
  --did "what you actually did, honestly, including what you skipped" \
  --files "$(git diff --name-only HEAD)" \
  --ask "a real question about THIS task's logic" \
  --ask "a second one, aimed where you are least sure"
```

**The questions are what make it useful.** Generic questions get generic answers.
Ask about the specific mechanism you doubt, not the part you are proudest of.
Three questions are always added for you: whether it matches the logic it was
meant to follow, whether it is DRY or wrongly abstracted, and what it claims that
is not true.

**The reviewer answers in three passes**, and only the third is shown. It works
through the questions and reaches a conclusion; then it checks that conclusion
as if someone else had written it, throwing out anything asserted without
opening the file, anything that is a preference dressed as a defect, anything it
would have said about any codebase, and anything it sharpened only because a
thin answer felt like failure; then it writes what survived. It is told plainly
that finding nothing is a correct and complete answer, and never to inflate a
small problem to look thorough.

## Then: judge it, file it, move on

The output is **evidence, not a verdict**. Take each finding and judge it against
the code:

- **Real** — reproduce it, name the input or state that triggers it.
- **Wrong** — say what the reviewer misread. Never silently drop one.
- **Out of scope** — real, but not this task.

Then **every finding that survives becomes its own task on the board**, all nine
fields filled, and only then does the finished task move from `wait_for_roast`
to `done`. Then you take the next one.

**One roast per task. Never re-roast.** This is the owner's rule, given directly:

> "the roasting needs to happen after a task is done, and then you roast the
> roast, then add to-do! and then go on and start from the next to-do"

A finding is work for later, not a reason to reopen what was just finished.
There is no passing score and no minimum. Re-roasting until a number improves has
no end: ask any reviewer the same question again and it will look harder for
something to say.

**Relay it to the owner in your reply**: what was found, what you accepted, what
you rejected and why. They never see `.claude/roast-result.md`.

## The technical roast

After a run of big tasks, not after each one. Claude, opus, no fallback: if opus
is unavailable it fails rather than quietly answering with something smaller,
because the depth of the reviewer is the entire point.

```bash
python .claude/skills/roast/roast.py technical \
  --did "what has landed since the last technical roast" \
  --files "$(git diff --name-only <last-technical-roast-commit>..HEAD)" \
  --ask "where will this hurt in three months?"
```

It checks shape rather than correctness: boundaries, coupling, data flow, the
cost of the next change, what a new engineer would misread first. Where the shape
holds it says so.

**This one may run as an agent instead of the script.** Spawn a subagent with the
same brief when you want it to read the repository itself rather than judge from
a diff. The script is the default because it keeps the conversation.

## Search

```bash
python .claude/skills/roast/roast.py search \
  --ask "which free tiers in 2026 will run a NestJS API with a Postgres, and what are the limits?"
```

Terra medium, its own conversation, and the ask is the whole job: it answers the
question and does not review code or suggest work.

## Usage limits, and the order of the fallback

**The clock is checked first, before anything is called.** Every model that is
out of usage is recorded in `.claude/roast-sessions.json` with the time it comes
back. At the start of a run, any block whose time has passed is deleted: that
model is simply usable again, with no record left behind. Anything still in date
is skipped without spending a slow round trip learning what we already knew.

**The record is per model, not per brand.** Terra being out of usage says
nothing about the reserved gpt model, which is the entire point of holding one
in reserve. So the order is:

1. **terra medium.** If it is out of usage, note when it returns and fall to
2. **gpt high, the reserve.** If that is out of usage too, then codex is done for
   now, and fall to
3. **claude sonnet medium.**

The `technical` kind has no fallback at all. If opus is out of usage it fails and
says so, because answering that question with a smaller model is worse than
waiting.

**How long a block lasts is what the model said**, not a guess. The reply is read
for a reset time, in any of the forms they use: `resets at 2026-09-08T18:30:00Z`,
`try again in 4 hours`, `in 45 minutes`, `in 2h 30m`. Only when it refuses
without saying when is an hour assumed, and the result file says which of those
happened.

The result file also records the reviewer that actually answered and every one
that was skipped, with the reason. A fallback is never invisible.
