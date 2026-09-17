# SB-308, a guide's verified date is the oldest check its page shows

**Exit:** every researched guide's date is the oldest read among the definitions
it cites, each source card shows its own read date, and the researched guides
spec holds both.

This plan lives in `apps/api/src/guide/` because `researched-guides.ts` receives
most of the work. It also touches `apps/api/test/` (the spec, and one existing
test whose assertion this card overturns).

## What is true today, measured rather than assumed

Every number here came from reading the files, not from the card.

- **Ten guides, 125 source references, 114 unique URLs, and every one of the 114
  matches a footnote definition in that guide's own agreed document.** Zero
  unmatched. So no read date has to be invented, researched or asked for: the
  data is already in `apps/api/prisma/research/agreed/<country>/<document>.md`,
  as JSON on each footnote, `{"status": "verified", "read": "2026-09-14", ...}`.
- **Two of the ten guide dates overstate how current their oldest sentence is**,
  which is exactly what the card says:

  | guide | claims | oldest read among the definitions it cites |
  |---|---|---|
  | `residence-permit`, Germany | 2026-09-15 | **2026-09-14** |
  | `tax-number`, Turkey | 2026-09-16 | **2026-09-14** |

  The other eight already equal their oldest cited read, so the rule this card
  wants is already the house rule. It is simply not enforced anywhere, which is
  why two drifted.
- **Twenty one of the 125 source cards show a date that is not the one they
  should.** One source carries an explicit `read` today, at `researched-guides.ts`
  line 122, and the rest inherit the guide's date through line 1300,
  `verifiedAt: source.read ? new Date(source.read) : verifiedAt`. An earlier draft
  of this plan said twenty, counted by keying on the URL alone and taking one read
  from a set whose size it never checked. The next bullet is why that key is not
  sound.
- **One URL can carry two cited definitions read on different days.** In
  `germany/health-insurance.md`, `bundesgesundheitsministerium.de/finanzierung-gkv`
  is cited twice in the body: `[^bmg-charged-average-2026]` read 2026-09-16 and
  `[^bmg-half-each]` read 2026-09-14. The seed holds one source card for that URL.
  So "each card equals its definition's read" is not an invariant that can hold,
  and a `Map<url, definition>` silently loses one of the two. The plan check found
  this; it is recorded here because the first draft's whole proof rested on that
  key.
- **The prose line is not the rule, and disagrees with it.**
  `turkey/tax-number.md` line 72 says "All others read 2026-09-12", and I nearly
  took that as the answer for the tax number guide. It is not: that sentence
  covers pages elsewhere in the document, and the guide cites only two sources,
  read 2026-09-14 and 2026-09-16. The card asks for the oldest read among the
  definitions **its sections cite**, so the answer is 2026-09-14. The footnote
  JSON is the machine readable truth; the prose is a human summary of it.
- **Most of this already exists in `researched-guides.spec.ts`, and I did not look
  before planning.** That spec holds `AGREED` at line 10, a `DOCUMENTS` map at 12
  giving each guide's document, `plain`, `folded`, `documentOf` and `pagesCited`,
  and it runs in 8ms with no database. Its footnote regex,
  `/^\[\^([^\]]+)\]: <([^>]+)> \|/`, already finds the definition lines and simply
  throws the JSON away. So the missing capability is a capture group and a lookup,
  not a parser. `research-rules.e2e.spec.ts` has a fuller reader at lines 100 to
  120, but extracting it may not be needed at all, which shrinks this card.
- **The two directional assertion the plan check asked for is already there, and
  is stricter than what it proposed.** `researched-guides.spec.ts` line 100 asserts
  `guide.detail.sources.map(url)` **equals** `pagesCited(document, shown)`, an exact
  ordered comparison. And `pagesCited` counts a label only when the sentence
  carrying it appears in the guide's own shown text,
  `shown.includes(plain(sentence))`. All four of that spec's tests pass today.
- **One existing test asserts the behaviour this card overturns.**
  `researched-guides.e2e.spec.ts` line 171 ends
  "every other source keeps the guide's day". After this card they keep their own.
  That test changes rather than merely passing, and saying so here is the point:
  a card that quietly rewrites an assertion it did not mention is how a rule gets
  lost.

## The contract, as the code already defines it

The plan check proposed a contract and one clause of it is wrong, which only
became visible after reading the spec that exists.

- **A guide's date is the MINIMUM `read` among the labels cited by sentences the
  guide SHOWS.** The check said "every footnote label cited in the document body".
  That is not the same set: a document body includes leads the guide deliberately
  does not carry, recorded in `OMITTED` at line 30, such as Germany's two city
  comparison table left out under SB-290. Dating a guide by a page the reader is
  never shown understates in the other direction, and `pagesCited` already draws
  the line in the right place.
- **A source card's date is the LATEST `read` among that guide's cited definitions
  for that card's URL.** Latest, because the card says when the page was last
  checked, and because one URL can carry two cited definitions read on different
  days. Measured: `bundesgesundheitsministerium.de/finanzierung-gkv` resolves to
  2026-09-16, the later of its two.
- **Both directions are already asserted** by line 100, so this card adds dates to
  a correspondence that is already enforced, rather than building the
  correspondence.

## What the corrected rule actually changes, measured

Run against the real seed objects with the spec's own helper logic, not a
re-implementation of it in another language, because approximating it is what
produced two earlier counts I had to withdraw.

- **Two guide dates**, unchanged across all three ways of counting:
  `de/residence-permit` 2026-09-15 to 2026-09-14, and `tr/tax-number` 2026-09-16
  to 2026-09-14.
