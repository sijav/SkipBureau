import type { ResearchCase } from '../rows.js'

// Written from research/agreed/turkey/health-insurance.md and nothing else, one file per research
// case, which the country's file composes (SB-232).

const READ = '2026-09-14'

export const CASE: ResearchCase = {
  document: 'health-insurance',
  statuses: [
    {
      code: 'tr.residence-permit',
      parent: null,
      names: { en: 'Residence permit', fa: 'اجازه اقامت' },
    },
  ],
  obligations: [
    {
      slug: 'join-general-health-insurance',
      kind: 'insurance',
      titles: {
        en: 'Join general health insurance',
        fa: 'ثبت‌نام در بیمه سلامت عمومی',
      },
    },
  ],
  sources: {
    socialInsuranceLawCover: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5510.pdf',
      name: 'Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu (5510), Madde 60',
      read: READ,
    },
    socialInsuranceLawRegistration: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5510.pdf',
      name: 'Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu (5510), Madde 61',
      read: READ,
    },
    healthServiceConditions: {
      url: 'https://www.sgk.gov.tr/Content/Post/4d85599f-e810-4755-a81b-02be5c253d60/Yurtici-2022-08-23-04-08-30',
      name: 'SGK, Sağlık Hizmetlerinden Yararlanma Şartları',
      read: READ,
    },
    socialInsuranceLawPremium: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5510.pdf',
      name: 'Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu (5510), Madde 81',
      read: READ,
    },
    healthInsuranceGuide: {
      url: 'https://www.sgk.gov.tr/Download/DownloadFileStatics?d=YAYINLARIMIZ&f=GSS_Sistemi_Kitabi_TR.pdf',
      name: 'SGK, Genel Sağlık Sigortası Sistemi, Prime Esas Kazançlar ve Prim Oranları',
      read: READ,
    },
  },
  versions: [
    {
      obligation: 'join-general-health-insurance',
      document: 'health-insurance',
      validFrom: READ,
      criteria: [{ dimension: 'residenceStatus', value: 'tr.residence-permit' }],
      source: 'socialInsuranceLawCover',
      labels: ['sgb5510-60-1d-foreign-residents'],
      facts: [
        // Article 61(1)(c): a year that has passed, then a request. No operator says
        // "more than", so the condition is kept whole as text.
        {
          key: 'residenceBeforeRequest',
          operator: 'equals',
          textValue: 'more than one year',
          source: 'socialInsuranceLawRegistration',
          labels: ['sgb5510-61-1c-after-a-year'],
        },
        {
          key: 'coverStartsAfterRequest',
          operator: 'equals',
          numericValue: 1,
          unit: 'days',
          source: 'socialInsuranceLawRegistration',
          labels: ['sgb5510-61-1c-after-a-year'],
        },
        {
          key: 'premiumDaysInPrecedingYear',
          operator: 'atLeast',
          numericValue: 30,
          unit: 'days',
          source: 'healthServiceConditions',
          labels: ['sgk-yurtici-thirty-days'],
        },
        {
          key: 'premiumRate',
          operator: 'equals',
          numericValue: 12,
          unit: 'percent',
          source: 'socialInsuranceLawPremium',
          labels: ['sgb5510-81-1f-twelve-percent'],
        },
        {
          key: 'premiumBase',
          operator: 'equals',
          numericValue: 2,
          unit: 'times the gross minimum wage',
          source: 'healthInsuranceGuide',
          labels: ['sgk-gss-guide-twice-minimum-wage'],
        },
      ],
      notes: {
        en: "Only for a residence permit holder who is not insured under a foreign country's law, which this rule cannot tell, so settle that first. Joining is not automatic: once your residence in Turkey has passed one year you ask SGK, and you are insured from the day after you ask. SGK's guide calls that year unbroken, but how it is counted and how days abroad break it could not be verified, so ask SGK. Routine treatment normally also needs thirty premium days in the year before it, waived when you move from another kind of cover or stop being a dependant, and, in this category, no unpaid premium debt, with the exceptions the law sets. Each month's premium is twelve per cent of twice the gross minimum wage.",
      },
    },
  ],
}
