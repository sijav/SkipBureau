# SB-240, Research Germany's residence permit fee with its reductions, Turkish citizens' association rates first

**Exit:** on the deployed API, a national D visa holder of a nationality with no reduction is told the 100 euro,
a Turkish citizen entitled under the association law is told the fee the official pages state for them, and a
residence permit holder changing purpose is told that fee, each fact naming its official page.

## Why

A reader told nothing about what the permit costs budgets wrong, and a Turkish citizen moving to Germany, one of
the routes this product exists for, must not be told 100 euro where the official pages list a lower fee for them.
SB-225 left the fee out for exactly that reason: its verified 100 euro would have been false for Turkish citizens.

## What the pages say, read 2026-09-15 to ask exact questions

- **§45 AufenthV**: the grant of a residence permit, a Blue Card or an ICT card costs 100 euro whether it runs
  for up to a year or longer (Nr. 1); an extension 96 euro for up to three months more and 93 euro for longer
  (Nr. 2); "die durch einen Wechsel des Aufenthaltszwecks veranlasste Änderung der Aufenthaltserlaubnis
  einschließlich deren Verlängerung" 98 euro (Nr. 3).
- **§45b**: the fee falls by 44 euro when the title is issued as a sticker under §78a(1) sentence 1 AufenthG, the
  exception to the electronic card. The agreed document already verifies this and Berlin's 56 euro.
- **§52a(1)**: "Assoziationsberechtigte" are foreigners "für die das Assoziationsrecht EU-Türkei ... Anwendung
  findet". **§52a(2)**: for them the fees of §§44 to 45 are "eine Gebühr in Höhe der für die Ausstellung von
  Personalausweisen an Deutsche erhobenen Gebühr", and "Wird der Aufenthaltstitel für eine Person ausgestellt, die
  noch nicht 24 Jahre alt ist", the rate for a German of that age. **§52a(3)** exempts them from §45b's sticker fee.
- **§1(1) PAuswGebV**: an identity card costs 27.60 euro when its holder "im Zeitpunkt der Antragstellung noch nicht
  24 Jahre alt ist", and 46 euro in all other cases.
- **§49(2) AufenthV** charges a processing fee in the amount of the fee, and **§69(7) AufenthG** says "Die Gebühr
  ist auf die Gebühr für die individuell zurechenbare öffentliche Leistung anzurechnen" and that it is not repaid
  when the application is withdrawn or refused. So it is paid up front and counts towards the fee, not on top.
- **§69(6) sentence 3 AufenthG** allows surcharges for nationals of a state that charges Germans higher fees.
- **§47(1)**: a Fiktionsbescheinigung 13 euro (Nr. 8); the accelerated skilled worker procedure under §81a
  AufenthG 411 euro (Nr. 15). **§52** exempts or reduces fees for, among others, refugees and subsidiary protection
  holders (3), holders of a public scholarship (5); **§53** for people who cannot live without SGB II, SGB XII or
  asylum seekers' benefits; **§54** leaves international agreements untouched.
- **Berlin's §18b page** ("Gebühren"): 56 euro first issuance as a sticker, 49 euro extension as one, 100 euro
  first issuance as an electronic card, 93 euro extension as one, 27.60 euro "für Türkische Staatsangehörige bis
  zum vollendeten 24. Lebensjahr für die erste Erteilung / für die Verlängerung", 46 euro from the 24th birthday,
  and 6 euro more for a photo at the self-service terminal. No change of purpose is listed.
- **Munich's §18b page** ("Gebührenrahmen"): 100 euro first grant, 93 euro extension, "Assoziationsberechtigte
  türkische Staatsangehörige: 46 Euro (ab 24 Jahren) oder 27,60 Euro (bis 24 Jahre)".

## What the product cannot tell apart, and so how the facts are shaped

Three conditions decide the fee and none is a detail a reader gives: their age for the Turkish rate, whether their
current residence permit is for another purpose or already this one, and whether an exemption reaches them. An
`equals` fact named plainly `fee` would be false for some of the readers it reaches (the first check), and an
`atMost` fact is true but tells no one the amount that is theirs (the second check). So each fact is **exact and
named for its condition**: `grantFee` 100 euro, `changeOfPurposeFee` 98 euro, `extensionFee` 93 euro,
`shortExtensionFee` 96 euro, `feeFrom24` 46 euro and `feeUnder24` 27.60 euro. Each states what the ordinance
charges in that case, which is true for every reader who is told it, and the reader reads which case is theirs.
Exemptions stay in the notes: `grantFee` states the scheduled fee, not a promise that no exemption applies.