- **Twenty four source cards**, and the last three only became visible after the
  first twenty one were applied. Twenty one measured against the dates as they
  were: `de/residence-permit` 7, `de/business-registration` 9,
  `de/health-insurance` 3, `tr/tax-number` 1, `tr/company-formation` 1. Then three
  more, all inside the two guides whose dates moved: two on
  `de/residence-permit` and one on `tr/tax-number`.
- **The two corrections are coupled, and measuring them in one pass is wrong.** A
  card with no explicit `read` shows the guide's date, so changing the guide's
  date changes what every inheriting card displays. Cards that were right by
  inheritance against the old date become wrong against the new one.
  `aufenthg_2004/__81.html` wanted 2026-09-15 and got it for free while the guide
  said 2026-09-15; correcting the guide to 2026-09-14 broke it. So the residual
  set can only be computed after the guide dates are fixed, not alongside them,
  and the spec found each one rather than the survey predicting it.
- The `tr/tax-number` residual is this card in miniature: Law 492, read
  2026-09-16, is the source whose newest read was dating the whole guide. The
  guide now says 2026-09-14 and Law 492's own card says 2026-09-16.
- The two rules pull opposite ways and that is correct.
  `de/business-registration` keeps 2026-09-14 as its guide date while nine of its
  cards move up to 2026-09-15: the headline date is the oldest check, each source
  says its own.

## What I retract

An earlier draft reported one cited definition with no source card, Munich's
`servicestelle-fur-zuwanderung-und-einburgerung` page on Germany's residence
permit guide, and proposed adding the card. **That was wrong.** That page is cited
only by the lead `OMITTED` records as deliberately not carried, so adding a card
for it would break the exact equality at line 100 and undo SB-290's decision. The
count came from treating every body citation as cited, which is the same error the
contract above corrects. It is written down rather than deleted because I came
within one step of making a content change on the strength of it.

## The approach

**1. Read the day, not just the page.** Extend the footnote regex in
`researched-guides.spec.ts` to keep the JSON it already matches and discards, and
expose the `read` per label. Only if `research-rules.e2e.spec.ts` would otherwise
duplicate it does its reader move into a shared module; on current evidence it
does not need to.

**2. Correct the two guide dates.**

**3. Give the twenty four cards their own `read`**, each the latest cited read for
its URL in that guide's document. The rest still show the right day through the
inheritance at `researched-guides.ts` line 1300, so they are left alone. Twenty
four rather than twenty one because three of them are only wrong once the guide
dates are corrected, for the reason recorded above.

**4. Two assertions beside the existing four**, in the same spec: each guide's
`verifiedAt` is the minimum read among its shown-cited labels, and each card's
effective date is the latest read for its URL.

**5. Nothing to do in the e2e spec, and the earlier draft was wrong about it.**
This plan said the test at `researched-guides.e2e.spec.ts` line 171, which ends
"every other source keeps the guide's day", would stop being true. It does not.
That test is about `tr/short-term-residence-permit`, and that guide appears
nowhere among the twenty one cards that change: all fourteen of its sources
already show the right day, because their latest cited read IS the guide's date.
Left alone. Writing the claim down without checking it would have had me editing
a correct test to match a prediction.

## Files

- `apps/api/src/guide/researched-guides.ts`, two dates and twenty four reads.
- `apps/api/test/researched-guides.spec.ts`, the reader change and two assertions.
- this plan.

`apps/api/test/researched-guides.e2e.spec.ts` was on this list and is not touched,
for the reason in step 5.

Note what is no longer here: a new shared module, and `research-rules.e2e.spec.ts`.
Reading the spec that already existed removed both.

## How it meets the exit condition

The exit's three clauses map to steps 2, 3 and 4, and step 4 lands in the spec the
exit names. It reads the agreed documents, so a date in the seed drifting from a
date in the research fails rather than being quietly re-transcribed.

The proof is the two assertions watched failing before the corrections and passing
after, plus one read date changed by hand in an agreed document to watch them
catch it. A spec over data that already agrees has proved nothing until it has
been seen refusing something.

**Both halves were run, and both refused.**

Against the uncorrected seed: `2 failed | 4 passed`, on
`de/residence-permit: expected '2026-09-15' to be '2026-09-14'` and on that
guide's `aufenthv/__45.html` card. After the corrections: `6 passed`. The four
tests that were already there passed throughout, which is what says lifting
`labelsCited` out of `pagesCited` did not change what that helper decides.

Against a planted document: Law 492's read date moved from 2026-09-16 to
2026-09-11 in `turkey/tax-number.md`, and **both** assertions refused it, the
guide's date at `expected '2026-09-14' to be '2026-09-11'` and Law 492's own card
at `expected '2026-09-16' to be '2026-09-11'`. Restored from a copy rather than
through git, the document holding 2026-09-16 again and `git status` clean, and the
spec green at `6 passed`.

That second run is the one that matters. The first only shows the assertions
compare something; a spec built this way could in principle compare the seed with
itself and pass forever. Watching a change in the research break it is what shows
the documents are the source of truth.

## The step I am least sure of

**Whether `verifiedAt` should be the minimum read at all, or the day the guide was
last composed.** Every one of these dates is currently 2026-09-14 or later while
the underlying reads go back to 2026-09-12, which means the seed's dates were
never simply "the oldest read" even where they agree today. If `verifiedAt` is
meant to record when the guide was last written rather than when its oldest source
was last checked, then step 2 is changing the meaning of a field rather than
correcting two errors in it, and the reader is owed both numbers rather than one.
The card's own wording asks for the oldest read, so that is what this builds, but
the eight guides that already agree may agree by construction rather than by rule.
