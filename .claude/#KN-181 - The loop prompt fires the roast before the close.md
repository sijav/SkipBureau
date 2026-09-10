# Plan — KN-181, the loop prompt contradicts itself

A KarNama card, planned here because this is the file that changes.

## The task, from the board

`.claude/ralph-loop.local.md` is the prompt this project's Stop hook feeds every
iteration, so it is a rule file. Step 5 says:

> **THEN move it to `done`, and only then fire the roast, in the background.**

and the command block directly beneath it does the opposite:

```bash
python ~/.claude/skills/roast/roast.py task --title ... --did ... --ask ... &
todo move <id> done
```

The roast is backgrounded first and the close second, so the reviewer can read
and report on work before it is closed, which is the ordering the rule exists to
prevent. **Exit condition:** the block closes before it roasts, matching its own
prose; step 1 says a false `done` is repaired by filing a card rather than by
reopening; and a check covers BOTH of this project's rule files, so a
contradiction between them fails rather than passing.

## Why it matters more than a two-line swap looks

A copyable command block is followed more literally than the sentence above it.
Someone reading this file copies the block; nobody retypes the prose. So the
file's actual instruction is the wrong one, and it arrives at the start of every
iteration, before `CLAUDE.md` is read.

This is the sijav failure mode exactly: correct prose over a body that
instructs the opposite. KN-166 praised this project for not having it, having
read `CLAUDE.md` and not this file.

## Steps

1. **Swap the two lines.** `todo move <id> done` first, the backgrounded roast
   second. Add a line saying why the order is what it is, so the next person
   editing the block does not "tidy" it back.
2. **Step 1's wording.** It says a false or premature `done` is repaired before
   any new work starts. Under the current rules a false `done` is repaired by
   filing a card, because `done` does not reopen. Say which is meant, since as
   written it reads as licence to reopen.
3. **Widen the check.** `agent/scripts/verify/KN-166.mjs` in KarNama reads only
   `CLAUDE.md`. Whatever checks this project's rules has to read both files and
   compare them, or the next contradiction hides in whichever one is not read.
   Note that KN-182 says that check belongs in SkipBureau rather than KarNama;
   this card should not make that placement worse.

## What I am unsure about

- **Whether to fix the check here or wait for KN-182.** Widening KN-166's
  verifier in KarNama deepens a coupling that KN-182 exists to remove. Adding
  the second file to it is two lines and leaving the contradiction unguarded is
  worse, so I lean towards widening it now and letting KN-182 move the whole
  thing. I want that judgement checked rather than assumed.
- **Whether step 1 needs changing at all.** The self-roast of the previous
  iteration is a genuinely useful step and "repair a false done" is its point.
  What it must not mean is reopening a closed card. It may be enough to say
  that, rather than to reword the step.
- **Committing in this worktree again.** Another session has ~25 files modified
  here. The last commit was made by explicit path and left those untouched, and
  a reviewer objected that advancing `HEAD` under an active session is itself
  the problem. The alternative is leaving it uncommitted, which risks a
  `checkout` wiping it, which is how a plan file was lost today.
