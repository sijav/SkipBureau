# SB-367, no test would catch the upward walk being replaced by a one-level check

**Exit, as the card words it:** `place.e2e.spec.ts` and `status.e2e.spec.ts` each refuse moving a leaf
whose named ancestor is two levels above it, and replacing the recursive CTE with a single
`OLD."parentCode"` check makes them fail.

This plan lives in `apps/api/test/` because that is where both specs are. No source changes.

## What is there

SB-200's upward walk refuses moving a row out from under an ancestor a criterion names. Two tests
exercise it:

- `place.e2e.spec.ts:390`, moving `TR-52.altinordu` out from under the named `TR-52`.
- `status.e2e.spec.ts:282`, moving `tr.reach.kind` out from under the named `tr.reach`.

Both move a row whose `OLD."parentCode"` **is** the named row. A guard that read `OLD."parentCode"`
alone, with no recursion, would refuse both, and the suite would stay green while the walk it is
named for had been thrown away.

## The card's account of the third test is imprecise, and the corrected one is stronger

The card says SB-362's temporary-cycle case "moves TR-71.b whose old parent is the named TR-71". That
is one of the three rows that statement moves. Its fixture is `TR-71` named, `TR-71.b` under it, and
`TR-71.c` and `TR-71.d` under `TR-71.b`, and the `UPDATE` moves b, c and d together. So **c and d are
already two hops** from the named ancestor, with `OLD."parentCode"` of `TR-71.b`, which nothing names.

A one-level check would permit c and d and refuse b, and the assertion only requires the **statement**
to be refused with a message naming `TR-71`, which b's refusal provides whatever order the executor
visits rows in. So the test passes either way.

**The gap is therefore not that no test has a two-hop row.** One does. It is that no test ever
requires a two-hop row to be the one refused. That is a sharper statement of the hole and it is what
the new cases close.

## What is added

One test per spec, each the smallest case that separates a walk from a one-level check: a named root,
an **unnamed** middle, a leaf under the middle, and then only the leaf is moved.

- Places: `TR-56` named by a criterion, `TR-56.middle` under it naming nothing, `TR-56.middle.leaf`
  under that. Moving the leaf must be refused naming `TR-56`.
- Statuses: `tr.deep` named, `tr.deep.mid`, `tr.deep.mid.leaf`, the same shape.

Both also keep the negative half the existing tests keep: a sibling subtree nothing names above it
still moves, so the case proves a walk rather than a freeze.

## The fixtures own codes nothing else uses, checked rather than assumed

Neither spec cleans up between tests, `beforeAll` and `afterAll` only, so rows persist across a file
and a collision would either fail the insert or quietly reuse another test's named row and prove
nothing.

- `TR-56` appears nowhere in either spec. It exists only in the research files, `provinces.ts` and the
  agreed and talk documents, and `place.e2e.spec.ts` never loads those: it seeds six places of its
  own, `TR-34`, `TR-16` and four below them, and imports no research loader.
- `tr.deep` appears nowhere in the repository at all.

**A three level status code is new here, and permitted.** The deepest status anywhere today is two
levels, `tr.reach.kind`, but that is convention: `ResidenceStatus_code_names_its_country` checks
`left(code, length("countryCode") + 1) = "countryCode" || '.'`, a prefix only, with nothing about
depth. Regions already have three levels in `TR-34.kadikoy.moda`.

## Is this a gate the owner did not ask for

**Asked of the check rather than settled here**, because the same judgement was drawn wrongly this
morning on SB-359 and the owner then dropped that card.

`CLAUDE.md:37` forbids inventing a gate, naming "no mutation testing" among the things it means, and
this card's exit is mutation shaped: replace the recursive CTE with a one-level check and the tests
must fail. Against that, the same file requires exactly this of any guard, "a guard you added must
have been watched failing on a planted case", and the project has done it on every card today.

