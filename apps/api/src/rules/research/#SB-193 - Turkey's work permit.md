# SB-193, Turkey's work permit

**Exit:** on the deployed API, Turkey's work permit answers with those figures,
each naming its page, and no figure comes from a calculated definition.

## Why

A newcomer who works needs a permit before the first day, and these figures
decide whether their job can produce one at all. `research/agreed/turkey/work-permit.md`
verifies them, and none reaches a reader.

## What stays exactly as it is

- **SB-190's loader and its rule for choosing a page**, SB-194's statuses,
  SB-192's nationality groups and SB-209's notes. This card adds rows to Turkey's
  file and changes no code.
- **Nothing calculated**: the multiplied salaries are not written, because no
  official page publishes them, only the multipliers and the wage.

## Who these reach

Each version is scoped to the situation `worker`, which the move tests already
use: a reader who says they work, or are coming to work, in Turkey is told them, a
reader who has not said is asked for their situation, and a reader in another
situation is not told them. As with SB-196's `company-founder`, the situation says
where the reader is, not whether each figure binds them: every figure here binds
only under a condition no criterion holds, a business keeping a balance sheet, a
kind of job, an application made from inside Turkey, a timely extension. So each
version's notes open with the condition that makes it bind, and SB-209 serves them
beside the figures.

## Four obligations, one duty each

The work permit's figures belong to four different moments, each with its own
condition, so they are four obligations rather than one version whose notes would
have to open with four conditions at once.

**`get-a-work-permit`**, a permit, one version from 2026-09-14:

| key | operator | value | page, by research label |
|---|---|---|---|
| `permitFeeUpToOneYear` | equals | 12574.90 TRY | `csgb-fee-page-12574` |
| `cardFee` | equals | 964 TRY | `csgb-fee-page-card-964` |
| `residencePermitIssuedForAtLeast` | atLeast | 6 months | `csgb-faq-9-six-months` |
| `residencePermitValidOn` | equals | the text "the day of application" | `csgb-faq-9-six-months` |
| `turkishEmployeesPerForeigner` | atLeast | 5 | `csgb-criteria-a-1-1` |
| `paidInCapitalNewBusiness` | atLeast | 500000 TRY | `csgb-criteria-a-2` |
| `paidInCapitalEstablishedBusiness` | atLeast | 500000 TRY | `csgb-criteria-a-2` |
| `netSalesEstablishedBusiness` | atLeast | 8000000 TRY | `csgb-criteria-a-2` |
| `exportsEstablishedBusiness` | atLeast | 150000 USD | `csgb-criteria-a-2` |
| `salarySeniorExecutivesAndPilots` | atLeast | 5 times the gross minimum wage | `csgb-criteria-a-3-1` |
| `salaryEngineersAndArchitects` | atLeast | 4 times the gross minimum wage | `csgb-criteria-a-3-1` |
| `salaryOtherManagers` | atLeast | 3 times the gross minimum wage | `csgb-criteria-a-3-1` |
| `salaryExpertiseOrMastery` | atLeast | 2 times the gross minimum wage | `csgb-criteria-a-3-1` |
| `salaryDomesticAndOtherWork` | atLeast | 1 times the gross minimum wage | `csgb-criteria-a-3-1` |
| `grossMinimumWage` | equals | 33030 TRY per month | `csgb-minimum-wage-2026` |
| `netMinimumWage` | equals | 28075.50 TRY per month | `csgb-minimum-wage-2026-net` |

Its own source is the Ministry's evaluation criteria, `csgb-criteria-a-1-1`. The
unit of the quota is "Turkish employees for each foreigner". The three figures for
an established business are alternatives, any one enough, which no fact can say, so
the notes say it.

**`report-employment-starting-and-ending`**, a deadline, one version:
`reportWithin` within 15 days, `law6735-22-1-fifteen-days`.

**`apply-for-a-residence-permit-after-a-work-permit`**, a permit, one version:
`applyWithin` within 10 days, `yukk-reg-21-6-ten-days`.

**`keep-working-while-an-extension-is-assessed`**, a permit, one version:
`workWhileAssessedAtMost` atMost 90 days, `ilf-reg-27-5-ninety-days`.

**Each page, by SB-190's rule.**

- The permit fee: the Ministry's fee page, which states the 2026 fee for a permit
  of up to a year as such, and Law 492's tariff IV-1, which prints it in brackets
  as the applied amount beside the statute's own 500 lira. The fee page, the direct
  statement.
