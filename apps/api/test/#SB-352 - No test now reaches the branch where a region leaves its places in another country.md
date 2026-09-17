# SB-352, no test now reaches the branch where a region leaves its places in another country

**Exit, as the card words it:** a test in `place.e2e.spec.ts` changes a region's code
and countryCode together while a place inside it stays in the old country, and is
refused with the message about a place inside it being in another country.

This plan lives in `apps/api/test/` because the test lands in `place.e2e.spec.ts`.

## What is there, measured

- **The branch, in full, from the LIVE function.** `skipbureau_tree_holds` in
  `20260914140100_residence_statuses/migration.sql`, which is generic over both trees
  and dispatched by `TG_TABLE_NAME`:

  ```sql
  IF TG_OP = 'UPDATE' THEN
    IF NEW."countryCode" <> OLD."countryCode" THEN
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I.%I node WHERE node."parentCode" = $1 AND node."countryCode" <> $2)',
        TG_TABLE_SCHEMA, TG_TABLE_NAME) INTO found USING NEW.code, NEW."countryCode";
      IF found THEN
        RAISE EXCEPTION '% % cannot be in % while a % inside it is in another country.',
          label, NEW.code, NEW."countryCode", shape.kind;
      END IF;
    END IF;
  END IF;
  ```

  With label Region and kind place that prints exactly the sentence the exit names.

  **An earlier draft of this plan quoted the wrong function**, the Region specific
  `skipbureau_region_tree_holds` from `20260914120000_places_at_any_level`. The plan
  check caught it, and its conclusion was right while its reference was not: it said
  the replacement was in the 09-16 migration and the drop in that one's successor. In
  fact `20260914140100_residence_statuses` does all of it, dropping the trigger at
  line 286, recreating `region_tree_holds` on the generic function at 287, and
  dropping `skipbureau_region_tree_holds()` at 309. Checked rather than transcribed.

  The trigger keeps the name `region_tree_holds` after that recreate, which matters
  for the ordering question below: the internal `RI_ConstraintTrigger` still sorts
  before it.

- **The older, dead version**, kept here only because the exit's wording came from it:
  `20260914120000_places_at_any_level/migration.sql`:

  ```sql
  IF TG_OP = 'UPDATE' THEN
    IF NEW."countryCode" <> OLD."countryCode" AND EXISTS (
      SELECT 1 FROM "Region" region WHERE region."parentCode" = NEW.code AND region."countryCode" <> NEW."countryCode"
    ) THEN
      RAISE EXCEPTION 'Region % cannot be in % while a place inside it is in another country.', NEW.code, NEW."countryCode";
    END IF;
  END IF;
  ```

  It is an AFTER INSERT OR UPDATE FOR EACH ROW trigger, which is why SB-180's CHECK
  now runs first for a country change that keeps the code.
- **The CHECK that shadows it.** `Region_code_names_its_country` is
  `left(code, length("countryCode") + 1) = upper("countryCode") || '-'`, so `TR-06`
  in `de` is refused before any trigger. `DE-06` in `de` satisfies it.

  **And the two CHECKs are not the same shape, which the second test turns on.**
  Region wants `upper("countryCode") || '-'`, so `TR-` for `tr`. ResidenceStatus wants
  `"countryCode" || '.'`, the code as it is and a dot, because status codes are
  lowercase and dotted: `tr.residence-permit`, not `TR-RESIDENCE-PERMIT`. So a status
  recode is `tr.x` to `de.x`.

  Copying the region's shape into the status test would have been refused by that
  CHECK before the trigger ran, which is precisely the shadowing this card exists to
  escape, reproduced by accident in the test written to escape it.
- **The existing test says so itself.** `place.e2e.spec.ts` around line 373 carries a
  comment from SB-180 ending "The tree's own branch, a region leaving its places
  behind, is reached only by changing the code and the country together, which is
  SB-352." The card and the code agree.
- **The freeze that can refuse first.** `skipbureau_region_in_use_keeps_its_code`
  raises "Region % is named by a rule's criteria, itself or through a place inside it,
  so it cannot be deleted or recoded, or moved."

## The card's recipe does not work as written, and that is the substance here

The card says to use "TR-16 to DE-16 with countryCode de, while a place inside it
stays behind". Two things stop that.

