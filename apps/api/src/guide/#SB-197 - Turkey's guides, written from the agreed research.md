# SB-197, Turkey's guides, written from the agreed research

**Exit:** no Turkish sample guide, category, hub copy or question remains on the deployed database, and every Turkish
guide on the live site says only what agreed/turkey says, its figures shown from the linked rules with their pages.

The card was split before it was built, each part planned, checked, built and proven live on its own:

- SB-279: the tax number, health cover, work permit and company formation guides, written from their agreed documents.
- SB-281: the address guide, which took over the sample one in place.
- SB-282: every Turkish sample guide, area, hub text and question deleted from the deployed database, and the filler
  no longer making them, by the owner's answer of 2026-09-15.
- SB-280: the health cover, work permit and company formation guides linked to their research's rules, each fact
  labelled; SB-286 before it, so a reader can say the role those rules need.
- SB-154 and SB-169 before them: the short-term residence permit guide and its rules.

What is left is to prove the whole on the live site and database, and close it. No code is expected to change; a check
that fails becomes a card of its own.

## What is checked

1. **Nothing sample remains.** The live API lists Turkey's guides and areas as exactly the six researched ones, each area
   under its researched goal, and no question.
2. **Each guide says what its research file says.** The live API serves every researched guide exactly as
   `researched-guides.ts` holds it, its title, description, verified date, sections, sources and links, compared field
   by field, as SB-261's read-back does. That file is what SB-279 and SB-281 wrote from the agreed documents, under the
   spec that compares it with them.
3. **Every figure a rule carries is linked.** Every obligation in Turkey's research rules files is linked by a guide:
   the address duty, the short-term permit and its charge, health cover, the work permit and its three duties, and
   company formation and its five. The tax number has an agreed document and no rules file, so its guide links nothing;
   what the Revenue Administration charges is SB-206's research.
4. **Every guide is a page.** Each of the six opens from its own file with 200 in en and fa, with its heading and its
   canonical, and the three SB-280 linked show their rules' answers for the reader the link names, which SB-280's live
   check already proved in both languages and schemes.

## What I am least sure of

- "Hub copy": the Turkish areas' own texts were deleted with the samples, and a goal's hub text is the product's, the
  same in every country. Whether anything a Turkish hub shows still comes from the sample content, such as an area's
  description, which SB-260 says the researched residence permit areas do not yet have.
- "Its figures shown from the linked rules": the tax number guide's prose repeats a university's "free of charge",
  cited as not official, with no rule behind it until SB-206.

## Checked on 2026-09-15: not closed yet

The check found the hubs clean: a Turkish goal's title and texts are the product's own, written once for every country
in `apps/api/src/tasks.ts`, and a researched area carries only what `researched-guides.ts` gives it. It found the Pages
deploy replaces the whole site, so a deleted guide cannot survive as a file, and asked for that to be asserted once: on
the live site `/en/TR/guides/sim-card` and its Persian page answer 404 and the sitemap lists only the six researched
guides, both checked.

It found one real gap, and it stands: the tax number guide states a figure, that a tax number is free, from Bursa
Uludağ University's page, with no rule or rule page behind it. That is faithful to the agreed document, which marks the
source as not official, but it does not meet "its figures shown from the linked rules with their pages". So SB-197
waits for SB-206, which asks the Revenue Administration's own pages what the tax number costs, and closes on these same
checks once that answer is a rule the guide links, or the figure has left the guide through a research change.

## Closed 2026-09-16

SB-206 took that figure out. The tax number conversation found no first-party page stating a charge or an exemption,
Law 492 was read here and lists no fee for issuing the number, and the guide now says that, sourced to the law, with
the university's "free of charge" gone from the document and the guide. No figure of a Turkish guide is left without a
rule or an authority's page.

Every check of this card was then run again, after that deploy:

- Turkey's live guides are the six researched ones, its areas the same six, each under its researched goal, and it has
  no question.
- SB-261's read-back finds every researched guide served exactly as `researched-guides.ts` holds it, sections, sources,
  verified date and links.
- Every obligation in Turkey's research rules files is linked by a guide; the tax number has no rules file, and its
  charge now rests on Law 492's own page in the guide's sources.
- All six guides answer 200 in en and fa from their own files; `sim-card`, the sample guide SB-282 deleted, answers 404
  in both and is absent from the sitemap, which lists exactly the six.
- A Turkish hub shows only the product's own goal texts from `tasks.ts` and what the researched guides give it.
