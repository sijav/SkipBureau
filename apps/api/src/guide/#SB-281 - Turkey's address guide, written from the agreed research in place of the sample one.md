# SB-281, Turkey's address guide, written from the agreed research in place of the sample one

**Exit:** on the live site /en/TR/guides/register-your-address shows only address-registration.md's
heading, sections and sources, still shows its rule's answer by city and residence status, and the
sample's quick answer, cost, time and steps are gone.

## Why in place

`register-your-address` is Turkey's one address guide, linked to the researched address duty since
SB-255, and its body is sample text nobody checked. The researched loader upserts a guide by its
country and slug and then owns it (SB-261): it rewrites the English text with no quick answer, cost or
time, deletes every other language's text, deletes the sections the file does not list and every
section's steps, deletes the options and related guides, rewrites the sources and the links, and moves
the guide into its own area. So writing the agreed document under the same slug replaces the sample
guide in its own row, keeping its address, which search engines and shared links already hold, and its
id, which proposals point at. The sample content, which runs before the loader on every start, finds the
guide already there and only relinks it to the same address duty.

## The guide

In `apps/api/src/guide/researched-guides.ts`, after Germany's, written the way SB-258 wrote the two
there:

- **Goal and area.** Getting Settled (`getting-settled`), in an area of its own, slug
  `register-your-address`, titled as Turkey's research file titles the obligation: "Report your address
  and any change to it", "اعلام نشانی محل سکونت و هر تغییر آن".
- **Guide.** Slug `register-your-address`; verified 2026-09-14, the day its footnotes were read; titled
  with the document's heading, "Telling Turkey where you live"; its description the first sentence of
  the first section, which then starts after it.
- **Seven sections**, one for each bold lead of "What a reader is told", each with the paragraphs under
  it, whole sentences in the document's order, with footnote markers, bold and list markers taken out
  and nothing else, as SB-258's rule has it. A kind appears once in a guide and never `yourOptions`, so the seven
  take the seven other kinds: Who this applies to, `beforeYouStart`; When the clock starts,
  `importantToKnow`; Your application is not your registration, `whatToCheck`; One office or two,
  `whereToDoIt`; Online, `howToDoIt`; Bursa, `whatYouNeed`; If you are late, `commonProblems`.
- **Sources.** The pages the document's footnotes cite, thirteen, in the order the footnotes are defined,
  each named from its footnote's locator, as SB-258 did; not the Sources list, which names pages no
  footnote cites and leaves out Law 5490, which one does.
- **Links.** `ADDRESS_GUIDE`, as now.

## The tests

- `test/researched-guides.spec.ts` holds each guide to its own document, keyed by country and guide
  rather than one document per country. Its rule for what comes out of a sentence does not change here.
- `test/researched-guides.e2e.spec.ts` stops assuming one researched area in Turkey and a Turkish guide
  first and a German one second: it reads the areas and the guides it changes from `RESEARCHED_GUIDES`
  by slug. A new test takes a sample guide over: with the loader's row removed, sample content writes its
  address guide, with its Persian text, quick answer, cost, time and steps; the loader then runs, and the
  guide keeps its id, sits in its researched area, has only English text with no quick answer, cost or
  time, no steps, options or related guides, and exactly the file's sections and sources.

## What a reader sees in between

Until SB-282 deletes the sample area `first-week`, Getting Settled in Turkey has two areas, so its goal
shows a hub listing both instead of opening Getting Settled's area directly. The address guide reads in
English in Persian too, marked as English (SB-049), as Turkey's other researched guide does.

## How it is checked

- The spec, watched failing with one sentence of a section changed.
- The takeover test, watched failing with the loader no longer deleting a section's steps.
- The API's lint, type check and tests.
- Pushed, then on the live site in en and fa: the document's heading and seven sections, no Quick answer
  and no cost strip, its thirteen sources, and the address rule still asking where the reader lives and
  answering for İzmir.

Checked on 2026-09-15. The check found the takeover sound: the loader rewrites everything of the guide
it owns, sample content afterwards only relinks the same duty, `first-week` keeps its own checklist and
start guide, and what points at the guide, related guides, questions and proposals, survives with its
id, as intended. It found every kind but `yourOptions` draws a titled body the same way, so the seven
mappings are safe. It corrected the count of sources to thirteen, and refused taking code and italic
markers out in this card, since that would change the live permit guide's text outside it; both taken,
and the markers the live guides show literally are their own card.
