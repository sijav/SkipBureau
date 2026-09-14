# SB-210, Every Turkish province is a place a reader can name

**Exit:** on the deployed API, a residence permit holder may give any of Turkey's
81 provinces as where they live without being refused, each stored by its ISO
3166-2 code and the official name on the list the file names, and a second start
adds none.

## Why

The deployed database holds no region: bootstrap writes countries only, and the
seed's regions, eight German Länder, never run there. The API refuses a region it
does not know, so no reader can say where in Turkey they live, and SB-191's Bursa
rule waits on it. The owner, 2026-09-14: a rule belongs to a place at any level,
and a reader is shown the answer for their place. A reader can only be somewhere
the database knows.

## What stays exactly as it is

- **SB-190's loader, its lock and its rule for choosing a page**, SB-194's statuses,
  SB-192's nationality groups and SB-209's notes.
- **The region tree and its triggers** (SB-186): a region stays inside its own
  country and never inside itself, and a region a rule names keeps its place.
- **Every migration.** The `Region` table already holds a code, a country, a
  parent, an official code and a name.

## Research first, with the list read from two pages

The case `turkey/provinces` is open in `research.py`, and is resumed until both sides
are satisfied, then signed off and passed through the fixed point as the six rule
cases were. The conversation checks the sources; it is not itself the source. After
two turns the list is read from two pages, both already read once and compared:

- **ISO's Online Browsing Platform for ISO 3166-2:TR**, read in the browser pane: 81
  rows, each a province's code beside its name as ISO prints it, TR-01 to TR-81 each
  once, and a change history with no Turkish subdivision change since 2011;
- **NVI's directory of provincial population directorates**, a raw page: the 81
  official names, each once.

The two print the same 81 names in Unicode's composed form but one: ISO writes
Hakkâri and NVI Hakkari. The conversation found no instrument that settles it, the
Interior Ministry printing HAKKARİ and TDK's spelling rules Hakkâri, so the stored
name is NVI's and ISO's spelling is carried beside it as a variant, with the reason in
the agreed document.

**No third page.** The research found no current official page that assigns each
province its number beside its name: the Education Ministry's mediation directory
prints codes and names but numbering is not its business and it prints Niğde as
NİGDE, the Interior Ministry's founding-dates list has no number column, and the 2014
vehicle registration annex could not be confirmed still in force. The tie between a
code and its official name is ISO's own row naming the province, which already makes a
swapped name fail.

The agreed document `agreed/turkey/provinces.md` holds the list in two definitions in
SB-174's grammar, each quoting **one passage per row**: ISO's with a code and its name,
and beside its rows the count line, the column headings, and the code source line that
says where the codes ISO marks with an asterisk, TR-80 and TR-81, come from; NVI's with a
name. A third definition quotes TDK's rule that writes Hakkâri, the reason the variant is
recorded. Every quoted passage is then read again on its page, ISO's in the browser pane
and the others fetched and searched for, as SB-182's were.

**No official code is written.** A plate number identifies a province in the vehicle
registration scheme, not necessarily as the state's general identifier, and no page
here assigns it.

## The loader writes regions

`ResearchRules` gains `regions`, each with a code, a parent, null for a province, a
name, and where ISO spells the name differently, that spelling. They are written after
statuses and before nationality groups, fill-only: a missing region is created, and a
deployed one whose country or parent differs from the file stops the load with
`ResearchRulesMismatch`, as a status does, since moving a region changes which readers
every rule naming it reaches.

**A deployed region's name is an editor's**, as a status's names are, and a name that
differs from the file does not stop a start: it is shown to no reader yet, and a deploy
refused over a corrected diacritic would do more harm than the difference. The cost is
stated rather than hidden: a name the research later corrects reaches the deployed
database only by an editor's hand, never by the loader.

No `RegionText` is written. No field serves a region's name to a reader yet, and the
name in a reader's own language belongs to the screen that asks where they live, SB-154.
ISO's variant spelling is not written to the database either; it exists for the check.

## Turkey's file, and the check that reads it back row by row

Turkey's file gains its 81 provinces, each with no parent, and names the agreed document
and its two definitions, each on a page of the file's sources with the day it was read, as
a version names its source. The label test reads both back, requires them verified on the
page and day the file names, and checks each province **as a pair and as a name**: the ISO
passage that holds the province's code, with ISO's asterisk where it prints one, must hold
its name, or its recorded ISO spelling where it has one, and NVI's definition must hold a
passage that is exactly the stored name. Neither definition may hold a province the file
leaves out: each of ISO's rows holds exactly one code, the codes its rows hold are exactly
the file's, and NVI's names are as many as the file's, each the name of exactly one
province, so no row can carry two provinces while another names a code the file lacks.
Names are compared in Unicode's composed form with Turkish casing, `İ` and `i`, `I` and
`ı`, and a circumflex is never folded away: Hakkari against ISO's Hakkâri passes only
because the file records Hakkâri as ISO's spelling. So `TR-16` named Ankara fails, and so
does a stored Hakkâri against NVI.

## Files

`src/rules/research/rows.ts`, `src/rules/research/load.ts`,
`src/load-research-rules.ts`, `src/rules/research/turkey.ts` and
`test/research-rules.e2e.spec.ts`; and under `prisma/research/`,
`talk/turkey/provinces.md`, `sessions.json`, `agreed/turkey/provinces.md`, and the
README's table of settled cases. No schema change and no migration.

## What this card does not do

It writes no district, city or area; SB-191 adds Bursa's where its rule needs one. It
gives no province a name in English or Persian for a reader, which is SB-154's, writes no
official code, and writes no rule for any province, which is SB-191's for Bursa. Germany's
states are SB-170's.

## The step I am least sure of

**Hakkari as the stored name.** Two official Turkish sources print it without the
circumflex and the language authority with it, and no instrument settles it; NVI's is
stored because it is the directory of the offices a reader deals with, and the choice is
recorded where a reader of the research can see it.

**One page for the code.** ISO's platform renders by script, so its 81 rows are read in the
browser pane, and a later change there is caught only when the page is read again.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`:

- the two definitions Turkey's regions name are verified, on the page and day the file
  names; every province's code is found with its name, or its recorded ISO spelling, in one
  passage of ISO's; each of ISO's rows holds exactly one code, and those codes are exactly
  the file's; every stored name is one of NVI's passages exactly, and NVI has no name the
  file leaves out;
- after a load, all 81 provinces exist with their names and no parent, and **every one of
  them** is given, one reader at a time, as where a residence permit holder lives, through the
  move query's own check, and none is refused;
- a second load adds no region;
- a deployed province given a parent the file does not name stops the load, and nothing is
  written, while one whose name an editor has changed does not.

Then planted faults, each watched failing: a province left out of the file, two provinces'
names swapped, one name misspelled, Hakkâri's recorded ISO spelling removed, an ISO row
given a second province's code and name while that province's own row names a code the file
lacks, and the region comparison switched off. Then the full API suite, lint and `lint:tsc`,
the build, and the compiled loader run twice on a fresh database. After the push, the
deployed API answers a residence permit holder living in each of the 81 provinces without
refusing them, and a second start adds no region.
