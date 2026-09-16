# SB-215, The short-term permit's note says the application document, not the approved one

**Exit:** the sentence this card rewrites, in the note, in the agreed document and in the guide a
reader reads, says nothing its cited pages do not state; the deployed API serves it and the live
guide page shows it; the version keeps its legal period and identity, the withdrawn wording being
left in git; and the FAQ's source card carries the day that page was read, not the guide's.

The paragraph's other attribution gaps, the passport requirement, the appointment form sentence and
the online deadline, are **SB-333**, not this card. The exit is narrowed to the sentence being
rewritten rather than promising the whole paragraph, because promising more than is delivered is
the fault this card exists to remove.

## The card's premise was half wrong, and the research said so

The card reads: the note says "the approved application document", Article 21(9)(d) grants the
fifteen day return with the application documents and says nothing of approval, so drop the word.
The first plan followed that. The resumed turn in `turkey/short-term-residence-permit` refused it:

> approval of the application document is not approval of the residence permit application.
> "Without waiting for the result" does not contradict "directorate-approved document".

The Presidency's FAQ, fetched from the official host on 2026-09-16 and matched verbatim here, says
in the answer on travelling while the permit is produced:

- `İlk başvuruda bulunan yabancılara randevu gününde il göç idaresi müdürlüğü tarafından ikamet izni müracaat belgesi düzenlenmektedir.`
- `Bu belgenin il göç idaresi müdürlüğü tarafından onaylanması gerekmektedir.`
- `Bu müracaat belgesi ve harç makbuzlarının onaylı örnekleri kişilere her defasında 15 gün içerisinde dönmek şartıyla çoklu çıkış-giriş hakkı sağlamaktadır.`

The directorate issues the document at the appointment, **the document must be approved by the
directorate**, and it is the approved copies of it with the fee receipts that carry the multiple
exit and entry right. So the word is true. Both rounds of the plan check agreed, the second adding
that the FAQ should be a verified definition rather than mere corroboration, since Article 21(9)(d)
supports the travel right but not the approval requirement.

**The actual fault is that it was unsourced.** That FAQ is not a definition of
`agreed/turkey/short-term-residence-permit.md`: it appears only under `## Sources` as a page
consulted on 2026-09-12, and the document's label list has no entry for it. The sentence cites
`yukk-reg-21-9-d-fifteen-days` and `eikamet-guide-fifteen-days`, and both say only the application
document. So a word a reader can be turned back at a border for not knowing has been standing on
nothing this project's rules accept.

The card's `why` survives and is what the wording must fix: a reader must not read "approved
application document" as a decision on their application.

## The wording

The check's supported core, taken as given. It states the pending decision, says plainly that the
**document** is what is approved, and drops "your passport", which neither cited page establishes:

> While your residence permit application is awaiting a decision, you may travel during the
> requested permit period with the residence permit application document approved by the provincial
> migration directorate and the required residence-charge receipts. You may return without a visa
> if you return within fifteen days of each departure.

"Beyond fifteen days, ordinary visa rules apply" stays, and the appointment form sentence stays
untouched for SB-333. The note's own sentence says the same in its register, keeping its
surrounding sentences exactly as they are.

## The data, the document and the guide

- a definition `goc-sss-belge-onay` in the agreed document: the FAQ's URL, verified, read
  2026-09-16, method `raw page`, with the three passages above as evidence, matched in composed
  form before the line was written, placed after `eikamet-guide-fifteen-days`;
- its marker joins the two already on that sentence;
- the document's sentence and the note take the wording above;
- the guide's section body is kept **byte identical** to the document's prose, and the guide's
  `sources` gains the FAQ page after the e-İkamet entry, since `pagesCited` builds a guide's
  sources from the pages its shown sentences cite in the order the document defines them.

**The version keeps its obligation, criteria and `validFrom`**, so no successor: decided in SB-263,
argued both ways and settled again in SB-213. `sameVersion` compares notes, so the row steps aside
and is written again under the same key. The withdrawn wording lives in git, which SB-331 owns.

**No version or fact label changes**, so no source's read day moves. The new definition is cited by
the document's prose, not by a version, and the second check confirmed the rules spec binds the
read date only for labels a version or fact names. The guide's own `verifiedAt` stays 2026-09-14,
because a guide takes the oldest read among the definitions its shown sentences cite and the older
ones remain.

### A source has to carry its own date

Found by the second check and confirmed in the code: `GuideSource` already has its own
`verifiedAt DateTime @db.Date` column, but `writeGuide` writes the single guide level date into
every source row, and the API exposes that field. So citing a page read on 2026-09-16 inside a
guide dated 2026-09-14 would print "verified 14 September" on the card for a page nobody read that
day. Moving the guide's date to hide that is refused outright: it would misdate every other source.

So `SourceSeed` gains an optional `read`, and `writeGuide` uses `source.read` where it is given and
the guide's date otherwise. The column exists, so there is no migration; every other source is
untouched because the field is optional. This card is the first to cite a page read on a different
day from its guide, which is why it is the card that pays for this.

## The tests

`research-rules.e2e.spec.ts` gains the shape SB-213 used: the note's text stated in the spec, and
the phrase that must not return named.

**No guide test is added, because the ones that matter already exist.** `researched-guides.spec.ts`
asserts for every section that the agreed document contains `folded(title + body)`, and separately
that a guide's sources are the pages its shown sentences cite, each once, in the document's
definition order. So a guide left saying the old sentence fails, a document corrected without the
guide fails, and a marker added without the guide's sources updated fails: three planted cases
already guarded. Both checks agreed an added equality assertion would only begin SB-310's work.

For the per-source date, the guard is the one this card adds: the seeded FAQ source reads back with
its own day rather than the guide's.

Neither test can prove new English follows from Turkish evidence. That is the research review.

## Publishing and the live proof

**Commit first, then publish.** `research:publish` selects only the data file, country file, agreed
document, talk, sessions and README, and `otherInputs` throws on any other changed build input that
is not `.md`: "the deployed build is made from changes this publish would not carry ... Commit them
first." `src/guide/researched-guides.ts`, `src/sample-types.ts` and the spec are exactly that.

**A green Pages run is not proof.** `prerender.mjs` retries `collect(origin)` only until the API
*answers*, then after 600 seconds warns and ships the site with no prerendered pages, and CI's Pages
job runs concurrently with the API rollout the same push triggers. So:

1. read the deployed API until it serves both the corrected note and the corrected guide section;
2. only then dispatch a Pages build, and identify the deployment that dispatch produced;
3. fetch the guide's HTML with the cache bypassed, asserting the new sentence present and the old
   "directorate-approved application document, your passport" wording absent.

The changed text is its own deployment marker: `verifiedAt` does not move and guide data does not
change the bundle hash.

## The steps I am least sure of

**Keeping three copies byte identical.** The note, the document sentence and the guide body are
three hand written copies, and the spec checks the document against the guide but not the note
against either.

**Whether the FAQ is a stable page to cite.** It is a question and answer page, not a regulation, so
its wording can change without a legal change. The evidence array is what protects the claim: if the
page is rewritten, the recorded passages stop matching and a later read notices.

## How it is checked

SB-215 came out of SB-192's roast, so it is a child: the tests covering the files it changes,
`research-rules.e2e.spec.ts` and `researched-guides.spec.ts`, plus the API's lint and `lint:tsc`.
Then the planted cases watched failing, the publish reporting live, and the live sequence above.
