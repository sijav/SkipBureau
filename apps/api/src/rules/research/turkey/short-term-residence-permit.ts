import type { ResearchCase } from '../rows.js'

// Written from research/agreed/turkey/short-term-residence-permit.md and nothing else, one file per research
// case, which the country's file composes (SB-232).

const READ = '2026-09-14'

const HEALTH_INSURANCE_CIRCULAR =
  'https://www.seddk.gov.tr/upload/Vize%20ve%20%C4%B0kamet%20%C4%B0zni%20Taleplerinde%20Yapt%C4%B1r%C4%B1lacak%20Sa%C4%9Fl%C4%B1k%20Sigortalar%C4%B1na%20%C4%B0li%C5%9Fkin%20Genelgede%20De%C4%9Fi%C5%9Fiklik%20Yap%C4%B1lmas%C4%B1na%20Dair%20Genelge%20%282024-34%29.pdf'

export const CASE: ResearchCase = {
  document: 'short-term-residence-permit',
  statuses: [
    {
      code: 'tr.short-stay',
      parent: null,
      names: {
        en: 'A stay on a visa or visa exemption',
        fa: 'اقامت با ویزا یا معافیت از ویزا',
      },
    },
    {
      code: 'tr.short-stay.visa',
      parent: 'tr.short-stay',
      names: { en: 'Visa', fa: 'ویزا' },
    },
    {
      code: 'tr.short-stay.visa-exemption',
      parent: 'tr.short-stay',
      names: { en: 'Visa exemption', fa: 'معافیت از ویزا' },
    },
  ],
  nationalityGroups: [
    {
      code: 'tr.residence-permit-charge-exempt',
      name: "Nationalities exempt from Turkey's residence permit charge",
      members: ['cz', 'dk', 'ie', 'xk', 'np', 'lk', 'sy', 'tm', 'ps'].map((nationality) => ({ nationality, from: READ })),
    },
  ],
  obligations: [
    {
      slug: 'get-a-short-term-residence-permit',
      kind: 'permit',
      titles: {
        en: 'Get a short-term residence permit',
        fa: 'دریافت اجازه اقامت کوتاه‌مدت',
      },
    },
    {
      slug: 'pay-the-residence-permit-charge',
      kind: 'fee',
      titles: {
        en: 'Pay the residence permit charge',
        fa: 'پرداخت هزینه اجازه اقامت',
      },
    },
  ],
  sources: {
    foreignersLawStay: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6458.pdf',
      name: 'Yabancılar ve Uluslararası Koruma Kanunu (6458), Madde 11',
      read: READ,
    },
    foreignersRegulationArticle21: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.21460.pdf',
      name: 'Yabancılar ve Uluslararası Koruma Kanununun Uygulanmasına İlişkin Yönetmelik, Madde 21',
      read: READ,
    },
    migrationFeePage: {
      url: 'https://www.goc.gov.tr/belge-bedeli-ve-harc-miktari',
      name: 'Göç İdaresi Başkanlığı, Belge Bedeli ve Harç Miktarı',
      read: READ,
    },
    shortTermChecklist: {
      url: 'https://e-ikamet.goc.gov.tr/Ikamet/BasvuruIstenenBelgeler/BasvuruFormuIstenenBelgeler?tur=0',
      name: 'e-İkamet, Kısa Dönem İkamet İzni Başvurularında İstenen Belgeler',
      read: READ,
    },
    healthInsuranceCircular: {
      url: HEALTH_INSURANCE_CIRCULAR,
      name: 'SEDDK, Genelge 2024/34, Yıllık Asgari Teminat Limitleri',
      read: READ,
    },
  },
  versions: [
    {
      obligation: 'get-a-short-term-residence-permit',
      document: 'short-term-residence-permit',
      validFrom: READ,
      criteria: [{ dimension: 'residenceStatus', value: 'tr.short-stay' }],
      source: 'foreignersLawStay',
      labels: ['law6458-11-1-ninety-in-180'],
      facts: [
        {
          key: 'stayOnVisaOrExemption',
          operator: 'atMost',
          numericValue: 90,
          unit: 'days in any 180 days',
          source: 'foreignersLawStay',
          labels: ['law6458-11-1-ninety-in-180'],
        },
        {
          key: 'returnWhilePendingWithin',
          operator: 'within',
          numericValue: 15,
          unit: 'days',
          source: 'foreignersRegulationArticle21',
          labels: ['yukk-reg-21-9-d-fifteen-days'],
        },
        {
          key: 'cardFee',
          operator: 'equals',
          numericValue: 964,
          currency: 'TRY',
          source: 'migrationFeePage',
          labels: ['goc-fee-page-card-964'],
        },
        {
          key: 'cardFeeExemptionByNationality',
          operator: 'none',
          source: 'migrationFeePage',
          labels: ['goc-fee-page-card-964'],
        },
        {
          key: 'healthCoverSpans',
          operator: 'equals',
          textValue: 'the requested permit period',
          source: 'shortTermChecklist',
          labels: ['eikamet-checklist-cover-period'],
        },
        // The insurance regulator's minimum cover, read from the health insurance
        // research: a limit the policy must reach, a share it may leave the insured.
        {
          key: 'policyOutpatientLimitContracted',
          operator: 'atLeast',
          numericValue: 15000,
          currency: 'TRY',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-contracted'],
        },
        {
          key: 'policyOutpatientShareContracted',
          operator: 'atMost',
          numericValue: 20,
          unit: 'percent',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-contracted'],
        },
        {
          key: 'policyInpatientLimitContracted',
          operator: 'equals',
          textValue: 'unlimited',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-contracted'],
        },
        {
          key: 'policyInpatientShareContracted',
          operator: 'atMost',
          numericValue: 0,
          unit: 'percent',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-contracted'],
        },
        {
          key: 'policyOutpatientLimitNonContracted',
          operator: 'atLeast',
          numericValue: 15000,
          currency: 'TRY',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-non-contracted'],
        },
        {
          key: 'policyOutpatientShareNonContracted',
          operator: 'atMost',
          numericValue: 40,
          unit: 'percent',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-non-contracted'],
        },
        {
          key: 'policyInpatientLimitNonContracted',
          operator: 'atLeast',
          numericValue: 150000,
          currency: 'TRY',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-non-contracted'],
        },
        {
          key: 'policyInpatientShareNonContracted',
          operator: 'atMost',
          numericValue: 20,
          unit: 'percent',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-non-contracted'],
        },
        {
          key: 'policyOutpatientLimitAnnexOne',
          operator: 'atLeast',
          numericValue: 15000,
          currency: 'TRY',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-annex-1'],
        },
        {
          key: 'policyOutpatientShareAnnexOne',
          operator: 'atMost',
          numericValue: 20,
          unit: 'percent',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-annex-1'],
        },
        {
          key: 'policyInpatientLimitAnnexOne',
          operator: 'atLeast',
          numericValue: 250000,
          currency: 'TRY',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-annex-1'],
        },
        {
          key: 'policyInpatientShareAnnexOne',
          operator: 'atMost',
          numericValue: 0,
          unit: 'percent',
          document: 'health-insurance',
          source: 'healthInsuranceCircular',
          labels: ['seddk-2024-34-annex-1'],
        },
      ],
      notes: {
        en: "Only while your visa or visa-exempt stay is still valid: apply through e-İkamet before your own permitted stay ends, which is not ninety days after you arrive when your visa gives you fewer. The approved application document, with your passport and proof the charges are paid unless you are recorded as exempt, lets you leave and come back without a visa within fifteen days of each departure, within the period you asked for; beyond fifteen days, ordinary visa rules apply. The card fee is the same for every nationality, while the permit charge depends on yours. Your health cover must span the period you ask for and meet the insurance regulator's minimum, in force since 1 April 2025, by kind of provider; applicants under eighteen or over sixty-five need not obtain cover, but must submit any valid cover they have.",
      },
    },
    {
      obligation: 'pay-the-residence-permit-charge',
      document: 'short-term-residence-permit',
      validFrom: READ,
      criteria: [
        {
          dimension: 'nationalityGroup',
          value: 'tr.residence-permit-charge-exempt',
        },
      ],
      source: 'migrationFeePage',
      labels: ['goc-fee-page-exempt-ten'],
      facts: [
        {
          key: 'charge',
          operator: 'none',
          source: 'migrationFeePage',
          labels: ['goc-fee-page-exempt-ten'],
        },
      ],
      notes: {
        en: 'Only for a citizen of Czechia, Denmark, Ireland, Kosovo, Nepal, Sri Lanka, Syria, Turkmenistan or Palestine: the Migration Presidency names these nationalities as exempt from the residence permit charge on reciprocity. The card fee is still paid.',
      },
    },
  ],
}
