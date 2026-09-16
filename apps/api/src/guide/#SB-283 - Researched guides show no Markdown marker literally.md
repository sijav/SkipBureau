# SB-283, researched guides show no Markdown marker literally

**Exit:** on the live site no researched guide shows an asterisk or a backtick
that is Markdown, the spec's rule takes them out, and it fails for a body that
keeps one.

## What is actually wrong, measured rather than assumed

The card names two cases. There are **seven**, and all seven are live now. Read
from the deployed API, every researched guide, every string field, not only
section bodies:

| guide | field | marker |
|---|---|---|
| `tr/short-term-residence-permit` | `sections[1].body` | `*Ikamet Izni Muracaat Belgesi*` |
| `tr/register-your-address` | `sections[5].body` | `` `randevu.goc.gov.tr` `` |
| `tr/work-permit` | `sections[0].body` | `*remaining*` |
| `tr/company-formation` | `sections[0].body` | `*anonim sirket*` |
| `tr/company-formation` | `sections[2].body` | `*harc*`, twice |
| `de/business-registration` | `sections[7].body` | `*Fragebogen zur steuerlichen Erfassung*` |

The Turkish words above are transliterated into ASCII throughout this plan,
because this machine mangles non-ASCII passed through the shell and this file is
read back that way. The real spellings are the ones in `researched-guides.ts`
and in the agreed documents, and those are what the work must match.

Three independent counts agree on the same seven: the deployed API, the
`## What a reader is told` prose of the agreed documents, and
`researched-guides.ts` at lines 61, 303, 521, 622, 636 (twice) and 919. The
other five researched guides are clean, and all ten are served, so the deployed
API is level with the repository.

The live page was read directly rather than reasoned about. It shows, in
visible text, "issues a residence permit application document
(*Ikamet Izni Muracaat Belgesi*). The implementing regulation", asterisks and
all. That it renders literally is also the proof that a section body is not
Markdown: nothing interprets these markers, so they reach the reader as
punctuation.

## Why this is completing SB-258, not reversing it

SB-258's plan says its rule took out "only the footnote markers and the Markdown
bold". Italic and code markers were never in its scope, so nothing decided is
being undone.

## The approach

**Drop the markers, keep the words.** `(*Ikamet Izni Muracaat Belgesi*)` becomes
`(Ikamet Izni Muracaat Belgesi)`, and `` `randevu.goc.gov.tr` `` becomes
`randevu.goc.gov.tr`.

The card offers an alternative, to "mark the words as the document does". That
is rejected here: a section body is drawn as literal text, so italic or code
rendering would be a new template feature rather than this repair, SB-258's rule
is that a guide gives nothing the emphasis the document does not, and inventing
a presentation convention for foreign terms is the owner's decision, not this
card's.

**The agreed documents are not edited.** They are the transcription of the
agreed research and they keep their markers. Only the guide text a reader meets
is marker free, and `plain` is what bridges the two.

## The three callers of `plain`, and why the change is required rather than optional

`plain` is used three times in `apps/api/test/researched-guides.spec.ts`, and the
plan check caught that an earlier draft of this file named only two.

1. **The body comparison**, line 59. `plain(document)` must contain
   `folded(section.body)`, and `folded` only normalises whitespace.
2. **`pagesCited`**, line 82: `shown.includes(plain(sentence))`, where `shown` is
   the guide's own displayed text. A document sentence is matched against what
   the guide shows, and the footnote labels of a sentence that matches are what
   become the guide's sources.
3. **The bold-lead test**, line 147, on the inner text of a captured
   `\*\*([^*]+[.?])\*\*`. That capture is `[^*]+`, so it can never hold an
   asterisk, and measured across every document **no bold lead carries a marker
   of any kind**, so this caller is unaffected.

Caller 2 is why `plain` **has** to change in the same commit as the guide text.
Take the markers out of a body and leave `plain` alone, and the document sentence
still reads `*harc*` while the body now reads `harc`, so `shown.includes(...)` is
false, the sentence's footnote goes uncounted, and **the guide quietly loses a
source**. That is exactly the failure SB-369 was filed for. The two edits are one
change, not two.

