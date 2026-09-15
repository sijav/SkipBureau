# SB-226, Germany's health insurance and care contributions, federally and in Saxony

**Exit:** on the deployed API, a reader who works in Saxony is told the 2.3% and 1.3% care split and one who works in
Berlin 1.8% each, a reader who has not said where they work is asked, and every federal figure names its official
page.

## Why

Cover is required from the day a newcomer resides in Germany, and the one regional difference the research found
follows where a reader works rather than where they live, which is what the rules model exists to get right. The
owner's order of 2026-09-15: the German researches are loaded, each as its own data file published with the research
script and read back live, before anything else starts.

## What there is to write from

`research/agreed/germany/health-insurance.md`, agreed 2026-09-12, every figure a verified or calculated definition from
SB-174, read 2026-09-14, and its conversation's last pass answered no. The facts are written from its verified
definitions only, since the label test refuses a calculated one. Two of those definitions leave out a condition their
facts depend on, which the first check found and the raw pages read here confirm, so they are extended through the
conversation before anything is written (below).

## Which figures are written, and which wait

Written, each on the verified definition named, every page federal:

- **Statutory health insurance** (`join-statutory-health-insurance`, kind `insurance`), one version with no criteria:
  `compulsoryInsuranceThreshold` 77,400 EUR a year (`bmg-threshold-2026`); `generalContributionRate` 14.6 percent
  (`sgb5-241-general-rate`); `employeeAndEmployerShare` equals "half each, of the general and the additional
  contribution" (`bmg-half-each`); `assessmentCeiling` 5,812.50 EUR a month (`bmg-assessment-ceiling-monthly`);
  `voluntaryMembershipNoticeWithin` within 3 months, its text the second check's: "after starting employment, if you are
  taking up your first employment in Germany and are exempt from compulsory insurance under §6(1) no. 1; employment
  before or during vocational training does not count" (`sgb5-9-three-months`, extended below); `membershipBeginsForEmployees` equals "on the day the employment begins"
  (`sgb5-186-membership-begins`). Notes: the agreed sentences on who is in which system, the threshold and the window,
  the weeks before a job starts, and what is the same everywhere.
- **Care insurance** (`pay-care-insurance-contributions`, kind `insurance`):
  1. no criteria: `careContributionRate` 3.6 percent and `childlessCareContributionRate` 4.2 percent (`bmg-care-rate`,
     extended below),
     `careDiscountPerChild` 0.25 percentage points from the second to the fifth child under 25
     (`bmg-care-children-under-25`), `employeeCareShare` and `employerCareShare` 1.8 percent each
     (`bmg-care-other-states`); notes: who is exempt from the childless surcharge, as the Ministry's page says, that the
     employee alone pays the surcharge, and that the split follows where the employment is.
  2. `workRegion` `DE-SN`: `employeeCareShare` 2.3 and `employerCareShare` 1.3 percent (`bmg-care-saxony-split`); notes:
     the second check's wording, "These are the standard care-insurance shares for compulsorily insured employees. In
     Saxony, the place of employment, not the home address, determines the standard split. The figures do not include
     the childless surcharge or child-related reductions; special statutory rules can produce different shares."
     It narrows version 1 by place alone, so it takes the rates and the discount from it.

**Waiting, each on its open card:**

- **The 2.9% average additional rate**, and so the 8.75% each and the minimum contributions of €222.80 and €230.71,
  which are computed at it: SB-183 found the agreed sentence misleading, since 2.9% is the average the Ministry announced
  for 2026 and funds charged 3.13% on average by April. Nothing here repeats that sentence until SB-183 corrects it.
- **The €1,318.33 minimum assessment base** for the self-employed: SB-185 is open because its "monthly" rests on a paper
  about pensioners.
- **Berlin's €300 and Hamburg's €5,000 deductible limits**: they are what each immigration office accepts as proof of
  insurance for a residence permit, a different obligation from paying contributions, and not in this card's exit.

A note is added to SB-183 and SB-185 that, once each closes, its figure is written into this file and published with
the research script.

## Two definitions extended first, through the conversation

Read on the raw pages today:

- **`sgb5-9-three-months`** quotes §9(2)'s three months and its Nr. 3, but not who Nr. 3 is. §9(1) sentence 1 Nr. 3 reads
  "Personen, die erstmals eine Beschäftigung im Inland aufnehmen und nach § 6 Absatz 1 Nummer 1 versicherungsfrei sind;
  Beschäftigungen vor oder während der beruflichen Ausbildung bleiben unberücksichtigt", which joins its evidence.
- **`bmg-care-rate`** quotes the 3.6 and 4.2 percent, but not who is exempt from the surcharge. The same page reads
  "Ausgenommen sind kinderlose Mitglieder, die vor dem 1. Januar 1940 geboren sind, Mitglieder bis zur Vollendung des
  23. Lebensjahres sowie Bezieherinnen und Bezieher von Bürgergeld nach dem SGB II.", which joins its evidence, as does
  "diesen tragen die Arbeitnehmerinnen und Arbeitnehmer alleine" for who pays it.

