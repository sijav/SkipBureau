import type { ResearchCase } from '../rows.js'

// Written from research/agreed/germany/health-insurance.md and nothing else, one file per research case, which the
// country's file composes (SB-232). The 2.9% average additional rate and what is computed at it wait for SB-183, and the
// minimum assessment base for the self-employed for SB-185 (SB-226).

const READ = '2026-09-14'

const REREAD = '2026-09-15'

const HEALTH_NOTES =
  "You must hold qualifying health insurance while you reside in Germany unless an exception applies (§193(3) VVG); the duty attaches to residing here, not to holding a permit or having a job. An employee is normally compulsorily insured in the statutory system (§5(1)(1) SGB V); someone self-employed as their main occupation normally is not, and a permit on its own does not get you into the statutory system, since §5(11) restricts the uninsured-person fallback for third-country nationals. Someone starting employment above the general annual earnings threshold is generally outside compulsory employee membership, and private insurance is then an option, not an obligation. If this is your first employment in Germany and you are exempt for being over the threshold, you can join the statutory system voluntarily without the usual prior-insurance history, but you must tell the fund within three months of starting work (§9(1) no. 3). Employer and employee normally split the general and additional contributions equally, up to the monthly assessment ceiling; special contribution-sharing rules apply, including for midijobs. Compulsory statutory membership through employment begins on the day the employment begins (§186(1) SGB V), not when you sign the contract. The duty, the earnings threshold, the statutory rates and the assessment limits are federal and the same wherever you live; which funds you can join, what each fund charges as its additional contribution, and what your city's immigration office accepts as evidence differ."

const CARE_NOTES =
  "The standard social care insurance rate is 3.6%, and childless members pay 4.2%. The childless surcharge is paid by the employee alone and starts from the month after the twenty-third birthday, subject to the statutory exceptions, which include members born before 1 January 1940 and people receiving Bürgergeld under SGB II. Parents get a discount of 0.25 percentage points for each child from the second to the fifth, until the end of the month in which the child turns, or would have turned, 25. Employee and employer normally share the contribution, without the surcharge, equally at 1.8% each, before child-related adjustments and special rules such as midijobs. Where an employee's share differs, it follows where the employment is located, not where the employee lives."

const SAXONY_NOTES =
  'These are the standard care-insurance shares for compulsorily insured employees. In Saxony, the place of employment, not the home address, determines the standard split. The figures do not include the childless surcharge or child-related reductions; special statutory rules can produce different shares.'

