# SB-188, A rule fact names the page that states it

**Exit:** on PGlite, a version whose two facts come from two different pages
returns each fact with its own URL, name and read date through `move` and
through a guide's obligations, a started version's fact source cannot be
changed, and `prisma migrate diff` reports nothing.

## Why

The owner's order of 2026-09-12, recorded in CLAUDE.md: every fact the research
records "carries an official source URL and the date it was checked". SB-182
tied every figure in Turkey's agreed research to the page that states it, and
one obligation's figures come from several pages. Address registration's twenty
working days are read in the implementing regulation, its 2026 fines on the
population directorate's page. A `RuleVersion` has one `sourceUrl`, so a version
holding both would cite a page that does not state one of them, which is how
SB-174's plan check saw the wrong page get picked. SB-169's split made this the
first card: nothing Turkish can be written honestly until a fact can name its
own page.

## What stays exactly as it is

- **A version keeps its own source**, `sourceUrl`, `sourceName` and
  `verifiedAt`, required as today. It is the page for what the version itself
  states: that the rule exists for its scope, from its date.
- **Comparison is by value.** `sameFact` compares operator, number, text, unit
  and currency, as today. Two pages stating the same deadline state one
  deadline, so a move between them reports no difference.
- **History stays append-only, and no applied migration is edited.**
  `rule_fact_is_history`, from `20260911200000_rule_history_is_append_only_throughout`,
  already refuses any insert, update or delete of a started version's fact,
  whatever column it touches, so the new columns are covered without a new
  trigger.
- **The seed and every test that writes a fact keep working unchanged**, because
  a fact with no page of its own is what every existing fact already is.

## The change

**A fact can name its own page.** `RuleFact` gains `sourceUrl`, `sourceName` and
`verifiedAt`, a date. All three are set, or none is. None means the version's
own page states this fact. All three mean it was read on its own page, on that
day. One new migration, written by hand, adds the three columns and a CHECK
constraint, `RuleFact_source_is_whole`, that refuses a fact with some of them
and not the others. No existing row is backfilled: a null on an existing fact
says exactly what that fact always claimed, that its version's page states it,
and a copy of the version's source would add no evidence while hiding which
facts were read on a page of their own.

**Prisma cannot see the CHECK constraint.** Its schema and introspection do not
model one, so `migrate diff` reporting nothing proves the three columns match
the schema and says nothing about the constraint, `db pull` leaves it in the
database without describing it, and `migrate dev` replays it from the migration
into its shadow database. The refusal test below is what proves the constraint
exists and holds.

**A reader always gets a page and a day for a figure.** `RuleFactValue`, which
`move` returns, and `GuideObligationFact`, which a guide's obligations return,
each gain `sourceUrl`, `sourceName` and `verifiedAt`: the fact's own, or, where
it has none, the source of the version the fact belongs to. The choice is one
pure function, `sourceOf`, in `src/rules/source.ts`, used by both services,
taking all three from the fact or all three from that version, never one field
from each. A fact inherited from a wider place (SB-186) is resolved against the
version it was read from before it is merged into the winner's answer, so it
names the national version's page and date, never the winner's.

**`Fact` in `diff.ts` carries the resolved source**, so `move`'s facts and
differences both name their pages. `sameFact` does not read it.

## Files

`prisma/schema.prisma`; one new migration; `src/rules/source.ts`, new;
`src/rules/diff.ts`, `src/rules/rules.service.ts` and `src/rules/rules.model.ts`;
`src/guide/guide.service.ts` and `src/guide/guide.model.ts`; a new
`test/fact-source.e2e.spec.ts`; the committed `schema.gql` and whatever web
codegen regenerates from it, which should be nothing, since no web document
selects a fact; and `DESIGN.md`, whose "Why the values are rows" gains a
sentence.

## What this card does not do

It writes no Turkish rule, which is SB-190 onwards. It shows no source on a
screen, which is SB-197's guides. It does not store the research's footnote
label in the database: SB-190's data file carries the label for its test, and
the database carries what a reader is shown.

## The step I am least sure of

**Resolving a fact without its own page to its version's page in the API.** A
consumer cannot tell whether a figure's page was chosen for the figure or for
its version. For a reader both mean "this page states it", and the row keeps
the difference for an editor. The alternative, a required source on every fact
backfilled from its version, says the same with more rows and every fact
creation in the tests and the seed changed, and the check agreed it adds no
evidence.

And **the inheritance path**, which is where this is most likely to go wrong: a
fact merged into a Bursa answer must carry the source of the national version it
came from, so the source is resolved where the fact is read from its own
version, before any merging.

## How it is checked

On PGlite, in `test/fact-source.e2e.spec.ts`, with every refusal attempted
against the database and the rows read back afterwards:

- a Turkish version in force today whose one fact names its own page and whose
  other has none: `move` returns the first with its own URL, name and read date
  and the second with the version's;
- a guide linked to that obligation returns the same two sources on its
  obligation's facts;
- a Bursa version stating one fact on its own page, under a national version
  whose facts have no page of their own: a reader in Bursa gets Bursa's fact
  with Bursa's page and date, and the inherited fact with the national version's
  URL, name and date, each asserted equal to that version's own, not merely
  present;
- changing the source of a started version's fact is refused, and it reads back
  unchanged;
- a fact with a URL and no name or date is refused, and nothing is written,
  which is the proof that the CHECK constraint exists;
- `prisma migrate diff` from the migrations to the schema reports nothing for
  the columns, and a schema planted with a different column type reports the
  difference.

Then a planted fault per guard: the fallback to the version's page removed, a
fact resolved against the winner's version instead of its own, and the CHECK
constraint dropped, each watched failing its test. Then the full API suite, lint
and `lint:tsc`, the web's `lint:tsc`, which regenerates its types, and the build.
