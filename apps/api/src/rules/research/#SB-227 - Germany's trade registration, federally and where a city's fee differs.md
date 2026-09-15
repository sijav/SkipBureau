# SB-227, Germany's trade registration, federally and where a city's fee differs

**Exit:** on the deployed API, a reader starting a business in Berlin is told the federal duty, the fine ceiling and
Berlin's €26 or €15 online, one in Hamburg €25, each fact naming its official page, and a reader who has not said where
is asked.

## Why

A self-employed newcomer who registers late, pays a chamber they owe nothing or works before their title allows it pays
for a question the agreed research already answered. The owner's order of 2026-09-15: each German research is written as
its own data file, published with the research script and read back live before anything else starts.

## What there is to write from

`research/agreed/germany/business-registration.md`, agreed 2026-09-12, its figures verified or calculated definitions
from SB-174 read 2026-09-14, its last pass answered no. Facts rest on verified definitions only. This card needs two
done before it: SB-228, which put Cologne in the tree as `DE-NW.koeln` under North Rhine-Westphalia, so no city is added
here, and SB-249, which made the publish's read-back ask a work-region version with its work region. Both are done.

Three pages read raw today, 2026-09-15, change what can be written:

- **§4a AufenthG** now reads, in (1), that a foreigner holding a residence title may pursue gainful activity unless a law
  forbids it, that it can be restricted by law, and that activity beyond the prohibition or restriction needs
  permission; and in (3), that every title must show whether gainful activity is permitted and any restriction, and that
  a title issued for a particular employment forbids any other gainful activity until the competent authority permits
  it. The agreed sentence "the intended self-employment must be permitted before you exercise it" says more than (1)
  does, and has no definition. So no §4a fact is written from it as it stands: the turn below puts both paragraphs to
  the other side for the sentence the page supports, and the fact rests on new definitions of those paragraphs.
- **DGUV's page** says, beside the one week, that the notification duty under §192 SGB VII counts as met when a trade
  registration has been filed for the business. `dguv-one-week` does not carry that, and the fact needs it.
- **§138 AO**: `ao-138-one-month` quotes (4)'s one month but not (1b), which makes the questionnaire the further
  information a business opener or new freelancer owes the tax office, sent electronically unless the office waives that
  for hardship. The fact needs (1b).

## Which figures are written, and which are not

Every version is scoped to the situation `company-founder`, the vocabulary SB-196 gave Turkey's founder duties. It means
a reader starting a business on their own account, a freelance practice included, which whatever screen later asks a
situation has to say, since the questionnaire and the accident insurer bind a freelancer as much as a trader. So a
reader starting a business in either country answers one question, a reader who has not said is asked, and a student is
not told these. The trade office's duty and the chamber's bind only a business that is a trade, and their notes say so
first, since the agreed document says calling yourself a freelancer settles neither question. Written:

- **Register a trade** (`register-a-trade`, kind `registration`):
  1. no place: `notifyTradeOfficeWhen` equals "at the same time as you start the business" (`gewo-14-at-the-same-time`);
     `lateTradeNotificationFine` at most 1,000 EUR (`gewo-146-late-notification-fine`). Notes: the two questions and the
     two authorities, the self-employed software developer, getting it wrong, no uniform fee, the online route depending
     on the authority, and what registering sets off.
  2. `workRegion` `DE-BE`: `soleTradeRegistrationFee` 26 EUR, its text for each sole trade or each partner of a
     partnership, other legal forms costing differently (`berlin-trade-registration-26`), and `onlineTradeRegistrationFee`
     15 EUR, its text where Berlin's online procedure is available for the legal form
     (`berlin-trade-registration-online-15`).
  3. `workRegion` `DE-HH`: `soleTradeRegistrationFee` 25 EUR (`handelskammer-hh-registration-25`).
  4. `workRegion` `DE-NW.koeln`: `soleTradeRegistrationFee` 26 EUR, its text for a natural person
     (`koeln-trade-registration-26`); a warning fine possible once the start lies more than 4 weeks back
     (`koeln-warning-fine-four-weeks`) and fine proceedings once it lies more than 6 months back
     (`koeln-fine-proceedings-six-months`), which the notes call possible enforcement, not an extension of the deadline.

  Versions 2 to 4 narrow version 1 by place alone, so each inherits the duty and the fine. Each place's notes say its fee
  follows where the business has its establishment, not where the founder lives, and that other legal forms and
  additional representatives can change the charge.