They are agreed evidence, so they are not changed silently while writing data: one turn in `germany/health-insurance`
(`python research.py ask`) puts both extended definitions, the fact wordings above and the notes in front of the other
side and asks only which claim more than the evidence supports; its corrections are applied, every passage is found
again on its page by script, and a fixed-point turn follows. The definitions keep their labels, their `read` becomes
today's date, and the sources they sit on are read that day in the data file.

## How the facts are shaped, and the seed

- **Facts named for their case**, as SB-240 settled: `employeeCareShare` is the employee's share by law, true for every
  reader told it, so no version needs a situation such as employed or self-employed. That also keeps every version of
  both obligations free of a situation criterion, so the publish's read-back needs no situation fallback, which SB-249
  left to this card if it needed one.
- **Their own slugs**, not the seed's `hold-health-insurance` and `pay-care-insurance`. The seed's German rules for those
  slugs are what `needs.e2e`, `region.e2e` and `move.e2e` test the resolver with, and they never deploy
  (`src/bootstrap.ts`); writing the research under the same slugs would put two sets of versions in every test database
  and rework three specs for no reader's gain. Turkey's health insurance took its own slug for the same reason (SB-194).
  So in production only the researched obligations exist, and the seed's stay test fixtures.
- **Where the reader works**: the Saxony version is a `workRegion` criterion, which the resolver treats as a place and
  SB-249's read-back now asks with a work region; a reader who has not said where they work is asked, since version 2
  could change the shares.

## The data, and publishing

`src/rules/research/germany/health-insurance.ts`, written from the agreed document and nothing else. Its sources carry
the day their definitions were read: 2026-09-15 for the §9 SGB V page and the Ministry's care financing page, both
re-read today with every label on them re-dated and its evidence found again on today's page, and 2026-09-14 for the
rest; versions from 2026-09-15, the last day anything they rest on was read; composed in `src/rules/research/germany.ts` after the
residence permit. Published with `npm run research:publish -w @skipbureau/api -- src/rules/research/germany/health-insurance.ts`,
its reset line run when it reports.

## The tests

In its own commit after the publish, a resolver test in `test/research-rules.e2e.spec.ts` reading its expectations from
Germany's file: a reader working in `DE-SN` told the Saxon shares with the federal rates and discount it inherits, one
working in `DE-BE` the federal version's facts, one who has not said where they work asked for `workRegion`, and every
statutory health insurance fact served to a reader anywhere. The label test reads every label back. Planted: the Saxony
version given 1.8 percent each, which the test must fail as the Saxon reader told the federal split, and the Saxony
version made a `residenceRegion`, which it must fail as the Saxon worker told the federal split while a Saxon resident
working in Berlin is told the Saxon one.

## Files

`agreed/germany/health-insurance.md` (the two definitions), `talk/germany/health-insurance.md`,
`src/rules/research/germany/health-insurance.ts` (new), `src/rules/research/germany.ts`, `test/research-rules.e2e.spec.ts`;
this plan. The board: notes on SB-183 and SB-185.

## How it is checked

The label test, the new resolver test, lint, `lint:tsc`, the build and the full API suite, the card having no parent
task. Live: the publish's read-back, then direct queries of the deployed API for a reader working in Saxony, in Berlin,
and nowhere said, each fact's page named.

## The steps I am least sure of

1. **Own slugs rather than the seed's**, which leaves a sample `pay-care-insurance` beside the researched one in test
   databases and no join between Germany's and Turkey's health insurance for a comparison.
2. **Holding the 2.9%, the €1,318.33 base and the minimum contributions** until SB-183 and SB-185, when the card's
   description lists some of them.
3. **Changing two definitions' evidence and read date** on figures SB-174 already verified, which the turn and the
   fixed point must both clear before the data rests on them.
4. **The Saxony split's reach**: named as employee and employer shares, with §58's qualification in the note, and no
   employment-status criterion, which the first check allowed only while no fact says "you pay".

## Checks

1. **First check** (2026-09-15). Accepted: `sgb5-9-three-months` must carry §9(1) sentence 1 Nr. 3, and the fact uses the
   statute's §6 wording rather than "above the threshold"; the Ministry's page itself names who is exempt from the
   childless surcharge, which the plan had wrongly placed on §55's page only, so `bmg-care-rate` carries it; both are
   agreed evidence, so a turn and a fixed point clear them first; and the Saxony note says the split is for compulsorily
   insured employees. It confirmed the separate slugs, holding back the 2.9%, the minimum contributions and the €1,318.33
   base, and the version shape.
2. **Second check** (2026-09-15). Its two wordings, for the voluntary-membership text and the Saxony note, are used as
   given, the owner's order of that day. Accepted: the data section's read date contradicted the extended definitions,
   so the pages re-read today carry today's date on every label they hold, and the versions start that day. Its point
   that SB-249 is a prerequisite was already met: SB-249 was done and committed before this plan. No third check, since
   nothing changed in what is built beyond wording and dates.
