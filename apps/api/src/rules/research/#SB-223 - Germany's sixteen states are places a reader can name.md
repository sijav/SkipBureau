# SB-223, Germany's sixteen states are places a reader can name

**Exit:** on the deployed API, a reader may give any of Germany's 16 states as where they
live or work without being refused, each stored by its ISO 3166-2 code and the official
name on the list the file names, and a second start adds none.

## Why

The deployed database holds no German region: bootstrap writes countries only, the seed's
eight Länder never run there, and the API refuses a region it does not know. So no rule for
Hamburg's registration fee, Saxony's care split or Berlin's procedure can reach a reader who
lives or works there, and SB-224 to SB-227 wait on it. SB-210 did this for Turkey.

## What stays exactly as it is

- **SB-190's loader and SB-210's regions**: a missing region is created, one deployed in
  another country or under another parent stops the load, and a deployed region's name is an
  editor's.
- **Every migration, and the seed's eight Länder** as the tests' sample data.
- **Turkey's file and every check of it**, which behave exactly as before.

## Research, and the three pages

The case `germany/states` in `research.py`, two turns, then signed off and passed through the
fixed point as `turkey/provinces` was. The list is read from its pages:

- **ISO's Online Browsing Platform for ISO 3166-2:DE**, read in the browser pane: "16 Land",
  16 rows from DE-BW Baden-Württemberg to DE-TH Thüringen, each code once, and a change
  history whose entries concern the English category name and the remarks on code 280, not
  any subdivision;
- **Destatis's Gemeindeverzeichnis glossary, "Bundesländer"**, a raw page: a sentence
  introducing a list, and 16 lines from "- 01 Schleswig-Holstein (SH)" to "- 16 Thüringen
  (TH)";
- **the Basic Law's preamble**, a raw page: one sentence naming all 16 Länder.

The three name the same 16 Länder in the same short forms, and each Destatis abbreviation is
the two letters of its ISO code. The research found the glossary an official federal list
with current names, and the short forms the officially used names. It found the two-digit
numbers to be the Land part of the Amtlicher Gemeindeschlüssel only by reading the glossary
beside Destatis's explanation, so no official key is written and nothing says it is.

`agreed/germany/states.md` quotes ISO's count line, column headings and 16 rows; Destatis's
sentence and 16 lines; and the preamble's sentence. ISO's list and code source line, which
names DE-PRO, is left out of the evidence and named in the locator, because the check takes
any word in the country's prefix for a code.

## Germany's file, and one list of researched countries

`src/rules/research/germany.ts`, new: country `de`, research `germany`, no statuses, groups,
obligations or versions, and the 16 Länder by ISO code, each with no parent and Destatis's
name. `regionsFrom` names `agreed/germany/states.md`, ISO's definition on its page, and
Destatis's on its page with the pattern of its lines.

`src/rules/research/countries.ts`, new, exports the researched countries, Turkey's and then
Germany's. `src/load-research-rules.ts` loads that list, and both specs import it, so a country
the loader leaves out is one the tests leave out too, and the unseeded test below fails.

## The check, for a list printed as lines

`ResearchReading` gains an optional `row`: a pattern whose one group is the name, for a page
that prints more than the name on each line. A passage it does not match is not a row.
Turkey's names reading has none, so every NVI passage is a row whose whole text is the name,
exactly as now. Destatis's is `^- \d{2} (.+) \([A-Z]{2}\)$`. The rows must be as many as the
file's regions, and each stored name must be the name of exactly one row, compared in
Unicode's composed form with nothing folded.

The research spec's first load is counted across every researched country, less the regions
the seed had already written.

## Two databases, because the seed writes eight Länder first

**In the research spec the seed's names stay.** The seed writes eight Länder with English
names before that spec loads, and a deployed region's name is an editor's, so after the load
those eight keep the seed's names and the other eight carry Destatis's. That spec asserts
exactly that: it proves the loader keeps an editor's name, not the official names.

**A new spec on a database the seed never touches, as the deployed one is.**
`test/research-regions.e2e.spec.ts` starts its own PGlite, migrates it, writes the two
countries as bootstrap does, loads every researched country, and asserts that each country's
regions are exactly the file's, code, no parent and name, all 81 of Turkey's and all 16 of
Germany's, and that a second load adds none. It also imports Turkey's and Germany's files
directly and requires the researched list to be exactly those two, so a country left out of the
list, which the loader and both specs would then all leave out, still fails there.

## Files

`src/rules/research/rows.ts`, `src/rules/research/germany.ts`,
`src/rules/research/countries.ts`, `src/load-research-rules.ts`,
`test/research-rules.e2e.spec.ts` and `test/research-regions.e2e.spec.ts`; and under
`prisma/research/`, `talk/germany/states.md`, `sessions.json`, `agreed/germany/states.md` and
the README's table of settled cases. No schema change and no migration.

## What this card does not do

It writes no official key, no city, no rule, no name in another language and no German
residence status. Hamburg's fee, Saxony's care split and the rest are SB-224 to SB-227.

## The step I am least sure of

**A line pattern in the data file.** The check reads Destatis's list through a pattern the
file states, so a change to how the page prints its lines fails the check until the page is
read again, which is the right failure but a brittle one.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`:

- the definitions Germany's regions name are verified on the page and day the file names;
  each ISO row holds one code and those codes are exactly the file's; Destatis's rows are as
  many as the file's Länder, and each stored name is exactly one row's name;
- after a load, all 16 Länder exist in Germany with no parent, the eight the seed did not write
  with Destatis's names and the eight it wrote with the seed's; every one is given, one reader
  at a time, as where a reader will live and as where they will work, through the move query's
  own check, and none is refused, while a code that is no Land is;
- a second load adds nothing.

And in `test/research-regions.e2e.spec.ts`, on a database the seed never touched: every
researched country's regions are exactly its file's, names included, a second load adds none,
and the researched list is exactly Turkey's and Germany's files, imported directly.

Then planted faults, each watched failing: a Land left out of the file, a name misspelled, two
names swapped, the row pattern removed, and Germany left out of the list of researched
countries. Then the full API suite, lint and `lint:tsc`, the build, and the compiled loader run
twice on a fresh database, adding 81 and 16 regions and then none. After the push, the deployed
API accepts each of the 16 as where a reader lives and where they work.
