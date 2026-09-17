# SB-360, a place or status a rule reaches from above can still be deleted

**Exit, as the card words it:** on PGlite, with a version naming TR-52 in force, deleting
TR-52.altinordu is either refused and the row reads back unchanged, or `PHASE-NEXT.md` records why a
delete is allowed where a move is not.

This plan lives in `apps/api/prisma/` because that is where SB-200's plan lives and where a migration
would land. The exit has two branches and this plan is mostly about which of them is true.

## The defect, read at source

`migrations/20260916180000_the_upward_tree_walk_carries_its_path/migration.sql`, the current
definition of `skipbureau_tree_row_in_use_keeps_its_place`. It enters on `DELETE`, takes the tree
lock, and runs the **downward** walk for both operations, refusing when a criterion names the row or
anything inside it. Then:

```sql
  -- Nothing names this row or anything inside it. It can still be a row a rule reaches from above,
  -- and taking it out from under that row would move every reader in it to another rule's answer.
  IF TG_OP = 'UPDATE' THEN
    IF NEW."parentCode" IS DISTINCT FROM OLD."parentCode" AND OLD."parentCode" IS NOT NULL THEN
```

The **upward** walk is inside `IF TG_OP = 'UPDATE'`. On `DELETE` it never runs. So a leaf that no
criterion names, whose parent a criterion does name, passes the downward walk and is deleted. The
card is right.

**Both trees, not one.** One function, two triggers, `migrations/20260914140100_residence_statuses`
lines 292 and 305: `region_in_use_keeps_its_code` on `"Region"` and
`residence_status_in_use_keeps_its_code` on `"ResidenceStatus"`, both `BEFORE UPDATE OR DELETE`.
`status.e2e.spec.ts:294` holds the move half for statuses, and **no test deletes a residence status
at all**, so nothing is pinned there in either direction.

## It has no instance in today's data, which the card does not say

Every region code a researched rule names as a criterion value: `DE-BE`, `DE-HH`, `DE-SN`, `TR-16`,
and the five cities `DE-BY.muenchen`, `DE-NW.duesseldorf`, `DE-NW.koeln`, `DE-HE.wiesbaden`,
`DE-BW.freiburg`.

The five cities that sit inside a parent are named **directly**, so the downward walk already refuses
deleting them. The parent states they sit in, `DE-BY`, `DE-NW`, `DE-HE` and `DE-BW`, are never
criterion values. The states that are named have no children.

So today there is **no row anywhere that a rule reaches only from above**. The hole is reachable in a
constructed fixture and nowhere else. It is one research edit from being live, because Germany's
Anmeldung already names DE-SN at state level and DE-BY.muenchen at city level, so a rule naming a
state that has cities is an ordinary next step rather than a hypothetical.

## The card's `why` is backwards, and the severity rests on it

The card says "a reader with a place no rule recognises is the worse of the two outcomes". Measured,
it is the better one.

- **Deleted place**: `rules.service.ts:144` throws `ProfileError` for an unknown code, and
  `profile-args.ts:8` turns it into a GraphQL `BAD_USER_INPUT`. The reader gets a refusal that names
  the code.
- **Moved place**, which SB-200 refused: the reader is silently answered by a different rule.

A loud refusal is not worse than a silent wrong answer. Whatever is decided, that sentence should not
stand as the reason.

## Branch A, refuse the delete

Run the upward walk on `DELETE` too, seeded from `OLD."parentCode"`. On `DELETE` there is no `NEW`, so
the guard becomes `OLD."parentCode" IS NOT NULL` for that operation and keeps the
`IS DISTINCT FROM` test for `UPDATE`.

**It breaks no test that exists.** `place.e2e.spec.ts:501-502` deletes `TR-35.konak.alsancak` and then
`TR-35.konak` only after `ruleVersion.delete` has freed the criteria, so the walk would find no named
ancestor. `region.e2e.spec.ts:303` deletes `TR-90`, whose `parentCode` is null.

**But it constrains the research loader, and that is the real cost.** `load.ts:288-292` deletes the
regions a file of this load owns and no longer lists, through `deepestFirst`, which
`load.ts:132-140` implements by walking parent links and sorting by descending depth: **children are
deleted before parents.** Statuses do the same at `load.ts:262-266`. So a research file that stops
listing a city while a rule still names its state would delete the child under a named parent, be
refused, and fail the whole load transaction. That is a legitimate research edit, and it would fail
for a reason no one editing research would predict.

