# SB-438, the whitespace loop lives in a test named for a different constraint

**Exit, as the card words it:** the whitespace loop is its own test in `region.e2e.spec.ts` with a
name describing what it checks, the two ordinary spaces case stays in the single valued detail test,
and both pass.

This plan lives in `apps/api/test/` because that is the folder the change lands in. One file changes
and no source does, so nothing a reader sees moves.

## Where this came from

SB-354's roast, which agreed with it plainly rather than hedging: the loop "reports under a name
that's about a different constraint entirely", which is "a real readability cost for the next person
who sees a red test and has to open the file to find out it's not about duplicate values at all". It
was explicit that correctness is not affected, the assertions are sound and the planted failure
proved the loop executes. So this is a naming and placement change, not a repair.

## What is there, read from the file rather than remembered

`test('a version cannot carry two values of one single valued detail, nor a blank value')` at line
163 does four jobs:

- **165**, `const versions = await prisma.ruleVersion.count()`, the baseline.
- **167 to 197**, two duplicate cases, two work regions and two nationalities, each rejected by
  `one_value_per_single_valued_dimension`. This is what the test's name is about.
- **199 to 208**, a criterion whose value is two ordinary spaces, rejected by `value_is_not_blank`.
  This is the "nor a blank value" half of the name, so it belongs here.
- **210 to 237**, SB-354's comment, the `BLANK` array of twenty five code points, and the loop that
  asserts each is refused by the database and is also `''` to JavaScript's `trim()`. This is the
  part whose failures report under the wrong name.
- **239**, `expect(await prisma.ruleVersion.count()).toBe(versions)`.
- **241 to 258**, the nationalityGroup exception: two group criteria on one version ARE allowed,
  because one nationality can belong to several groups. Proved rather than assumed, and it stays.

## The count assertion, which is the only real decision here

Line 239 is not decoration and it is not part of the loop. It is the only assertion in the whole test
that proves **nothing was stored**. Every assertion inside the loop is about a rejection, and a
rejection assertion passes whether or not a row was also written by something else. `versions` is
captured at 165, before any of the four cases, so today that one line guards all of them.

So the split gives **each test its own baseline and its own count assertion**. That is not
duplication for its own sake: without it, the new test could store twenty five rows and still pass
every line it contains. The original keeps its own, now guarding the two duplicate cases and the two
space blank case.

## What changes

One test becomes two, in place, in the same file:

- The existing test keeps its name, its two duplicate cases, the two ordinary spaces blank case, its
  baseline, its count assertion and the nationalityGroup exception. Lines 210 to 237 leave it.
- A new test takes the comment, the `BLANK` array and the loop, with its own `held`, its own
  baseline and its own count assertion. Name:
  **`'the database refuses every character JavaScript calls whitespace'`**, so a red line names the
  constraint it broke.

**The first name this plan proposed was wrong, and it was wrong in this card's own way.** It read
"the database and the API refuse the same twenty five whitespace characters as a value". The loop
does not touch the API. It asserts `only.trim()` is `''`, which is the JavaScript primitive
`checkProfile` uses, beside the database's rejection. Naming the test after the API would claim it
exercises `checkProfile` when it exercises the premise `checkProfile` rests on, which is testing a
thing like the thing. Writing an overclaiming name into a card about names that overclaim would have
been a poor joke, and the name now says exactly what the two assertions show.

**Whether the test should call `checkProfile` instead is a separate question and not this card's.**
This card moves a loop and renames it; changing what it asserts would be new work with its own risk,
and SB-354's roast was explicit that the assertions are sound. If calling the real function is
better, that is a card, not a silent widening of this one.

**And no test calls it today, which was checked rather than assumed.** `checkProfile` appears four
times across `apps/api/test/`: three comments, in `needs.e2e.spec.ts` line 106,
`status.e2e.spec.ts` line 216 and `region.e2e.spec.ts` line 211, and one assertion message at
`region.e2e.spec.ts` line 224. Not one of them is a call. So there is no house pattern to follow into
this test, and switching to the real function would be starting something rather than matching
something.

Nothing inside the loop changes: not the array, not the two assertions per character, not the
messages. The point of this card is where the code sits and what the failure is called.

SB-354's comment moves with the loop, because it explains the loop. Its first half, on why the two
contracts had disagreed, is the reason the new test exists and reads correctly at the top of it.

## What does not change

The migration, the constraint, `rules.service.ts`, and every assertion's meaning. If this card
changed behaviour it would be the wrong card.

## How it is proved, and the planted case is the point

A passing run is weak evidence here, because the same assertions pass from either location. Two
things are checked instead:

- **The file's test count rises by one**, from 9 to 10, which distinguishes a real split from a moved
  block.
- **A planted failure reports under the NEW name.** One character's expectation is broken by hand,
  the file is run, and the failing test's reported name must be
  `'the database refuses every character JavaScript calls whitespace'` rather than the single valued
  detail one. That is this card's exit condition stated as an observation, so it is watched rather
  than argued, and then restored from a copy rather than by `git checkout`, which would discard the
  uncommitted split itself.

**This section named the wrong test until the plan check caught it.** It still quoted the earlier
candidate, "the database and the API refuse the same twenty five whitespace characters as a value",
which the section above had already rejected as overclaiming. Followed literally it would have
checked the planted failure against a string that can never appear, and produced either a false "the
split did not work" or a quiet shrug from whoever ran it, which is the opposite of a watched proof.
A card about a name in one place not matching reality in another had that defect in its own plan.
Recorded rather than quietly corrected, because the correction is the more useful half.

This is a child task, so it closes on the tests covering the file it changes, plus lint and the type
checker over what it touched, per the owner's rule of 2026-09-10. The full suite runs when SB-176
closes.

## What the runs actually showed

- **Baseline, taken before touching the file**, so a later failure would be attributable: 9 test
  declarations and `Tests 9 passed (9)`, with lint and the type checker producing no diagnostics.
- **After the split**: 10 declarations, the new test at line 245, and `Tests 10 passed (10)`.
- **The planted failure reported under the new name**, which is this card's exit condition observed
  rather than argued:

  ```
  × the database refuses every character JavaScript calls whitespace 10ms
  FAIL  test/region.e2e.spec.ts > the database refuses every character JavaScript calls whitespace
  Tests  1 failed | 9 passed (10)
  ```

  Two choices in that plant are the reason it proves anything. It broke the DATABASE assertion rather
  than the JavaScript one, so it demonstrates the loop's database calls run rather than only that a
  synchronous line executed. And it was applied to a substring unique to the new test, asserted to
  occur exactly once before writing, because the two ordinary spaces case left behind also expects
  `value_is_not_blank`: planting in both would have failed two tests and proved nothing about which
  name reports.
- **Restored from the copy under a shell trap**, never by `git checkout`, which would have discarded
  the uncommitted split. Verified afterwards rather than assumed: byte identical to the copy, the
  planted string absent, `value_is_not_blank` back to two occurrences, 10 declarations, and
  `Tests 10 passed (10)`.
- **The gate**: tests 0, lint 0, typecheck 0, with each exit code captured without a pipe.

**The first baseline's exit codes were worthless and are not relied on here.** They were read with
`$?` after piping npm into `tail`, which reports `tail`'s status, so both would have read 0 however
npm had failed. That is the same shape as a `grep -P` failure earlier in this session being turned
into a clean "none" by an `||` fallback. What the baseline did establish is weaker but real: eslint
and tsc print diagnostics on failure and printed nothing.
