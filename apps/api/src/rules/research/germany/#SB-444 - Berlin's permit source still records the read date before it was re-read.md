# SB-444, Berlin's permit source still records the read date before it was re-read

**Exit, as the card words it:** `BERLIN_PERMIT_READ` is `'2026-09-17'`, its comment says why, and the
suite still passes.

This plan lives in `apps/api/src/rules/research/germany/` because that is where the constant is.

## This plan was rejected once, and the rejection is the plan

The first version changed one constant and nothing else, on this reasoning: SB-357's roast had ruled
that a guide's source card should carry the latest cited read for its URL, so the same must hold for
a research source naming the same page. That was an analogy, it was flagged as an analogy in the
question put to the check, and the check refused it:

> "Changing only `BERLIN_PERMIT_READ` to `2026-09-17` makes `research-rules.e2e.spec.ts` fail ... The
> most likely mistake is treating one URL's latest read as interchangeable with every claim ever
> taken from that URL; this repository's existing spec expressly says it is not."

It is right, and the whole approach below is rebuilt on what the spec says rather than on what
another card's ruling suggested. **A guide source card and a research source are not the same
object.** A card is displayed provenance for one guide. A `ResearchSource` is the page a version and
every fact using it were read from, and the suite ties each of those readings to it individually.

## What the spec actually demands, read at source

`research-rules.e2e.spec.ts:145`, inside "every researched version and fact rests on verified
definitions of its own agreed document, on the page and the day the file names":

```ts
expect(definition?.read, `${use.what}: ${label} was read on another day`).toBe(page?.read)
```

Exact equality, once per referenced label, beside the same test's equality on `url` and its
requirement that the definition be `verified`. The test's own name already says it: **the day the
file names**.

**Read at source rather than taken from the review.** The check has been right all session, and its
sibling was still one line out on SB-443, which is why a line number is never transcribed here.

## Which labels the spec walks, which is the real scope

`residence-permit.ts` references the 329328 definitions in exactly three places:

- line 80, the Berlin version: `berlin-online-before-expiry`
- line 88, a fact: `berlin-card-4-to-6-weeks`
- line 95, a fact: `berlin-online-before-expiry` again

So **two** definitions are walked, not four. The agreed document holds four citing that page:

| definition | read | walked by the spec |
|---|---|---|
| `berlin-online-before-expiry` | 2026-09-16 | yes, twice |
| `berlin-card-4-to-6-weeks` | 2026-09-16 | yes |
| `berlin-sticker-fee-56` | 2026-09-16 | no label uses it |
| `berlin-online-lawful-stay` | 2026-09-17 | no label uses it, added by SB-357 |

That last row is why the suite is green today with the document already disagreeing with itself: the
definition SB-357 dated 2026-09-17 is reachable from the document and from no rule label, so nothing
compares it to the source. **The inconsistency this card is about is already in the tree and
invisible**, and moving the constant alone would have made it visible in the worst way, as two
failures blamed on a one line change.

## The re-verification, which is the only thing that makes 2026-09-17 honest

The check offered two branches and made the date depend on fact rather than preference: re-verify the
other claims and move everything to 2026-09-17, or leave the source at 2026-09-16 because a later
reading cannot refresh provenance for claims it did not check.

**So the claims were checked, before choosing.** All ten evidence passages recorded across the four
definitions were matched against 329328 as fetched on 2026-09-17: **ten of ten are present**,
including the five in `berlin-online-before-expiry` that carry the whole application procedure and
the PDF confirmation, the sticker fee line, and the four to six week card line.

Matched with markup stripped, entities decoded, NFC composed and whitespace removed on both sides, so
a passage broken across tags still matches and a passage that has genuinely changed still cannot.
Comparing raw would have produced false misses; comparing loosely would have produced false hits.

**The page was then fetched live, and that is what the date rests on.** The first pass matched the
passages against a snapshot already on disk, and the check refused to accept that on its own: a
stray cached file is not provenance, and the plan had to identify a retained capture. Rather than
argue for the snapshot, the page was requested again at 14:25 on 2026-09-17, `HTTP/1.1 200`, server
`date: Thu, 17 Sep 2026 12:21:26 GMT`, 59016 bytes, headers saved beside the body, and all ten
passages matched against **that** response.

