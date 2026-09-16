# SB-180, A region criterion stays on its own country's version, and a region code agrees with its country

**Exit:** on PGlite, changing a draft version's countryCode while it carries a region criterion of
the old country is refused, inserting or recoding a Region whose code prefix differs from its
countryCode is refused, and the rows are read back unchanged.

## The two gaps, checked rather than taken from the card

**A version can walk out from under its criteria.** `skipbureau_criterion_names_a_tree_row` fires
`BEFORE INSERT OR UPDATE ON "EligibilityCriterion"` only. Nothing fires on `RuleVersion` about its
criteria, and the history triggers do not stand in the way: `skipbureau_rule_version_is_history`
returns early for `skipbureau_rule_version_is_new(OLD.id)`, for `skipbureau_research_load()`, and
for `OLD."validFrom" > current_date`, which is every draft. So a German draft carrying a `DE-SN`
criterion can be updated to `countryCode = 'tr'` and the criterion stays, naming a German region on
a Turkish version. Matching then hands it to a reader who says they live in Saxony while asking
about Turkey.

**A code can disagree with its country.** `Region.code` is the primary key and `countryCode` is a
separate column with only a foreign key on it. Nothing ties them, so `{ code: 'DE-XX', countryCode:
'tr' }` inserts, and two things then accept it: `checkProfile` finds it by code alone,
`prisma.region.findMany({ where: { code: { in: regionCodes } } })`, so it is a known region, and
`skipbureau_criterion_names_a_tree_row` accepts it for Turkish versions because it joins on
`countryCode`.

**The card's account of the rest of it is wrong, and the plan does not repeat it.** It says
`checkRegions` calls the row known, that `regionsInConflict` groups it as German, and that SB-176
reads the code prefix. There is no `checkRegions`: the validator is `checkProfile`,
`rules.service.ts:92`. `inConflict`, `eligibility.ts:172`, groups by `countries.get(code)`, a map
built from the **stored** `countryCode`, so it groups the row as Turkish, not German. And nothing
in either app derives a country from a code's prefix: `treeFit` works through `tree.has` and
`within`, `treesOf` selects `where: { countryCode }`, and the one `split('-')` in the web,
`paths.ts:49`, splits the locale segment `en-IR`. So the API is consistent about such a row. It
treats it as Turkish throughout.

**The harm is to the identifier, which is the real reason to constrain it.** A region's code is
public and human read: it is in the address a reader shares, `/en/DE-HH/guides/anmeldung`, in the
research files that key regions by it, in the seed, and in the admin panel to come. DESIGN.md says
a province or state has its ISO 3166-2 code and a place inside one a readable key under its
parent's, `TR-34.kadikoy`, and that convention is the only thing telling an editor which country a
key belongs to. A row whose code says `DE-` while its country says `tr` asserts something false
about itself everywhere it is read, and it silently breaks that convention for every editor after.
That is worth a constraint on its own, without needing the four-way disagreement the card
describes and the code does not have.

## The shape the two trees actually have

Read from the data, not assumed, because the obvious single rule is wrong here:

- Regions are upper case with a hyphen, and the country code is lower case: `DE-SN`, `TR-34`,
  `DE-BW.freiburg`, `TR-34.kadikoy.moda`, each with `countryCode` `de` or `tr`.
- Statuses are lower case with a dot: `tr.residence-permit.student`, `de.aufenthv-41-1`,
  `tr.short-stay.visa-exemption`, `de.national-visa`.

So the rule is "the country code, then this tree's separator", and both the case and the separator
differ per tree. `DE-PRO`, which a grep turns up, is not a row: it appears only inside the research
prose for Germany's states, in the locator describing ISO's list and code source line.

Every fixture the existing suites plant to prove a refusal satisfies the rule already, so none of
their expected messages changes: `DE-BY.muenchen` with `de`, `de.wrong` with `de`, `tr.itself` with
`tr`, `TR-06.itself` with `tr`, `DE-XX` and `TR-35-X` in their own country.

## What changes

**All of it goes in a NEW migration**, `20260916120000_a_code_names_its_country_and_a_version_keeps_its_criteria`,
never as edits to the applied files quoted above. `prisma migrate deploy`, which is how the API
installs schema changes on Northflank, applies only PENDING migrations. Editing `20260914140100`
would replay clean on a fresh PGlite database, because a fresh database replays every file, and
install nothing whatever on the deployed one, and Prisma says the same about editing an applied
migration. The plan check caught this, and it is the exact shape of failure where every test here
is green and the live database is unguarded.

