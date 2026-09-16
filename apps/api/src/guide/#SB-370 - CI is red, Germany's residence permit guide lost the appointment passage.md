# SB-370, CI is red: Germany's residence permit guide lost the appointment passage

**Exit:** the `de/residence-permit` case of `researched-guides.spec.ts` passes, and the reply says
whether the passage was correctly removed or wrongly lost.

## Neither. It was reworded, and the guide is still publishing the old claim

The card asked whether the passage was dropped from the agreed document or the guide had gone stale.
Read on both sides, it is a third thing: the passage is present in both, and **SB-184 rewrote one
sentence of it in the document while the guide kept the sentence it replaced.**

The guide, `researched-guides.ts:191`:

> In Berlin, submit the employment-permit application through the dedicated online application before
> your current permission expires; **you do not need to wait for an appointment.**

The agreed document, `germany/residence-permit.md:85` onward:

> In Berlin, applicants for the residence permits for academic skilled workers, skilled workers with
> vocational training, research employment and employment of certain nationalities submit the online
> application "Befristeter Aufenthaltstitel zur Beschäftigung" while their current title is still
> valid. **The LEA reviews the application and, if it is positively reviewed, you receive an
> appointment to attend in person.**

**The meaning is not the same, and the guide's version is the wrong one.** It tells a reader they do
not need an appointment at all; the research now says an appointment follows a positive review, and it
names which four permit routes the online application actually covers, which is the whole point of
SB-184. Every other sentence of the section is identical on both sides.

So this is the same defect as SB-369, an agreed document corrected and its guide left behind, but here
it reaches the reader: for as long as it stands, the site tells someone in Berlin to expect no
appointment.

## What changes

`src/guide/researched-guides.ts`, the `de/residence-permit` section titled "If you cannot get an
appointment.": its body is replaced with the document's own sentences, with the document's markers
removed as `plain()` removes them, so that `plain(document)` contains `title + ' ' + body`.

Nothing else moves. The title is already the document's bold lead. The other sections are untouched,
and the document and the spec both stay exactly as they are: the document is the authority and the
spec is the guard that caught this.

## The sources list moves too, which my first plan missed

The check caught it and the mechanism is plain: SB-184's rewrite cites footnotes the old sentence did
not, so restoring the paragraph marks them used, and `pagesCited` will then require their pages in
`detail.sources`, in the document's definition order. **Replacing the body alone turns test one green
and leaves test two red**, which is the Turkish failure approached from the other side.

So this card changes the section body **and** that guide's `sources`, together.

**Where they go was derived, not read off a failure.** `pagesCited` dedupes by URL and orders by the
line each label is DEFINED on: `__45` at 138, `329328` at 140, `__45b` at 144, `__81` at 146 with 148
and 150 deduping into it, `__41` at 152, then `305304` at 156, `328457` at 158, `350471` at 160, then
`termin-vereinbaren` at 162. The calculated footnote at 142 is skipped, since the pattern wants a
`<url>`, and Munich's at 166 stays out because its sentence is in the city table the guide omits. So
the three insert between `__41` and `termin-vereinbaren` and nothing else moves. The spec's expected
list then matched that exactly, which is the derivation checked rather than the answer copied.

**Their names are the pages' own headings**, fetched from service.berlin.de, which the standing
permission covers and which SB-184 read on 2026-09-16. That is not a convention I invented: the guide
already names `329328` "Service Berlin, Aufenthaltserlaubnis für Fachkräfte mit akademischer Ausbildung
beantragen", and that page's `h1` is exactly those words. The three others follow from theirs. The
document's own Sources section maps them by statute, §18a, §18d with §18e and §18f, and §19c with §26
BeschV, which is the right identification but not a name a reader would recognise under a link.

## What the check settled

**Replace the whole body, not the one sentence that differs.** If another sentence differs invisibly,
a one-sentence swap fails again and teaches nothing.

**No generator and no test helper.** The guide is a curated projection, sectioned and selectively
omitting, and the spec is its drift detector rather than a sign the copy should be automated. Copy
from the UTF-8 source and run the spec at once.

**The matcher is slightly looser than character for character**: `plain()` normalises NFC, strips
markers and folds whitespace, then checks containment. So a stray non-breaking space would fold away
harmlessly, but a curly quote where the document has a straight one still fails. The quotes around
"Befristeter Aufenthaltstitel zur Beschäftigung" are the live risk, and copying the whole paragraph
rather than retyping it removes it.

**SB-184's mid-paragraph bold is not a lead**, which I checked against the regex rather than taking on
trust: test four matches `(?:^|\n\s*\n)\*\*([^*]+[.?])\*\*`, anchored at a paragraph start, so a bold
run inside a paragraph needs no section of its own, and `plain()` strips its markers so the emphasis
test is untouched.

If the spec still fails after this, I compare the two strings by code point rather than by reading
them.

## What this unblocks

`researched-guides.spec.ts`'s first test iterates every guide and throws at the first failure, which
is this one, so Turkey's stale fee sentence in SB-369 is hidden behind it. SB-369 is blocked on this
card for that reason, and the whole spec can only go green once both are done.

## How it is checked

`researched-guides.spec.ts` whole, plus `research-rules.e2e.spec.ts` because the same guide content is
seeded there, and lint and the type checker. SB-370 is a child, so that is its gate; no schema and no
research data change, so nothing is published. CI's own `check` job on main is the last word, and it
cannot be green until SB-369 lands too.
