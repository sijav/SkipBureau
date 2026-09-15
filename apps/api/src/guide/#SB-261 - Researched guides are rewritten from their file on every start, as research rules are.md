# SB-261, Researched guides are rewritten from their file on every start, as research rules are

**Exit:** `test/researched-guides.e2e.spec.ts`: after a load, changing a section's text and
removing a source and a group in `RESEARCHED_GUIDES`, then loading again, serves exactly the
changed file on the guide query with no row of the old, and a link the file does not name at a
group's index is replaced without an error; watched failing against the fill-only loader.

## Why

From SB-258's roast. `loadResearchedGuides` creates a researched guide once and afterwards only
fills what is missing, through sample content's `fillGuideDetail`. So a corrected agreed
document, regenerated into `src/guide/researched-guides.ts` and deployed, leaves the old prose
live; a section or source the file drops stays; a link to an obligation the file no longer
names stays; and a link the file does not name at a group's index is refused, which stops the
API from starting. The research rules do not work that way: after a load every row a module
owns says exactly what the module says (SB-202). A researched guide is its agreed document's
text, so it is owned the same way.

## What the loader owns, and what it does not

Written on every start to exactly what the file says, in one transaction per guide:

- **the guide row**: its area, its verified date and position 0, with no disclaimer, the
  suggest link shown and no reading time, since the file gives none of those;
- **its texts**: the English title and description with every other column empty, and no text
  in a language the file does not write;
- **its sections**: one per section of the file, by kind, at the file's index, with the file's
  title and body in each language it writes and nothing else, no link and no steps; a section
  of a kind the file does not list is deleted;
- **its options and the guides it relates to**: none;
- **its sources**: the file's, in the file's order, found by address, named as the file names
  them, dated with the guide, official, with no publisher or note; any other source is deleted;
- **its obligation links**: each group's first obligation the database has, at the group's
  index, and no other link, so a link the file does not name is replaced rather than refused. A
  slug named in two groups is still refused;
- **its area**: under the file's goal, at position 0, with no kind and no recommended start guide,
  titled in English and Persian as the file titles it, with no description, start reason or Ask
  prompt.

Not owned, and never deleted:

- **the goal**, shared with sample content through `src/tasks.ts`: the loader still only makes
  sure it exists with its texts;
- **what points at the guide or its area from elsewhere**: visitors' proposals, common
  questions, other guides' related links, and an area's checklist and related goals.

No sample guide or area has a researched guide's or area's slug in either country, so sample
content and this loader never write the same rows, and no start undoes the one before.

## How

`loadResearchedGuides(prisma, guides = RESEARCHED_GUIDES)`, so a test can load a changed copy.
For each guide one `prisma.$transaction`, with `src/rules/research/load.ts`'s two-minute timeout,
does the writes above: upserts keyed as the schema keys each row, `deleteMany` for what the file
does not list, and sources, which have no unique key, found by address with any second row of
one address deleted. `fillGuideDetail` and `linkObligationGroups` stay as they are for sample
content. A failed transaction leaves no half-written guide. Until SB-262 takes the research
loader's lock around the same transaction, two containers starting together can both create one
row and one of them fail its start.

## The tests

In `test/researched-guides.e2e.spec.ts`:

- the first test, which loads twice and finds no row count changed, stays;
- a new test loads the file, then a copy whose Turkish guide has its first section's title and
  body changed, its last source removed and only its first group; the guide query then serves
  exactly the copy's sections, sources and obligations, and the rows of that guide's sections,
  section texts, sources and links are the copy's count. Then a link to an obligation the file
  does not name is written by hand at the German guide's index 0, the file is loaded again
  without an error, and only the file's obligation is linked. It ends, in a `finally`, by loading
  the file, so the tests after it see the file's rows whatever failed.

`test/guide.e2e.spec.ts`'s refusal tests stay: they are `linkObligationGroups`', which sample
content keeps.

Watched failing, each restored: the text writes put back to create-if-missing, so the changed
title and body are not served; the delete of sources the file does not list skipped, so the
removed source stays; the delete of links the file does not name skipped, so the hand-written
link stays.

## Files

`src/guide/researched-guides.ts`, `test/researched-guides.e2e.spec.ts`, and this plan.

## The steps I am least sure of

**Deleting a text in a language the file does not write.** None exists today and nothing writes
one. The day a Persian research text exists it is in the file. A translation typed into the
admin panel would go at the next start, which is right for text the agreed document owns, and a
question for the admin panel's card when it is built.

**The area's description, owned as empty.** SB-260 is to put an agreed sentence there, through
the file.

## How it is checked

API lint and `lint:tsc`; `test/researched-guides.e2e.spec.ts`, `test/researched-guides.spec.ts`
and `test/guide.e2e.spec.ts`, the specs that load or link guides; the three planted failures.
Then pushed: once deployed, the API serves both guides as before, the same title, description,
sections, sources and links, since the file has not changed. A child of SB-258, so the covering
tests, not the full suite.

Checked once on 2026-09-15: sound. It asked that the area's kind and start guide be stated and
the test's last load run in a `finally`, both taken, and that every write go through the
transaction's client.
