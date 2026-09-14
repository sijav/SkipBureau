# SB-194, Turkey's health insurance

**Exit:** on the deployed API, joining SGK's general health insurance in Turkey
answers with its figures, each naming its page, none calculated, and it applies
only to a reader who holds a residence permit.

## What changes on the card

The card listed two things from `research/agreed/turkey/health-insurance.md`:
the insurance regulator's minimum cover for a residence permit policy, and
joining SGK's general health insurance. The first is what a residence permit's
policy must contain, which is the health cover SB-192 already writes for the
permit, so it moves to SB-192, whose card now names it. This card writes the
second, and its exit says so.

## Why

The agreed research verifies that a foreigner holding a residence permit, not
insured under a foreign country's law, may join SGK's general health insurance
once their residence exceeds a year, is covered from the day after they ask,
needs thirty contribution days in the preceding year before routine treatment,
and pays twelve per cent of a base of twice the gross minimum wage. None of it
reaches a reader, and it applies to permit holders only, which SB-189's
residence status can now say.

## What stays exactly as it is

- **SB-190's loader, its lock, its identity and its refusal to rewrite a
  deployed version**, and its rule for choosing a fact's page.
- **Calculated figures stay out**: the 66,060 lira base and the 7,927.20 lira
  premium are the research's arithmetic, `calculated` in its definitions.
- **The seed's sample `hold-health-insurance` rows** are untouched; this is a
  different obligation.

## The change

**The loader writes the residence statuses a file names.** `ResearchRules` gains
`statuses`, each with its code, parent and names, and the loader creates a
missing one with its texts before any version, since a criterion naming a status
that is not there is refused. Its names are an editor's once created, as an
obligation's titles are. A deployed status whose country or parent differs from
the file stops the load, because that would change which readers every rule
naming it reaches. Statuses are created in the file's order, so a status is
listed before any kind of it; a kind listed first is refused by the database,
by the parent's foreign key or the status tree's own check, whichever fires
first, and the load stops with nothing written.

**Turkey's file gains one status and one version.** The status
`tr.residence-permit`, "Residence permit", with nothing above it. The obligation
`join-general-health-insurance`, of kind `insurance`, with one national version
from 2026-09-14, scoped to `residenceStatus` `tr.residence-permit`:

| key | operator | value | the fact's page, by research label |
|---|---|---|---|
| `residenceBeforeRequest` | equals | the text "more than one year" | `sgb5510-61-1c-after-a-year` |
| `coverStartsAfterRequest` | equals | 1 day | `sgb5510-61-1c-after-a-year` |
| `premiumDaysInPrecedingYear` | atLeast | 30 days | `sgk-yurtici-thirty-days` |
| `premiumRate` | equals | 12 percent | `sgb5510-81-1f-twelve-percent` |
| `premiumBase` | equals | 2 times the gross minimum wage | `sgk-gss-guide-twice-minimum-wage` |

The version's own source is Law 5510, Article 60(1)(d), `sgb5510-60-1d-foreign-residents`,
which is what makes a foreign resident with a permit, not insured abroad, one of
the people this insurance covers.

**Each page, by SB-190's rule.** All five are national. Article 61(1)(c) states
both the year and the day after the request in one passage, where SGK's guide
repeats them. SGK's page on who may use health services states the thirty days
as the rule itself, where Article 67(1) states it inside a list of categories and
exceptions. Article 81(1)(f) is the only page stating the twelve per cent for
those covered only by general health insurance, which the permit holders of
Article 60(1)(d) are; its note on six per cent is for category (g), not theirs.
SGK's guide states the base as twice the gross minimum wage, where Article 80
states twice the daily floor, which needs another page to become the wage.

**The year is a condition, not a number.** Article 61(1)(c) makes a foreign
resident insured from the day after they ask, once their residence has passed one
year. No operator says "more than": `atLeast` one year would make them eligible
on the day the year ends, a day early, and `equals` one year loses both the strict
threshold and the request. So the condition is a text fact whose key names the
request, `residenceBeforeRequest`, valued "more than one year", beside the day
the cover starts. It is not comparable as a number, which is the price of saying
exactly what the law says.

**What stays unwritten, and why.** "Not insured under a foreign country's law"
is a condition no criterion can hold. It leads the version's notes, before any
figure, so an answer never reads as though every permit holder may join.
Whether the year is continuous, and how days abroad count, the research could
not verify. The 2026 minimum wage itself is a work permit figure, SB-193's. The
waivers of the thirty days on moving between categories are exceptions a fact
cannot carry, and stay in words.

## Files

`src/rules/research/rows.ts`, `src/rules/research/load.ts`,
`src/rules/research/turkey.ts`, and `test/research-rules.e2e.spec.ts`. No schema
change and no migration.

## What this card does not do

It does not write the regulator's minimum cover, which is SB-192 now, nor when
employment insurance starts, which no card asks for. It adds no status but the
one its rule names.

## The step I am least sure of

**A text fact for the year.** `residenceBeforeRequest` valued "more than one
year" says what Article 61 says, strict threshold and request included, which
the plan check found `equals` one year did not. The cost is that it is text: a
comparison with another country's waiting period reads it as a changed text, not
a longer or shorter number, until an operator for "more than" exists.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`:

- every label, the new version's included, is a verified definition of its
  document on the page and day the file names;
- after a load, a reader who holds `tr.residence-permit`, or a kind of one the
  test adds, is told the five facts with their pages; a reader who has not said
  what they hold is asked for their residence status; and a reader holding a
  visa exemption the test adds is not told this obligation at all;
- a second load adds no status, obligation, version or fact;
- a deployed status whose parent differs from the file stops the load;
- a kind listed before its status stops the load, and nothing is written.

Then a planted fault: the status left out of the file, watched failing the load
on the criterion trigger. Then the full API suite, lint and `lint:tsc`, and the
build. After the push, the deployed API answers a permit holder with the five
facts.