**My reading is that SB-359 and this are different.** SB-359 asked for a new invariant, refusing data
no rule serves, which is a new refusal. This adds no invariant at all: the trigger already refuses
this move, on both trees, and the tests merely fail to distinguish it from a weaker guard. Nothing
new is refused, and no work is blocked that was not blocked before. But that is a distinction I have
already got wrong once today, so the check rules on it before anything is written.

## The check ruled it a gate, and the owner is asked

> "The proposed tests add no product invariant, so the distinction from SB-359 is technically real.
> But `CLAUDE.md` forbids new checks, test apparatus, and mutation testing, not only new database
> refusals. This plan adds two tests and deliberately mutates the guard to prove them. Under the
> current owner instruction, that is prohibited. Ask the owner; do not treat the existing 'watch a
> guard fail' guidance as overriding the explicit no-gates rule."

**Third time today I have drawn this line and third time it has been refused**, which is worth
recording as a pattern rather than as three separate misjudgements. On SB-359 I argued a new test was
an existing gate's blind spot; on SB-360 I argued a trigger change was product behaviour rather than
apparatus; here I argued that tests adding no invariant are not a gate. Each distinction was real and
none of them mattered, because the rule is about what is ADDED, not about what kind of thing it
refuses. The right reading of `CLAUDE.md:37` is the literal one.

So nothing is written until the owner decides.

## What the check settled about the design, if it is ever authorised

Recorded now so it is not re-derived later.

- **Two hops is the right depth, and the claim must be stated narrowly.** A three-hop fixture would
  only move the blind spot to a three-level bounded implementation, and **no finite fixture proves
  unbounded recursion**. What this case catches is the loss of the walk to a direct-parent check, not
  every conceivable bounded rewrite. My plan asked whether deeper was better; it is not.
- **The test must move ONLY the leaf**, assert the refusal names the root, and read back the leaf's
  original parent. That is what makes the two-hop row indispensable rather than incidental, which is
  exactly how the existing temporary-cycle test fails to discriminate.
- **My correction of the card's evidence is confirmed**, including that PostgreSQL does not promise
  row visitation order, which is why `TR-71.b` can be the row that refuses.
- **The migration belongs to the temporary planted proof only**, never to the changed-file list.

## How it is proved

- **Both new tests pass against the guard as it stands**, which is the weaker half and proves only
  that the case is well formed.
- **The plant is the point of this card.** The recursive CTE in
  `migrations/20260916180000_the_upward_tree_walk_carries_its_path/migration.sql` is replaced with a
  single `OLD."parentCode"` comparison, both specs run, and **both new tests must fail while every
  existing test still passes**, which is the card's own claim demonstrated rather than argued.
- **The plant reaches the database, verified rather than hoped.** `place.e2e.spec.ts:49-53` runs
  `prisma migrate deploy` from the migration files against a fresh PGlite in `beforeAll`, so editing
  the migration changes the schema under test. Had the spec pushed the Prisma schema instead, the
  plant would have changed nothing and reported a clean result, which is the shape of check this
  project has already been bitten by.
- **Restored from copies, not by `git checkout`**, which would discard this plan, and the migration is
  never committed in its planted form.
- This card has no parent of its own work, so it closes on the full suite, plus lint and the type
  checker.

## Dropped, by the owner's decision of 2026-09-17

Put to him with both rules quoted and located, `CLAUDE.md` lines 37 to 39 against this card's exit,
and with the one way this differs from SB-359 stated plainly: that card added a new rule refusing
data, while this adds no rule at all and only lets the tests tell an existing guard apart from a
weakened one. **He chose to drop it**, as he had dropped SB-359 an hour earlier.

So no test is written, the guard is unchanged, and the hole is recorded in `PHASE-NEXT.md` as a
decision rather than debt, with the condition that would reverse it: the next time this trigger is
edited, which is the only moment the reduction it guards against could be introduced.

**This plan stays**, per CLAUDE.md, as the account of what the case would be and why two hops is the
right depth, so it is not worked out a third time. What it should not be read as is a defect waiting
to be fixed: the guard itself is correct today and was watched refusing the move at one hop.
