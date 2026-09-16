# SB-300, Germany's three guides show their rules' answers, each fact labelled

**Exit:** on the live site the three German guides show The rules that apply, each line carrying its fact's label, its
value and its page, in en and fa. A rule keyed to where the reader works shows the question Where you work instead of a
value, until SB-313 gives them a way to answer it. The label test fails for a linked fact whose label is removed.

SB-299 put Germany's Anmeldung, business registration and health insurance guides live. Two of them link no rule at
all, so a reader sees prose with no figure they can check and no answer for their own case, which is what Turkey's
guides looked like before SB-280. The research behind them already holds the rules and the facts, loaded on every
start by `load-research-rules.js`; nothing points the guides at them.

## What links what

`apps/api/src/guide/obligation-groups.ts` gains two constants, in each document's own order, every duty its own group
because none of them is an alternative to another:

- `GERMANY_BUSINESS_REGISTRATION`: `register-a-trade`, `notify-the-accident-insurer`,
  `send-the-tax-registration-questionnaire`, `pay-trade-tax`, `pay-chamber-of-commerce-contributions`,
  `use-the-vat-small-business-rule`, `check-your-title-allows-self-employment`.
- `GERMANY_HEALTH_INSURANCE`: `join-statutory-health-insurance`, `pay-care-insurance-contributions`.

Both join `LINKED_OBLIGATION_GROUPS`, which is what the web's label test reads, and the two entries in
`researched-guides.ts` carry them in place of `[]`. The Anmeldung guide already links `ADDRESS_GUIDE`, whose
`report-your-address` facts are all labelled, so it needs no new link.

## The thirty labels

`apps/web/src/shared/rule-answer/factLabels.ts` holds 66 labels and none of these. Each is written from the sentence
in the agreed document that states the figure, not from the fact key. Several hold text rather than a number, and a
text fact renders its English value under the translated label, so those labels are noun phrases that read as the
subject of a sentence rather than the introduction of a figure.

**register-a-trade**: `notifyTradeOfficeWhen` (text) when the trade office must be notified;
`lateOrMissingTradeNotificationFine` fine for a late or missing trade notification; `soleTradeRegistrationFee`
registration fee for a sole business; `onlineTradeRegistrationFee` the same fee online; `warningFineCanBeChargedAfter`
when a warning fine can be charged; `fineProceedingsCanStartAfter` when fine proceedings can start.

**notify-the-accident-insurer**: `notifyAccidentInsurerWithin` deadline to notify the accident insurer.

**send-the-tax-registration-questionnaire**: `sendTaxQuestionnaireWithin` deadline to send the tax questionnaire.

**pay-trade-tax**: `tradeIncomeAllowance` trade income allowance.

**pay-chamber-of-commerce-contributions**: `contributionExemptionThreshold` profit below which the contribution is
nothing; `founderReliefThreshold` profit ceiling for founder relief; `levyBaseAllowance` allowance the levy is charged
above.

**use-the-vat-small-business-rule**: `previousYearTurnoverThreshold`, `currentYearTurnoverThreshold` and
`firstYearTurnoverThreshold` the three turnover ceilings; `exemptionLostFrom` (text) **Transaction losing the
exemption**; `waiverBindsFor` **Minimum waiver period**, which is a number, at least five calendar years.

**check-your-title-allows-self-employment**: `selfEmploymentCountsAsWork` (text) **Self-employment under the Residence
Act**; `workOnYourResidenceTitle` (text) **Work allowed by your residence title**.

**join-statutory-health-insurance**: `generalAnnualEarningsThreshold` the earnings threshold; `generalContributionRate`
the general rate; `employeeAndEmployerShare` (text) how the contribution is split; `assessmentCeiling` the monthly
assessment ceiling; `voluntaryMembershipNoticeWithin` the window to tell the fund;
`compulsoryMembershipThroughEmploymentBegins` (text) when membership through employment begins.

**pay-care-insurance-contributions**: `careContributionRate` the care rate; `childlessCareContributionRate` the rate
for a childless member; `careDiscountPerChild` the discount per child; `employeeCareShare` and `employerCareShare` the
split, which differs in Saxony.

The wording above is the intent; each is written as `` msg`…` `` against its document's sentence when the file is
edited. Persian goes into `src/locales/fa.po` by hand after `npm run i18n:extract`, then `i18n:compile`, as SB-280 did
for Turkey's thirty-five.