- **TR-16 has nothing inside it.** The spec's shared `PLACES` gives Istanbul two
  districts and Bursa none. Recoding TR-16 would cascade to no child, the `EXISTS`
  would find nothing, and the branch would not fire. The test would pass by doing
  nothing, which is the failure mode this card exists to remove.
- **TR-16 is named by a criterion later in the same file**, `works('TR-16')` at line
  597, and these tests share one database in file order. A test placed after that is
  refused by the freeze with its own message, so it would look like a guard working
  while the branch under test never ran.

So the test creates its own parent and child, on codes no criterion names anywhere in
the file, and does not depend on where it sits in the run.

## Why the route works at all: ON UPDATE CASCADE

The `EXISTS` matches `region."parentCode" = NEW.code`, the NEW code. A child still
recording the old parent code would not be found. It is found because both self
referencing keys cascade:

```sql
"Region_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "Region"("code")
  ON DELETE NO ACTION ON UPDATE CASCADE
```

and the same for `ResidenceStatus`. So recoding the parent rewrites the child's
`parentCode`, the `EXISTS` finds a child whose country still differs, and the branch
raises. Nothing in the card says this, and without it the card's route is simply
wrong rather than merely awkward.

## The approach

1. Create a parent and a child under codes no criterion names, both in `tr`.
2. Update the parent's `code` and `countryCode` together, to `DE-` and `de`.
3. Expect the refusal to name a place inside it being in another country.
4. Read the rows back: the parent keeps its code and country, the child keeps its
   parent, so the statement was refused whole.
5. Do the same for `ResidenceStatus`, whose identical branch is bypassed identically.

## Files

- `apps/api/test/place.e2e.spec.ts`, the Region test.
- `apps/api/test/status.e2e.spec.ts`, the ResidenceStatus test.
- this plan.

**Two specs, not one, and the plan first said otherwise.** `place.e2e.spec.ts` does
not touch `ResidenceStatus` anywhere: that tree has its own spec with its own seed
and its own tree guard tests. Putting the second half in the place spec would have
meant seeding a status tree in a file that has never held one, beside tests that know
nothing about it.

## The exit names one tree and the card's own note names two

The card's note, from SB-180's roast, says "The same bypass applies to
ResidenceStatus, so the replacement test should cover both trees." The exit says only
"a region's code". Covering both is what the note asks and what the shape of the
guards deserves, since the ResidenceStatus function is the generic one and the Region
one is its older twin.

I am covering both and saying so here, rather than covering one and calling the exit
met. If the check thinks the exit should be restated to name both, that is a wording
correction the board can carry.

## How it is proved

The test itself is the proof, and it is the kind that can pass for the wrong reason,
so two things are asserted beyond the message.

- **The rows are read back.** A refusal that left the parent recoded would be a
  different defect, and the existing neighbours in this file already read rows back
  after a refusal for exactly that reason.
- **The child must exist and be found.** If the setup created no child, or the cascade
  did not run, the update would succeed and the test would fail on the missing
  rejection rather than silently pass, which is the right way round.

Then the planted half: with the child removed, the same update must be **accepted**,
which shows the refusal came from the child's country and not from the recode alone.
That is the case the card's TR-16 recipe would have produced by accident.

## What the plan check settled

The first check today that reached a working reviewer, and it corrected something
real rather than agreeing.

- **Build it as written, with one correction.** The quotation above cites
  `skipbureau_region_tree_holds`, which the 2026-09-16 migration replaced with the
  generic `skipbureau_tree_holds` and then dropped. So the plan quoted dead code. It
  costs nothing to the argument, because the generic function's format string with
  label Region and kind place produces byte identical text, so the message the exit
  names is still what fires. The citation is corrected below rather than left for a
  future reader to hit the same dead end.
