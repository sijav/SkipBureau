# SB-299, Germany's Anmeldung, business registration and health insurance guides, written from the agreed research

**Exit:** on the live site the three German guides say only what their agreed documents say, each section a document
paragraph and each source a footnote's page, held by the researched guides spec and proven by the live read-back.

Germany has four agreed documents that describe a guide. One is live already, the residence permit. These three are
not, and the Anmeldung guide a reader sees today is the sample filler's:

| document | title | leads | footnote pages |
|---|---|---|---|
| `germany/anmeldung.md` | Registering where you live in Germany | 7 | 16 |
| `germany/business-registration.md` | Registering a business in Germany | 10 | 17 |
| `germany/health-insurance.md` | Health insurance in Germany, which is not optional | 9 | 17 |

## How each guide is written

As SB-279 wrote Turkey's: the scratchpad extractor reads the document by SB-258's rule, the title from its heading, one
section per bold lead of "What a reader is told" that ends in a full stop or a question mark, holding the paragraphs
under it, the description the first sentence of the first section, and the sources the footnotes' pages in definition
order named in each locator's words. Its JSON becomes an entry in `researched-guides.ts` by script, never by hand:

- `country: 'de'`, and the goal each belongs to: `getting-settled`, `start-a-business`, `health-and-insurance`.
- an area of its own, `anmeldung`, `business-registration` and `health-insurance`, each named in English and Persian.
- `verifiedAt`: the newest read among the document's definitions.
- `obligations`: none for business registration and health insurance, which SB-300 links. **The Anmeldung guide keeps
  `ADDRESS_GUIDE`**, which the sample row it takes over links today, so the rules a reader sees on that page, and the
  pages test that proves them (SB-257), do not disappear between this card and the next.
- The Anmeldung guide keeps the slug `anmeldung`: the loader owns the row and rewrites it in place, as Turkey's address
  guide did in SB-281, so the address a reader already has still opens the guide.

`test/researched-guides.spec.ts` gains the three documents in its `DOCUMENTS` map, which holds every entry to its
document's own sentences and its sources to the pages those sentences cite.

## Seven sections, and two documents with more leads than that

A guide's sections are keyed by kind: `@@unique([guideId, kind])` in the schema, "one of each kind per guide", and the
loader upserts by that key. There are eight kinds and `yourOptions` is barred from a researched guide (SB-258), so a
guide holds at most seven sections. Business registration has ten leads and health insurance nine.

**Merging is not the answer, and the check said so.** It keeps every sentence but turns a document's heading into body
text, and the spec would not notice, since it tests containment and not structure. The section identity changes
instead: a guide's sections become ordered rows, `@@unique([guideId, position])` in place of the kind, which is what
already orders the API's answer and the page. A section keeps its kind as what it is, and a document that says
something twice gets two sections of that kind, honestly. That is a migration and it touches both writers and the
page's key, so it is its own card, and this one waits for it.

## How it is checked

- `test/researched-guides.spec.ts` over all ten guides: text, no emphasis the document does not give, and sources.
- `test/researched-guides.e2e.spec.ts`, which writes every entry to a database and reads it back, and the API suite.
- The web's pages e2e, unchanged: Germany's Anmeldung page still shows its rules, since the guide keeps that link.
- Pushed; the live read-back finds each guide served as its file says, and the three pages open in en and fa.

## Checked on 2026-09-16, and revised

The check refused the merge and gave the reasons above; ordered sections are its answer and are now a card of their
own, which this one waits for. It read both long documents and found every lead fits the existing vocabulary, several
of them repeating a kind honestly, and no lead needing a new one. It confirmed the Anmeldung guide keeps the slug
`anmeldung` and its `ADDRESS_GUIDE` link, the German word being the address a reader already has and the link being
what SB-257's page test exercises, and that the other two guides linking nothing until SB-300 is a temporary absence
rather than an inconsistency.

It refused the verified date too: the newest read among a document's definitions makes older claims look newer than
they are on a page that says Last verified in three places. **A guide's date is the oldest read among the definitions
its sections cite**, and a source card's date is that source's own read, which the entry has to carry. The existing
guides are dated the other way, the tax number's 2026-09-16 among them, and that is a card of its own.

It also asked for a test the current spec cannot give: every paragraph-opening bold lead of a document appears as a
section title of its guide, in the document's order, so a lost heading fails rather than passing a containment check.

## What I am least sure of

- Which kind each section takes, since the kinds are a fixed vocabulary drawn for a SIM card guide and these documents
  are about a registration, a business and an insurance.
- Whether a source's own read date belongs in the entry beside its page and name, or is read from the document when
  the guide is written.