### One, the code agrees with its country: a CHECK, not a trigger

```sql
ALTER TABLE "Region" ADD CONSTRAINT "Region_code_names_its_country"
  CHECK (left(code, length("countryCode") + 1) = upper("countryCode") || '-');

ALTER TABLE "ResidenceStatus" ADD CONSTRAINT "ResidenceStatus_code_names_its_country"
  CHECK (left(code, length("countryCode") + 1) = "countryCode" || '.');
```

A CHECK rather than a branch in `skipbureau_tree_holds`, for three reasons. It is validated against
every existing row when it is added, so the migration is itself the proof that the data conforms,
and fails loudly on deploy if it does not. It holds for every write, including ones that never
reach a row trigger. And it costs nothing per statement.

`left(code, length("countryCode") + 1)` rather than `LIKE "countryCode" || '-%'`: a `LIKE` pattern
built from a column would treat `_` as a wildcard, and `length(...)` rather than a literal 3 keeps
it correct if a country code is ever not two characters.

This is a per-table constraint even though the rest of this area is generalised over
`skipbureau_tree`, because the two trees genuinely differ here. Putting one parameterised rule in
the closed list would be the same amount of code saying the same two things less directly.

### Two, a version does not leave its criteria behind: a trigger on `RuleVersion`

```sql
CREATE OR REPLACE FUNCTION skipbureau_version_keeps_its_tree_criteria() ...
CREATE TRIGGER rule_version_keeps_its_tree_criteria
AFTER UPDATE ON "RuleVersion" FOR EACH ROW
WHEN (NEW."countryCode" IS DISTINCT FROM OLD."countryCode")
EXECUTE FUNCTION skipbureau_version_keeps_its_tree_criteria();
```

- `AFTER UPDATE`, matching `region_tree_holds`, so it judges the tree the whole statement leaves
  rather than a half applied one.
- A `WHEN` clause, so a version whose country does not change pays nothing. Every other update on
  this table stays exactly as fast as it is now.
- It walks the version's criteria, takes each named tree from `skipbureau_tree_named_by`, locks
  that tree for both the old and the new country through `skipbureau_lock_tree`, and refuses if any
  criterion names a row that is not in the new country. Reusing those functions makes it cover
  `Region` and `ResidenceStatus` at once, which is the same widening SB-189 already applied to
  every other guard here.
- **The lock is EXCLUSIVE, not shared**, which the first draft of this plan had wrong. A shared
  advisory lock conflicts only with an exclusive one, never with another shared one, and
  `skipbureau_criterion_names_a_tree_row` takes it shared. Two transactions, one writing a
  criterion and one moving the version's country, would both hold it shared, each validate without
  seeing the other's uncommitted row, and both commit: exactly the cross-country criterion this
  task exists to prevent. Exclusive makes the country move wait, then read again and refuse. This
  is a change of approach the check made, and applying it is not a re-check.
- **Both trees are locked, for both countries, in one fixed order**, `Region` then
  `ResidenceStatus`, and unconditionally on any country change, before the criteria are walked.
  The check proposed locking only the trees the version's criteria name, and writing the tests
  showed why that cannot be verified: once this ships, a version carrying a tree criterion can
  never successfully change country, so a conditional lock is taken only on paths that end in an
  exception, and an exception rolls the statement back before anything can read `pg_locks`. Locking
  unconditionally makes the mode observable on a move that succeeds, which is what the regression
  assertion needs, and it removes the cross-tree ordering question rather than answering it.
  `skipbureau_lock_tree` already sorts the countries within a tree, so the old country against new
  country cycle stays covered. The cost is two advisory locks on a statement nothing in the running
  app performs: `load.ts` is the only writer of a version's country and it creates and deletes
  rather than updating.
- **It does not honour `skipbureau_research_load()` or `skipbureau_rule_version_is_new`.** Those
  exist so the loader and a same-transaction build can write history that the freeze would
  otherwise refuse. This is not a history rule: a version whose country contradicts its own
  criteria is a contradiction whoever writes it, and the loader has no need of it, because it
  replaces versions rather than re-countrying them. That is the decision in this plan I am least
  sure of and the first question the check gets.

Wording follows the file: `RuleVersion % cannot move to %, because a % criterion names %, which is
not a % of that country.`

## The tests

`apps/api/test/region.e2e.spec.ts` for the region half and `apps/api/test/status.e2e.spec.ts` for
the status half, in the style both already use: attempt the write against the database itself and
assert the refusal, then read the row back.

