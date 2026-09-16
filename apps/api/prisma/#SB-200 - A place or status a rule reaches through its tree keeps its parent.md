# SB-200, A place or status a rule reaches through its tree keeps its parent

**Exit:** on PGlite, with a version naming `TR-34` in force, moving `TR-34.kadikoy` under `TR-16` is
refused and reads back unchanged, the same holds for a status inside a named residence status, and
moving a row that no criterion names above, at or below it still succeeds.

## The fault, read from the function rather than assumed

`skipbureau_tree_row_in_use_keeps_its_place`, in
`20260914140100_residence_statuses/migration.sql`, refuses a change when a criterion names the row
**or a row inside it**. Its recursive CTE is seeded with `OLD.code` and joins
`node."parentCode" = inside.code`, so it walks strictly **downward**.

That catches the case it was written for and misses the mirror of it. With a version naming `TR-34`,
moving `TR-34.kadikoy` under `TR-16` walks down from Kadıköy to Moda and Fenerbahçe and never
reaches `TR-34`, so nothing refuses. Every reader in Kadıköy then leaves İstanbul's rule for Bursa's
without any version changing, which is precisely what the freeze exists to prevent.

The same hole is in the status tree: with a version naming `tr.residence-permit`, moving
`tr.residence-permit.student` out from under it takes student permit holders out of every rule for
permit holders.

**The two existing tests are not this case**, which I checked rather than assuming they covered it.
`status.e2e.spec.ts:189` moves `tr.protection.applicant` while the criterion names
`tr.protection.applicant` itself and the row moved is its **parent**; `place.e2e.spec.ts:390` names
`TR-35.konak.alsancak` and moves `TR-35.konak`, again an ancestor. In both the criterion is on the
deepest row, so the downward walk reaches it. Neither exercises a criterion on an ancestor.

## What changes

A **new migration**, never an edit to the applied one.

`skipbureau_tree_row_in_use_keeps_its_place` gains a second walk, **upward** from `OLD."parentCode"`
following `node.code = above."parentCode"`, and refuses when a criterion of this tree's dimensions
names any row on that chain. The downward walk stays exactly as it is.

Two details that decide whether this is right:

- **Only on a move.** A rename or a country change of a row whose ancestor is named is already
  refused by nothing, and should stay that way: the ancestor's rule still reaches it. The upward
  check therefore runs only when `NEW."parentCode" IS DISTINCT FROM OLD."parentCode"`. This is the
  part I am least sure of and it is the first question for the check.
- **The message.** The existing one says "itself or through a % inside it". A row refused because its
  ancestor is named needs different words, or a reader of the error is told something untrue about
  which row is in use.

`apps/api/test/place.e2e.spec.ts` and `test/status.e2e.spec.ts` each gain a test for the new case,
plus one that a row no criterion names above, at or below still moves freely, so the guard is not a
blanket freeze.

`PHASE-NEXT.md` gains one sentence in the **statuses** section. The places section at line 154
already records the rule, "a merger, a split or a move under another parent is a new place, with the
rules that follow it recorded as new versions", so it needs nothing. The statuses section says a
status is scope and never inherited and says nothing about moving. The card asks for both; only one
is missing.

## Watching it fail

The planted case is the test itself, written and run against the schema as it stands, before the
migration exists. `place.e2e.spec.ts` already seeds `TR-34`, `TR-16` and `TR-34.kadikoy`, so the case
is a version naming `TR-34` and one `update`. Expect it to be ACCEPTED, and the row to read back
under `TR-16`. That is the defect, reproduced, and it is what the migration then has to refuse.

I tried three hand-rolled probes for this before writing it as a test and abandoned them: a
standalone script cannot resolve `src/generated/prisma/client.js`, which is a TypeScript ESM
specifier the suite's own harness handles. The suite is the right place and was all along.

**What it did, and the correction the run forced.** Both cases were accepted, as predicted:
`TR-34.kadikoy` read back under `TR-16`, and `tr.residence-permit.student` read back with no parent
at all. Written above them, the migration is
`20260916160000_a_place_or_status_a_rule_reaches_through_its_tree_keeps_its_parent`.

Then both tests failed a second time, for a different reason, and the reason matters more than the
first. Run alone under `-t`, each passed through to the new guard. Run with the rest of its file,
each was refused by the DOWNWARD walk instead, with the old message: earlier tests in both files
leave criteria naming `TR-34.kadikoy`, `TR-34.kadikoy.moda` and `tr.residence-permit.student`
directly, so the rows I picked were already frozen and the case never reached the guard it was
written for. That is SB-181's mistake exactly, caught this time because the whole file was run.

Both tests were rewritten onto rows nothing else names, `TR-52`/`TR-52.altinordu` moved toward
`TR-53`, and `tr.reach`/`tr.reach.kind`, each with an unnamed pair beside it, `TR-53.pazar` and
`tr.free.kind`, that still moves freely. **A filtered run is not proof for a guard like this**: the
state an earlier test leaves behind is part of the case.

## How it is checked

SB-200 is a child of SB-186, so it closes on the tests covering what it changes: `place`, `status`
and `region` e2e specs, plus lint and the type checker. `research-rules.e2e.spec.ts` is run whole as
well, because the research load writes region and status trees and a new refusal could catch one of
its rows.
