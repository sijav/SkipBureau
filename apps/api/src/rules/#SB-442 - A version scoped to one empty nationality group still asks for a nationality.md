# SB-442, a version scoped to one empty nationality group still asks for a nationality

**Exit, as the card words it:** a version scoped to one `nationalityGroup` whose members have all
ended before the date asked about does not put `nationality` into `needs`, and a version scoped to
one group that still has members does, both proved by a test in `needs.e2e.spec.ts`.

This plan lives in `apps/api/src/rules/` because the expression is in `eligibility.ts`. One line of
source changes, and one test is added.

## Where this came from

SB-440's roast, confirming a doubt that card had already written down before firing. That order
matters: the gap was found by reading my own code against its purpose, and the reviewer verified it
rather than supplying it.

## The defect, from the source

`anyNationalityFits` in `eligibility.ts` short circuits with `if (sets.length < 2) return true`. It
never inspects a single set's contents. So a version whose only nationality shaped criterion is one
`nationalityGroup`, and whose group has nobody in it on the date being asked about, is called
satisfiable, stays open, and the reader is asked for a nationality that cannot change what the
version says. That is exactly the defect SB-440 closed, one criterion short of the guard that catches
it.

**It arrives without anyone making a mistake.** SB-440's case needs an editor to pair two groups that
happen not to overlap. This one needs only a membership to end. The seed already contains one:
`gb` belongs to `eu` only until 2020-02-01, so a group that held nobody else would be empty at any
date after that, with no edit involved.

## The fix, which is one expression

Change the short circuit to `sets.length === 0`.

Why that is right, worked through rather than asserted, and confirmed by the roast by hand:

- **One non empty set.** `rest` is `[]`, so `rest.every(...)` is vacuously true for every element, and
  `[...first].some(...)` is true as soon as `first` has one member. Satisfiable, which is correct.
- **One empty set.** `[...first]` is empty, so `.some(...)` is false. Contradicted, which is the fix.
- **A lone plain `nationality` criterion.** `new Set([criterion.value])` is never empty, so it stays
  true. Unchanged, which is correct: a reader can have that nationality.
- **No criteria of either kind.** `sets.length === 0` returns true, unchanged, and a version with no
  nationality shaped criteria was never this function's business.

So the only behaviour that moves is the one that should.

## The test

The exit asks for both directions, because a check that refuses everything would satisfy the first
half alone.

- **An emptied group must not ask.** A group whose one membership runs from `day(29)` to `day(30)`,
  asked about at `AFTER_NEXT_MONTH`, which is `day(31)`. It has ended a full day before the question,
  which is what the exit condition actually says, and the row still exists so the group is empty
  rather than absent.

  **The dates were checked rather than picked.** `rules.resolver.ts:59` turns the `at` string into
  `new Date(at)`, UTC midnight. `groupMembersAt` filters with `validFrom lte at` and `validTo` either
  null or `gt at`, which is the same shape as `inForceAt` at `selection.ts:16`, so this query follows
  the house idiom rather than inventing one.

  **This plan first proposed `validTo: day(31)` against `at: day(31)`, and that is worse.** It does
  work, because the comparison is strictly greater and `day(31) > day(31)` is false. But it sits
  exactly on the boundary, it proves "not valid at" rather than the exit's "ended before", and a test
  balanced on an off by one is one refactor away from passing for the wrong reason. Moving the
  membership a day earlier costs nothing and removes the question. Both dates are still in the
  future, so the history trigger counts them as not yet in effect and the test can delete them.
- **A group with members must still ask**, so the check has not simply learned to refuse.
- Both memberships are dated from next month, so the history trigger still counts them as not yet in
  effect and the test can delete them again, as SB-440's test does.

## What does not change

`fitToProfile`, `groupMembersAt`, the `GroupMembers` type, and the two call sites. This is one
expression inside a function SB-440 already added, reached by data it already loads.

## How it is proved

- **Planted.** With the short circuit put back to `sets.length < 2`, the emptied group case must go
  back to asking, watched, then restored from a copy rather than by `git checkout`, which would
  discard the uncommitted work.
- **The other direction must keep passing throughout**, or the change is refusing rather than fixing.
- This is a child, so it closes on the tests covering what it changes, plus lint and the type checker.
  `anyNationalityFits` sits under `resolve`, so that is the API suite, as it was for SB-440.