- **Notify the accident insurer** (`notify-the-accident-insurer`, kind `registration`), no place:
  `notifyAccidentInsurerWithin` within 1 week of opening the business, its text saying a trade registration already
  counts as the notification (`dguv-one-week`, extended).
- **Send the tax registration questionnaire** (`send-the-tax-registration-questionnaire`, kind `tax`), no place:
  `sendTaxQuestionnaireWithin` within 1 month of starting, electronically unless the tax office waives that for hardship
  (`ao-138-one-month`, extended). Notes: registering the trade does not replace it, and the tax number is sent in
  writing, how long that takes not verified.
- **Trade tax** (`pay-trade-tax`, kind `tax`), no place: `tradeIncomeAllowance` 24,500 EUR for individuals and
  partnerships (`gewstg-11-allowance`).
- **Chamber of commerce contributions** (`pay-chamber-of-commerce-contributions`, kind `fee`), no place:
  `contributionFreeUpTo` 5,200 EUR of trade income or profit, for an individual or partnership not in the commercial
  register (`ihkg-3-exempt-up-to-5200`); `founderReliefUpTo` 25,000 EUR, its text the years and the conditions
  (`ihkg-3-founder-relief`, `ihkg-3-five-years`, `ihkg-3-more-than-one-tenth`); `levyBaseAllowance` 15,340 EUR for
  individuals and partnerships (`ihkg-3-levy-allowance`). Notes: membership is normally compulsory, these are profit
  tests and not turnover tests, and a chamber may lower the exemption thresholds.
- **The VAT small business rule** (`use-the-vat-small-business-rule`, kind `tax`), no place: `previousYearTurnoverUpTo`
  25,000 EUR and `currentYearTurnoverUpTo` 100,000 EUR (`ustg-19-thresholds`), `firstYearTurnoverUpTo` 25,000 EUR
  (`bmf-first-year-ceiling`), `waiverBindsFor` 5 years (`ustg-19-waiver-five-years`), and `exemptionLostFrom` equals the
  whole transaction that crosses the ceiling, not only the excess (`bmf-exemption-lost-in-full`). The card's description
  leaves this out; the owner's order makes a passed research data, so it is written.
- **Self-employment on a residence title** (`check-your-title-allows-self-employment`, kind `permit`), one version for
  `de.residence-permit` and one for `de.national-visa`, each also `company-founder`: one fact, the corrected §4a sentence,
  which must not suggest that every title needs a separate permission, on the two new definitions. Notes: §21(6) as a
  possible route, not an entitlement, and that we could not verify a trade office refusing a registration without the
  permission. A Schengen visa is a residence title too (§4(1), §6(1) no. 1 AufenthG) and a visa-free visitor holds none,
  but what either may do before starting a business was not researched, so neither is told this; SB-253 carries both.

Not written: Rhein-Neckar's rates and its €35 example, since the chamber's district is no place of the model and the
example is calculated; the ten per cent and the founder relief's zero, which are calculated; and retrospective
cancellation, which the research could not verify.

## Definitions added and extended first, through the conversation

One turn in `germany/business-registration` (`python research.py ask`) puts in front of the other side today's §4a(1)
and (3) beside the agreed §4a sentence, asking for the sentence the page supports; the DGUV sentence and §138(1b), which
extend the two definitions; and every fact's key, value and text as planned above, asking which claim more than the
evidence, and for every version's notes in its own wording. Its wording is taken where it keeps the meaning, the owner's
order of 2026-09-15. The corrections go into the agreed document; the two new §4a definitions and the two extended ones
are written by script only once every passage is found on today's page, dated 2026-09-15, and the sources they sit on
are read that day in the data file. A fixed-point turn follows.

