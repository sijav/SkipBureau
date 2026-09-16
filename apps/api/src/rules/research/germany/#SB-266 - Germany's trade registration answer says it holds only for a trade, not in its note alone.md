# SB-266, Germany's trade registration answer says it holds only for a trade, not in its note alone

**Exit:** on the deployed API a company founder's `register-a-trade` answer carries the trade condition
in its facts as the research conversation agreed, the case's publish reports live, and
`research-rules.e2e.spec.ts` passes.

## What a reader is served now

The federal `register-a-trade` version carries `criteria: FOUNDER` alone, so it reaches every reader in
situation `company-founder`, a freelance practice included. Its facts are the deadline,
`notifyTradeOfficeWhen` equals "at the same time as you start the business" on
`gewo-14-at-the-same-time`, and the fine, `lateOrMissingTradeNotificationFine` at most EUR 1,000.

The condition sits only in `TRADE_NOTES`, which opens "This applies only if your activity is a trade
under trade law." So a reader who takes the answer's facts is told a deadline and a EUR 1,000 fine with
no sign that the duty depends on a classification somebody else makes.

## What the agreed document supports, and what it does not

The footnote quotes §14(1) GewO: "Wer den selbständigen Betrieb eines stehenden Gewerbes, einer
Zweigniederlassung oder einer unselbständigen Zweigstelle anfängt, muss dies der zuständigen Behörde
gleichzeitig anzeigen." The duty is on whoever starts a **standing trade**.

The document's own prose says the trade office decides, on its own, whether you must register a
Gewerbe; that the Federal Administrative Court has held the tax classification does not bind the trade
authority; and that calling yourself a freelancer does not determine which you are.

So the condition is real and already agreed. What is **not** settled is how the fact should word it,
and that is the conversation's to give rather than mine. SB-204 is the reason this line matters: a
correction worded here rather than there introduced a fresh overclaim that the next round caught.

## The precedent the card names

SB-263 put a qualifying condition into the fact's own text rather than leaving it in the note:

```ts
key: 'notifyAccidentInsurerWithin', operator: 'within', numericValue: 1, unit: 'weeks',
textValue: 'of opening the business; a trade registration made within that week already counts as this notification',
```

with the fuller prose still in `ACCIDENT_INSURER_NOTES`. The shape is that the condition travels with
the figure and the note keeps the explanation. That is the shape this card proposes to follow.

## How the conversation is resumed, and the trap in doing it

`talk/germany/business-registration.md` names its own conversation in its header, session
`01a093d1-58d0-7601-bc64-fbf538cca3f1`, and records every round as `## Asked, <date> UTC` followed by
`## Answered`. Its last round closed on 2026-09-15 with "No. I opened no URLs in this pass."

`.claude/roast-sessions.json` currently maps `search:codex` to `01a093b1-8cc5-7ed1-bb67-c6d984ec7fba`,
a **different** conversation whose id differs from this one by a few characters. SB-364 records why:
the skill keys a session as `search:<brand>`, one per brand rather than one per subject, so resuming
the right conversation means editing that JSON before firing, and the edit has to land with nothing
else in flight because the map is rewritten before a roast runs.

**Repointing that shared map is not safe, and the plan check showed why.** Even with nothing running
when I check, a second `search` roast can start while mine runs, fall back to a fresh conversation
because the lock is held, and save its own `search:codex`. The intended run's three way merge can then
keep that competing mapping, because its own target id is unchanged from its baseline, and the *next*
subject resumes the wrong thread with nothing to show for it.

So the shared map is not touched at all. The round goes through a one shot resume that never reads or
writes `search:codex`, mirroring exactly what `run_codex` builds:

```bash
codex exec resume -m <model> -c model_reasoning_effort="<effort>" --skip-git-repo-check \
  -o <output file> -c tools.web_search=true -c sandbox_mode="read-only" \
  01a093d1-58d0-7601-bc64-fbf538cca3f1 -
```

