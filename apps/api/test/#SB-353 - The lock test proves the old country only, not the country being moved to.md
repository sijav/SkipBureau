# SB-353, The lock test proves the old country only, not the country being moved to

**Exit:** the successful-move test reads `TREE_LOCKS` for both `tr` and `de` in one transaction and
asserts both trees `ExclusiveLock` on each.

## Why this is worth a card at all

SB-180 added `skipbureau_version_keeps_its_tree_criteria`, which takes both trees' advisory locks
for **both** countries, exclusively, whenever a version's `countryCode` changes. Exclusive rather
than shared because a shared advisory lock conflicts only with an exclusive one, and
`skipbureau_criterion_names_a_tree_row` takes it shared: two transactions, one writing a criterion
and one moving the country, would otherwise each validate without seeing the other and both commit.

The test written for it reads `TREE_LOCKS` for `'tr'` alone, the country being **left**. The
migration does call `skipbureau_lock_tree(tree, ARRAY[OLD."countryCode", NEW."countryCode"], false)`,
so both are locked today, but that is established by reading the SQL rather than by a test. The
new-country lock is the half that makes a move wait on a transaction writing a criterion under the
country being moved **into**. An edit dropping it would leave the whole suite green and silently
reopen the race SB-180 existed to close.

SB-180's own roast found this, and the same roast is where the overstatement came from: the account
of SB-180 claims the test proves locks for "both countries". It proves both trees and the old
country. That sentence is corrected as part of this card.

## What changes

`apps/api/test/status.e2e.spec.ts`, inside the existing successful-move block, which already opens a
transaction, creates a version whose only criterion is a nationality, and updates its country:

- A second `tx.$queryRawUnsafe<Held>(TREE_LOCKS, 'de')` beside the existing `'tr'` read, both inside
  the same `$transaction`. `TREE_LOCKS` already takes the country as `$1`
  (`objid = hashtext($1)::oid`), so nothing about the query changes.
- Both reads must happen before the transaction closes. These are `pg_advisory_xact_lock` locks:
  they are released at commit, so a read afterwards sees nothing and would pass for the wrong
  reason, which is the failure mode this card is about in the first place.
- Both asserted as `region` and `status` at `ExclusiveLock`.
- The comment above the block says "for the country being left". It is corrected.

Nothing in `apps/api/prisma/` changes. The guard is already right; only its proof was short.

## Watched failing, which needs a planted case here

The lock this asserts already works, so the new assertion passes the moment it is written and proves
nothing by passing. To see it refuse, the `NEW."countryCode"` half is removed from the
`skipbureau_lock_tree` call in
`20260916120000_a_code_names_its_country_and_a_version_keeps_its_criteria/migration.sql`, the test is
run against that, and the `'de'` read is watched coming back empty. Then the migration is restored
and the test run again.

The hold-aside is done in one command so the restore happens whatever the result, the way SB-181's
migration and `checkProfile` guard were both held aside and put back.

## How it is checked

SB-353 is a child of SB-168, so it closes on the tests covering what it changes: `status.e2e.spec.ts`
is the only file touched, so that spec, plus lint and the type checker. `region` and `place` are run
as well, because they share the same triggers and the hold-aside edits a migration they also apply.