- The card: the Ministry's fee page, "2026 yılı Çalışma İzni Belgesi değerli kağıt
  bedeli" 964 lira, and Treasury communiqué 97, whose row 16 names the foreign work
  permit document at 964 lira and whose Article 5 gives the year. The fee page states
  the document, the year and the figure in one sentence; the communiqué needs two
  places for it. The fee page.
- Six months and valid on the day: the Ministry's FAQ, question 9, the only page.
- The quota, the capital, sales and exports, and the multipliers: the Ministry's
  evaluation criteria, the only page for each.
- The minimum wage, gross and net: the Ministry's minimum wage page, the only page.
- Fifteen days: Law 6735 Article 22(1), and the Ministry's FAQ question 59, which
  repeats it. The Article is the statement, so the Article.
- Ten days: the implementing regulation's Article 21(6), the only page.
- Ninety days: the International Labour Force regulation's Article 27(5), and the
  FAQ's question 21, which repeats it. The Article.

## Notes, per version

Each opens with the condition that makes its figures bind, then says what no fact
holds, from the agreed text:

- The permit: "Where your employer applies for your work permit, as it normally
  does", then that the six months apply to an application from inside Turkey and are
  not six months remaining; that the quota and the capital apply to a business
  keeping a balance sheet, and for an established one capital, sales or exports is
  enough; that each salary multiple is of the gross minimum wage in force on the day
  of application, for that kind of job; that the quota is waived for up to five
  foreigners where last year's net sales reach fifty million lira; that from 3 August
  2026, for an application made from inside Turkey, the employment and financial
  criteria are not applied for up to three foreigners who lawfully stayed in Turkey
  for at least a year of the last three under a work permit, a residence permit or
  international protection, and that in a workplace using that relief the foreigners
  working there on a permit may not outnumber its Turkish employees; and that a
  long-term residence permit holder, or a foreigner married to a Turkish citizen for
  at least three years, is exempt from the employment, financial and salary criteria.
- The report: "For the employer, or a foreigner holding an indefinite or independent
  work permit", then that the Ministry is told within fifteen days when work starts or
  ends or the permit must be cancelled, a reporting duty and not a grace period for
  the worker.
- The ten days: "Once your work permit has been cancelled or has ended", then that a
  residence permit application made within ten days is decided under Law 6458
  Article 22, gives no permission to work and no period to look for a job, that the
  day the ten days run from could not be verified, and that a separate valid residence
  permit is not invalidated.
- The ninety days: "Only while a timely application to extend your work permit is
  assessed, for the same work at the same workplace", then that a first application
  gives no such right, and that no rule was found extending a stay while a first
  application is decided.

**The agreed text is corrected where it read too much into criterion 4.1.** It said
the relief is for "up to three foreigners per workplace"; criterion 4.1 limits it to
three foreigners and only 4.2 speaks of the workplace, for the headcount. Its sentence
is corrected with a dated note saying so, and the label test, which reads only the
definitions, is unaffected.

## Files

`src/rules/research/turkey.ts`, `test/research-rules.e2e.spec.ts`, and
`prisma/research/agreed/turkey/work-permit.md` for that one sentence. No loader,
schema or migration change.

## What this card does not do

It does not write the multiplied salaries, the partner criteria that bind a
foreigner working in their own company, the professions reserved to Turkish
citizens, the fees of indefinite, independent or temporary protection permits, or
the authorisations health and education work need first.

## The step I am least sure of

**`worker` as the scope.** It reaches a reader who says they work, or will, in
Turkey, whether new or already holding a permit, which the ten and ninety days need.
A situation is one value, so a founder who also works in their own company gives only
one, and the partner criteria are not written for them here.

**The card's page.** Both the fee page and communiqué 97 name the document and the
figure; the fee page is chosen because it says the year in the same sentence.

**Alternatives and exemptions in notes.** Capital or sales or exports, and the three
exemptions, are conditions on the figures, so a reader reads them in the notes beside
the facts rather than as facts.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`:

- every label is a verified definition of `work-permit.md` on the page and day the
  file names, the existing test over the four new versions;
- after a load, a reader whose situation is `worker` is told each of the four
  obligations with the facts the file holds, each on its page, and its notes as
  served, starting with the condition listed above for it; a reader who has not said
  is asked for their situation; a student is not told them;
- a second load adds nothing.

Then planted faults, each watched failing: one version's situation criterion left
off, and one version's notes opening with a figure instead of its condition. Then the
full API suite, lint and `lint:tsc`, the build, and the compiled loader run twice on a
fresh database. After the push, the deployed API answers a worker with the four
obligations, each with its figures on their pages and its condition first in its
notes.
