# SB-206, Find what Turkey's Revenue Administration charges for a foreigner's tax number

**Exit:** `agreed/turkey/tax-number.md` states the fee, or that no Revenue Administration page states one, with a
verified definition read from a Revenue Administration or other first-party page, agreed in the resumed research
conversation.

SB-197 waits on this. The tax number guide's one figure, "It is free", rests on Bursa Uludağ University's guidance for
its own applicants, which is not the authority that issues the number.

## The conversation

`turkey/tax-number` is resumed with `research.py ask`; its session is in `sessions.json` and its transcript in
`talk/turkey/tax-number.md`, both committed. One question, carrying the leads SB-195's plan check gave, which are not
yet research:

- the Revenue Administration's foreigner application page, <https://dijital.gib.gov.tr/foreigners/kimlikNoBasvuru>,
  presents the form and states no price or payment;
- the Presidency's statement at
  <https://www.iletisim.gov.tr/turkce/haberler/detay/vergi-borcu-sorgulamalarinin-ucretli-olacagi-iddialarina-dair-aciklama>
  says query and verification services are free, which does not reach issuance.

It asks what issuing a foreigner's tax identification number costs, on a first-party page: the Revenue
Administration's pages and guides, a tax office's, its digital service's, or the law and tariffs that set charges,
each answer with the page and the sentence that states it; and, where no page states a charge or its absence, which
pages were read.

Each answer is judged against the page it names, opened here: the sentence has to be on the page, and a page that
shows no price is silence, not a statement that none is charged. The judgement goes back into the same conversation,
until a turn adds nothing.

## What is recorded

The paragraph on the charge in `agreed/turkey/tax-number.md` says what the conversation agreed, with a definition in
the form the file's two have: the page, verified, the day read, how it was read, where on the page, and the sentence as
evidence. One of three:

1. A first-party page states a fee: the paragraph gives it.
2. A first-party page states none is charged: "It is free" rests on that page, and the university's definition goes
   unless another sentence still cites it.
3. None states either: the paragraph says a charge or an exemption is stated on none of the pages read, naming them
   and the day, and the university's "free of charge" leaves the document and so the guide, since a figure with no
   authority's page behind it is what SB-197 cannot close on.

## What else changes

`test/researched-guides.spec.ts` holds the tax number guide to its document, so the guide's paragraph and sources in
`apps/api/src/guide/researched-guides.ts` follow the document in the same change, extracted as SB-279's were, and go
live with the API. A rule behind the figure, which SB-197's close needs, is not this card: after outcome 1 or 2 a card
is filed for Turkey's tax number rule, its fee fact and the guide's link; after 3, SB-197's close is checked again on
the new sentence.

## How it is checked

- The definition's sentence is on the page it names, fetched here with System32 curl `--ssl-no-revoke` where a
  government host refuses Python's certificates, and the evidence found in what came back.
- `test/researched-guides.spec.ts` passes with the new paragraph, watched failing first with the document changed and
  the guide not. It gains the assertion it lacked: each guide's sources are its document's footnote pages, in
  definition order, so a source whose sentence left the document cannot stay in the guide; watched failing with the
  university's page left in the guide's sources. Pages, not names: SB-288 has one name that differs today.
- The full API suite, as this card has no parent.
- Pushed; the live API serves the tax number guide as the file says, by SB-261's read-back, and the page shows the
  paragraph in en and fa.

## What I am least sure of

- Whether any first-party page says anything about the charge at all, and whether, if none does, the guide should keep
  the university's words.
- Whether the Revenue Administration's service running the application with no payment step can be read as "no
  charge". This plan says it cannot.

Checked on 2026-09-15 and approved with two corrections, both taken: outcome 3 says no statement was found rather than
that the pages state none, which would read silence as a statement, and drops the university's figure from the guide;
and the guides spec checks sources as well as text. It confirmed both leads are read as they should be, the
application form as silence and the Presidency's statement as covering querying and verification only, and named pages
for the conversation: the Istanbul tax office's procedure handbook, Law 492's tariffs with the notice of their 2026
amounts, which can update a charge but not create one, and an e-Devlet page only as a route, not as who sets a charge.
No tax number rules file exists, so `research-rules.e2e.spec.ts` and `publish-research.ts` do not read this document.
