# SB-258, Two short guides show the rules where nationality makes the exception

**Exit:** on the live site both guides answer 200 with their own title, description and canonical and appear in the
sitemap; every sentence of each is its agreed document's; each links its researched obligations, and asked for a visa-free
reader from the United States, or a reader from Denmark, the API answers the exception on that guide.

## Why

The owner, 2026-09-15, asked which guide should change when a reader says who they are: the address guides by city and
status (SB-255 answers them), and "Nationality exceptions: the two rules where nationality makes the exception, each gets
a short guide of its own, so choosing a nationality changes a guide". Only two published rules depend on nationality:
§41(1) AufenthV's 90 days to apply inside Germany for seven nationalities, and Turkey's residence permit charge, which nine
nationalities do not pay. Neither has a page.

## What there is to write from

`research/agreed/turkey/short-term-residence-permit.md` and `research/agreed/germany/residence-permit.md`, both agreed,
signed off and past their fixed-point turns, the German one extended on 2026-09-15 with §41 (SB-234, SB-241). The README's
rule binds: nothing in `agreed/` may be softened, sharpened or given colour when it becomes a guide.

## How agreed text becomes a guide

Every text a guide shows is agreed text, whole sentences in the document's order, with only the footnote markers and the
Markdown bold taken out, and nothing the template would present with emphasis the document does not give it:

- **each section is one of the document's bold-led paragraphs**: its bold lead, with its full stop, as the section's title,
  and the rest as its body, drawn as plain text under the heading. The plain paragraphs that follow it before the next bold
  lead are joined onto that body by a space, so a sentence the document does not set in bold never becomes a heading;
- **no quick answer, no cost, time or deadline strip, no cost note, no steps, no note and no callout**: the template labels
  each of those ("Quick answer", "Typical cost", a warning panel), and each would give a sentence a weight the document
  does not;
- **the description**, which a hub lists, search engines read and the page opens with, is the first sentence of the first
  section's body, and that body starts after it, so the page does not say it twice;
- a paragraph the template cannot hold without rewording, Germany's table of Berlin and Munich and the paragraph that
  qualifies it, is left out, not turned into sentences.

Which kind each section is only sets its place, since a section with a title and a body and nothing else draws the same in
every kind; `yourOptions` is not used, as it draws nothing without options.

**Turkey, `short-term-residence-permit`**, titled with the document's heading, "Getting a short-term residence permit in
Turkey", its description "Apply online through e-İkamet while your visa or visa-exempt stay is still valid.", and seven
sections in the document's order: When to apply; If your stay runs out while you wait; Leaving and coming back while you
wait; What it costs, its body the lead's own sentence and the four paragraphs after it, the card, the permit charge by
nationality, the countries outside every group with the nine exempt nationalities, and the conversion; Proving you have
health cover; Proving your address; Istanbul, and this is the part we cannot answer. It links
`get-a-short-term-residence-permit` and `pay-the-residence-permit-charge`. Last verified 2026-09-14, when SB-182 verified
each of its figures on its page.

**Germany, `residence-permit`**, "Getting a residence permit in Germany", its description "The Ausländerbehörde where you
live decides your application and issues the permit: in Berlin the Landesamt für Einwanderung, in Munich the city's
Servicestelle für Zuwanderung und Einbürgerung.", and five sections: Who decides; What it costs, and this one is federal;
What happens while you wait, and this is the part to read twice, its body joined with every plain paragraph after it up to
the next bold lead, the sentence on working and travelling, the §81(4) and §81(3) bullets, the paragraph beginning "Two
more things about working." with §41(1), §41(2) and §39 No. 3, and the Withdrawal Agreement's British nationals; If you
cannot get an appointment; The mistake to avoid. It links
`get-a-residence-permit-as-a-skilled-worker-with-a-degree`. Last verified 2026-09-15, when the §41 pages were read.

**Sources**: each page a footnote in the chosen paragraphs cites, once, named as the country's research file names it, or
by the page's own title where the file has none.

## Where the guides live, and what creates them

Not sample content, which PHASE-NEXT.md takes out before launch and whose rows could not then be told from these:

- `src/tasks.ts` holds the twelve goals of Home, moved out of `sample-content.ts`, which imports them: they are the
  design's structure, not sample content;
- `src/guide/researched-guides.ts` holds each country's area, guide, body, sources and obligation groups, its header saying
  they are written from the agreed documents;
- `src/guide/guide-fill.ts` takes out of `sample-content.ts` what fills a guide's body level by level and links its
  obligations, so both use one copy;
- `src/load-researched-guides.ts` is an entrypoint step of its own, run by `docker-entrypoint.sh` after sample content. It
  makes sure the goal `get-a-residence-permit` exists with its texts, from `src/tasks.ts`, so a fresh database with no
  sample content gets it too; creates each country's area under it, the guide and its texts where missing; fills the body
  and reconciles the links. A start after changes nothing. The goal has no area in either country today, so it opens that
  area's hub directly and Home's tile for it is no longer Coming soon. Each area's title is its obligation's title from the
  research file.