**The snapshot's own timestamp is why this was worth the request.** Its mtime read 13:21, which no
action recorded in this session accounts for. It would have been easy to assume which fetch wrote it;
the honest answer is that I do not know, and a read date resting on a file whose origin I cannot name
is not a read date. The live response also came back byte-identical in size, which vindicates the
snapshot after the fact but was not knowable before asking.

## What changes

1. **The three definitions dated 2026-09-16 become 2026-09-17** in
   `apps/api/prisma/research/agreed/germany/residence-permit.md`. Only the `read` field; every
   `evidence`, `locator`, `status` and URL stays exactly as it is, because nothing about them
   changed, which is the finding.
2. **The document's source-summary sentence**, line 155, stops saying Berlin's four employment permit
   pages were read 2026-09-16 and says they were read that day and again 2026-09-17, each definition
   carrying the day its own claim was verified. Without this the document contradicts its own
   definitions the moment they move, and I did not know the sentence existed until the check named it.
3. **`BERLIN_PERMIT_READ` becomes `'2026-09-17'`.**
4. **The comment is rewritten short.** On the check's instruction: describe the source's current
   provenance, not an accumulating diary of readings.

**The check's instruction for that sentence was followed and its detail corrected.** It said to
distinguish 329328's re-check "from the other three pages". The document says otherwise: every one of
Berlin's four employment permit pages carries the same split, an older definition at 2026-09-16 and
one SB-357 added at 2026-09-17, and all four guide cards already read 2026-09-17. A 329328-only
exception would have replaced one false sentence with another, so the sentence names both readings
instead.

**The other three pages' 2026-09-16 definitions are deliberately left alone**, and the reason is the
same one that lets this card move its own three: those claims were not re-verified today, and no
source in this file names them, so nothing forces or justifies moving them. Moving a date because a
sibling moved is the mistake this whole card exists to correct.

`berlin-sticker-fee-56` moves with the others although no label walks it. The spec does not force it
and coherence does: it quotes the same page from the same reading, and leaving one of four behind
would record two different days for one verification and set the next reader the puzzle this card
exists to clear.

## What does not change

`READ` and `STATUTES_READ`, and every other source in the file. The other three Berlin pages were
also fetched on 2026-09-17 and are not sources here, so nothing about them belongs in this change.

**Half of the existing comment is still true and stays in substance.** "The appointments page was not
re-read" was true when SB-184 wrote it and is still true after SB-357, which re-read the four permit
pages and not the appointments one.

## How it is proved

- **The suite is the check, which it was not before.** The first plan said "nothing tests this date",
  and that was wrong: `research-rules.e2e.spec.ts:145` tests it for every walked label. After the
  change the constant and both walked definitions read `2026-09-17` and the test passes on equality
  rather than on nothing.
- **Watched failing on a planted case, in the direction that matters.** Put `'2026-09-16'` back in
  the constant while the definitions say `2026-09-17` and the test must fail naming a label; put one
  definition back to `2026-09-16` with the constant at `2026-09-17` and it must fail naming that one.
  Two plants, because the equality has two sides and a test that only catches one of them is half a
  test. Restored from a copy, not by `git checkout`, which would discard this plan.
- **Run the whole file, never `-t` on that test.** `research-rules.e2e` loads the research files
  inside an earlier test, so a filtered run reaches it with no researched obligation loaded and
  passes without checking anything.
- **The document and the constant agree**, checked by reading both after the edit rather than by
  assuming they moved together.
- **`researched-guides.spec.ts` stays green, and the reason is worth stating** rather than
  discovering: it asks a guide source card to carry the latest cited read for its URL. That is
  already `2026-09-17` on all four Berlin cards, set by SB-357, and moving three definitions up to
  the date a fourth already held does not move the latest. So this change cannot disturb it.
- This card has no parent of its own work, so it closes on the full suite, plus lint and the type
  checker.
