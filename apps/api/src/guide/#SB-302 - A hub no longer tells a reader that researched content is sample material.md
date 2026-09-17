# SB-302, A hub no longer tells a reader that researched content is sample material

**Exit:** no Turkish hub says its content is sample material, a hub whose rows are still sample says so, and a story or
pages test proves both.

Three places say it, and all three are false on Turkey's pages since SB-282 deleted its sample rows and SB-279 to
SB-206 wrote its guides from the agreed research:

- `apps/web/src/screens/category-hub/CategoryHub.tsx`: "Content shown here is sample material for design review."
- `apps/web/src/screens/task-hub/TaskHub.tsx`: "Descriptions on this page are sample content for design review. They
  deliberately avoid fees, thresholds and eligibility rules, which are determined during guided setup against verified
  sources."
- `apps/web/src/screens/home/Home.tsx`: "Figures, timings and requirements shown throughout this design are sample
  content for review, not verified legal information."

The card names the two hubs; Home's line is the same sentence about the same rows, so it is fixed here rather than
left true-sounding on the one page every reader starts at. The work is the flag, which is the API's, and the three
screens', so the plan sits with the hub views in `apps/api/src/guide/` and names the web files it touches.

## Which rows are sample, and who says so

Only two writers make a country's content rows: `sample-content.ts` and the researched guides loader, whose guides are
listed in `RESEARCHED_GUIDES` beside the service. So the API can answer it without a migration or a new column: a
guide row is sample where its country and slug are not a researched guide's, and an area row is sample where its
country and slug are not a researched guide's area.

- `TaskHubView.sample` and `CategoryHubView.sample`, both non-null booleans: true where any row that view shows is
  sample, which for a task hub is its areas and the guides under them, and for an area hub is the area itself and its
  guides. Per page, not per country: once SB-299 gives Germany a researched Anmeldung guide, its area hub must stop
  saying it while `first-week` still says it.
- `sampleQuestions(country)`, a non-null boolean, for Home. Home shows no guide or area content: its tiles are the
  product's own goal copy and its band sits under the common questions, which only sample content writes. So Home's
  flag is about its own rows, true where the country has any question.

The two hub flags read the same helper, one set of researched keys built once.

## The screens

Each notice renders only where its page's flag is true, with its wording unchanged: the two hubs from their view's
`sample`, Home from `sampleQuestions`. The line above each, "Every guide shows when it was last verified and links to
the official source", becomes the other half of the same choice rather than standing always: a sample guide's date and
source are design data, so the assurance shows where the page's rows are researched and the warning where they are
sample. One of the two, never both, never neither.

**Corrected by SB-304.** That is true of `Home` and `CategoryHub`, and false of `TaskHub`. `Home` line 102 and
`CategoryHub` line 193 are ternaries, warning against assurance. `TaskHub` line 194 is `{hub.sample && (...)}` with
no other branch: it has no assurance line at all, so a researched task hub shows **neither** of the two. The
sentence above describes two screens of the three.

## How it is checked

- Stories for the three screens, each with the flag true and false, asserting which of the two lines shows; the mocks
  gain the field. The stories carry the sample side: the browser cannot, because SB-301 deletes the last sample rows
  within days, and because every Turkish goal now has one area, so its address routes to the area hub and never
  renders the task hub.
- An API test over the service: a researched area's hub is not sample, an area holding a row no researched guide names
  is, and a task hub holding both is.
- A pages test on the built site: Turkey's area hub and its home say nothing about sample material and do say every
  guide shows when it was last verified; watched failing with the condition taken out.
- Web lint, typecheck, unit, the four Storybook projects and the pages e2e; API lint, tsc and its suite, since this
  card has a parent and touches both, so the tests for what it changes and the checkers over it.
- DESIGN.md's trust band and hub notes say the notice is shown only where the page's rows are sample.

## What I am least sure of

- Whether the flag belongs on the view at all, rather than the web deciding from what it already has. It cannot: a
  sample guide carries a fabricated source and verified date like a researched one, so nothing in the view tells them
  apart today.
- Whether Home's band should speak for the country or for its own page's rows, which are the areas and the questions
  it lists.
- Whether the notice should survive at all once no country has a sample row, which is SB-301 for Germany; this card
  keeps it, conditional, so the last sample country still warns its readers.

Checked on 2026-09-16 and approved with two corrections, both taken. It agreed the researched list is the right
boundary for today's two writers, and that no column and no migration should be added until an admin panel can edit a
row, when provenance stops being derivable and SB-011 must say so. It found Home's flag wrong: Home shows no guide or
area content, so a country-wide answer would warn about rows that are not on the page and miss the ones that are, and
the flag is now the questions Home lists. It found the assurance line false on a sample page for the same reason the
warning is false on a researched one, so both are conditional, one or the other. It also warned that the browser cannot
carry the sample half, since SB-301 removes the last sample rows and a one-area goal routes to the area hub rather than
the task hub, so the stories and an API test carry it.
