# SB-362, The temporary-cycle test pins a row order PostgreSQL does not promise

**Exit:** `place.e2e.spec.ts`'s temporary-cycle test asserts only the shared part of the refusal,
names no single row, and the place suite still passes.

## The defect, which is mine and one line wide

SB-361 added, at `place.e2e.spec.ts:449`, a test that a statement cannot hide a named ancestor behind
a temporary cycle. It asserts:

```ts
).rejects.toThrow(/TR-71.b is inside TR-71, which a rule's criteria name/)
```

The statement updates three rows, `TR-71.b`, `TR-71.c` and `TR-71.d`, and **PostgreSQL does not
promise the order an `UPDATE` visits them.** Its own documentation, which I quoted into
`20260916180000`'s comment while building SB-361, says the ordering of these change events "is not in
general predictable". Whichever row the executor reaches first is the one whose upward walk refuses,
and each names itself:

- `TR-71.b` if `b` is first, which is what happens today,
- `TR-71.c` if `c` is first,
- `TR-71.d` if `d` is first.

All three are correct refusals, and all three name `TR-71` as the protected ancestor. So the test can
fail on a different plan, a different version, or a different row count, while the invariant it
guards holds perfectly. SB-361's roast found this and I had asked it the question directly, because I
noticed while writing the roast that I had pinned something the database does not owe me.

## What changes

One regex, in one test:

```ts
).rejects.toThrow(/is inside TR-71, which a rule's criteria name, so it cannot be moved/)
```

**The two read-backs stay exactly as they are.** They are what actually prove the invariant: `TR-71.d`
still under `TR-71.b`, and `TR-71.c` still under `TR-71.b`. The message was never the evidence that
nothing moved; the rows are.

## Why this is loosening and not weakening

The new pattern still pins the two things that distinguish this refusal from every other one the
schema can raise:

- **the protected ancestor**, `TR-71`, so a refusal naming some other row fails it, and
- **the refusal's kind**, the upward walk's own wording, which no other guard uses.

That second half is the point, and the check corrected my reasoning for it. I had written that with
the upward walk deleted this statement would still be refused, by `skipbureau_tree_holds`. **It would
not**, and the mistake is worth keeping visible because it is the same one I made in SB-361's first
comment: that trigger is AFTER and sees the FINAL tree, and this statement's final tree is
**acyclic**. `b` ends under `c`, `c` under `TR-71`, `d` at the top. The cycle exists only
transiently, and only on the visit orders that produce it at all. The downward guard cannot match
either, because `TR-71` is an ancestor of the moved rows and never inside them.

So with the upward walk gone, this statement **commits**, and the test fails at `.rejects` before any
message is compared. That is a stronger guarantee than the one I claimed, not a weaker one: no path
refuses this statement with the new pattern's message unless the upward walk is what refused it. A
pattern loose enough to also match the cycle guard would be a test that passes with the feature gone,
which is worse than a flaky one, and this pattern is not that.

**Watched, not argued.** The check and I had both only reasoned about this, and the card's whole
justification rests on it, so it was run: a scratchpad probe applied every migration into a bare
PGlite, redefined `skipbureau_tree_row_in_use_keeps_its_place` with the upward block deleted and the
downward walk untouched, seeded `TR-71` with `b`, `c` and `d` and a criterion naming `TR-71`, and
issued this exact statement. It **committed**, and the rows read back as

```
TR-71 -> null, TR-71.b -> TR-71.c, TR-71.c -> TR-71, TR-71.d -> null
```

which is acyclic, which is why the AFTER cycle guard never fires, and in which `TR-71.d` has left the
named ancestor's reach unrefused. That is the defect SB-361 exists to prevent, reproduced by removing
its guard, and it is what this test still catches.

**Files: `apps/api/test/place.e2e.spec.ts` and this plan, and nothing else.** No schema change. The
migration is read for the message's exact wording and never edited, because it is applied: editing an
applied migration replays clean on a fresh PGlite and installs nothing on the deployed database.

## What I considered and rejected

- **Forcing a deterministic order.** There is no portable way to make `UPDATE ... FROM (VALUES ...)`
  visit rows in a stated order, and a plan hint would be testing the planner rather than the guard.
- **Accepting any of the three messages**, with an alternation on b, c and d. It encodes the same
  assumption, just three times, and says nothing a reader can use.
- **Splitting into three tests**, one per starting row. The statement is one statement; which row is
  visited first is not something the test can choose.

## How it is checked

SB-362 is a child of SB-186, so it closes on the tests covering what it changes: `place.e2e.spec.ts`
whole, plus lint and the type checker. Nothing else touches this file and no schema changes, so the
status, region and research specs are not implicated.
