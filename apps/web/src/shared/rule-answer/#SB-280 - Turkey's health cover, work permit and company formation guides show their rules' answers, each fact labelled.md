# SB-280, Turkey's health cover, work permit and company formation guides show their rules' answers, each fact labelled

**Exit:** on the live site the three guides show The rules that apply with each fact's label, value and page, in en
and fa, and the label test passes and fails for a linked fact whose label is removed.

Most of the work is the labels, here in `apps/web/src/shared/rule-answer/`, with their Persian in `fa.po`; the links are
in `apps/api/src/guide/`.

## The links

`obligation-groups.ts` gains one constant per guide, each group one obligation, in the order the research lists them,
and all three join `LINKED_OBLIGATION_GROUPS`:

- `TURKEY_HEALTH_INSURANCE`: `join-general-health-insurance`.
- `TURKEY_WORK_PERMIT`: `get-a-work-permit`, `report-employment-starting-and-ending`,
  `apply-for-a-residence-permit-after-a-work-permit`, `keep-working-while-an-extension-is-assessed`.
- `TURKEY_COMPANY_FORMATION`: `form-a-limited-company`, `request-electronic-tax-notifications`, `get-a-tax-certificate`,
  `register-an-employee-for-social-insurance`, `get-a-workplace-licence`, `keep-company-books-electronically`.

`researched-guides.ts` gives the three guides those constants in place of `obligations: []`. The researched guides spec
already expects one link per group, in order, for every entry, so it covers the new ones without a change.

What a reader then sees, from the criteria the research wrote: health cover asks for the residence status (its version
is for residence-permit holders); every work permit rule, and the five company duties after formation, ask only for the
role (SB-286), and a reader who says Worker or Company founder is answered; forming a limited company answers everyone.

## The labels

35 fact keys have no label. Each is a noun phrase its value completes, read from the agreed sentence that states the
figure, English in `factLabels.ts`, Persian in `fa.po`:

| key | English | Persian |
|---|---|---|
| residenceBeforeRequest | Continuous residence before applying for GSS | اقامت پیوسته پیش از درخواست بیمهٔ سلامت عمومی |
| coverStartsAfterRequest | GSS registration starts after the request | آغاز ثبت‌نام بیمهٔ سلامت عمومی پس از درخواست |
| premiumDaysInPrecedingYear | Contribution days in the preceding year, for routine treatment | روزهای پرداخت حق‌بیمه در سال پیش، برای درمان عادی |
| premiumRate | GSS premium rate | نرخ حق‌بیمهٔ سلامت عمومی |
| premiumBase | GSS premium base | مبنای حق‌بیمهٔ سلامت عمومی |
| permitFeeUpToOneYear | Fixed-term work permit fee, up to one year | هزینهٔ مجوز کار مدت‌دار، تا یک سال |
| residencePermitIssuedForAtLeast | Minimum issued term of the residence permit | حداقل مدتِ اجازهٔ اقامتِ صادرشده |
| residencePermitValidOn | Required validity date of the residence permit | تاریخ لازم برای معتبر بودن اجازهٔ اقامت |
| turkishEmployeesPerForeigner | Turkish employees for each foreigner | کارکنان ترک برای هر خارجی |
| paidInCapitalNewBusiness | Paid-in capital for a new business | سرمایهٔ پرداخت‌شده برای کسب‌وکار جدید |
| paidInCapitalEstablishedBusiness | Paid-in capital for an established business | سرمایهٔ پرداخت‌شده برای کسب‌وکار موجود |
| netSalesEstablishedBusiness | Net sales for an established business | فروش خالص کسب‌وکار موجود |
| exportsEstablishedBusiness | Exports for an established business | صادرات کسب‌وکار موجود |
| salarySeniorExecutivesAndPilots | Minimum salary for senior executives and pilots | حداقل حقوق مدیران ارشد و خلبانان |
| salaryEngineersAndArchitects | Minimum salary for engineers and architects | حداقل حقوق مهندسان و معماران |
| salaryOtherManagers | Minimum salary for other managers | حداقل حقوق سایر مدیران |
| salaryExpertiseOrMastery | Minimum salary for work requiring expertise or mastery | حداقل حقوق کارِ نیازمند تخصص یا مهارت |
| salaryDomesticAndOtherWork | Minimum salary for domestic and other work | حداقل حقوق کارهای خانگی و سایر کارها |
| grossMinimumWage | Gross minimum wage in 2026 | حداقل دستمزد ناخالص در ۲۰۲۶ |
| netMinimumWage | Net minimum wage in 2026 | حداقل دستمزد خالص در ۲۰۲۶ |
| reportWithin | Employer’s deadline to notify the Ministry of employment changes | مهلت کارفرما برای اطلاع به وزارتخانه از تغییرات کار |
| applyWithin | Deadline to apply for a residence permit after a work permit ends | مهلت درخواست اجازهٔ اقامت پس از پایان اجازهٔ کار |
| workWhileAssessedAtMost | Maximum work while a timely extension is assessed | حداکثر مدت کار در زمان بررسی تمدید به‌موقع |
| minimumCapital | Minimum capital for a limited company | حداقل سرمایهٔ شرکت با مسئولیت محدود |
| cashCapitalPaidWithin | Deadline to pay cash capital after registration | مهلت پرداخت سرمایهٔ نقدی پس از ثبت |
| formationFee | Registry charge on company formation | هزینهٔ ثبت در تأسیس شرکت |
| competitionLevy | Competition Authority levy on subscribed capital | عوارض سازمان رقابت از سرمایهٔ تعهدشده |
| requestAfterCommencement | Deadline to request electronic tax notifications after starting business | مهلت درخواست ابلاغ الکترونیکی مالیاتی پس از شروع فعالیت |
| firstAfterLiability | Deadline for the first tax certificate after tax liability begins | مهلت دریافت نخستین گواهی مالیاتی پس از آغاز تکلیف مالیاتی |
| renewEachYearBy | Annual tax-certificate renewal deadline | مهلت تمدید سالانهٔ گواهی مالیاتی |
| renewAfterDeclarationDeadlineInSpecialPeriod | Tax-certificate renewal deadline after the return deadline in a special accounting period | مهلت تمدید گواهی مالیاتی پس از مهلت اظهارنامه در دورهٔ حسابداری ویژه |
| registerBeforeStart | Deadline to register an employee before starting work | مهلت ثبت کارمند پیش از شروع کار |
| obtainBefore | Required time to obtain an opening and operating licence | زمان لازم برای گرفتن مجوز افتتاح و بهره‌برداری |
| keptIn | Where the share register and general-meeting minutes are kept | محل نگهداری دفتر سهام و صورت‌جلسات مجمع عمومی |
| opensWith | Event that opens ETDS | رویدادی که ETDS را فعال می‌کند |