That is not reasoning, it was watched. Planting the two new rules back out of
`plain` while the bodies stayed clean failed **two** tests, not one: the body
comparison, and "each researched guide's sources are the pages its sentences
cite", which is `pagesCited`. The second failure is the loss of a source,
demonstrated.

The other plant, a marker put back into `tr/work-permit`'s body with `plain`
left alone, failed the body comparison only. So both directions of the pair are
covered, and each was restored byte for byte afterwards.

## The mechanism that makes this self-guarding

`plain` today takes out list markers, footnote markers and bold:

```ts
text.replace(/^- /gm, '').replace(/\[\^[a-z0-9-]+\]/g, '').replaceAll('**', '')
```

Once it also strips italic and code markers, a body that **keeps** one no longer
appears in the document's plain form, and the existing `toContain` assertion
fails on it.

That is the exit condition's "it fails for a body that keeps one", and it costs
no new gate: the assertion that already exists becomes the guard. Nothing is
added that can refuse to let work close.

## The pattern, after the plan check corrected it

```ts
.replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '$1')
.replace(/(?<!`)`(?!`)([^`]+?)`(?!`)/g, '$1')
```

Paired markers only, **kept before the whitespace fold**. Three things were
settled here:

- `[^*]` already matches a newline, so no newline-tolerant alternation is needed.
  An earlier draft proposed `((?:[^*]|\n)+?)`, which is the same thing written
  twice. Verified: `/^[^*]$/.test('\n')` is `true`, and `*anonim\nsirket*` is
  matched and unwrapped.
- **Not** the blunt `replace(/\*/g, '')`. It needs no pairing, but it silently
  swallows a stray unpaired asterisk, so a document that grew a typo would stop
  being visible to the comparison.
- **Not** moved after the whitespace fold, which an earlier draft preferred.
  Folding first would let a marker pair across a paragraph boundary, and that is
  a wider recognition than this normalizer wants.

Measured with those patterns: the reader-facing prose holds 6 italic and 1 code
span, the seven above. Whole documents hold 9 italic and 52 code, the surplus
being footnote anchors such as `__19` and `talk/...` paths in the source
sections. `plain` sees the whole document and will strip those too, which is
harmless: no guide body contains them, and the footnote-definition paragraphs
`pagesCited` might otherwise trip on are skipped by its `startsWith('[^')` guard.
The place files, `provinces.md`, `states.md` and `cities.md`, are never read by
`documentOf`, so the long unpaired asterisk inside the province table is out of
reach.

## Files

- `apps/api/src/guide/researched-guides.ts`, the seven spans in five guides.
- `apps/api/test/researched-guides.spec.ts`, `plain` gains italic and code.
- This plan, which stays in this folder and is committed with the work.

The agreed documents under `apps/api/prisma/research/agreed/` are deliberately
untouched.

## How it reaches the reader

Guides are rewritten from this file on every API start (SB-261), and Northflank
builds on a change under `apps/api/**`, so the push deploys it. The Pages
prerender does not wait for new API data, so the live page keeps the old text
until a Pages rebuild is dispatched **after** the API serves the new content.
The order is: take a before reading, push, confirm the API has no markers, then
dispatch Pages, then read the page again.

## What the plan check changed

Run 2026-09-16, accepted in full:

1. **The pattern**, as above: paired single markers with `[^*]+?`, before the
   fold, and the same rule for backticks. The blunt strip was rejected with a
   reason, and a full Markdown parser was named as a fourth option and dismissed
   as unjustified for a deliberately narrow normalizer.
2. **The third caller**, `pagesCited`, which this file had missed. Its
   consequence, that the change is required rather than merely compatible, is
   written above.

It also confirmed, on grounds this plan had not checked, that removing the
markers is the right scope because a section body is rendered as literal text,
and that the deployment order is sound because the Northflank allow list
includes `apps/api/**` while Pages is a separate snapshot build.

## The residual loss, recorded

`*remaining*` is the one span that is emphasis rather than a foreign term. Its
sentence reads "it is not six months *remaining*", drawing a contrast. Dropping
the markers keeps the words but loses the stress, and the sentence still says the
right thing. The other six only flagged a phrase as not English.
