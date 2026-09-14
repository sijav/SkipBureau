# SB-189, Residence status is a detail a rule can depend on

**Exit:** on PGlite, a Turkish version scoped to residence-permit holders
applies to a reader who says they hold one, asks a reader who has not said, and
does not apply to a reader on a visa exemption, and a status that is not one of
that country's is refused as the caller's mistake.

## Why

Turkey's agreed research, `research/agreed/turkey/address-registration.md`,
verifies the twenty working days for residence-permit holders,
international-protection applicants and status holders and temporary-protection
beneficiaries, and says of someone here solely on a visa or visa exemption that
"we could not verify the same registration and change-notification duty". A
rule can depend today on nationality, a nationality group, a situation, and
where the reader lives and works. None of those is a residence status, and
`situation` is the design's Role row, one value. So a version for everyone would
tell a visitor on a visa exemption a duty the research refused to claim, and a
version for a situation cannot say it at all. SB-191, Turkey's address
registration, waits for this card.

The design says what a status is. The Complete state of the context panel,
Figma `47:663`, shows Residence status "Student residence permit" beside Role
"Student" and City in Turkey "İzmir". A status is a country's own kind of
permission to be there, one per country for a reader, and it is not a role.

## What stays exactly as it is

- **`situation` stays the Role row**, untouched.
- **Inheritance still follows places only** (SB-186). A residence status is
  scope, like a nationality group: a version for student residence permit
  holders does not take a missing key from a version for residence-permit
  holders, and the gap stays a gap. So a student-specific version, if one is
  ever written, states every fact it is meant to show. Two versions inherit only
  when their criteria other than places are exactly equal, a status included.
- **Specificity is still set inclusion**, ambiguity is still `needsReview`, and
  a detail is still asked for only when it could change the answer (SB-176).
- **History stays append-only**, and the clash trigger is untouched: a version
  for a status is a different criteria set from one without.

## The change

**A country's statuses are rows, in a tree.** A `ResidenceStatus` table like
`Region`: a product-owned readable key that never changes, lower-case under its
country, `tr.residence-permit` and under it `tr.residence-permit.student`, a
country, a nullable parent in the same country, a name, and a
`ResidenceStatusText` per locale like `RegionText`. Rows are added only for
statuses a researched rule names or a test needs, as places are; real ones
arrive with SB-191 and SB-192. The tree is what lets a rule the research
verified for residence-permit holders reach a reader who says "Student
residence permit", so SB-191 states the address duty once, without a copy of
the rule per kind of permit.

**The enum value alone first.** `EligibilityDimension` gains `residenceStatus`
in a migration of its own, because PostgreSQL refuses to use an enum value in
the transaction that added it, as SB-168 did for regions.

**One set of tree triggers for both trees.** A second migration creates the
tables and replaces SB-186's region-only trigger functions with generic ones
shared by `Region` and `ResidenceStatus`. Which table a function may touch is a
closed mapping written into the function, never a value a caller supplies, and
every query names its table as `format('%I.%I', schema, table)` with every value
passed through `USING`, so nothing depends on `search_path`.

- **The tree's own triggers**, on `Region` and on `ResidenceStatus`, take their
  table from `TG_TABLE_SCHEMA` and `TG_TABLE_NAME`:
  - the tree holds: a parent is a row of the same country, a row is never inside
    itself, and a row does not change country while a row inside it stays
    behind;
  - a row a criterion names, itself or through a row inside it, keeps its code,
    country and parent, drafts included, where a criterion naming a row means
    one of that tree's dimensions: `residenceRegion` or `workRegion` for
    `Region`, `residenceStatus` for `ResidenceStatus`.
- **The criterion trigger fires on `EligibilityCriterion`**, so its own table
  name says nothing about a tree. It maps the criterion's dimension explicitly,
  `residenceRegion` and `workRegion` to `Region` and `residenceStatus` to
  `ResidenceStatus`, and uses that one mapped table both for its shared lock and
  for the check that the value is a row of the version's own country. A
  criterion of any other dimension is left alone.
- **Every one of them takes the per-country advisory lock first**, exclusive for
  a change to a tree and shared for a criterion, keyed by the mapped tree's
  table name, so a status criterion waits only for a change to the status tree
  and never for the region tree.

Every message a region test reads today says the same words for a region, and
names a residence status for a status.

