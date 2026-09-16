# SB-361, The upward tree walk can loop inside one multi-row update

**Exit:** a test issues one UPDATE that points two rows of the same tree at each other and it
terminates, refused rather than hanging, and the migration's comment says what is actually true about
when a cycle can be met.

## The finding is mine, it is real, and the reason I gave was wrong

SB-200 added an upward walk to `skipbureau_tree_row_in_use_keeps_its_place`. It uses `UNION ALL` with
a `steps` counter so it can report the NEAREST named ancestor rather than an arbitrary one, and I
justified that in the migration's own comment:

> That terminates because the parent chain cannot contain a cycle: skipbureau_tree_holds refuses a
> row inside itself at the end of the statement that would create one, so no later statement's BEFORE
> trigger can meet one.

**That sentence is about LATER statements. It says nothing about the statement creating the cycle,
which is the case that matters.** SB-200's roast said so and I checked it against PostgreSQL's
documentation rather than deciding from memory. Two documented rules, both against me:

- Trigger data-change visibility: "SQL commands executed in a row-level `BEFORE` trigger *will* see
  the effects of data changes for rows previously processed in the same outer command."
- SPI visibility: commands in read-write mode "can see all changes made so far", and "commands of
  `VOLATILE` functions are done in read-write mode". A plpgsql trigger function is VOLATILE.

So in one `UPDATE` that sets B's parent to C and C's parent to B, the BEFORE trigger firing for the
second row sees the first row's NEW parent. The walk goes B, C, B, C without end. `steps` makes every
repetition a distinct row, so `UNION ALL` never dedupes it away, and the AFTER trigger that would
refuse the cycle never runs, because the statement never finishes. A trigger that does not return
takes its connection with it.

## What changes

A **new migration**, never an edit to an applied one, replacing the function with the same body and a
cycle-safe upward walk.

**A path array, not the `CYCLE` clause.** `CYCLE code SET is_cycle USING path` is the clause written
for exactly this and it is what I would reach for first. It needs PostgreSQL 14. PGlite 0.4.3 embeds
17.5 and it works there, which I ran rather than assumed. **But nothing in this repository pins the
Postgres version the deployed API runs**: no workflow and no Dockerfile names one, the database is
Northflank's managed addon, and I cannot read its version without a credential I do not have and will
not ask for. A migration that parses here and fails on deploy is the worst outcome available. The
manual guard is what the `CYCLE` clause rewrites to internally, it works on every version in the
field, and it costs one array column:

```sql
WITH RECURSIVE above(code, steps, path) AS (
  SELECT $1::TEXT, 1, ARRAY[$1::TEXT]
  UNION ALL
  SELECT node."parentCode"::TEXT, above.steps + 1, above.path || node."parentCode"::TEXT
  FROM %1$I.%2$I node JOIN above ON node.code = above.code
  WHERE node."parentCode" IS NOT NULL
    AND NOT (node."parentCode"::TEXT = ANY (above.path))
)
```

`steps` stays, so the message still names the nearest named ancestor and the existing wording does
not change.

**What happens when a cycle is present mid-statement**, stated so nobody has to work it out later:
the walk stops at the repeat, raises no upward refusal, and the statement is still refused, by
`skipbureau_tree_holds` at statement end, which is the guard that owns cycles. The upward walk
declining to answer in that case is correct, not a hole: a tree that is momentarily cyclic has no
well defined "inside".

**And the comment is rewritten.** The current one states as proved something true only between
statements. That is worse than no comment, because the next person to touch this will trust it. The
new one quotes the documented rule and says the walk is safe because it carries its path, not because
a cycle cannot exist.

## Watching it fail

The planted case is one statement touching two rows of one tree and pointing them at each other:

```sql
UPDATE "Region" AS r SET "parentCode" = v.parent
FROM (VALUES ('TR-70','TR-70.b'), ('TR-70.b','TR-70')) AS v(code, parent)
WHERE r.code = v.code
```

