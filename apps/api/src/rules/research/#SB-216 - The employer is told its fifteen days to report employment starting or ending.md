# SB-216, The employer is told its fifteen days to report employment starting or ending

**Exit:** on the deployed API, a reader starting a company is told
`report-employment-starting-and-ending` with its fifteen days and notes opening with the
employer's duty, and a worker is still told it.

## Why

`report-employment-starting-and-ending` has one version, scoped `situation: worker`. Law 6735
Article 22(1) puts the duty on the **employer**, or on a foreigner holding an indefinite or
independent work permit, and the agreed document already says so: "That fifteen days is the
**employer's reporting duty**". So does the note the version already serves, which opens "For the
employer, or a foreigner holding an indefinite or independent work permit".

The wording is right and the **scope** is wrong. A founder who employs a foreigner is never told
a duty that is theirs, and a worker is told one whose own first clause says it belongs to someone
else. The fifteen-day report is what keeps the worker's permit alive, so the employer missing it
is the harm.

## What changes

A `FOUNDER` constant in `turkey/work-permit.ts`, as `company-formation.ts` already has, and a
second version of the same obligation scoped to it: same source `internationalLabourLaw`, same
label `law6735-22-1-fifteen-days`, same fact `reportWithin within 15 days`.

**The two versions take different notes.** The plan first gave them the same text; the check
answered that each reader should be addressed directly, and supplied both, which are taken as
given because they keep the meaning:

> **Founder.** For the employer: tell the Ministry within fifteen days when work under a foreign
> employee's permit or exemption starts or ends, or when cancellation is required. This is your
> reporting duty.

> **Worker.** For a worker: your employer must tell the Ministry within fifteen days when work
> under your permit or exemption starts or ends, or when cancellation is required. If you hold an
> indefinite or independent work permit, you have that reporting duty yourself.

**So one version is added and one is rewritten**, which corrects both the card and this plan's
first draft. The card says "both are new versions"; they are not, the worker's is deployed. This
plan then said none is changed, which stopped being true the moment the worker's note was
rewritten: `sameVersion` compares notes, so that row steps aside and is written again **under the
same key**, keeping its obligation, criteria and `validFrom`. That is a wording correction, not a
change in the law, which is the decision SB-263 made and SB-213 and SB-215 followed.

`WORKER_DUTIES` in the spec asserts the worker's note opens with
`For the employer, or a foreigner holding an indefinite or independent work permit`, so that
expected opening moves to `For a worker` with the note itself.

## Why two versions of one obligation is safe, read rather than assumed

- **The write is allowed.** `skipbureau_rule_versions_do_not_overlap` refuses a second version
  only when the two criteria sets are identical, by a pair of `EXCEPT` clauses; `worker` and
  `company-founder` differ, so both may be in force.
- **A reader who has not said their situation is still asked.** In `rules.service.ts` both
  versions are open on `situation`, so `winners`, which takes only candidates with
  `open.length === 0`, is empty; `matters` begins `const [only] = winners; if (!only) return true`,
  so every open version counts and `needs` is `['situation']`. That is exactly today's answer and
  the existing assertion keeps holding.
- **A reader who has said is given one.** `fitToProfile` contradicts the version whose situation
  is not theirs, and `if (fit.contradicted) continue` drops it before resolution, so a worker is
  answered from the worker's version and a founder from the founder's. This said "a worker sees
  today's answer and note unchanged", which stopped being true when the notes were split: the
  worker's answer and facts are unchanged, and their **note was rewritten** to address them
  instead of describing the employer's duty in the third person. Its meaning survived; its text
  did not. Corrected here after SB-216's roast caught the sentence.
- **Neither version completes the other.** `scopeOf` is equal for both, one non-place criterion,
  and `strictlyCovers` is false in both directions between differing values of one dimension, so
  `answerOf`'s chain is empty for each and `mostSpecific` never returns both.

## The tests

`research-rules.e2e.spec.ts` has `COMPANY_DUTIES`, a table of the duties a founder is told with
the condition each note must open with, and `toldInSituation` asserts the facts, the note, the
`needsDetail` for a reader who has not said, and that a student is told none. The obligation joins
that table.

**One hole has to be closed first.** `factsOf(slug)` is
`TURKEY.versions.find((version) => version.obligation === slug)`, the first version of that
obligation, and `toldInSituation` asserts a reader's facts equal it. With two versions it silently
takes one. Today both carry the same single fact, so the assertion would pass **for the wrong
reason** and would keep passing if the two ever stated the fifteen days differently.

The first plan said to give `factsOf` the situation. **The check refused that as insufficient**,
and it is right: `toldInSituation` takes the first version by slug for the expected **note** as
well as for the facts, so a situation-aware `factsOf` would still leave the note assertion reading
whichever version comes first. So `toldInSituation` now finds the version by the slug **and
the situation it is scoped to**, and asserts both the facts and the note from that one version.
That catches a wrong founder criterion, diverging facts and diverging text, and it encodes no
assumption about how many versions an obligation has.

The check asked for the match to be on the version's **full criteria**; matching on the situation
is exactly that here, because every duty in both tables has the situation as its only criterion,
which was checked rather than assumed. If a duty ever carries a second criterion, that lookup
stops being exact and has to take the whole set.

Planted: the founder version's criteria switched back to `WORKER`, which must fail the founder
case; and a changed fact on one version alone, which must fail only the reader that version
serves and leave the other passing.

## What this card does not do

`TURKEY_COMPANY_FORMATION` in `obligation-groups.ts` does not list this obligation, so the company
formation **guide** will not link it; only the rule answer changes, which is what the exit asks
for. Whether a founder should also meet this duty on that guide is a content decision about what
the guide covers, not a scoping bug, and it is raised with the check rather than smuggled in here.

## Publishing and the live proof

```bash
npm run research:publish -w @skipbureau/api -- src/rules/research/turkey/work-permit.ts
```

The spec change is a build input the publisher refuses to carry, so it is committed first, as
SB-213 and SB-215 both had to be. No rendered page changes, since no guide links this obligation
and no document prose moves, so the Pages sequence SB-215 needed does not arise: the live proof is
the deployed API answering for a founder, for a worker, and for a reader who has said neither.

## The steps I am least sure of

**Whether the two notes should differ.** The exit only asks that the founder's note open with the
employer's duty, and the existing note already does, so the simplest change gives both versions
the same text. The reason to differ is that each reader is then addressed directly, the founder as
the employer and the worker as the person whose permit depends on it. The reason not to is that
two nearly identical notes drift apart.

**Whether `factsOf` taking a situation is enough**, or whether the helper should key on the
version's full criteria, which is what actually distinguishes them.

## How it is checked

SB-216 came out of SB-193's roast, so it is a child: the tests covering the files it changes,
`research-rules.e2e.spec.ts`, plus the API's lint and `lint:tsc`. Then the planted cases watched
failing, the publish reporting live, and the deployed API asked for all three readers.