**One key, two documents.** `cardFee` is labelled "Residence permit card fee" from the short-term permit, and the work
permit's research uses the same key for its own 964 lira card. Both are the fee for the card issued under the rule
whose title sits above it, so the label becomes **Card fee**, "هزینهٔ کارت", for both, with no research change.

## Two units the interface names

`factValue` names two more units in the reader's language, since they are structured units the research repeats rather
than prose: "times the gross minimum wage", the gross minimum wage itself for a multiple of one and "# times the gross
minimum wage" otherwise, and "Turkish employees for each foreigner". A Persian page then reads the salary thresholds and
the staffing ratio in Persian. The five text values, "the day of application", "31 May", "opening", "ETDS" and
"registration", stay the research's English words beside their labels, which read without them.

## How it is checked

- `factLabels.test.ts` fails as soon as the links land and passes once the labels do; watched failing with one new
  label removed.
- `factValue.test.ts` gains the two units, in English, singular and plural.
- The API's researched guides spec and research rules spec, run whole, and the full suites, as this card has no parent.
- A pages test on the built site: Turkey's work permit guide says "Your role decides the answer" for the permit, and
  once the reader chooses Worker in the panel it shows "Fixed-term work permit fee, up to one year" and "Card fee" with
  their values and page; watched failing with the work permit guide's link removed.
- Pushed; the three guides looked at on the live site in en and fa, light and dark.

Checked on 2026-09-15 and approved with revisions, all taken but three. It confirmed the links and that every work
permit and company duty needs only the role; gave the labels and their Persian, taken as given except two whose
meaning would change: the thirty contribution days keep "for routine treatment", since they are what routine treatment
needs and not what joining needs, and the formation fee is the registry charge the document says formation is exempt
from, where "Statutory charge on company formation" would say none sits beside a statutory levy of 0.04 per cent. It
agreed Card fee is honest for both cards, and asked for the two units to be named; both taken, the Card fee line proven
in the work permit test. Its request that the units be tested in Persian is not taken: the owner's order of 2026-09-10
is that no test is written for a language.
