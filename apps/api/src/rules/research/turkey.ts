import type { ResearchRules } from './rows.js'

// Written from research/agreed/turkey and nothing else. A fact's page is chosen
// as this folder's SB-190 plan says, and test/research-rules.e2e.spec.ts reads
// every label back from the agreed document it names.

const READ = '2026-09-14'

export const TURKEY: ResearchRules = {
  country: 'tr',
  research: 'turkey',
  obligations: [{ slug: 'form-a-limited-company', kind: 'registration', titles: { en: 'Form a limited company', fa: 'تأسیس شرکت با مسئولیت محدود' } }],
  sources: {
    companyTypes: { url: 'https://ticaret.gov.tr/ic-ticaret/sirketler/sirket-bilgiler', name: 'Ticaret Bakanlığı, Şirket Bilgileri', read: READ },
    commercialCodeFormation: { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf', name: 'Türk Ticaret Kanunu (6102), Madde 585', read: READ },
    commercialCodeCashCapital: { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf', name: 'Türk Ticaret Kanunu (6102), Madde 585 ve 344', read: READ },
    feesLaw: { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.492.pdf', name: 'Harçlar Kanunu (492), Madde 123', read: READ },
    competitionLaw: { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.4054.pdf', name: 'Rekabetin Korunması Hakkında Kanun (4054), Madde 39', read: READ },
  },
  versions: [
    {
      obligation: 'form-a-limited-company',
      document: 'company-formation',
      validFrom: READ,
      criteria: [],
      source: 'commercialCodeFormation',
      labels: ['ttk-585-1-limited'],
      facts: [
        { key: 'minimumCapital', operator: 'atLeast', numericValue: 50000, currency: 'TRY', source: 'companyTypes', labels: ['ticaret-limited-50000'] },
        {
          key: 'cashCapitalPaidWithin',
          operator: 'within',
          numericValue: 24,
          unit: 'months',
          source: 'commercialCodeCashCapital',
          labels: ['ttk-585-1-limited', 'ttk-344-1-twenty-four-months'],
        },
        { key: 'formationFee', operator: 'none', source: 'feesLaw', labels: ['law492-123-formation-exempt'] },
        { key: 'competitionLevy', operator: 'equals', numericValue: 0.04, unit: 'percent', source: 'competitionLaw', labels: ['law4054-39-c-levy'] },
      ],
      notes: {
        en: 'Forming a limited company, the same everywhere in Turkey: the minimum capital, how long cash capital may take to pay, the registry fee formation is exempt from, and the Competition Authority levy on the subscribed capital. Each chamber charges its own fees, which follow where the company registers and are not here.',
      },
    },
  ],
}