## The research, in the `germany/residence-permit` session

1. **One turn**, `python research.py ask --case germany/residence-permit --file <ask>`, asking:
   - who is "assoziationsberechtigt" under §52a(1) for a first §18b permit, on a federal page, instruction or
     court decision: Berlin's instructions, as the first check reported them, say it reaches Turkish citizens
     lawfully in Germany, a first grant after entering on a national visa included, not a tourist stay, and needs no
     prior status under Decision 1/80; confirm or correct from a federal source, in both directions: that every
     Turkish citizen holding a national D visa or a residence permit for any purpose pays the association rate for
     this permit with no further condition (prior lawful work, a Decision 1/80 right, family ties, length of stay, the
     visa's purpose), and that no Turkish citizen outside those two statuses who could apply for it does;
   - whether a federal page states the reduced amounts for a residence permit, and whether the under-24 rate turns
     on age at application (PAuswGebV) or at issue (§52a(2)'s "ausgestellt");
   - whether a residence permit holder with another purpose who obtains a §18b permit pays §45 Nr. 3's 98 euro, and
     that extending a §18b permit already held is Nr. 2's 93 or 96 euro, on an official page;
   - that §69(7) credits the processing fee against the fee;
   - which exemptions, reductions and surcharges (§§52, 53, 54 AufenthV, §69(6) AufenthG) can reach a skilled
     worker with a degree applying for this permit, and whether any surcharge is in force for a nationality.

   Every claim with the official page and its locator.
2. **Judged here** against the raw pages, fetched with `curl`; what does not hold goes back into the same session.
3. **A sign-off turn** on the reader-facing sentences and the fee texts, asking only which claim more than the
   evidence supports.
4. **Definitions** in SB-174's format for each figure a rule rests on, every passage found again on its page.
5. **The fixed-point turn.**

## The data, in `src/rules/research/germany/residence-permit.ts`

**A separate obligation for the fee**, as Turkey's `pay-the-residence-permit-charge` is, rather than fee facts on
the permit's versions: a Turkish fee version beside Munich's version of the permit would have neither cover the
other, and the resolver would answer needsReview. Its slug is `pay-the-skilled-worker-residence-permit-fee` (kind
`fee`), not Turkey's, because Turkey's charge is for a different permit.

Versions, from the definitions' read date, every fact `equals` in EUR:

1. **No criteria**: `grantFee` 100, the standard statutory fee for granting the permit as an electronic card, on §45
   AufenthV. Notes: the
   sticker's 44 euro reduction, the processing fee counted towards the fee (§69(7) AufenthG), and the exemptions,
   reductions and any surcharge the research finds reaching this permit, each with who it reaches.
2. **residenceStatus `de.residence-permit`**: `changeOfPurposeFee` 98, `extensionFee` 93 (for more than three months
   more) and `shortExtensionFee` 96 (for up to three months more), on §45 AufenthV. Notes: which is which.
3. **residenceStatus `de.national-visa` and nationality `tr`**: `feeFrom24` 46 and `feeUnder24` 27.60, each with the
   age condition the research settles (at application or at issue), the version resting on §52a AufenthV and the
   facts on §1 PAuswGebV, unless one federal page states both. The notes name §52a, since an answer serves only the
   facts' page, so the reader sees why the identity card's fee is theirs.
4. **residenceStatus `de.residence-permit` and nationality `tr`**: the same two facts, since §52a(2) reaches every
   fee of §45.

The Turkish versions name the statuses the research finds the association rate reaching, a D visa and a residence
permit, not nationality alone, so a Turkish tourist is told version 1's grant fee. They are written only if the
federal research shows those two statuses are both sufficient and complete for the association rate, in both
directions the research question names. If it does not, SB-240 does not close and **nothing of the fee is
published**: without a Turkish version, `grantFee` 100 would reach a Turkish reader unasked, the very reason
SB-225 left the fee out (the fifth check). A card for a verified association-entitlement situation is filed as
SB-240's blocker, the agreed research is kept, and SB-240 goes back to backlog with its exit unchanged, not narrowed
(the fourth check).
The reduced fees are never put on version 1: telling an Indian applicant the Turkish association rates would
mislead them (the third check). Version 3 is more specific than
version 1, and version 4 than versions 1 and 2, so each reader is told one fee. A reader who has not said their
nationality or status, where either could change the fee, is asked it.

## Publishing, and the specs around it

All or nothing. **Only if the research shows the two statuses exactly cover the association rate**, the case is
published with the research script as SB-234's was, all four versions together. Then, in its own commit, a resolver
test reading its expectations from the file: a D visa holder of `in` told version 1's fee, of `tr` version 3's, a
residence permit holder of `in` version 2's and of `tr` version 4's, a Schengen visa holder of `tr` version 1's, and a
D visa holder of no stated nationality asked it. Planted: version 3 removed, which the test must fail as a Turkish D
visa holder told version 1's fee, and version 4 removed, which it must fail as a Turkish residence permit holder told
version 2's. **If the research does not show it**, nothing is published, no test is added, and SB-240 waits on its
blocker as the data section says.

## Files

`agreed/germany/residence-permit.md`, `talk/germany/residence-permit.md`, `src/rules/research/germany/residence-permit.ts`,
`test/research-rules.e2e.spec.ts`; this plan.

## The steps I am least sure of

1. **Who is "assoziationsberechtigt" on a federal source**, when the scoping to a D visa and a residence permit comes
   from Berlin's instructions as reported, not from a page read here.
2. **Facts named for their condition** (`grantFee`, `feeUnder24`) as the shape for a fee the product cannot pin
   down, and whether `grantFee` 100 is honest for an exempt reader with the exemption in the notes.
3. **The reduced fee's page**: §52a(2) gives the rule and §1 PAuswGebV the amounts; the second check found the split
   between version and fact honest under the label test.
4. **Exemptions in version 1's notes**: naming the ones that reach this permit without implying a reader qualifies.

## How it is checked

On the publishing branch only: the label test reads every new definition back; the new resolver test; lint,
`lint:tsc`, the build and the full API suite, the card having no parent task. Live: the publish's read-back, then direct queries of the deployed API
for a D visa holder of `in` and of `tr`, a residence permit holder of `in` and of `tr`, a Schengen visa holder of
`tr`, and a D visa holder of no stated nationality, each fact's page named, and the Turkish answers' notes naming
§52a AufenthV, since their facts' page is the identity card's.

## Checks

1. **First check** (2026-09-15). Accepted, all four: `equals` 46 is false for a Turkish reader under 24; a
   residence permit holder may be extending, not changing purpose; nationality alone is too broad for the
   association rate; and a flat 100 euro is false for an exempt reader. Each is now a condition in an `atMost`
   fact's text, and the Turkish versions name their statuses. It confirmed the separate fee obligation, the version
   chain, and that §69(7) AufenthG credits the processing fee, which the page read here says.
2. **Second check** (2026-09-15). Accepted: `atMost` is an honest ceiling but tells no reader the amount that is
   theirs, and the resolver reads no condition in a text, so each fee is now an exact fact named for its case. It
   confirmed the separate obligation, the version chain, the split of §52a and PAuswGebV between version and fact,
   98 euro for a change of purpose and the credited processing fee, and asked that the Turkish versions follow the
   federal research's set of readers, which the data section now says.
3. **Third check** (2026-09-15). Accepted: the fallback that put the Turkish rates on version 1 for every reader is
   dropped, since it would mislead every other applicant; the Turkish versions are written only if the federal
   research shows their two statuses are exactly who pays the association rate, otherwise that part becomes its own
   card; `grantFee` is worded as the standard statutory fee; and the Turkish notes name §52a because an answer serves
   only the facts' page. It confirmed the facts named for their case, no generic exemption fact, and the version chain.
4. **Fourth check** (2026-09-15). Accepted: the research question now asks for both directions, every Turkish D visa
   or residence permit holder paying the association rate with no condition the product cannot ask, and no Turkish
   citizen outside those statuses paying it; and if that is not shown, SB-240 stays open behind a blocker card with
   its exit unchanged, instead of narrowing its exit, since narrowing would close it on a different test than the one
   it names. The Turkish live answers are checked for a note naming §52a. It found the rest consistent.
5. **Fifth check** (2026-09-15). Accepted: publishing the standard fees without the Turkish versions would tell a
   Turkish reader 100 euro unasked, so publication is all or nothing; and the specs, the plants and the live queries
   are now the publishing branch's only. It found the design otherwise sound and the resolver behaving as assumed.
