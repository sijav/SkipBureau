# Plan — KN-166, check the loop rules in SkipBureau

A KarNama card, planned here because this is the folder the changes land in.

## The task, from the board

**What.** The owner's instruction of 2026-09-10: go to the sibling project at
`../SkipBureau` and make sure the loop rules are written correctly there,
because the agent working it has been getting them wrong.

**Exit condition.** SkipBureau's loop and rule files state the finish, prove,
close, roast order, the findings-become-cards rule with its blocking exception,
and the plan-beside-the-work rule; anything that contradicts them is corrected
or, where the difference is deliberate, recorded as deliberate with its reason;
and the owner is told what was found and what was changed.

## What I found, before changing anything

**The rules are already correct.** That is the headline and it contradicts the
premise I was given, so it is worth being precise about what was checked:

- `CLAUDE.md` line 74 carries the plan rule with the owner's own words, the
  `#<id> - <title>.md` name, the work folder, and "never a `plans/` folder".
- Line 95 carries the roast rule with the owner's 2026-09-10 quote verbatim,
  then the five numbered steps in the right order: finish with tests, THEN
  `done`, THEN roast in the background, then judge, then every finding becomes
  a task, then either revert-and-take-next or forget.
- "One roast per task. Never re-roast", with no passing score and no minimum.
- A grep for the abandoned rules, a 9.5 threshold, zero-criticals gating,
  re-roasting, a `review` state or a `plans/` folder, finds nothing.

This project is in better shape than the sijav rule files were, where the header
said one thing and the body still instructed the other.

## The real gap: the rules are right and the TOOL does not enforce them

`CLAUDE.md` says a finding is "not a reason to reopen what was just finished".
SkipBureau's board is `.claude/todo.db` driven by the global `/todo` skill, and
`~/.claude/skills/todo/todo.mjs` has **no guard on the current status**. So a
closed task reopens freely there, exactly as it did in KarNama until KN-162.
The rule is honour-based in the one project whose agent was described as getting
it wrong.

That is a finding, not this card's work: this card is about what the rule files
SAY. It becomes its own card.

## Two clauses worth adding, both learned here today

Neither is a contradiction, so neither is strictly in the exit condition. Both
are cheap and both cost something real when they were missing:

1. **A task title is not a filename.** The rule gives `#SB-0XX - <title>.md`
   with no note that `< > : " / \ | ? *` are refused outright and that Windows
   silently mangles trailing dots and spaces. The very first plan written under
   this rule in KarNama had four illegal characters in its title.
2. **The plan STAYS when the task closes.** SkipBureau implies it, "committed
   with the work, so the folder carries the reasoning next to the result", but
   does not say it. In KarNama the lifecycle was left unstated, then guessed at
   wrongly, and two plan files were deleted; one is unrecoverable.

## Steps

1. Add those two clauses to `CLAUDE.md`, in the plan section, worded as rules
   rather than as anecdotes.
2. File the tool-enforcement gap as a KarNama card.
3. Write `agent/scripts/verify/KN-166.mjs` in KarNama asserting SkipBureau's
   `CLAUDE.md` states all three required rules and none of the abandoned ones.
4. Mutation-test it.
5. Report to the owner what was found, which is mostly that the premise was
   wrong.

## What I am unsure about

- **Whether editing another project's rule file is welcome at all.** The owner
  said to make sure the rules are written correctly, which I read as permission
  to correct. I am adding two clauses and changing none of the existing ones, so
  nothing that project decided is being overridden.
- **Whether a KarNama verifier should read another repository.** It makes
  KN-166's check depend on a path outside the repository, which will fail if
  SkipBureau moves. Failing loudly is the right behaviour there, but it is a
  real coupling and it may belong in SkipBureau instead.
