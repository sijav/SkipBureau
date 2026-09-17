# SB-441, Berlin's rule notes still tell a reader not to wait for an appointment

**Exit, as the card words it:** `BERLIN_NOTES` says what the agreed document says about who submits
Berlin's online application and what follows it, carries no sentence telling a reader they need not
wait for an appointment, and `research-rules.e2e.spec.ts` still passes.

This plan lives in `apps/api/src/rules/research/germany/` because that is where the string is. One
file changes.

## The card's own description is stale, and SB-357 is why

Filed this morning, it says the document "now enumerates four permit routes submitting the online
application while their current title is still valid". That was true when it was written. SB-357 then
put that paragraph through five rounds with the document's own conversation, and the valid title
condition was the thing those rounds kept finding wrong. So the target has moved, and the plan is
written against the document as it stands rather than as the card describes it.

The two defects the card names are untouched by that and still real.

## What is there

`residence-permit.ts:23`, published as the Berlin version's notes and reaching a reader through
`noted(winner, standing)` at `rules.service.ts:242` and the `notes` field on `rules.model.ts:86` and
`guide.model.ts:122`:

> In Berlin you apply online only, paying before you submit, **and an appointment follows a positive
> assessment**. Submit the application through **the dedicated online application** before your
> current permission expires; **you do not need to wait for an appointment**.

Two sentences that contradict each other, inside one paragraph.

- **"you do not need to wait for an appointment"** is false, and the sentence before it in the same
  string already says the true thing.
- **"the dedicated online application"** is the class claim SB-174's check refused and SB-184
  removed from the document by naming the routes: four pages naming one form prove the form for
  those four services, not a class.

**Missed twice, by two cards that each touched half of it.** `d40403c` (SB-184) changed only the read
dates in this file. `58ecd8f` (SB-370) touched only `apps/api/src/guide/researched-guides.ts`.

## Why nothing caught it, and what this plan will NOT do about that

Nothing compares this prose to the document it says it was written from. `guide.e2e.spec.ts`
exercises notes through the API, which is behaviour rather than content. `researched-guides.spec.ts`
compares the GUIDE's text to the document, which is why SB-357's corrections turned it red, and it
says nothing about notes.

**The plan first cited the wrong test here, and the check caught it.** It named
`research-rules.e2e.spec.ts:479` as the round trip covering these notes. That line round trips a
TURKISH health insurance note, not `BERLIN_NOTES`, and the German residence permit test checks the
facts the API serves rather than its notes. So the conclusion stands and is in fact stronger than
written: nothing round trips this string at all. Worth correcting rather than quietly leaving, since
a plan that cites the wrong evidence for a right conclusion teaches the next reader to trust a test
that is not doing the job.

**A test tying notes to the document is not in this card.** It would be a new gate, and CLAUDE.md is
explicit: never invent a gate the owner did not ask for. The card's exit asks only that the existing
suite still passes. That the hole exists is worth telling the owner in the reply, and his to decide.

## What changes, and the judgement in it

A rule version's note is a short procedural summary shown beside an answer. It is not the guide's
prose, and the document's paragraph is now long: three routes with a two branch lawful stay
condition, a Schengen C visa exclusion, a four month earliest filing rule, and a fourth route whose
condition is set by two different nationality groups.

**So the note is corrected, not expanded into the paragraph.** It drops the two false claims and
keeps its own register:

- the class claim goes, replaced by the application's actual name, which the document quotes
- "you do not need to wait for an appointment" goes, because an appointment follows a positive
  review, which the string's own first sentence already says
- what stays: online only, payment before submission, the appointment following review, the 4 to 6
  week card, the extra evidence Berlin lists, the €56 sticker note, the emergency route, and the
  closing line that these are differences in procedure rather than eligibility

**That is a judgement, not a rule**, and the check ruled on it: keep the note a procedural summary.
The visa-free, Schengen and nationality-route analysis is outside this version, which is already
scoped to Berlin plus a national D visa or residence permit, so importing it would describe routes
this rule does not answer for.

**But the check named the trap, and it is the one I would have walked into.** If the note keeps any
instruction about WHEN to submit, it must carry Berlin's "no earlier than four months before expiry"
limit, or drop timing altogether. "Before your current permission expires" on its own is true and
incomplete in the direction that costs a reader something: it sends them to apply too early, to a
page that will not take the application. Meeting the appointment half of the exit while leaving that
in place would satisfy the card's literal words and still publish a materially incomplete
instruction.

So the corrected note keeps the appointment following a positive review, and on timing either states
both bounds or states none. It does not say "before expiry" alone.

## The name is not unique, which is a trap worth naming

`BERLIN_NOTES` also exists at `germany/business-registration.ts:29`, a different document's note. Both
are file local consts, so nothing collides, but a search and replace on the name would edit the wrong
research. The edit is anchored in `residence-permit.ts`.

## Files

`apps/api/src/rules/research/germany/residence-permit.ts`, and this plan.

## How it is proved

- **`research-rules.e2e.spec.ts` passes**, which is the exit's own condition. It round trips, so it
  proves the loader still publishes what the file says, not that the file is right.
- **The false sentences are gone**, checked by searching the file for them rather than by reading
  past them: the string must contain neither "do not need to wait for an appointment" nor "the
  dedicated online application".
- **Planted.** Put one of the false sentences back and the search must find it, so the check is
  watched failing rather than assumed.
- This is a card with no parent, so it closes on the full suite, plus lint and the type checker.
