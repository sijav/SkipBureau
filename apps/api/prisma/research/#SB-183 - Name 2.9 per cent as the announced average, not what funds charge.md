# SB-183, name 2.9 per cent as the announced average, not what funds charge

**Exit:** `research/agreed/germany/health-insurance.md` names 2.9% as the average additional rate announced for 2026
and 8.75% as an illustration at that rate, the change is recorded in `talk/germany/health-insurance.md`, and its
fixed-point turn comes back clean.

## What is wrong

Under **What it costs**, the agreed document says the general rate is 14.6% "plus an additional contribution each fund
sets for itself; the official 2026 average is **2.9%**", and that employer and employee split both "giving **8.75%
each** at the official average". In a passage about what a reader will pay, that reads as the rate they will be
charged.

Two pages of the Ministry, both already cited by this document, say otherwise when read together:

- `/beitraege/seite`, the footnote behind 2.9% today: "Für das Jahr 2026 beträgt der durchschnittliche
  Zusatzbeitragssatz 2,9 Prozent." That is the rate **announced** for the year, which the Ministry sets ahead of it.
- `/finanzierung-gkv`, already cited for the half-each split, read today: "Im Durchschnitt liegt der derzeit von den
  Krankenkassen erhobene Zusatzbeitragssatz bei **3,13 Prozent** (Stand 1. April 2026)." That is what the funds
  **actually charge**.

So a reader told 2.9% expects to pay about that, and pays more. This is the confident half-truth the research exists
to prevent, and SB-174's own sign-off missed it.

## The change, through the conversation

The owner's order of 2026-09-12 is that research goes through the conversation, one case, resumed. So:

1. **The turn**: `research.py ask --case germany/health-insurance`, proposing the corrected sentences and a new
   definition for the charged average, quoting the page as read today, and asking the one question the fixed-point
   turns ask: does anything left claim more than its evidence supports. Its wording is taken where it keeps the
   meaning, per the owner of 2026-09-15, and fixed only where it is wrong.
2. **The document**: 2.9% is named as the average the Ministry **announces ahead of the year**, the charged average
   is named beside it as **what the funds were charging on 1 April 2026**, with its own verified definition
   `[^bmg-charged-average-2026]` on the financing page, and 8.75% becomes **an illustration at the announced rate**
   rather than a rate anybody will be charged. Neither average is a reader's own rate, and no new typical charge is
   derived from 3.13%.
3. **The self-employed minimums move with it**, which the first draft of this plan left alone and its check refused:
   €222.80 and €230.71 are computed at 2.9% on the Ministry's own table, which says so and says a fund's rate can
   differ, so they are named as illustrations at the announced rate too. Leaving them would keep the same half-truth
   in the same passage and would not survive a fixed-point turn.
4. **No second source, and no changed formula.** The guide's source list dedupes by page and follows definition
   order, and the financing page is already cited, so its position does not move; 8.75%'s calculated definition keeps
   its inputs and its formula, `(14.6 + 2.9) / 2`, since only the prose around it changes.
5. **The transcript** records the turn, which `research.py` writes. It does not judge the answer: the fixed point is
   established by reading what came back, not by the script exiting zero.

## What else moves, and what does not

- **The guide entry moves with the document, in this same change.** `researched-guides.ts` carries those sentences
  verbatim in de/health-insurance's What it costs section. The check corrected the first draft here: that entry is
  literal data, not something a script regenerates on load, and the spec only reports the disagreement. So the entry
  is updated with the document, by the same extractor run that produced it, and the spec is watched failing with the
  old entry first.
- **The rules data does not move here.** `src/rules/research/germany/health-insurance.ts` deliberately holds back the
  2.9% average and what is computed at it until this card closes (SB-226's note). Writing those facts and publishing
  them is its own card, filed when this one closes, because a fact in the rules data is a different thing from a
  sentence in a document and has its own live proof. When it is written, the check's line holds: the announced
  average may be a fact named as announced, an 8.75% may only ever be an illustration, and **3.13% must not become a
  reader's answer**, being a dated aggregate rather than anybody's fund rate.

## How it is checked

- The fixed-point turn answers that nothing claims more than its evidence supports, recorded in the transcript.
- `test/researched-guides.spec.ts`: the regenerated entry is the document's sentences, and its sources are the pages
  its shown sentences cite, in definition order. Watched failing with the entry left as it was.
- The API's lint, type checker and suite.
- Pushed; the live German health insurance guide's What it costs paragraph reads as the document does, in en and fa.

## Checked on 2026-09-16, and revised

Revise before building, and five corrections are taken. The self-employed minimums carry the same half-truth and are
changed here rather than left, which the first draft's "the rest stays as it is" would have preserved. 8.75% keeps its
formula and inputs; only the prose around it becomes illustrative. No second source entry is added, since the guide's
source rule dedupes by page and the financing page is already cited. And the claim that the guide entry is regenerated
on load is wrong: it is literal data in `researched-guides.ts`, so it is updated in this same change with the spec
watched failing first.

It also settled what the pages license, which is the thing that matters: 2.9% is the rate the Ministry announces
ahead of the year, 3.13% is what the funds were charging on 1 April 2026, and neither is the reader's own rate, so no
new typical charge is derived from either.

## What I am least sure of

- Whether the guide should carry both numbers or only the announced one with a caveat. Both is more honest and longer;
  the conversation is asked which a reader is better served by.
- Whether "announced" is the right English for what the Ministry does, since it sets the figure by decree ahead of the
  year rather than predicting it.