## How the facts are shaped

- **Where the business is**: the city fees follow where the business has its establishment, which for a sole trader
  working from home is their home. The reader gives it as where they work, a `workRegion`, and each place's notes say so;
  Berlin's and Hamburg's pages name the competent office by the business's seat. SB-226's Saxony split is keyed the same
  way. A founder who has not said where they work is asked, since three places change the fee, and one working in North
  Rhine-Westphalia outside Cologne is asked where in the Land, as SB-229's cities are.
- **Facts named for their case** (SB-240): a key or its text names the condition its value holds under, so a fact is true
  for every reader told it; a fee is a sole trade's, never a registration's in general.
- **Their own slugs**. None joins a Turkish obligation, since Germany's trade office and Turkey's company formation are
  not the same duty.

## The data, and publishing

`src/rules/research/germany/business-registration.ts`, from the agreed document and nothing else. Sources read
2026-09-14, or 2026-09-15 for the three pages re-read today; versions from the last day anything they rest on was read;
composed in `germany.ts` after health insurance. Published with
`npm run research:publish -w @skipbureau/api -- src/rules/research/germany/business-registration.ts`, its reset line
run when it reports.

## The tests

In its own commit after the publish, a resolver test in `test/research-rules.e2e.spec.ts` reading its expectations from
Germany's file: a founder working in `DE-BE` told the duty and the fine with Berlin's two fees, in `DE-HH` with €25, in
`DE-NW.koeln` with Cologne's fee and timings, in a Land no version names the federal facts alone; a founder who has not
said where asked for `workRegion`, and one in `DE-NW` asked where in it; a student not told the duty; a founder holding
`de.residence-permit` told the §4a fact, and one who has not said what they hold asked. The label test reads every label
back. Planted: Berlin's version made a `residenceRegion`, which the test must fail as the Berlin founder told only the
federal facts, and version 1's situation removed, which it must fail as the student told the duty.

## Files

`agreed/germany/business-registration.md` (corrections and definitions), `talk/germany/business-registration.md`,
`src/rules/research/germany/business-registration.ts` (new), `src/rules/research/germany.ts`,
`test/research-rules.e2e.spec.ts`; this plan. The board: SB-253.

## How it is checked

The label test, the new resolver test, lint, `lint:tsc`, the build and the full API suite, the card having no parent
task. Live: the publish's read-back, then direct queries of the deployed API for a founder working in Berlin, in
Hamburg, in Cologne and nowhere said, each fact's page named.

## The steps I am least sure of

1. **`workRegion` for where the business is**, for a sole trader who works from home and may give where they live
   rather than where they work.
2. **The §4a sentence and its reach**: status-scoped versions, which ask a founder who has not said what they hold, and
   leave Schengen visa holders and visa-free visitors to SB-253.
3. **Writing the VAT rule and the levy allowance**, which the card's description does not list.
4. **`company-founder` holding a freelance start**, which no screen defines yet.

## Checks

1. **First check** (2026-09-15). Accepted: a €26 fee named for registration in general would reach the founder of a
   company, for whom Berlin charges €31 and Cologne €33, so every place's fee is keyed and worded for a sole trade and
   Berlin's €15 for where its online route exists; a Schengen visa is a residence title under §4(1), which the plan had
   denied, so Schengen visa holders and visa-free visitors are left out because what their stay allows was not
   researched, filed as SB-253, rather than put on §4a(4); `workRegion` is right only as where the business has its
   establishment, which the notes say; the §4a fact must not suggest that every title needs a separate permission, and
   §21 is a possible route in the note; `company-founder` has to hold a freelance start for the questionnaire and the
   accident insurer to reach a freelancer, and the trade and chamber duties say first that they bind only a trade. It
   found no verified figure left out without a reason and agreed the VAT rule and the levy allowance follow the owner's
   order. The prerequisites it named, SB-228 and SB-249, were done before this plan. No second check: what changed is
   keys and texts naming their case, notes' wording and the reason a status is left out, not what is built, the owner's
   order of that day.
