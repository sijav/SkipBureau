# SB-186, A rule belongs to a place at any level and inherits what it does not change

**Exit:** on PGlite, a national version with two facts and a city version
stating one of them resolve, for a reader in that city, to the city's fact and
the national other fact, and to both national facts for a reader elsewhere in
the country; a version for an area within that city applies only to a reader in
that area; a city and an area can be stored under their parents; and a move
between two places reports only the facts that differ.

## Why, in the owner's words

The research found every Turkish rule national, with office steps that differ in
Bursa, district closures in Istanbul and chamber fees that differ by city. Asked
what Turkey should show per province, the owner answered on 2026-09-14, recorded
in CLAUDE.md: rules belong to "whole country province/state/city/area", a
narrower place "will then inherit from global (whole country) laws but can have
a different rule in somewhere (or different office for something)", and "the
database needs to make sense and the rules needs to make sense".

Two things in the code stop that today. A `Region` is a first-level division
only, with a six-character ISO 3166-2 code. And resolution picks one winning
version and returns its facts and nothing else, so a regional version has to
restate every national fact, which is a copy of the national rule, not an
exception to it.

## What stays exactly as it is

- **Place is still a criterion.** `residenceRegion` and `workRegion` criteria
  valued by a region code, as SB-168 built them. No new column on `RuleVersion`.
- **Specificity is still set inclusion**, and two matching versions neither of
  which covers the other still come back `needsReview`. Nothing is guessed.
- **History stays append-only.** A started version, its facts and its criteria
  cannot change, and `skipbureau_rule_version_clash` still refuses two versions
  of one obligation, country and criteria set over overlapping dates. A city
  version and the national version are different sets, so it needs no change.
- **A guide still shows the national rule** through `generalVersionAt`. What a
  reader sees for their own place is SB-154, and the owner's rule for it is on
  that card: not on the first page, in the details.
- **Where a transaction happens stays SB-177.**

## The change

**Places below the first level.** `Region` gains `parentCode`, nullable, a
foreign key to `Region.code`: a province or state has none, a city names its
province or state, an area names its city. The country stays the root through
`countryCode`. The code widens from `VARCHAR(6)` to `VARCHAR(40)`, in `Region`
and `RegionText`. That is binary compatible, so PostgreSQL does not rewrite the
tables, but `ALTER TABLE` still holds an exclusive lock on each while it runs.
The migration is written by hand as direct `ALTER COLUMN ... TYPE` statements,
not whatever sequence Prisma would generate, and `prisma migrate diff` from the
migrations to the schema must report nothing afterwards. `parentCode` gets an
index, because PostgreSQL does not index the referencing side of a foreign key.

**What a code below the first level is.** ISO 3166-2 stops at provinces and
Länder. The plan is a readable code under its parent's, `TR-34.esenyurt` or
`DE-BY.muenchen`, so a criterion, a seed file and a log line stay legible, with
an optional `officialCode` beside it for the state's own identifier, Germany's
Amtlicher Gemeindeschlüssel or Turkey's district code, where one exists. **The
key is the product's own and never changes.** A rename changes `name`; a merger,
a split or a move under another parent is a new place row, and the rules that
follow it are new versions, which is how history is already recorded. The
official code is an attribute and never the identity, because Germany's register
is maintained through territorial changes and Turkey's address identifiers are
not a uniform public key for a district. Rows are added only for places a
researched rule names, never all 81 provinces' districts at once.

**A trigger keeps the tree honest.** A parent must be a region of the same
country, a region cannot become its own ancestor, and a region whose code or
any descendant's code a criterion names keeps its code, its country and its
parent. SB-168's trigger already refuses changing the code or country of a
region in use; a changed parent would change which rules a version inherits
from without touching the version, so the parent joins them. The ancestry and
descendant checks are recursive queries over `parentCode`, run after a
transaction-level advisory lock keyed by the country, so two concurrent changes
cannot each see the tree without the other's new parent and commit a cycle
between them. **The freeze stays SB-168's policy, on purpose:** a region is
fixed once any criterion names it or a descendant, a draft's included, so a
mistake in the tree under a draft is corrected by removing the draft first,
which SB-168's test already does for a code.

