# SB-225, Germany's first residence permit for employment

**Exit:** on the deployed API, a reader holding a national D visa who has said they live in a Land with
no rule of its own, such as Brandenburg, is told what applying before it expires preserves, a reader on a
C visa is not told that protection, and a reader in Munich is told Munich's published wait, each fact
naming its official page. The resolver asks a reader who has not said where they live before it answers,
because Berlin's and Munich's rules add facts, so the D visa holder of the exit has said where.

## Why

A reader who applies late, travels on the wrong certificate or waits for an appointment they do not need
can lose their right to stay or to work, and the agreed research says which protection each status has.
The owner's order of 2026-09-15: written as its own data file and published with the research script
(SB-232), read back live, before anything else starts.

## What the agreed document supports, and what it does not

A fact reaches a reader only on a verified definition of its agreed document, on the page and the day
the file names; `test/research-rules.e2e.spec.ts` reads every label back. `agreed/germany/residence-permit.md`
verifies, read 2026-09-14:

- `aufenthg-81-4-before-expiry`: §81(4) AufenthG, applying before a residence title expires keeps it in force until the decision;
- `berlin-online-before-expiry`: Berlin's §18b page, the online application's confirmation certifies that a national D visa or
  residence permit stays valid, and not a Schengen C visa or a title already expired;
- `berlin-card-4-to-6-weeks`: the same page, the electronic card is ready 4 to 6 weeks after issuance;
- `berlin-emergency-four-weeks`: Berlin's appointment page, an emergency is travel within four weeks, shown by a booking;
- `munich-up-to-seven-months`: Munich's §18b page, processing takes up to seven months.

Not written:

- **The fee.** `aufenthv-45-first-permit-fee` verifies §45 AufenthV's 100 euro for granting a residence
  permit, but Berlin's and Munich's §18b pages list 27.60 or 46 euro for a Turkish citizen entitled under
  the EEC-Turkey association law, and an extension or a change of purpose costs less than a grant. A fact
  that the fee equals 100 euro for every D visa holder would be false for those readers, and no definition
  states their rates, so the fee waits for SB-240, which researches it with its reductions and writes both.
- **§81(3) and §41.** What §81(3) protects during a visa-free stay, and which nationalities §41 names so that
  the ninety days of `aufenthv-41-ninety-days` reach a reader, have no definition: SB-234 researches them.
- **§45b's 44 euro**, which applies only to the exceptional format of §78a; the €56 Berlin quotes is explained
  in Berlin's note, as the agreed document explains it.
- **Munich's online-or-post**, which has no definition and stays in Munich's note.
- **Other titles §81(4) covers.** It covers every residence title, an EU Blue Card, an ICT card or a
  settlement permit among them, but the agreed document and Berlin's page say it for a national D visa and a
  residence permit, so only those holders are answered; the others are left unanswered, not told they are
  unprotected.

## The case file

`src/rules/research/germany/residence-permit.ts`, exporting `CASE`, composed after Anmeldung in `germany.ts`.

**Obligation.** `get-a-residence-permit-as-a-skilled-worker-with-a-degree`, kind `permit`, "Get a residence
permit as a skilled worker with a degree". Both city pages are §18b pages, and a city's wait or procedure
for that permit is not a fact about every permit for employment. Its own slug keeps the seed's sample
`get-a-residence-permit`, whose German row is for EU citizens, out of its answers, as Turkey's
`get-a-short-term-residence-permit` does.

**Statuses**, three, each with nothing above it: `de.national-visa`, "National visa (D visa)";
`de.residence-permit`, "Residence permit"; `de.schengen-visa`, "Schengen visa (C visa)". No version names
the last: it exists so a reader on a C visa can say so, and the resolver refuses a status code that is no
row while it answers one no rule names with nothing for this obligation. Kept flat so that SB-240 can add
the D visa holder's fee to that status's versions alone without a parent status's versions beside them.

