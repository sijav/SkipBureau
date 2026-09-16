# SB-207, Limited company formation reaches only a reader starting a company

**Exit:** on the deployed API, a reader who says they are starting a company is told
`form-a-limited-company` with its four facts, a reader who has not said is asked for their situation,
a student is not told it, and the national version stays in the history with its end date.

## What is wrong

`form-a-limited-company` is a national version with `criteria: []`, so the move answer tells **every**
reader arriving in Turkey to form a limited company. A student is told to form a company they have no
reason to form, while the duties that follow registration, which SB-196 scoped, first ask the reader
what they are doing. The owner, 2026-09-14: what is shown follows what the reader needs.

## The date, which is the real decision here

SB-204 published a successor for this obligation **today**, 2026-09-16, with `criteria: []`. So this
card ends a version that is one day old, and the date it ends on decides whether the history stays
honest.

- **Ending it today and starting the scoped version today** gives it `validFrom = validTo =
  2026-09-16`. `daterange` reads that as EMPTY and the resolver keeps versions where `validTo > at`,
  so a version that was published, deployed and read back through the live API would have been in
  force on **no day at all**. The history trigger permits it, since a started version may be closed
  with `validTo >= current_date`, but permitted is not the same as true.
- **Ending it tomorrow**, `validTo: '2026-09-17'`, with the scoped version starting 2026-09-17,
  leaves SB-204's version in force for the whole of the day it was actually served. The history then
  reads: 14 to 15 September the old fee key, 16 September the corrected key unscoped, 17 September
  onward the corrected key scoped to a founder. Every row is true.

**Tomorrow, and the exit is still met today**, which is the part I checked rather than assumed:
`rules.resolver.ts:32` declares `@Args('at', { type: () => String, nullable: true })` and line 59
resolves `at ? new Date(at) : new Date()`. The deployed API can be asked for any day, so a version
that starts tomorrow is live-verifiable now.

**The publish will not verify it for me.** `publish-research.ts:687` asks only versions
`inForceOn(version, today)`, with its own comment that the deployed resolver answers nothing else
today. A future-dated version is skipped silently, no failure and no proof, so the live check for
this card is mine to run against the deployed API with `at: '2026-09-17'`.

## What changes

`src/rules/research/turkey/company-formation.ts`:

- a constant for the new day beside `READ` and `ENDED`;
- SB-204's successor gains `validTo` of that day, and nothing else about it changes;
- a third version, `validFrom` that day, `criteria: FOUNDER`, the same source, labels and four facts,
  which is the existing constant `[{ dimension: 'situation', value: 'company-founder' }]` that every
  other founder-scoped version in this file already uses.

`test/research-rules.e2e.spec.ts`:

- **`MOVE` and `Asked` gain `at`.** They cannot express this case today: the query takes
  `residenceStatuses, nationality, situation, locale, toResidenceRegions` and no date, so a version
  starting tomorrow cannot be asked for at all. `expectedOf` already takes a day, so only the query
  side is missing.
- the assertion at line 351 stays true for **today**, where the unscoped version still answers, and a
  new assertion covers the scoped version with `at` set to its first day: a founder is told it with
  its four facts, a reader who has not said is `needsDetail` on `situation`, and a student is not
  told it at all.

## What the check answered, and the one thing it caught that I had missed

**The note stays.** "Forming a limited company, the same everywhere in Turkey" already opens with the
condition that matters: unlike the five post-registration duties, which each turn on a separate legal
trigger and must say so, the act here IS the scope. A rewrite would add no accuracy. So no pass
through Turkey's research conversation, which is the difference between this card and SB-204.

**`at` goes on the shared `MOVE` query and `Asked`.** It is a real public resolver argument that
defaults to today when omitted, and the helper every test shares should be able to ask anything the
API can answer. A second near-duplicate query would make the future-dated case exceptional for no
gain.

**The guide, which my plan ignored entirely.** This obligation is linked from the company-formation
guide: `obligation-groups.ts:24` lists `['form-a-limited-company']` inside `TURKEY_COMPANY_FORMATION`,
and that is also why `factLabels.test.ts` demands a label for its facts. `guide.service.ts:532`
resolves `version ? ObligationResolution.general : ObligationResolution.contextRequired`, so from the
day the scoped version takes over, the guide asked with **no reader** stops showing four facts and
becomes `contextRequired`; asked for a founder it answers; asked for a student it does not. That
follows the product rule the card is built on, and the check asked for it to be asserted rather than
discovered.

**It cannot be asserted for this obligation, and that is worth stating precisely rather than
quietly skipping.** The guide query takes `($country, $slug, $reader)` and no date, and
`guide.resolver.ts` exposes no `at` among its arguments, though `guide.service.ts:408` accepts one
internally. So no test and no live check can ask the guide what it will say on 17 September. Putting
a date on the public guide API is a change well outside this card, whose exit is written entirely
about the move answer.

What is true instead: **the flip is already guarded generically**, at `guide.e2e.spec.ts:316`, "an
obligation with only a scoped version asks for context rather than guessing", which asserts
`resolution: 'contextRequired'` and empty facts on its own fixtures, with the reasoning that one
student-only rule is not a general answer just because it is the only record. That is this exact
behaviour, proved once for every obligation rather than per obligation. The gap that remains, that
the guide cannot be asked for a day while `move` can, is filed rather than carried here.

**A correction I owe the check.** I told it `contextRequired` does not exist in this codebase. It
does, at `guide.model.ts:77`, and I said otherwise because I had grepped for `needsDetail` and read
the file from below the enum. Correcting a reviewer on a name that is right there is the same false
confidence as accepting one that is wrong, pointed the other way.

## The rule this pair of cards earns, recorded where publishing is described

This obligation is getting its third version in two days and two of the three transitions are
editorial. The check's answer to what should stop that happening again, which goes into
`prisma/research/README.md` under "A research is finished when it is live (SB-232)":

> Before a research publish, look for open cards touching the same obligation, and combine approved
> editorial corrections into one successor where they share a source and an effective date. After the
> publish, never rewrite that successor: the next correction gets its own version.

It is publishing guidance and not something a reader is ever told, so it goes in the README and not
in any note.

## How it is checked

SB-207 is a child of SB-190, so it closes on the tests covering what it changes:
`research-rules.e2e.spec.ts` whole, plus lint and the type checker. Then the publish, and then the
live check with `at`, which the publish does not perform: ask the deployed API for 2026-09-17 as a
founder, as a student, and with no situation given.