## Branch B, allow it and record why

Write the decision in `PHASE-NEXT.md`: a row inside a named row may be deleted, because a delete is a
lifecycle event a research file performs routinely and its failure mode for a reader is a loud
refusal, while a move is refused because it silently rehomes readers under another rule.

**The load is the argument.** The one caller that deletes these rows in anger is the research loader,
deleting deepest first precisely so a parent is never removed from under its children. Refusing that
would make research edits fail on tree shape.

## What I recommend, and what the check is asked to rule on

**Branch B**, on the balance above: no live instance, a loud failure mode, a card `why` that inverts
the two harms, and a cost to the loader that Branch A's consistency does not pay for. The plan is
written so either can be executed once the check rules.

**And the gate question, asked again because I got it wrong today.** SB-359 was dropped hours ago for
being a gate the owner did not ask for. Changing this trigger looks different to me: it is product
behaviour a reader is subject to, not test or verification apparatus that blocks work from closing,
and the trigger already refuses deletes. But that is the same shape of distinction I drew for SB-359
and the check refused it, so it is asked rather than assumed.

## The check ruled Branch B, and corrected the case for it

> "Choose Branch B. ... Of the four grounds, (1) is weakest: no current affected row lowers urgency,
> not the semantic question. (3) merely corrects the card's rationale. Grounds (2) and (4) hold:
> Branch A would reject a legitimate loader operation when a child is removed under a still-named
> parent."

It also answered the gate question without leaving it to me: the distinction from SB-359 is real,
this being runtime data integrity rather than a research-quality test, but **Branch A is still a new
runtime refusal and would need the owner's explicit approval**. Branch B is the path open without
asking him a second time today.

**The third branch is refused, and for a better reason than I had.** Gating the refusal on
`current_setting('skipbureau.research_load')` is technically workable, since `set_config(..., true)`
is transaction local, but it is **not an authorization boundary**: any trusted database writer can set
it. It buys a hidden exception for no present benefit while the loader is the only writer. Revisit it
only when there is a real administrative writer.

**And the mistake it warned against is the one I was closest to making**: documenting the delete as
harmless. It is not harmless, it is **loud**. A stale profile fails until the reader chooses a place
that exists, and that is precisely why it is acceptable where a silent move is not. The entry is
written that way.

## The defect was watched, not inferred

A throwaway probe on PGlite, on codes of its own because the existing test already owns TR-52: with a
version naming `TR-55`, moving `TR-55.leaf` out was refused with
`is inside TR-55, which a rule's criteria name, so it cannot be moved`, and **deleting it succeeded**,
the row reading back null. Twenty two tests passed where the file holds twenty one.

**The probe was then removed and the spec restored byte identical from a copy**, with zero lines left
behind, because the check was explicit: do not add a test that freezes the allowed delete. A test
asserting today's behaviour would make the decision permanent by accident, which is the opposite of
recording it as reversible.

## Nothing in the migrations over-claims, so nothing there is corrected

The check asked for the migration comment to be fixed **if** it still implied deletion is refused. It
does not. SB-200's comment says the upward walk "runs only when the row's PARENT CHANGES" and never
mentions delete; the function's own comment above the branch speaks of taking a row out from under
another; and the only message naming deletion, at line 84, belongs to the downward walk, where a
criterion does name the row and deletion genuinely is refused. **The gap is silence, not a false
statement**, so the record goes where the decision goes and no applied migration is touched.

## How it is proved

- **The defect is reproduced before anything is decided.** On PGlite, with a version naming TR-52,
  `prisma.region.delete` on `TR-52.altinordu` must be watched **succeeding** today. Reading the
  `IF TG_OP = 'UPDATE'` branch is not the same as seeing the row go, and the exit names this exact
  scenario.
- **If Branch A**: the delete is refused, the row reads back unchanged, and the refusal is watched
  failing on a planted case by putting the guard back to `UPDATE` only. The status tree gets the same
  case, since one function serves both triggers and neither the fix nor the hole is place-specific. A
  further case covers the loader: a file that stops listing a place under a named parent must still
  load, or the plan is wrong and Branch B is the answer after all.
- **If Branch B**: `PHASE-NEXT.md` gains the decision in that file's form, with what it costs and the
  condition that would reverse it, and the card's inverted `why` is corrected on the board rather than
  repeated.
- Either way this card has no parent, so it closes on the full suite, plus lint and the type checker.