**The migration's order**, because PostgreSQL refuses to drop a function a
trigger still uses: create the generic functions; drop each of SB-186's region
triggers and create it again on its generic function; create the status
triggers; then drop SB-186's region functions, without `CASCADE`. No applied
migration file is edited.

**Where a reader is, extended to what they hold.** `Profile` gains
`residenceStatuses`, one per country, as it has one place per country. A status
criterion matches when the reader's status in that country is the named one or
inside it, is open when the reader's status is above it or they gave none in
that country, and is contradicted by any other status of that country. It is the
fit SB-186 wrote for places, over the status tree, so `regionFit` becomes one
function over a tree and the coverage that lets a place stand in for places
inside it lets a status stand in for statuses inside it. `Detail` gains
`residenceStatus`.

**Refused as the caller's mistake.** The profile check that refuses an unknown
region, or two of one country in a list, does the same for statuses by their
stored country. `RegionProfileError` becomes `ProfileError`, since it now
refuses both.

**The service loads each country's status tree once per resolve**, beside its
places. `move` and `changes` take `residenceStatuses`; `move` takes no per-side
status lists, because a move between two places in one country does not change
what a reader holds, and a mover between countries already names one status
per country.

## Files

`prisma/schema.prisma`; two new migrations, `…_eligibility_by_residence_status`
and `…_residence_statuses`; `src/rules/eligibility.ts`, `src/rules/rules.service.ts`,
`src/rules/rules.resolver.ts`; a new `test/status.e2e.spec.ts`; `test/place.e2e.spec.ts`
and `test/region.e2e.spec.ts` only if a message they read changes, which the
plan says it must not; the committed `schema.gql`; `DESIGN.md`, "Who a rule
applies to"; and `PHASE-NEXT.md`, beside the places decision.

## What this card does not do

It writes no real status and no Turkish rule, which are SB-191 and SB-192. It
adds no Residence status row to a screen, which is SB-154. It does not make
statuses inherit, and it adds no per-side status lists to `move`.

## The step I am least sure of

**The dimension-to-tree mapping in the criterion trigger**, which the check
named as the likeliest mistake: a status criterion checked or locked against the
wrong relation would still pass every region test. The lock test below reads
the exact key a status criterion takes.

And **replacing SB-186's region triggers with generic ones in dynamic SQL.** The
region triggers are deployed and were watched failing on planted faults. A
second copy for statuses would leave them untouched, but it would double the
place where SB-186's plan check found a missing lock, and two copies drift. The
generic functions trade that for `EXECUTE format` in a trigger, which the SQL
parser cannot check when the migration runs. The region suites, which assert
every refusal, are what would catch a broken translation.

## How it is checked

On PGlite, in `test/status.e2e.spec.ts`, through `move` from Germany, with every
refusal attempted against the database and read back:

- a version scoped to `tr.residence-permit` applies to a reader who holds it and
  to one who holds `tr.residence-permit.student`, asks a reader who gave no
  Turkish status (`needsDetail` on `residenceStatus`), and does not apply to a
  reader holding `tr.visa-exemption`;
- a German status in the list does not answer for Turkey;
- a version for `tr.residence-permit.student` is more specific than one for
  `tr.residence-permit`, so a student permit holder gets it, and a reader who
  said only `tr.residence-permit` is asked when it would change the answer;
- an unknown status, and two Turkish statuses in one list, are refused as
  `BAD_USER_INPUT`;
- a status criterion on a German version naming a Turkish status is refused;
- the status tree refuses a parent in another country and a status inside
  itself, and a status a criterion names through a status inside it keeps its
  code, country and parent until the draft is removed;
- read from `pg_locks`: a change to the status tree holds an exclusive lock on
  the `ResidenceStatus` key, a criterion naming a status holds a shared lock on
  the `ResidenceStatus` key and on neither the `Region` nor the
  `EligibilityCriterion` key, and a criterion naming a region still holds the
  `Region` key;
- `prisma migrate diff` reports nothing for the schema, and a planted schema
  reports a difference.

Then every region and place test passing unchanged, which is the check on the
generic triggers, a planted fault per new guard watched failing, the criterion
mapping sending a status to `Region` among them, the full API suite, lint and
`lint:tsc`, the web's `lint:tsc`, and the build.