- A draft with a `DE-SN` criterion, updated to `countryCode: 'tr'`, is refused, and the version
  reads back as German.
- The same for a `tr.residence-permit` criterion moved to `de`, so the status tree is proved rather
  than assumed to follow.
- A draft whose only criteria are of a dimension that names no tree, a nationality say, DOES move
  country, so the guard is not a blanket freeze on the column.
- `prisma.region.create({ code: 'DE-XX', countryCode: 'tr' })` is refused, and so is
  `update({ where: { code: 'TR-16' }, data: { code: 'DE-16' } })`.
- `prisma.residenceStatus.create({ code: 'de.something', countryCode: 'tr' })` is refused.
- **The lock mode is asserted**, beside the test `status.e2e.spec.ts` already has for it, "a status
  criterion holds the status tree's lock shared, a change to the status tree holds it exclusively,
  and neither holds the region tree's". A version's country change must show as EXCLUSIVE on both
  countries of each tree it names, so a later simplification back to shared cannot quietly
  reintroduce the race.

**Watched failing first.** These assertions were written and run against the schema as it stood,
before the migration existed. A guard that has never been seen refusing is not known to refuse.

What was actually seen, which is the defect itself rather than a planted stand-in: both files at
`1 failed | 7 passed (8)`, each new test expecting a rejected promise and receiving a resolved
`RuleVersion` row. In `region.e2e.spec.ts` the German draft carrying a `DE-SN` work region criterion
came back `countryCode: "tr"`. In `status.e2e.spec.ts` the Turkish draft carrying a
`tr.residence-permit` criterion came back `countryCode: "de"`. The version had moved and its
criterion had stayed, which is exactly what the card describes.

The migration file was not written until that output was on disk, because the status spec runs its
own `prisma migrate deploy` in `beforeAll`: a migration appearing while the run was in flight would
have been applied and the assertion would have passed, destroying the evidence the run existed to
collect.

## What was verified before the check answered

Both of these confirm the plan rather than change it, so they are record, not a new approach.

**The research load never re-countries a version.** `load.ts:352` is its only `ruleVersion.update`
and it writes `research` alone. New versions are created at `load.ts:361` and the ones set aside
are deleted at `load.ts:219`. So the trigger refusing the `skipbureau_research_load()` bypass cannot
break the load: the load does not do the thing being refused.

**The load DOES update a region's country in place**, `load.ts:284`, with
`wanted.countryCode = rules.country`. That is safe under the CHECK, because `region.code` and
`rules.country` come from the same research file: the only write it could refuse is one where a
file lists a region whose code names a different country than the file does, which is a fault worth
refusing. The constraint therefore guards the research files as well as the table.

**Nothing outside `load.ts` writes a version's `countryCode`.** `country.resolver.ts` only reads it.
So gap A is not reachable through the running app today, and the plan does not claim it is: this
guard is a database invariant, which is where every neighbouring guard in this family already lives,
and it is what stops the admin panel, a script or a psql session from writing the contradiction
later.

## Two things this plan got wrong, found by running it

**The ordering risk was predicted and then checked incompletely.** This plan said a CHECK firing
before the tree trigger could change which message a refusal carries, looked at every `create`
fixture in the suites, found them all consistent, and stopped there. It never looked at an
`update`. `place.e2e.spec.ts:373` moves `TR-06` to `countryCode: 'de'` and asserted the tree guard's
words; the CHECK now refuses it first, with its own. The row is still refused, so nothing is less
safe, but the branch about a region leaving its places behind is now reachable only by changing a
code and a country together, and nothing exercises it. That lost coverage is SB-352, and the line
that used to provide it still passes, against a different rule, which is why the loss is invisible.

**The assertions could not have matched.** They were written as `/names its country/`, with spaces.
PostgreSQL reports `violates check constraint "Region_code_names_its_country"`, with underscores,
because what it prints is the constraint's name. Worth remembering when naming a constraint that a
test will match on: the name IS the message.

## How it is checked

SB-180 is a child of SB-168, so it closes on the tests covering what it changes: the API's region,
place and status e2e specs, plus lint and the type checker. `research-rules.e2e.spec.ts` is run
whole rather than filtered, because that file loads the research inside an earlier test and a `-t`
filter on a later one sees no researched obligation.

The research load is the one thing that could be broken by this without any of those noticing, so
it is run: the load writes every researched version and region, and a constraint or trigger that
refuses one of its rows would stop it.
