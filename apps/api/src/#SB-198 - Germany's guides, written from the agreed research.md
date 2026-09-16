# SB-198, Germany's guides, written from the agreed research

**Exit, as its check narrowed it:** no German sample content is served to a reader, and every German guide on the live
site says only what `agreed/germany` says.

This card was split on 2026-09-16 so each part could ship and be checked on its own, and all three have:

- **SB-299** wrote the Anmeldung, business registration and health insurance guides from the agreed documents, beside
  the residence permit guide SB-258 had already written.
- **SB-300** linked their rules and labelled the thirty facts behind them, and SB-313 then gave the reader a way to
  answer the one question those rules ask, where they work.
- **SB-301** retired Germany's sample area, stopped the filler making any country's sample content, and moved the
  fixture to `prisma/sample-germany.ts`.

What is left is this card's own job: **proving it on the deployed database and the live site**, which no test can see.

## What the proof can and cannot say

The check refused the first version of this plan for saying the public API asks for everything. It does not. A guide,
area or question with **no text row at all** is invisible to `guides`, `categories` and `questions`, so the public API
can prove that **no sample content reaches a reader**, not that no unexpected row exists in the database. A raw-table
read would need the database's own credentials, which are not in this repository and are not put there, so the exit
says what can be shown and the card does not pretend otherwise.

One thing is known to survive and is not claimed here: **SB-317**, a visitor's suggestion made against the Anmeldung
guide while that row was sample content. It is not a row a reader sees, the API exposes no way to read proposals, and
PHASE-NEXT.md's line about suggestions going with their sample guides is what SB-317 either makes true or corrects.

## What the proof reads, and what it holds

A read-only script against the live API and the live site, whose exact queries, expectations, the commit it ran
against and its output are recorded beside this plan in `#SB-198 - what the live site said.md`, committed with the
card so the proof is a record rather than a memory. It asserts all of:

1. **Nothing but the research reaches a reader.** `guides(country: "de")`, `categories(country: "de")` and
   `questions(country: "de")` return exactly the four researched guides, their four areas, and no question.
2. **`sampleQuestions(country: "de")` is false**, and every goal and area Germany has says `sample: false` (SB-302).
3. **Each guide is its entry**, in more than the sections, sources and verified date the first version of this plan
   stopped at: title, description, the area and goal it sits in, every emphasis field, its related guides, each
   source's name, publisher, official flag, note and date, and the obligations it links. Not the whole of what a
   reader sees, which this card first claimed: the area's title behind the breadcrumb (SB-322) and the rule cards'
   own facts and notes (SB-323) are outside it. The researched guides spec holds those entries to the agreed documents sentence by sentence,
   so the chain is: the document holds the entry, and this holds the deployment to the entry.
4. **No emphasis the documents do not give**: no quick answer, cost, time, intro, deadlines, cost note, options or
   steps on any German guide, which is SB-258's rule, checked on what is served.
5. **The rules a reader is shown come from the research data, not from these entries**, so the answers SB-300 and
   SB-313 proved live are named in the record rather than re-derived here: the Berlin fee for a reader who works in
   Berlin, Saxony's split for one who works there.
6. **Every German guide is a page.** `/en/DE/guides/<slug>` and `/fa/DE/guides/<slug>` answer 200 with the guide's own
   heading, for all four, so the prerender kept up with the research.

## How it is checked

The script above, run against the live API and `sijav.github.io`, with its output committed. It is the check; there is
nothing to build, and no gate is added, per the owner's order.

## Checked on 2026-09-16, and revised

The check made three corrections, all taken. The public API does not enumerate database rows, so the exit now says no
sample content is **served**, with the reason written down. The guide comparison was too narrow and now covers the
obligations and the source metadata as well as the sections and dates. And the surviving proposal is named as
SB-317's, not as something this card can show absent.

Its own roast, after the card closed, refused the phrase **whole reader-visible projection**, and it was right: the
area title a breadcrumb shows (SB-322) and a rule card's facts and notes (SB-323) are outside what was compared, and
the checker itself was never committed (SB-324). The record says so in its own words rather than leaving the claim
standing.

It also asked that the proof be a record rather than a scratchpad memory: the queries, the expected values, the
commit and the result are committed beside this plan. It agreed no CI gate is wanted.

## What I am least sure of

- Whether a record committed as markdown is worth more than nothing next month, or whether only a test that runs
  again counts. The owner's order forbids inventing a gate, so this is a record.
- Whether the four guides being right today says anything about the fifth, whenever Germany gets one, since nothing
  fails if a new researched guide is never proved live.
