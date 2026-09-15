# SB-228, Germany's cities a rule names are places a reader can name

**Exit:** on the deployed API, a reader may give München, Düsseldorf, Köln, Wiesbaden or
Freiburg im Breisgau as where they live or work without being refused, each stored under its
Land with the official name its page states, and a second start adds none.

## Why

Registration is free in Munich, Düsseldorf, Wiesbaden and Freiburg (SB-229), and Cologne sets
its own trade registration fee (SB-227). A rule for a city reaches only a reader who can say
they live or work there, and no German city is on the deployed database.

## What stays exactly as it is

- **SB-190's loader and SB-210's regions loop**: a missing place is created, one deployed in
  another country or under another parent stops the load, and a deployed place's name is an
  editor's.
- **SB-223's Länder, their check and what both specs assert about them.**
- **Every migration.** `Region` already holds a parent and an official code.

## Only the places a rule names, one card ahead of their rules

`PHASE-NEXT.md` says a place below the first level is added with the researched rule that names
it, and not before, so that no country's municipalities are loaded wholesale. Adding these five
one card before their rules contradicts that sentence, so this is an explicit, narrow amendment to
it, not a reading of it: a place may come one card ahead of its rule only where that rule is agreed
research and its card is already filed and waits on the place's. These five are exactly the places
`agreed/germany/anmeldung.md` and `agreed/germany/business-registration.md` give a rule of their
own, and SB-229 and SB-227 wait on this card. The rule against loading municipalities wholesale
stands. `PHASE-NEXT.md` records the amendment and its reason, which is to keep reading a place below
the first level its own change. The alternative, Köln with SB-227 and the other four with SB-229,
was weighed and not taken.

## Research, and the pages

The case `germany/cities` in `research.py`, two turns, then signed off and passed through the
fixed point. The list is read from:

- **each city's entry in the statistical offices' Gemeindeverzeichnis** on statistikportal.de, a
  raw page, whose imprint says the statistical offices of the Federation and the Länder develop
  and run the portal together. Each prints the key and the entry title, "09162000 München,
  Landeshauptstadt", then "Bundesland Bayern" and "Amtl. Gemeindeschlüssel 09162000";
- **the naming rules of the four Länder**, which make "Stadt" and "Landeshauptstadt" a
  designation and not part of the name: Bavaria's announcement on municipal names, Hessen's
  interior ministry, § 13 of North Rhine-Westphalia's municipal code, and § 5 of
  Baden-Württemberg's, read in the browser pane.

The stored names are the part of each entry title before the comma: München, Düsseldorf, Köln,
Wiesbaden and Freiburg im Breisgau. Each page also prints "Gebietsstand 30.09.2026", a date after
the day it was read, which the research could not explain, while the directory's introduction
dates its area and population figures 31.12.2025. Whether any of the five was renamed or rekeyed
could not be established, because Destatis's register of changes did not open.

## Germany's file

Five places after the Länder, so each parent is written first. Each has its Land as parent, a
readable key under the Land's code, `DE-BY.muenchen`, `DE-NW.duesseldorf`, `DE-NW.koeln`,
`DE-HE.wiesbaden` and `DE-BW.freiburg`, its name, its Amtlicher Gemeindeschlüssel as its official
code, and the reading of its page, with the pattern of its entry title.

## The loader writes an official code

`ResearchRegion` gains `officialCode` and `from`. The loader writes a place's official code when
it creates the place and never compares a deployed one: like the name it is an attribute an
editor may correct, and SB-186 made it never the identity.

## The checks

- **SB-223's check reads only the places with no parent**: its rows are counted against, and
  matched with, those alone.
- **A new check reads each place below the first level from its own page**: its definition is
  verified on the page and day the file names; its entry title, read through the file's pattern,
  is exactly the stored name, the pattern matching the whole passage from its first character to
  its last; one passage is exactly "Bundesland" followed by the stored name of the place's parent,
  and one exactly "Amtl. Gemeindeschlüssel" followed by the place's official code, each label and
  its value one passage because the page prints them on adjacent lines, so a label is never read
  beside another field's value; each is compared as a whole passage, never as part of one; and its
  parent comes earlier in the file.
- **The unseeded spec** compares every place's code, parent, name and official code with its file.
- **The seeded spec** gives every city, one reader at a time, as where a reader will live and
  where they will work, through the move query's own check, and none is refused.

## Files

`src/rules/research/rows.ts`, `src/rules/research/load.ts`, `src/rules/research/germany.ts`,
`test/research-rules.e2e.spec.ts`, `test/research-regions.e2e.spec.ts` and `PHASE-NEXT.md`; and
under `prisma/research/`, `talk/germany/cities.md`, `sessions.json`, `agreed/germany/cities.md` and
the README's table of settled cases. No schema change and no migration.

## What this card does not do

It writes no fee, no rule and no other city, which SB-229 and SB-227 do for these five, and no
official key for a Land.

## The step I am least sure of

**The future Gebietsstand.** Pages read on 2026-09-15 print a territorial status of 30.09.2026,
which nothing that opened explains; names and keys are quoted as the pages print them that day.
Nothing here claims the pages prove the territorial status on the day they were read, and no
stronger claim is made before they are read again after 30 September.

**A name read through a title's pattern.** "Name, Stadt" and "Name, Landeshauptstadt" are the
forms these five print; a city printed another way fails the check until its pattern is written.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`: each city is read back from its own page, its
name, its Land and its key, with its parent earlier in the file; SB-223's check still reads the
Länder alone; and after a load every city exists under its Land with its name and official code,
and each is accepted as where a reader will live and where they will work, while a key that is no
place is refused. In `test/research-regions.e2e.spec.ts`, on a database the seed never touched,
every place is exactly its file's, official code included, and a second load adds none.

Then planted faults, each watched failing: Köln put under Bavaria, a key mistyped, a name stored
with its designation, the loader not writing the official code, a city listed before its
Land, and a label and its value quoted as two passages. Then the full API suite, lint and `lint:tsc`, the build, and the compiled loader run twice
on a fresh database, adding 102 regions and then none. After the push, the deployed API accepts
each of the five as where a reader lives and where they work.
