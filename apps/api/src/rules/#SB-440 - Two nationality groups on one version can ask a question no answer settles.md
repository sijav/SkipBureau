# SB-440, two nationality groups on one version can ask a question no answer settles

**Exit, as the card words it:** a version whose `nationalityGroup` criteria share no nationality does
not put `nationality` into `needs`, proved by a test that builds two disjoint groups and asserts the
reader is not asked; and a version whose group criteria do overlap still asks, so the check does not
over refuse.

This plan lives in `apps/api/src/rules/` because that is where the decision is made: `eligibility.ts`
holds `fitOne` and `fitToProfile`, and `rules.service.ts` holds `resolve` and the only place
membership rows are read.

## Where this came from

SB-176's parent completion roast. SB-181 refused a second criterion of the same single valued
dimension, because a version naming `workRegion` DE-SN and DE-BB can match nobody, so `resolve` would
ask a question no answer could settle. Migration `20260916140000` line 18 deliberately exempts
`nationalityGroup`, and says so in terms: "fitOne resolves it as groups.has(value), and one
nationality can belong to several groups, so two group criteria on one version can both match a real
reader. Do not complete the list: the omission is the rule."

**That reasoning is sound for overlapping groups and silent about disjoint ones.** Both exist here.
`eu` holds `de`, `fr` and `gb` (to 2020-02-01), from `seed.ts:251`. `de.aufenthv-41-1` holds `au`,
`il`, `jp`, `ca`, `kr`, `nz`, `us`, from `germany/residence-permit.ts:195`. They share nobody, which
is not a coincidence: §41 AufenthV lists nationalities that may enter visa free precisely because EU
citizens need no permit at all.

## What is there, read from the source

- **`Detail`, `eligibility.ts:35`.** Its own comment says "A rule for a nationality group asks for
  the nationality, never the group (SB-176)." That collapse is deliberate and right: the reader has a
  nationality, not a group.
- **`fitOne`, `eligibility.ts:80`.** Two branches matter:
  - `case 'nationality'`: `if (!profile.nationality) return Detail.nationality`
  - `case 'nationalityGroup'`: `if (!profile.nationality) return Detail.nationality`, then
    `return groups.has(criterion.value) ? 'matches' : 'contradicted'`
- **`fitToProfile`, `eligibility.ts:110`.** `contradicted` if any fit is contradicted, else
  `open: [...new Set(fits.filter(isDetail))].sort()`.
- **`matters`, `rules.service.ts:33`.** Compares a candidate's completed answer against the winners,
  and criteria coverage. It never asks whether the candidate's own criteria are jointly satisfiable.
- **`groupsAt`, `rules.service.ts:70`**, called once at line 163. It reads memberships **by
  nationality** and returns the set of group codes that nationality was in at the date asked.

So with no nationality given, every nationality shaped criterion returns `Detail.nationality`
whatever its value, and the `Set` collapses them to one. A version naming two disjoint groups is
therefore reported open on `nationality`, indistinguishable from one naming a single group, and the
reader is asked a question whose every possible answer leaves the version unmatched.

## Why it only bites when no nationality is given

Once `profile.nationality` is set, `groupsAt` fills the set and `groups.has(value)` is evaluated per
criterion. Two disjoint groups then contradict on at least one criterion, and `fitToProfile` returns
`contradicted`, correctly. **The hole is exactly the unanswered case**, which is the case SB-176
exists for.

## The data the fix needs, which nothing loads today

A disjointness test needs memberships **by group code**: for the codes a version names, the
nationalities in each, intersected. Every existing read goes the other way. So this needs a new query,
and the shape it returns is the real design decision.

**Not all memberships.** Today that is about twenty rows and would be free, but it is unbounded in
principle and the laziness would not survive a real group list. `resolve` already holds the candidate
versions, so it can collect the group codes actually named and ask only for those.

## What changes

1. **A pure predicate in `eligibility.ts`, beside `fitOne`**, which is where this reasoning belongs
   and where it can be tested without a database: given the nationality shaped criteria of one
   version and a map of group code to its nationalities, is any nationality able to satisfy all of
   them at once? A `nationality` criterion contributes the single value; a `nationalityGroup`
   criterion contributes that group's members; the answer is whether the intersection is empty.
2. **`fitToProfile` takes that map and uses the predicate** when `profile.nationality` is absent and
   the version names more than one nationality shaped criterion. Empty intersection means
   `contradicted`, not open. One criterion alone keeps today's behaviour exactly.
3. **`resolve` loads the map** for the group codes its candidates name, once, beside `groupsAt`.

**Only two call sites exist, and one of them is dead.** `fitToProfile` is called at
`eligibility.ts:143`, inside `matchesProfile`, and at `rules.service.ts:192`, inside `resolve`.
Checked rather than assumed: `matchesProfile` appears exactly once in every `.ts`, `.tsx`, `.mjs` and
`.js` file in this repository, at its own definition. It is exported and **nothing calls it**, in
`apps/api/src`, in `apps/api/test`, or in the web app. So `resolve` is the only place this decision
is ever observed.

That is a stronger statement than "contained", and it is the one the plan check asked for plainly.
`matchesProfile` must still accept and forward the new parameter to keep compiling, but there is no
behavioural question at that site: it does nothing today and will do nothing after. Whether dead
exported code should simply be deleted is not this card's business, and is noted rather than decided
here.

