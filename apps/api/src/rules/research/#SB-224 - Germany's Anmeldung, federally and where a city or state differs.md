# SB-224, Germany's Anmeldung, federally and where a city or state differs

**Exit:** on the deployed API, a reader moving to Hamburg is told the two weeks, the fine
ceiling and a fee only if an official page states it, one moving to Berlin the same with no
fee, each fact naming its official page, and a reader who has not said where they will live
is asked.

## Why

Registering where you live is the first thing every newcomer to Germany must do, and its fee
is where Germany differs from itself: a reader in Hamburg pays €16 and one in Berlin nothing,
under the same federal deadline. SB-223 put the 16 Länder on the deployed database, so a
reader can now say where in Germany they will live and be answered.

## What stays exactly as it is

- **SB-190's loader, SB-209's notes, SB-186's inheritance and SB-223's regions.** No loader,
  schema or migration change.
- **The seed's sample `register-your-address`**, and every spec that reads it.
- **Every Turkish rule**, and what each research test proves about it.

## Scope: the federal rule, and three Länder

`agreed/germany/anmeldung.md` states the fee for Hamburg, Berlin and Saxony, which are Länder
SB-223 wrote, and for Munich, Düsseldorf, Wiesbaden and Freiburg, which are cities no one has
written. A city needs a place of its own under its Land, which ISO does not code and SB-223's
check does not read, so the four cities are SB-228 and their fees SB-229, noted on this card.

## One duty, compared with Turkey's

The obligation is **`report-your-address`**, the one SB-191 gave Turkey, because Germany's
Anmeldung and Turkey's address duty are the same thing a mover has to do, and a move between
the two should show what changes. Germany's file lists the obligation with the same kind and
titles, so it loads on its own as well as after Turkey's. The fact keys a mover would compare
are Turkey's: `reportAddressChangeWithin` and `lateAddressNotificationFine`.

## Four versions, all from the agreed document

Each is valid from 2026-09-14, the day SB-174 read its pages, as its definitions say.

**The federal rule**, with no criteria, since the duty binds whoever moves into a dwelling,
whatever their nationality:

- `reportAddressChangeWithin` within 2 weeks, on § 17 BMG, `bmg-17-two-weeks`;
- `lateAddressNotificationFine` at most €1,000, on § 54 BMG, `bmg-54-fine-late-registration`.

The provider's confirmation is no fact: § 19(1) BMG states only that it is given "within the
period named in § 17(1)", which is no whole statement of two weeks, and Berlin's page, which
does say two weeks, is narrower than a federal fact. The federal note carries it, as agreed.

**Three Länder**, each with one `residenceRegion` criterion and one fact, and the rest
inherited from the federal rule:

- **Hamburg**, DE-HH: `registrationFee` €16, on Hamburg's own service page,
  `hh-registration-fee-16`, an official host. The copies of Hamburg's Gazette on an archive
  site stay research evidence and are cited by nothing;
- **Berlin**, DE-BE: `registrationFee` none, on Berlin's service page,
  `berlin-registration-free`;
- **Saxony**, DE-SN: `registrationFee` none, on Saxony's state portal, read in the browser
  pane, `saxony-registration-free`.

**Pages, chosen as SB-169 says.** The federal law's own paragraphs for the federal facts, each
stating its fact whole; each Land's own page for its fee. A reader elsewhere, in Bavaria say,
is told the federal rule and no fee, because no page the research read states Bavaria's.

## Notes, from the agreed text

Each opens with whom it binds.

- **Federal:** "For anyone who moves into a dwelling in Germany, unless a statutory exemption
  or exception applies, whatever their nationality: register with the registration office
  within two weeks of moving in, which no Land can lengthen or shorten." Then, as agreed, the
  three-month cases and why they are not a newcomer's; the provider's confirmation, what to do
  without it and that a lease is no substitute; the fine as a ceiling, and the €50,000 for a
  fictitious address; and a child under sixteen.
- **Hamburg:** "In Hamburg, registration costs €16, set by Hamburg's general fee legislation
  rather than the federal registration law." Then the family tariff and what could not be
  established about it, and Hamburg's page on attending in person.
- **Berlin:** "In Berlin, registration is free." Then Berlin's appointment, representation and
  online route, as agreed.
- **Saxony:** "In Saxony, registration is free under the state's guidance."

A reader in Hamburg is given the federal note and then Hamburg's, as SB-209 orders them.

## The research spec's origin

Every research test asks for Turkey's answer to a reader moving from Germany. Once Germany has
`report-your-address`, the German side changes Turkey's address test: its verdicts become
comparisons, and a visitor Turkey does not tell is told Germany's duty. So the spec adds a
country of its own, `xx`, as a row in its database with no rules, and `MOVE` asks for a move
from it. Each Turkish test goes on proving Turkey's answer alone, and a country check the move
query may one day gain still passes, since the origin is a real row. The comparison itself gets
its own test below.

The first load's report counts an obligation once however many files list it.

## Files

`src/rules/research/germany.ts` and `test/research-rules.e2e.spec.ts`. No schema change.

## What this card does not do

It writes no city's fee, which is SB-229 after SB-228; no fact for the three-month cases, which
the notes explain; nothing about the tax number, the bank account or health insurance, which
the agreed document mentions as separate; and no guide.

## The step I am least sure of

**Sharing the slug with Turkey.** It is what makes a move compare the two duties, and it makes
Turkey's key `reportAddressChangeWithin` stand for Germany's registration on moving in, which
is a change of address for anyone who already lives somewhere.

**A test-only country.** The research spec's database gains a country no production reader can
choose, though that spec's own countries query lists it,
which exists only so that a Turkish answer can be read without another country's rules beside
it.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`, after a load:

- a reader moving to Hamburg is told the federal rule's two facts and Hamburg's €16, each on
  its own page, the fee on hamburg.de, with the federal note and then Hamburg's; to Berlin and
  to Saxony the same with the fee none on their own pages; to Bavaria the federal two only;
  and a reader who has not said where they will live is asked for `residenceRegion`;
- a residence permit holder moving from Hamburg to Bursa is shown the address duty as changed,
  with `reportAddressChangeWithin` among the differences;
- every Turkish test passes with the spec's own country `xx` as the origin, and the label check
  reads Germany's versions.

Then planted faults, each watched failing: Berlin's version restating the two weeks from
Berlin's page, Hamburg's fee as €61, the federal rule given a region, Saxony's version moved to
Bavaria, and the origin put back to Germany. Then the full API suite, lint and `lint:tsc`, the
build, and the compiled loader twice on a fresh database. After the push, on the deployed API:
a reader moving to Hamburg is told the three facts on their pages, to Berlin the fee none, and a
reader who names no place is asked.