with the prompt on stdin, because a prompt this long breaks the Windows command line as an argument.
Before the turn is recorded, the run must show it resumed **that** session id; if it starts a fresh
conversation instead, the round is discarded rather than written into the talk file, because a fresh
thread has none of the context the last fourteen rounds built.

The talk header records this conversation ran on `gpt-6-astra` at high effort. Today's plan roast fell
back from `gpt-5.6` to `gpt-5.6-terra`, so this round is asked at terra medium and the difference is
recorded here rather than left for a reader to infer from the answer's tone.

## What changes, if the conversation agrees

- `src/rules/research/germany/business-registration.ts`: the federal version's `notifyTradeOfficeWhen`
  text gains the trade condition, worded as the conversation words it. Whether the Berlin, Hamburg and
  Cologne versions need it as well is for the conversation to say; this plan does not pre-decide it.
- `prisma/research/agreed/germany/business-registration.md`: **nothing, and that is a decision rather
  than an omission.** The plan first said this would gain a "Corrected again" line as SB-227 and SB-263
  each did. Those lines record a correction to the *document's prose*, and this round corrected neither
  a sentence nor a figure there: the document already says the duty is to register a Gewerbe and that
  the trade office decides who must. What changed is where that condition sits in the rule's facts.
  Checked rather than assumed, because the publish would have failed if I were wrong:
  `research-rules.e2e.spec.ts` reads the agreed document through `definitionsOf` and checks a version's
  and a fact's `document`, `source` and `labels`, never their `textValue`. The successor reuses
  `gewo-14-at-the-same-time`, `gewo-146-late-notification-fine` and the same two sources, all already
  defined in that document.

  For the same reason the successor's `verifiedAt` stays 2026-09-14, the day those pages were read. No
  page was read again this round, and claiming a fresh reading by moving that date would be the kind of
  false provenance this pipeline exists to prevent.
- `talk/germany/business-registration.md`: the round itself.

**A spec change IS needed, and my first draft had this wrong.** I claimed the spec was unaffected
because `factsIn(GERMANY, federal, local)` derives both sides from `GERMANY`'s own versions. That holds
for an edit in place and fails for a successor: the trade test picks the national version with
`trade.find((version) => placeOf(version) === undefined)`, and `.find` returns the **first** match, so
once a successor exists the test compares the *ended* version's old facts against what the API serves
from the new one.

The repair is already idiomatic in that same file. `research-rules.e2e.spec.ts` imports `inForceOn`,
and its Turkey section carries the comment that company formation "now has two, the ended one first, so
without `inForceOn` this would" choose wrongly, with `factsOf` selecting
`version.obligation === slug && inForceOn(version, TODAY)`. Germany's trade test gets the same
treatment, plus a direct assertion on the agreed `notifyTradeOfficeWhen` text so the condition itself is
guarded rather than only the shape.

What the spec still cannot do is catch a wording that is wrong, and that is worth saying plainly rather
than letting a green run imply more than it proves.

## Open before building: a successor version, or an edit in place

Writing this raised a question the card does not answer and I will not settle alone. SB-207's rule,
recorded in `prisma/research/README.md`, is **one successor per publish and never a rewrite
afterwards**: once a version is published, "that successor is history: the next correction gets its own
version, however small it is."

The federal `register-a-trade` version is published and live. So "the text gains the condition" as
written above quietly assumes an edit in place, and that may be precisely the rewrite the rule forbids.
The alternative shape is a successor version with a new `validFrom`, ending the current one, carrying
the corrected fact, which is what SB-204 and SB-207 each did for company formation.

My objection was that a successor implies the rule changed on the day of the publish, which would be
false about the world. **That objection is wrong, and the check answered it cleanly**: a version's range
is the product's *answer history*, not the law's effective period. Ending the current version on the
successor's `validFrom` records what this product told readers before the correction. It claims nothing
about §14.