**Sources**, each named as the page names itself, read 2026-09-15: "Aufenthaltsgesetz (AufenthG), § 81
Beantragung des Aufenthaltstitels"; "Service Berlin, Aufenthaltserlaubnis für Fachkräfte mit akademischer
Ausbildung beantragen"; "Landesamt für Einwanderung Berlin, Termin vereinbaren"; "Landeshauptstadt München,
Aufenthaltserlaubnis – Fachkräfte mit akademischer Ausbildung".

**Versions**, all from 2026-09-14, three for each of `de.national-visa` and `de.residence-permit`, the same
for both. A city's version carries its status, so it narrows the status's federal version by place alone
and takes the facts it does not state from it; a status version with no place beside a city version with
another status criterion would be neither more specific than the other, and the answer `needsReview`.

1. **Federal**, on §81, label `aufenthg-81-4-before-expiry`: `currentTitleWhileDeciding` equals "stays valid,
   if applied for before it expires" on §81. Notes: the agreed sentences on who decides and on §81(4), what
   continues and what does not for work and travel.
2. **Munich**, residenceRegion `DE-BY.muenchen`, on Munich's page, label `munich-up-to-seven-months`:
   `processingTime` atMost 7 months. Notes: Munich's column of the agreed table.
3. **Berlin**, residenceRegion `DE-BE`, on Berlin's page, label `berlin-online-before-expiry`:
   `cardReadyAfterIssuance` atMost 6 weeks, label `berlin-card-4-to-6-weeks`;
   `onlineConfirmationKeepsTitleValid` equals "until the decision, if submitted before it expires", label
   `berlin-online-before-expiry`; `emergencyTravelWithin` within 4 weeks on the appointment page, label
   `berlin-emergency-four-weeks`. Notes: Berlin's column, the 4 to 6 weeks in full, the €56 explained, and the
   agreed paragraph on appointments.

So a D visa or residence permit holder who has said they live in Brandenburg is told that their title stays
valid if they apply before it expires; one in Munich also up to seven months; one in Berlin also Berlin's
three; a C visa holder nothing for this obligation; and a reader who has not said what they hold, or where
they live, or has said only Bavaria, is asked.

## Publishing, and the spec that follows

The case is published with `npm run research:publish -w @skipbureau/api -- src/rules/research/germany/residence-permit.ts`,
which commits it with `germany.ts` and the research documents, waits for the deployed digest and reads each
version back as the reader it reaches; its reset line is run when it reports. A spec written first would
fail on the commit before the data exists, and the publish refuses to push beside an uncommitted spec, so
the resolver test comes after the publish, in its own commit, reading its expectations from the file:

- a reader holding each status a federal version names, in a Land no rule names, is told that version's facts;
- a reader holding it in a place outside Munich inside Bavaria is told the federal version's facts, and one
  who has said only Bavaria, or nothing about where they live, is asked for the place;
- a reader in each place a version names is told that version's facts and the federal ones it inherits;
- a reader on `de.schengen-visa` gets no answer for the obligation.

The existing label test covers every new label from the publish's own checks.

## Files

`src/rules/research/germany/residence-permit.ts`, `src/rules/research/germany.ts`, and after the publish
`test/research-rules.e2e.spec.ts`; this plan.

## The steps I am least sure of

1. **Six versions for two statuses, the same facts for both**, so that each city version narrows its own
   status's federal version by place alone, and so SB-240 can give the D visa holder's versions a fee.
2. **A permit guide with no fee** until SB-240, which a reader may read as free; the notes do not say it is.
3. **Titles §81(4) covers that are left unanswered**, an EU Blue Card holder among them.
4. **`atMost 6 weeks` for "4 bis 6 Wochen"**, with the lower bound in the note.

## How it is checked

tsc, lint and the research specs, then the full API suite, the task having no parent task. Planted: a
version label changed to the calculated `federal-sticker-fee-56`, which the label test must refuse. Live:
the publish's read-back of the six versions, then a direct query of the deployed API for a D visa holder in
Brandenburg, in a Bavarian place outside Munich, in Munich and in Berlin, a residence permit holder in
Brandenburg, and a C visa holder in Brandenburg, each fact's page named; then the resolver test committed
and the suite run again.