**Where a reader is.** A profile still carries one place per country for where
they live and one for where they work, but that place can now be at any level.
A region criterion then:

- **matches** when it names the reader's place or one of its ancestors: a rule
  for Istanbul applies to a reader in Esenyurt;
- **is open** when it names a place under the reader's place, or the reader gave
  no place in that country: a reader who said only Istanbul has not said whether
  the Esenyurt rule is theirs, and SB-176 asks when it could change the answer;
- **is contradicted** when the reader's place is in the same country and is
  neither under the criterion's place nor above it.

The service loads the country's regions once per resolve, which are a handful of
rows, rather than walking parents in SQL per criterion.

**Coverage follows the tree.** One criterion covers another when they share a
dimension and its place is the same as or under the other's; for any other
dimension, when they are equal. A version is more specific than another when
every criterion of the wider one is covered by one of the narrower one's and it
says something the wider does not. That is SB-168's set inclusion with a place
allowed to stand in for its ancestor, so a city version is more specific than a
province version, and both are more specific than the national one.

**Inheritance follows places, and only places.** Among the versions that match
a reader, the winner is still the most specific one, and still unique or
`needsReview`. Its facts are then completed from its place chain. A version is
on it when its criteria other than places are exactly the winner's, and each of
its places is the winner's place of the same dimension or an ancestor of it,
compared by dimension name, never by country or ancestry alone. A version on
the chain may carry fewer kinds of place than the winner, a residence place
alone under a winner scoped by residence and work, but never a kind the winner
lacks. The version with no place at all is the widest. A key the winner states is the winner's; a key it does not state
comes from the most specific version on that chain that states it. So a version
for EU nationals never inherits from the national version, and a key an editor
leaves out of it stays a gap, as it is today. `none` is a stated value, so a city
that has no fee says `none` and does not inherit the national one. A key stated
differently by two versions on the chain neither of which covers the other, one
scoped by where the reader lives and one by where they work, and not restated by
the winner, is not guessed: the obligation comes back `needsReview`, naming both.

**Every fact says which version it came from.** A merged answer draws facts from
several versions, each with its own source and verified date, so `RuleFactValue`
gains `ruleVersionId`. SB-169 then keeps its rule, one source per row, per fact.

**A move between two places in one country.** `move(from, to)` applies one
profile to both sides, and two places in one country are refused as a
contradiction. It gains optional per-side lists, `fromResidenceRegions`,
`toResidenceRegions`, `fromWorkRegions` and `toWorkRegions`. A side's list,
when given, replaces the shared list on that side: an omitted list means the
shared one, `[]` means none, and an explicit `null` is refused as the caller's
mistake, since GraphQL tells the three apart. `move`
builds the two sides' profiles first, checks each on its own and resolves each
on its own, because checking a combined list with both places in it would
refuse Istanbul and Bursa as two places in one country. So `move(from: "tr", to:
"tr")` from Istanbul to Bursa compares two merged Turkish answers. The shared
lists keep working for every caller that has them.

## Files

`prisma/schema.prisma`; one new migration, widening the codes, adding
`parentCode` and `officialCode` and the tree trigger, no applied migration
edited; `src/rules/eligibility.ts`, the fit and coverage over the tree;
`src/rules/rules.service.ts`, loading places and completing the winner's facts;
`src/rules/diff.ts` and `src/rules/rules.model.ts`, a fact's version;
`src/rules/rules.resolver.ts`, the per-side lists and their descriptions; a new
`test/place.e2e.spec.ts`; the committed GraphQL schema and web types, which
codegen regenerates; `DESIGN.md`, whose "Who a rule applies to" says only
first-level divisions exist; and `PHASE-NEXT.md`.

## What this card does not do

It writes no real rule, which is SB-169 and SB-170 once this exists. It adds no
place picker and changes no screen, which is SB-154. It does not resolve where a
transaction happens, which is SB-177. And it adds places only as tests need
them; real ones arrive with the rules that name them.

## The step I am least sure of

**A chain with two kinds of place on it.** The checks settled that inheritance
follows places only, and that a version on the chain may carry fewer kinds of
place than the winner. What is left is the refusal when a residence member and a
work member disagree about a key the winner does not restate: `needsReview`
rather than ranking one kind of place over the other, which is the same refusal
SB-168 makes for two matching versions, but the case most likely to surprise an
editor who adds a work rule under an existing residence rule. And **the advisory
lock cannot be proven under contention here**: PGlite is one session, so the
tests show the lock is accepted and the tree's refusals hold, not that two real
sessions are serialised.