**And the in place edit is not the conservative choice, it is the destructive one.** Checked at the
lines the answer cited rather than taken on trust: `sameVersion` in `load.ts` compares the page, the
end, the facts and the notes, and returns false on any difference; the load then collects every stored
version where `!sameVersion(stored, listed)` into `aside` and runs
`tx.ruleVersion.deleteMany({ where: { id: { in: aside.map(...) } } })`. So editing a fact's text in
place makes the loader **delete the published version and recreate it under the same identity**,
erasing from history the exact wording readers were served. That is the outcome I was trying to avoid,
arrived at by the route I thought was safer.

**So: a successor.** End the federal version at the successor's `validFrom` and add the corrected one
from that date. `inForceOn` is `validFrom <= day && (validTo === undefined || day < validTo)`, so the
range is exclusive at `validTo` and the two never both answer.

## Publishing

```bash
npm run research:publish -w @skipbureau/api -- src/rules/research/germany/business-registration.ts
```

It builds its commit through a temporary index and prints a `git reset -q -- <paths>` line that must be
run in the foreground before any commit, checkout or restore. That is the mechanism SB-381 documented
this afternoon, so there is no excuse for mishandling it here. The tree is clean and in sync with
`origin/main` before this starts, which is the state that makes the printed line safe to follow.

**One successor per publish** (SB-207): before publishing, look across the open cards that touch
`register-a-trade` and combine any editorial corrections that are already agreed into one successor,
because after the publish that successor is history.

## How it is checked

`research-rules.e2e.spec.ts` whole, never a `-t` filter, because this suite loads its data inside an
earlier test. The publish reports live through its own read-back. Then the deployed API itself: a
company founder's `register-a-trade` answer read before and after, requiring the condition to appear in
its facts rather than only in its note.

## The before reading, taken on the deployed API

A founder in Bavaria, a state with no city rule of its own, is served the federal facts alone:

```
lateOrMissingTradeNotificationFine | atMost | 1000 EUR | textValue null
notifyTradeOfficeWhen             | equals |               "at the same time as you start the business"
note (en-US): "This applies only if your activity is a trade under trade law. ..."
```

In Berlin the same two facts arrive with the local fees beside them. **And that is the sharpest
argument this card has, sharper than SB-263's precedent**: in one served answer, Berlin's fee facts
already carry their conditions inside their own text, "where Berlin's online procedure is available for
the legal form" and "for each sole trade, or each partner of a partnership; other legal forms can cost
differently", while the deadline fact that decides whether any of it applies carries none.

The conversation worded both, in the same turn, and it is that inconsistency the round is put to rather
than a claim that it overlooked the condition.

## What the plan check said

It answered the successor question against me and gave the better reason, recorded above with the
`load.ts` evidence I then verified. It corrected "no spec change expected" to false, and named the
`.find` fragility and the `inForceOn` idiom that fixes it. It showed the session map procedure to be
unsafe even when nothing is running, and gave the one shot resume instead.

It also settled the premise: the condition **does** belong in the facts. §14(1) makes the simultaneous
notice apply to somebody starting a standing trade, and §146 makes failing to give that §14 notice the
offence, so the concise fact level form is the statutory scope, something like "when you start a
standing trade", while the note keeps the explanation about who classifies what.

And it raised one thing this card had not considered: **the same scope governs the fine**, which my
plan left alone while changing only the deadline. That goes to the conversation as part of the round
rather than being decided here.

## The step I am least sure of

Whether the conversation agrees the condition belongs in the fact at all. It may answer that the note
is the right home, because the classification is not a condition on a figure but a prior question about
who the duty falls on, and that putting it in the deadline's text makes the deadline read as
conditional when it is not. If that is the answer, the card's premise is wrong, and the honest outcome
is to record it in the talk file and close this as answered rather than force the change through. The
wording is not mine to write either way.