So the three points are not in the ripple. They are in the query that loads memberships by group
code, the predicate's edge cases, and the test.

**A load time refusal is NOT in scope**, though it is tempting: a research file could be refused for
writing such a version. The card's exit is about what `resolve` does, a row can arrive by other
routes than a research file, and SB-181's own migration comment warns against "completing" a list
whose omission is deliberate. If a load time guard is wanted it is its own card.

## The test, and why the history rules allow it

The exit needs two cases: disjoint groups must not ask, overlapping groups must still ask.

**Building them is possible because of how the history rules are written.** A membership that has
taken effect cannot be updated or deleted, which `history.e2e.spec.ts:151-158` proves. But the same
test, at lines 163 to 165, creates a membership with `validFrom: NEXT_MONTH` and **deletes it on the
next line**. So a not yet effective membership is removable, and a test can clean up after itself.

That fits the idiom `needs.e2e.spec.ts` already uses everywhere: versions starting next month, asked
about at `AFTER_NEXT_MONTH`. The memberships are future to the trigger, which compares against now,
and effective to the query, which asks about a later date.

**Whether a brand new group row itself can be deleted is not yet known.** `nationalityGroup.delete`
on `eu` is refused, but `eu` has effective members, so that proves nothing about a group whose
members are all in the future. It is checked during the build rather than assumed, and if a group
cannot be removed the test reuses the two groups that already exist rather than leaving rows behind.

**The existing two group case is not this test and does not become it.** `region.e2e.spec.ts:222-223`
pairs `eu` with `eea`, and no `eea` group exists anywhere, so it proves the database stores two group
criteria and nothing about resolve. Its comment justifies the exemption by saying two groups can both
match a real reader, which `eea` having no members cannot demonstrate. That comment is corrected here
because this card is what makes it checkable.

## What does not change

`Detail` still names `nationality` and never the group: that collapse is correct and is not the
defect. No migration, no CHECK constraint. Whether two named groups overlap is a fact about
membership rows, not a property of the criterion row, so no constraint can decide it, which is why
SB-181's approach does not extend here.

## How it is proved

- **Both directions, because a check that refuses everything would pass the first half.** Disjoint
  groups: the reader is not asked, and the obligation resolves as if that version were not there.
  Overlapping groups: the reader is still asked, exactly as today.
- **The single group case is unchanged**, which `needs.e2e.spec.ts:175` already asserts and must keep
  asserting.
- **Planted.** With the predicate forced to report "possible", the disjoint case must go back to
  asking, watched, then restored from a copy rather than by `git checkout`.
- This is a child of SB-176, so it closes on the tests covering what it changes, plus lint and the
  type checker, per the owner's rule of 2026-09-10.

## The step I am least sure of

**Whether the intersection is the right question for a `nationality` criterion paired with a group.**
Two groups is clear. A `nationality` criterion says the reader IS that nationality, so pairing it
with a group is satisfiable only if that nationality is in that group, which the same intersection
answers. But a version naming two different `nationality` criteria is already impossible by SB-181's
index, so that case cannot arise and the predicate should not pretend to handle it. I think the
intersection covers every case that can exist; the check should say whether it sees one I have not.

**The check confirmed it**, by reading SB-181's index itself: the partial unique covers
`('ruleVersionId', 'dimension')` where the dimension is one of nationality, situation,
residenceRegion, workRegion or residenceStatus, so plain `nationality` is in the list and two of them
on one version is already impossible. Any number of groups, plus at most one nationality beside them,
is the whole space, and the intersection covers it.

## What the runs actually showed

- **Typecheck after the four edits: exit 0.** A signature threaded through two call sites is where a
  silent mistake hides, so this ran before any test rather than after a confusing failure.
- **`needs.e2e.spec.ts` went from 8 declarations to 9, and `Tests 9 passed (9)`.**
- **The planted failure is the evidence, and a green run alone would not have been.** With
  `anyNationalityFits` forced to return `true`, which is exactly the behaviour before this card, the
  run gave:

  ```
  × a version naming two groups that share nobody asks the reader nothing, and one naming two that overlap still asks
  AssertionError: no nationality is in both groups, so no answer could change what this version says:
    expected [ 'nationality' ] to not include 'nationality'
  Tests  1 failed | 8 passed (9)
  ```

  So the defect was real and reproduced on demand: `needs` really is `['nationality']` without the
  check. Two details make that worth something. The plant was the **inverse of the fix** rather than
  a broken assertion, so it demonstrates the behaviour rather than the test's own wiring. And the
  **overlapping case still passed under the plant**, which is what shows the test is not simply
  asserting "never ask about nationality": only the half that should break, broke.

- **Restored from a copy under a shell trap**, not by `git checkout`, which would have discarded the
  uncommitted work in both `eligibility.ts` and the test.
- **The gate is the whole API suite**, not the two files edited. `fitToProfile` sits under `resolve`,
  which guide, place, status, research-rules, researched-guides and needs all exercise, so "the tests
  covering the files it changed" is effectively all of them. The owner's rule of 2026-09-10 says to
  run more rather than guess where that is unclear.
- **What it returned**: `Test Files 21 passed (21)`, `Tests 223 passed (223)`, suite exit 0, lint
  exit 0, typecheck exit 0, each read without a pipe so the number is npm's and not `tail`'s. The
  restore was verified first, byte identical to the copy with no `PLANTED` string left, so the suite
  ran against the real predicate rather than the disabled one.
