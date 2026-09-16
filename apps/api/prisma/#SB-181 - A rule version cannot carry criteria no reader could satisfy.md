# SB-181, A rule version cannot carry criteria no reader could satisfy

**Exit:** on PGlite, a version given two nationality, situation, residenceRegion or workRegion
criteria is refused and read back unchanged, a criterion with an empty value is refused, and a
profile sending an empty situation is not asked for its situation.

## The two faults

**A version can carry two values of a detail a reader has only one of.**
`EligibilityCriterion`'s uniqueness is `@@unique([ruleVersionId, dimension, value])`, which by
construction permits two rows of one dimension with different values, and no migration guards it. So
`workRegion DE-SN` and `workRegion DE-BB` sit on one version, `fitToProfile` calls it open on
`workRegion`, and `resolve` asks the reader where they work when no answer can make it apply.

**An empty value is never matchable, and reads as unanswered.** `fitOne` tests
`if (!profile.situation) return Detail.situation`, so `''` is treated as not given and the reader is
asked. The same for `nationality`. A criterion whose own value is `''` can never match anything.

## Five dimensions, not the card's four, and one real exception

The card names `nationality`, `situation`, `residenceRegion` and `workRegion`. The enum has six.

- **`residenceStatus` belongs in the refusal too.** A profile holds one status per country, which is
  what `checkProfile` enforces and what DESIGN.md says, so two status criteria on one version are
  exactly as unsatisfiable. The card is silent on it; widening is right, as it was for SB-178.
- **`nationalityGroup` is the genuine exception.** `fitOne` resolves it as
  `groups.has(criterion.value)`, and one nationality can belong to several groups, so two group
  criteria on one version can both match a real reader. It must NOT be refused, and the reason
  belongs in the migration's comment so nobody completes the list later.

`residenceRegion` and `workRegion` are separate dimensions, so one of each is fine. The refusal is
per dimension, which also covers SB-186's note: `TR-34.kadikoy` and `TR-34.besiktas` on one version
is the same fault at a lower level, and a place and a place inside it likewise.

## What changes, after the plan check refused the first draft

**A new migration only.** The first draft's prose said "new migration" and its changed-file list
named `20260914140100_residence_statuses`, which contradicted it. Nothing here edits an applied
migration: `prisma migrate deploy` applies pending migrations, so an edit to an applied one replays
clean on a fresh PGlite database and leaves Northflank without the invariant. SB-180 learned this
once already and this plan repeated it.

### One, a partial unique index, NOT a trigger

The first draft proposed `skipbureau_criterion_is_satisfiable`, a trigger that queries for an
existing criterion of the same dimension. **That is not concurrency safe and the check was right to
refuse it.** Two transactions inserting `workRegion DE-SN` and `workRegion DE-BB` at the same time
each see no competing row, both pass, and both commit. It would pass every PGlite test in this
repository and still admit the exact state this card exists to prevent. This is the same class of
fault as SB-180's shared locks: a guard that reads correctly and does not hold under concurrency.

```sql
CREATE UNIQUE INDEX "EligibilityCriterion_one_value_per_single_valued_dimension"
  ON "EligibilityCriterion" ("ruleVersionId", "dimension")
  WHERE "dimension" IN ('nationality', 'situation', 'residenceRegion', 'workRegion', 'residenceStatus');
```

PostgreSQL's native mechanism for uniqueness over a subset of rows, enforced by the index itself, so
concurrent inserts conflict rather than race. It coexists with the existing
`@@unique([ruleVersionId, dimension, value])`, which still catches exact duplicates and still allows
two `nationalityGroup` rows. The enum is fine in the predicate: its values were added by earlier
migrations and enum equality is an ordinary immutable comparison.

### Two, a value that is not blank

```sql
ALTER TABLE "EligibilityCriterion" ADD CONSTRAINT "EligibilityCriterion_value_is_not_blank"
  CHECK (btrim(value) <> '');
```

Validated as it is added, so the migration proves the existing rows conform. The check confirmed no
research or seed criterion carries an empty value today, so this breaks no load.

### Three, blank input refused at the door, NOT a change to `fitOne`

The first draft changed `if (!profile.situation)` to `profile.situation === undefined`. **That meets
the literal exit and is wrong.** It silently reinterprets `''` as a situation the reader supplied
that matches nothing, which removes scoped duties from them without saying so.

Instead `checkProfile` rejects a blank `situation` or `nationality`, the way it already rejects an
unknown region, so an accidental empty value from a caller gets an honest `BAD_USER_INPUT` and is
never asked for again either. `fitOne` is left alone.

This card does not grow into validating unknown non-blank values. That is a different question.

## The tests

- The refusals in the database, in the style `region.e2e.spec.ts` uses: attempt the write, assert
  the refusal, read the counts back unchanged. Two `workRegion` criteria, two `situation`, two
  `residenceStatus`, and a blank value.
- **Two `nationalityGroup` criteria are ACCEPTED**, so the exception is proved rather than assumed.
- `needs.e2e.spec.ts` for the resolution half: a profile with `situation: ''` is refused as bad input
  rather than asked for its situation.
- **Watched failing first**, against the schema as it stands, before the migration exists.
- **Named for the message.** SB-180's assertions read `/names its country/` and could never match,
  because PostgreSQL prints the constraint's NAME. A unique index violation prints the index name, so
  the tests match `EligibilityCriterion_one_value_per_single_valued_dimension` and
  `EligibilityCriterion_value_is_not_blank`, and those names are written to read as the rule.

## How it is checked

SB-181 is a child of SB-176, so it closes on the tests covering what it changes: the API's region,
status, place and needs e2e specs, `research-rules.e2e.spec.ts` run whole because it loads the
research inside an earlier test, plus lint and the type checker. The research load is run, because a
criterion refusal that caught a researched version would break it without any other suite noticing.