export const CASE: ResearchCase = {
  document: 'health-insurance',
  obligations: [
    {
      slug: 'join-statutory-health-insurance',
      kind: 'insurance',
      titles: { en: 'Join statutory health insurance', fa: 'عضویت در بیمه درمانی قانونی' },
    },
    {
      slug: 'pay-care-insurance-contributions',
      kind: 'insurance',
      titles: { en: 'Pay care insurance contributions', fa: 'پرداخت حق بیمه مراقبت' },
    },
  ],
  sources: {
    ministryInsured: {
      url: 'https://www.bundesgesundheitsministerium.de/gesetzlich-versicherte',
      name: 'Bundesministerium für Gesundheit, Gesetzlich Versicherte',
      read: READ,
    },
    socialCodeGeneralRate: {
      url: 'https://www.gesetze-im-internet.de/sgb_5/__241.html',
      name: 'Sozialgesetzbuch (SGB) Fünftes Buch, § 241 Allgemeiner Beitragssatz',
      read: READ,
    },
    ministryFunding: {
      url: 'https://www.bundesgesundheitsministerium.de/finanzierung-gkv',
      name: 'Bundesministerium für Gesundheit, Finanzierung der gesetzlichen Krankenversicherung',
      read: READ,
    },
    ministryCeiling: {
      url: 'https://www.bundesgesundheitsministerium.de/service/begriffe-von-a-z/b/beitragsbemessungsgrenze/seite',
      name: 'Bundesministerium für Gesundheit, Beitragsbemessungsgrenze',
      read: READ,
    },
    socialCodeVoluntary: {
      url: 'https://www.gesetze-im-internet.de/sgb_5/__9.html',
      name: 'Sozialgesetzbuch (SGB) Fünftes Buch, § 9 Freiwillige Versicherung',
      read: REREAD,
    },
    socialCodeMembership: {
      url: 'https://www.gesetze-im-internet.de/sgb_5/__186.html',
      name: 'Sozialgesetzbuch (SGB) Fünftes Buch, § 186 Beginn der Mitgliedschaft Versicherungspflichtiger',
      read: READ,
    },
    ministryCareFunding: {
      url: 'https://www.bundesgesundheitsministerium.de/themen/pflege/online-ratgeber-pflege/die-pflegeversicherung/finanzierung',
      name: 'Bundesministerium für Gesundheit, Finanzierung der Pflegeversicherung',
      read: REREAD,
    },
  },
  versions: [
    {
      obligation: 'join-statutory-health-insurance',
      document: 'health-insurance',
      validFrom: REREAD,
      criteria: [],
      source: 'ministryInsured',
      labels: ['bmg-threshold-2026'],
      facts: [
        {
          key: 'generalAnnualEarningsThreshold',
          operator: 'equals',
          numericValue: 77400,
          currency: 'EUR',
          unit: 'year',
          textValue: 'the general employee annual earnings threshold for 2026',
          source: 'ministryInsured',
          labels: ['bmg-threshold-2026'],
        },
        {
          key: 'generalContributionRate',
          operator: 'equals',
          numericValue: 14.6,
          unit: 'percent',
          source: 'socialCodeGeneralRate',
          labels: ['sgb5-241-general-rate'],
        },
        {
          key: 'employeeAndEmployerShare',
          operator: 'equals',
          textValue: 'half each, of the general and the additional contribution',
          source: 'ministryFunding',
          labels: ['bmg-half-each'],
        },
        {
          key: 'assessmentCeiling',
          operator: 'equals',
          numericValue: 5812.5,
          currency: 'EUR',
          unit: 'month',
          source: 'ministryCeiling',
          labels: ['bmg-assessment-ceiling-monthly'],
        },
        {
          key: 'voluntaryMembershipNoticeWithin',
          operator: 'within',
          numericValue: 3,
          unit: 'months',
          textValue:
            'after starting employment, if you are taking up your first employment in Germany and are exempt from compulsory insurance under §6(1) no. 1; employment before or during vocational training does not count',
          source: 'socialCodeVoluntary',
          labels: ['sgb5-9-three-months'],
        },
        {
          key: 'compulsoryMembershipThroughEmploymentBegins',
          operator: 'equals',
          textValue: 'on the day the employment begins',
          source: 'socialCodeMembership',
          labels: ['sgb5-186-membership-begins'],
        },
      ],
      notes: { en: HEALTH_NOTES },
    },
    {
      obligation: 'pay-care-insurance-contributions',
      document: 'health-insurance',
      validFrom: REREAD,
      criteria: [],
      source: 'ministryCareFunding',
      labels: ['bmg-care-rate'],
      facts: [
        {
          key: 'careContributionRate',
          operator: 'equals',
          numericValue: 3.6,
          unit: 'percent',
          source: 'ministryCareFunding',
          labels: ['bmg-care-rate'],
        },
        {
          key: 'childlessCareContributionRate',
          operator: 'equals',
          numericValue: 4.2,
          unit: 'percent',
          source: 'ministryCareFunding',
          labels: ['bmg-care-rate'],
        },
        {
          key: 'careDiscountPerChild',
          operator: 'equals',
          numericValue: 0.25,
          unit: 'percentage points',
          textValue:
            'for each child from the second to the fifth, until the end of the month in which the child turns, or would have turned, 25',
          source: 'ministryCareFunding',
          labels: ['bmg-care-children-under-25'],
        },
        {
          key: 'employeeCareShare',
          operator: 'equals',
          numericValue: 1.8,
          unit: 'percent',
          source: 'ministryCareFunding',
          labels: ['bmg-care-other-states'],
        },
        {
          key: 'employerCareShare',
          operator: 'equals',
          numericValue: 1.8,
          unit: 'percent',
          source: 'ministryCareFunding',
          labels: ['bmg-care-other-states'],
        },
      ],
      notes: { en: CARE_NOTES },
    },
    {
      obligation: 'pay-care-insurance-contributions',
      document: 'health-insurance',
      validFrom: REREAD,
      criteria: [{ dimension: 'workRegion', value: 'DE-SN' }],
      source: 'ministryCareFunding',
      labels: ['bmg-care-saxony-split'],
      facts: [
        {
          key: 'employeeCareShare',
          operator: 'equals',
          numericValue: 2.3,
          unit: 'percent',
          source: 'ministryCareFunding',
          labels: ['bmg-care-saxony-split'],
        },
        {
          key: 'employerCareShare',
          operator: 'equals',
          numericValue: 1.3,
          unit: 'percent',
          source: 'ministryCareFunding',
          labels: ['bmg-care-saxony-split'],
        },
      ],
      notes: { en: SAXONY_NOTES },
    },
  ],
}