## Two facts nobody can be shown yet, and that is this card's limit

The trade registration fee is keyed to where the business is established and Saxony's care split to the place of
employment. The journey carries one place, where the reader lives, so the resolver answers both with
`needsDetail: workRegion` and the guide shows the question **Where you work** with nothing to answer it. This card
does not invent a work place, and it does not reuse the residence city for it: the research says plainly that the fee
follows the business, not the reader's home. **SB-313** adds the field, the link value, the panel row and the
`workRegions` mapping; until it lands those lines are questions, which is honest, and the exit above says so.

## How it is checked

- `factLabels.test.ts`, which reads `LINKED_OBLIGATION_GROUPS` and `RESEARCHED` and fails for any fact of a linked
  obligation with no label. Watched failing with one of the thirty removed, and again with a group linked and its
  labels absent.
- The API's researched guides specs and e2e, its lint and type checker; the web's unit tests.
- Live, with the reader's details set three ways, since a rule only answers what it was asked: **Company founder** for
  business registration's duties, a German residence status for the residence-title rule, and no work place at all,
  which must show Where you work rather than a number.
- Live in Persian: the labels are read off the page, not asserted in a test. The owner's order of 2026-09-10 is that
  no test is written for any language, and SB-144, which proposed exactly a missing-translation check, was dropped.

## Checked on 2026-09-16, and revised

The check refused the exit condition as written, and it was right: the two work-region facts cannot resolve for
anybody because the reader has no way to say where they work. That is SB-313 now, and this card's exit says those
lines stay questions until it lands. It also corrected a premise: `waiverBindsFor` is a number, at least five calendar
years, not text, while `notifyTradeOfficeWhen`, `employeeAndEmployerShare` and `compulsoryMembershipThroughEmploymentBegins`
are text and were not marked as such. Its four label wordings are taken as written.

It confirmed the rest: one label per fact key is right, since the resolver asks for the detail rather than printing
competing lines; seven linked obligations is not too many, each being its own titled rule card, and linking fewer
would hide researched duties; `obligation-groups.ts` is the right boundary, static and Prisma-free so the web's test
can import it.

It asked for one thing that is refused: a Persian assertion or catalog check, so an untranslated label cannot pass
mechanically by falling back to English. The owner's order forbids a test per language, and the board already dropped
that proposal as SB-144. The Persian side is checked by reading the live page, which is what the exit requires.

## Checked again on 2026-09-16, on the revision

The second round found the dead end the first one left: the card for an unanswerable detail still shows **Tell us**,
because `Guide.tsx` passes `onAsk` for every question and the panel it opens has no work place row. A reader who
presses it finds nothing, which reads as broken rather than as deferred. So the guide passes `onAsk` only for a detail
the panel has a row for, which today is where you live, your nationality, your residence status and your role, and
`RuleAnswer` with no `onAsk` says the detail cannot be given yet instead of asking the reader to tell us. The planted
check is that one: the card for Where you work shows the question and no button, with a city already set.

It gave wording for the three text facts, taken as written: `notifyTradeOfficeWhen` **When to notify the trade
office**, `employeeAndEmployerShare` **Split of the general and additional contribution**,
`compulsoryMembershipThroughEmploymentBegins` **Start of compulsory membership through employment**. It agreed the
long residence-title value stays English under a Persian label, since that is the product's policy for research text
rather than a label defect, and it would not split the card: the links, the labels and the one completeness test are
one change.

For Persian without a test, it named the procedure this card follows: extract, read the `fa.po` diff for thirty new
entries with non-empty `msgstr`, compile, then read the Persian rule cards on the live page. Compiling alone proves
nothing, since an untranslated message falls back to English on purpose.

This round is not re-run for the button change, because that change is the round's own instruction and it said the
plan meets its exit condition once it is made.

## What I am least sure of

- Whether a text fact's English value under a Persian label reads as broken to a Persian reader. It is the existing
  behaviour for Turkey's text facts, so this card does not change it, but these three are longer sentences.
- Whether `soleTradeRegistrationFee` and `onlineTradeRegistrationFee` read as two rules or one, once SB-313 lets a
  reader answer Berlin and both appear.