## How it is checked

On PGlite, through `move`, in `test/place.e2e.spec.ts`, with every refusal
attempted against the database and the tables read back afterwards:

- a national version with two facts and a city version restating one: a reader
  in the city gets the city's fact and the national other one, each naming its
  version; a reader in another province gets both national facts;
- an area version under that city applies to a reader in the area, not to a
  reader elsewhere in the city, and a reader who gave only the city is asked for
  the place when the area version could change the answer;
- a province version and a city version: a reader in the city gets the city's
  facts completed from the province's and then the country's;
- a city saying `none` for a key does not inherit the national value;
- a version scoped to a nationality group and missing a key the national version
  states does not inherit it, and the key stays a gap;
- a winner scoped by a residence city and a work city takes one missing key from
  a residence-only version for the province and another from a work-only one;
- a residence version and a work version on the winner's chain stating one key
  differently, not restated by the winner, come back `needsReview` naming both;
- `move` from Istanbul to Bursa in Turkey reports only the keys that differ, an
  empty side list overrides the shared list on its side, and an explicit `null`
  side list is refused as `BAD_USER_INPUT`;
- the trigger refuses a parent in another country, a cycle, and a changed parent
  or code on a region a criterion names through a descendant;
- `prisma migrate diff` from the migrations to the schema reports nothing;
- the seed, run twice, adds nothing.

Then the full API suite, lint and `lint:tsc`, the web's types regenerated and
its suite, and the build.

## As built

What the build settled that the plan above did not spell out.

- **The tree's checks run after the statement's rows are written.**
  `region_tree_holds` is an AFTER trigger, so a statement that writes a city
  before its province, or a country's code change that carries every region with
  it, is judged on the tree it leaves. It takes the country's advisory lock, both
  countries' in one order when a region changes country, and refuses three
  things: a parent in another country, a place inside itself, and a region
  moving to another country while a place inside it stays behind. The last is
  the first seen from the parent's side.
- **The parent key is `ON DELETE NO ACTION ON UPDATE CASCADE`.** A place with
  places inside it is not deleted from under them. No action rather than
  restrict, because no action is checked at the end of the statement, so a
  country's deletion still takes its whole tree at once. A code change on a place
  nothing names carries the places inside it along.
- **The freeze keeps SB-168's function and its words.** The same function now
  also refuses a changed parent, and follows the places inside the region, and
  its message still says "cannot be deleted or recoded", which SB-168's test
  reads.
- **The lock covers the freeze and the criteria too**, which the fourth check
  of this plan found missing. As first built, only the tree check took the lock,
  so one transaction could move Kadıköy, reading no criterion under it, while
  another named Moda and committed first; the move then landed under a rule
  already recorded. A region deleted while a criterion naming it was written
  could leave the criterion naming nothing, which SB-168's triggers had open
  too. Now one function, `skipbureau_lock_region_tree`, takes the country's
  lock before any of the three reads: exclusively for a change to the tree,
  from the freeze and the tree check, and shared for a criterion naming a
  region, so rules written at the same time wait only for a change to the tree.
  PGlite runs one session, so the tests show the locks taken, not two sessions
  waiting on each other.
- **A profile's regions are checked by their stored country, not by the code's
  prefix.** A key below the first level is the product's own and nothing parses
  it, so `regionsInConflict` takes the countries read from the database, and an
  unknown code is refused before a conflict is looked for.
- **An open version is weighed by its completed answer.** `matters` compares
  what the open version would say, completed from its own chain, with what the
  winner says, completed from its. An area version restating the country's
  deadline asks a reader in the city nothing, which a test shows; comparing the
  versions' own facts would have asked.
- **Two versions on a chain stating one value are not a dispute.** Only a key
  stated differently comes back `needsReview`. The same value is taken from the
  version with the lower id, so an answer does not change between requests, and
  an answer's facts are ordered by key.
- **`prisma/seed.ts`**, which is not in the file list above, loses its comment
  that only first-level divisions exist.