against the schema as it stands, with a criterion naming an ancestor so the upward walk actually
runs. **Expect it to hang**, which is the whole point and also the hazard: PGlite runs Postgres in
this process, so a non-terminating query freezes the process rather than failing a test. It is run
under a hard timeout on the command, never left to a vitest `testTimeout`, which cannot interrupt a
blocked WASM call.

If it does NOT hang, the finding is wrong and this card becomes the comment correction alone. I will
say so plainly rather than fix something that was never broken.

After the migration the same statement must **terminate and be refused**, by the cycle guard, and
the ordinary single-row move must still be refused by the upward walk with its existing message, so
SB-200's two tests keep passing unchanged.

## What the check found, and where I disagree with it

The check accepted the version reasoning and the child process, and **rejected the safety argument
above**. Its scenario: a criterion names `A`; `B` and `C` sit below it; one statement first sets
`B`'s parent to `C`, creating `B` and `C` pointing at each other; then moves `D` out from below `B`,
whose upward walk meets the cycle, stops, and finds no named ancestor; then sets `C` back under `A`,
so the tree is acyclic by the end and `skipbureau_tree_holds` accepts. `D` has left the rule's reach
unrefused, and the `CYCLE` clause would decline in exactly the same way.

**I think that statement cannot be built, and the reason is the guard itself.** `D`'s upward path runs
`D` to `B` to `A`. To break that path the statement must change the parent of `B` or of `A`. Changing
`A` is refused by the DOWNWARD walk, since a criterion names `A` directly. Changing `B` runs `B`'s own
upward walk, seeded from `B`'s OLD parent, which still reaches `A`, so `B`'s move is refused and the
whole statement aborts, whichever row the executor visits first. Every row on the path between the
moved row and the named ancestor is protected by the same walk. The only rows exempt are those whose
OLD parent is NULL, and a row with no parent is on nobody's upward path until it is moved onto one,
which means changing the parent of a protected row again.

**That is an argument, and an argument is not evidence.** This repository's own rule is not to verify
by inference. So the check's scenario is written as a TEST, as literally as it can be built, and it
must be REFUSED. If it commits, the reviewer is right, the two guards can each decline and let a bad
state through, and the fix is statement level, with transition tables over the pre-statement and
final trees rather than a per-row walk. That would be a new card, because it replaces the mechanism
rather than repairing it, and this card's own exit would still be met.

**Both were run, and both answered.**

The hang is real. The three-row statement above, against the schema as SB-200 left it, in a child
process under GNU `timeout`, **never returned**: the probe printed "issuing the multi-row cycle
UPDATE...", then the shell reported exit 124, the kill. That is the planted case, watched rather than
predicted.

The check's scenario does not work, and the reason is the one given above. Written out as
`TR-71`, `TR-71.b`, `TR-71.c` and `TR-71.d`, the statement that would make `b` and `c` point at each
other, take `d` out, and put `c` back under the named `TR-71` is refused with:

> Region TR-71.b is inside TR-71, which a rule's criteria name, so it cannot be moved.

`b` is itself on the path between `d` and the named row, so `b`'s own upward walk reaches `TR-71` and
refuses before any cycle exists. `d` reads back under `b`, and `c` reads back under `b`. The
statement-level rewrite the check asked for is therefore not needed, and the path array is the whole
fix. I would rather have found the hole; the test is in `place.e2e.spec.ts` so that if the shape of
the guard ever changes, whoever changes it meets this case rather than the argument for it.

The path array is uncontested either way: it is the termination fix, and nothing about the dispute
above changes that a walk must not loop.

## How it is checked

SB-361 is a child of SB-186, so it closes on the tests covering what it changes: `place`, `status`
and `region` e2e specs, plus `research-rules` whole because the research load writes both trees, and
lint and the type checker.

**Files this touches**, which the check correctly noted my first list was missing: the new migration,
`apps/api/test/place.e2e.spec.ts` for the multi-row cases, and this plan. The hang plant is a
throwaway script in the scratchpad run as a child process, not a project file, precisely because it
is expected not to return.
