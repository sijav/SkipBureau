# SB-120, the history-scan rule overstates the danger and omits the actual remedy

**Exit condition:** `CLAUDE.md` states revoke or rotate first, and describes
what a force push does and does not achieve.

## What is wrong with what I wrote

SB-068 added a rule to `CLAUDE.md` about scanning history rather than the
working tree. Two defects, both mine, both found by that task's roast.

**It overstates.** It says a secret deleted in a later commit is "fetchable by
anyone, for ever". That is not true as an absolute. It may remain reachable
through refs, cached commit views, forks and clones people already have, and
none of that is a guarantee of permanence. Overstating a threat is not a safe
error: a reader who checks the claim, finds it overblown, and discounts the
rule has been taught to ignore the true part with it.

**It omits the response entirely.** The rule says find it and says nothing
about what to do. Worse, SB-068's own commit demonstrates a force push removing
the planted commits, which reads as remediation and is not. A force push
removes a ref. It does not revoke the credential, and it does not reach forks,
caches, or any clone already taken.

The order that matters is **revoke or rotate first**, because that is the only
step that makes the secret worthless, and every other step is slower than
whoever is already reading the repository.

## The approach

Rewrite the "Before publishing" section in `CLAUDE.md`:

- soften "for ever" to what is actually true, which is still bad enough
- add the response, in order: **revoke or rotate**, then rewrite history, then
  ask the host to purge what it caches
- say plainly what a force push does and does not do, so the demonstration in
  SB-068's history cannot be mistaken for the remedy
- note that the planted sentinel there was deliberately not a secret, which is
  the only reason dropping those commits was sufficient

The `#SB-068` plan file carries the same "for ever" phrase and gets the same
correction, since it sits beside the workflow as a record.

## Files

| file | change |
|---|---|
| `CLAUDE.md` | the rule |
| `.github/workflows/#SB-068 - ...md` | the same phrase, in the record |

## How it meets the exit condition

The exit condition is a claim about what the file says, so it is checked by
reading it: the section names revoke or rotate as the first step and states
what a force push achieves. There is no test to write, and inventing one for a
paragraph would be the kind of apparatus the owner has told me not to build.

## The step I am least sure of

**The correct order, and whether "revoke first" is right in every case.** It is
the advice I have absorbed rather than something I have checked against
GitHub's current guidance. There is an argument for removing the exposure
first when rotation is slow or coordinated, and if that is real the rule should
say when. Writing a confident order that is wrong would repeat the exact defect
this card exists to fix.
