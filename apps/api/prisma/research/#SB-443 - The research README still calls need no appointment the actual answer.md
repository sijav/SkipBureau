# SB-443, the research README still calls "need no appointment" the actual answer

**Exit, as the card words it:** `README.md` carries no sentence calling "need no appointment" the
actual answer, and the list entry that did says what the pass established, that an appointment
follows a positive review.

This plan lives in `apps/api/prisma/research/` because that is where the file is. One sentence
changes.

## Where this came from

SB-357's task roast, which found it after five rounds had corrected the same claim everywhere else.
Verified here at the source line before filing, and the reviewer's line number was one out, which is
why it was read rather than taken.

## What is there

`README.md`, in the list of things the sign-off pass has caught:

> - an instruction to plead an emergency for a Berlin appointment, when the
>   **actual answer is that you apply online and need no appointment**;

Berlin's own pages say the opposite, and the agreed document and the published guide now say so too:
once the application is reviewed positively, you receive an appointment to attend in person.

**So this file presents a disproven claim as a success story**, in the list that exists to show what
the checking process is worth, to exactly the reader who came to learn what it is for.

## The fourth survival, which is the part worth naming

That sentence has now outlived three corrections:

- **SB-184**, which rewrote the document's Berlin paragraph and changed only the read dates in the
  research file.
- **SB-370**, whose commit touched only `apps/api/src/guide/researched-guides.ts`.
- **SB-357's own preamble fix**, which corrected the agreed document's opening and appended a
  paragraph to this README explaining the five rounds, without touching the earlier list.

Each looked where it expected the claim to be. None searched for the claim itself. That is the
pattern this card is really about, and it is cheap to close for good: search the repository for the
wording, not for the place.

## What changes

The list entry keeps its shape, because the entry is still true in its point: the draft did tell a
reader to plead an emergency, and the pass caught it. What changes is the correction it names. It
should say what the research actually established, that you apply online yourself and the appointment
follows the LEA's positive review rather than standing between you and applying.

## What does NOT change

The paragraph added by SB-357 lower in this file, which quotes the false wording deliberately in
order to correct it. Quoting an error to name it is not asserting it, and rewriting that quote would
destroy the record of what was wrong.

## How it is proved

- **The phrase is gone**, by searching the file for it rather than by reading past it: after the fix,
  "need no appointment" must appear **nowhere** in the file, zero occurrences.

  **Stricter than this plan first said, and checked rather than assumed.** It first allowed the
  phrase to survive inside the paragraph SB-357 added, on the grounds that quoting an error is not
  asserting it. That exemption is unnecessary: searching the file shows line 68 is the only place the
  phrase occurs, because SB-357's paragraph quotes the error in different words, "not need to wait
  for an appointment at all". An exemption nobody needs is a hole in a check, and this check is the
  only thing covering the file.
- **Planted.** Put the phrase back and the search must find it, so the check is watched failing
  before it is trusted. Restored from a copy, not by `git checkout`, which would discard this plan.

  **And the plant runs in its own command, which the first attempt got wrong.** That attempt put the
  repository wide audit and the plant and restore cycle in one command. The audit walks `.git` and
  `dist` even when its output is filtered, took longer than the two minute limit, and was moved to
  the background, which meant the restoring trap could not fire until a scan of unknown duration
  finished. It happened to be harmless, because the scan had not reached the plant yet when this was
  noticed, but the shape is wrong: a step that leaves a file mutated must never sit behind something
  slow in the same command. Audit first, on its own; then plant, check, restore, in a command that
  does nothing else.
- **Nothing tests this file.** `publish-research.spec.ts` mentions `README.md` only inside command
  strings for its reset notice; no test reads its prose. So the search IS the check, which is why it
  is planted rather than assumed.
- **The repository wide audit, run as an audit rather than as the proof**, on the plan check's
  advice: it was right that the acceptance test should stay file scoped, because rewriting a file
  that quotes the error deliberately would destroy the record rather than fix an assertion.

  **What it actually found differs from what both of us expected, and the difference is worth
  keeping.** The phrase now survives in exactly two places: this plan, which quotes it in its title,
  its exit, the error it names and the proof phrase; and `.claude/todo.db`, as the text of the cards
  describing it. The check predicted that talk files would also carry it. They do not: the talk file
  records the error in different words, "not need to wait for an appointment at all", so it was never
  a survivor of this phrase at all. The README was the only live assertion, and it is now corrected.

  That matters beyond tidiness. The card's whole premise is that a claim hides in places nobody
  looks, so an audit that assumed where the copies were would have repeated the mistake it exists to
  catch. Searching for the wording found fewer copies than either of us guessed, which is the answer
  only a search can give.
- This card has no parent, so it closes on the full suite, plus lint and the type checker, even
  though it changes only markdown: the research README is hashed by the publish script, and a
  surprise there is exactly what a full run would catch.