SB-197 and SB-198, which replace each country's sample guides, carry a note that these rows are not sample rows.

## Linking more than one duty

A guide names its obligations as groups: each group is alternatives for one duty, most preferred first. Linking is one
reconciliation of all of a guide's groups, in one transaction: a slug named in two groups is refused; a link to an
obligation no group names that sits at a group's index is refused, since the schema would let the two tie; each group's
first obligation the database has is linked at the group's index, its position set to that index if it differs; the
guide's links to every named obligation no group chose are deleted; any other link is left alone. The address guides in
sample content become `[['report-your-address', 'register-your-address']]`; Turkey's permit guide is
`[['get-a-short-term-residence-permit'], ['pay-the-residence-permit-charge']]`. The transaction is what SB-259 asks for; its
test of an interrupted reconciliation stays SB-259's.

## The tests

- `test/researched-guides.spec.ts`, with no database: each guide's first section title, description and body joined by
  spaces, and each other section's title and body, are found in its agreed document once both are Unicode-composed and
  whitespace-folded and the document's footnote markers and bold are removed; no guide has a quick answer, cost, time,
  deadlines or cost note, and no section has steps, a note or a callout. Planted: one word changed in one body, and a
  callout added, each of which it must fail.
- `test/researched-guides.e2e.spec.ts`, a database of its own, migrated, with Turkey and Germany and the research loaded
  and no seed and no sample content, as a fresh start without sample content would be: the loader creates the goal, both
  areas, both guides with their bodies and sources, and the links, Turkey's exactly its two obligations at positions 0 and
  1 and Germany's its one; asked for a reader of Denmark, Turkey's guide answers the charge as `none` from the file, for a
  reader of Iran `noRule`, and for a reader who has not said `needsDetail` with `needs: [nationality]`; asked for a
  visa-free reader of the United States, Germany's guide answers with `applyInGermanyWithin` from the §41(1) version, and
  for a visa-free reader of Brazil without it; the loader run again changes no row. Planted: the loader linking only each
  guide's first group, which the Turkish test must fail.
- `test/guide.e2e.spec.ts`: the address guides still link exactly their address duty; a guide given two groups whose first
  group's preferred obligation appears only later keeps each link at its group's index; a slug named in two groups is
  refused, and so is a link to an unnamed obligation sitting at a group's index.

## Files

`src/tasks.ts`, `src/guide/researched-guides.ts`, `src/guide/guide-fill.ts`, `src/load-researched-guides.ts` (new);
`src/sample-content.ts`, `docker-entrypoint.sh`; `test/researched-guides.spec.ts`, `test/researched-guides.e2e.spec.ts`
(new), `test/guide.e2e.spec.ts`; this plan. The board: notes on SB-197, SB-198 and SB-259. The web has no change: a
written guide and an area's hub are pages the prerender already makes.

## How it is checked

API lint, `lint:tsc`, build and the full API suite, the card having no parent task. Then pushed; once the deployed API
serves both guides, the web's CI workflow is started by hand, since a page's file is the API as it was at build time; then
each guide's and each hub's address on the live site answers 200 with its own title, description and canonical, each is in
the sitemap, and the deployed API is asked for the Danish and the American reader.

## The steps I am least sure of

1. **Paragraphs about one lead joined into one body**, and a lead shown as a heading.
2. **Moving the twelve goals out of sample content**, which every start of the deployed API and the test seed now reads
   from a new module.
3. **Refusing a start** when a link no group names sits at a group's index, which no editor can make yet.

## Checks

1. **First check** (2026-09-15). Accepted: a warning panel adds a "Warning" label and treatment the agreed text does not
   have, and the quick answer and cost strip add emphasis too, so no guide has any of them and every section is plain text
   under its lead; researched guides written only by sample content would go with it before launch and could not be told
   from sample rows, so a loader of their own writes them; and linking several groups by counting links can repeat a
   position, so all groups are reconciled together at fixed indexes, a slug in two groups is refused, and it is one
   transaction. It confirmed that the sentences the plan named are whole agreed sentences, that leaving out the table beats
   paraphrasing it, that the American and Danish answers are reachable, and that the deployed start is sequential.
2. **Second check** (2026-09-15), on the approach changed by the first. Accepted: the page opens with the description, so
   the first section no longer repeats it and the test reconstructs the paragraph from both; a fresh database without sample
   content has no goal to hang an area on, so the loader makes sure of its goal from a module of the twelve goals, and a
   spec of its own proves it on a database with no seed; and a link no group names at a group's index is refused rather than
   left to tie. It confirmed joining whole paragraphs in order changes no claim, that titled plain sections render
   coherently, that the reconciliation leaves the existing fixtures' links alone and does not meet the research load's lock.
   Found while lifting the text: neither Germany's "Applying does not automatically let you work, and it does not
   automatically let you travel." nor its "Two more things about working." is bold, so both join the section before them
   rather than heading one, and the German guide has five sections, not the seven first planned. No third check: these are
   the check's own amendments and the plan's own rule applied, not a change of approach.