- **Which exception fires: probably the child's, not the one the exit names.**
  PostgreSQL fires same event, same timing AFTER ROW triggers in byte alphabetical
  order by trigger name, and implements ON UPDATE CASCADE as an internal trigger
  named RI_ConstraintTrigger. Uppercase R sorts before lowercase r, so the cascade
  runs before region_tree_holds on the parent row, and the cascade's UPDATE of the
  child runs to completion with the child's own triggers. On the child the parent
  country branch is violated, so the caller would see must be inside a region of its
  own country.

  The reviewer flagged this as documented knowledge rather than freshly checked,
  because web search was not available to it. So it is a prediction to test, not a
  fact to build on, and the test is written to find out. **If the child's message
  wins, this card's exit names a branch this route cannot reach**, and that finding
  is worth more than a passing test.
- **Covering both trees is right.** `skipbureau_tree_holds` and
  `skipbureau_tree_row_in_use_keeps_its_place` are generic, dispatched by
  TG_TABLE_NAME, and shared by Region and ResidenceStatus since the 09-16 refactor,
  so the bypass is structurally identical on both.
- **The accepted update plant is not a new risk**, and this was checked against the
  file rather than reasoned about: `place.e2e.spec.ts` line 493 already leaves a
  successful permanent mutation behind with no cleanup, TR-35.konak renamed and given
  an official code, still there for every later test. This file's convention is
  scoped codes no other test names, not transactional rollback, and the scratch
  parent and child follow it.

## Run, and the ordering question is answered by the database

Both specs pass:

```
place.e2e.spec.ts    21 tests passed    exit 0
status.e2e.spec.ts   11 tests passed    exit 0
```

so `rejects.toThrow(/while a place inside it is in another country/)` matched, and
the status tree's equivalent matched too. **The parent's country move branch fires.**
The exit is met as worded, on both trees, and the row read backs show nothing was
left recoded.

**The plan check's prediction did not hold, and that is worth recording precisely.**
It argued that AFTER ROW triggers fire in byte alphabetical order by trigger name,
that ON UPDATE CASCADE is an internal RI_ConstraintTrigger, that uppercase R sorts
before lowercase r, and therefore that the cascade would run the child's update to
completion first and the caller would see the child's message instead. It flagged
that as documented knowledge rather than freshly checked, because web search was not
available to it. The database says otherwise.

So on this card the same reviewer was right about the thing it could verify, that the
plan quoted a dropped function, and wrong about the thing it could not. That is the
argument for running it rather than for trusting it, and for asking questions whose
answers a run can settle.

**Planted on both trees, by removing the place inside.** With the parent created and
no child, the recode is legitimate and the update succeeds, so the rejection never
comes:

```
place.e2e.spec.ts     1 failed | 20 passed (21)
status.e2e.spec.ts    1 failed | 10 passed (11)
```

restored from copies, and green again at 21 and 11.

**That plant does double duty, and the second part is the one worth naming.** It shows
the refusal comes from the child's country rather than from the recode alone, which is
the whole distinction this card exists to test. It also shows the tests RUN: both
suites would have passed exactly as before if the new cases had never been collected,
so a green run was not by itself evidence of anything. The only thing that
distinguishes a test that passes from a test that is absent is watching it fail.

## The step I was least sure of, answered by the run

Left as it was written, because what was doubted beforehand is the useful half of the
record. **Answered: the parent's message fires.**

The doubt was which exception a caller sees, since the cascade updates the child and
that update fires the same AFTER trigger on the child row, where the parent country
branch is violated. Two messages were available and the exit names one. The plan check
predicted the child's would win, on trigger name ordering. The run says the parent's
does, on both trees, and the planted case shows the assertion can fail, so it is not
passing by accident.

What remains inference rather than measurement is the MECHANISM: whether the cascade
had not yet run when the parent's trigger fired, or ran and was rolled back with the
statement. The observation is solid, the explanation is not, and the difference is
worth keeping because the next person will want the explanation.

### What it was, before the run

**Which exception surfaces.** The cascade updates the child, and that update fires the
same AFTER trigger on the child row, where the parent-country branch is now violated:
the child is in `tr` and its new parent `DE-...` is in `de`, so that branch would
raise "must be inside a region of its own country". Two different messages are
available and the exit names only one.

Which one a caller sees depends on how Postgres orders AFTER ROW triggers against the
referential action that produced the cascaded update, and I do not know that from
memory. The honest plan is that the test asserts the message the exit names, the run
says whether that is what comes out, and if the other one surfaces first then the
card's exit is describing a branch this route cannot reach and that finding is worth
more than a passing test.
