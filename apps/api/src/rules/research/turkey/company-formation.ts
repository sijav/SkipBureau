import type { ResearchCase, ResearchVersion } from '../rows.js'

// Written from research/agreed/turkey/company-formation.md and nothing else, one file per research
// case, which the country's file composes (SB-232).

const READ = '2026-09-14'

// SB-213: the licence regulation was read again, for Article 4, which is the article that says who issues the
// licence. Its two definitions carry that day rather than READ, since every label of a version has to have been
// read on the day the version's source names.
const RUHSAT_READ = '2026-09-16'

// SB-204: the day the formation version stating a fee key wider than its evidence stops holding, and
// the day its successor starts. Half open, as the database reads a version's period, so there is no
// gap day and no day on which both answer. It is the same date as RUHSAT_READ by coincidence of when
// the work was done, and means something else, so it is named separately.
const ENDED = '2026-09-16'

// SB-207: the day formation stops being told to every reader arriving in Turkey and is told only to
// someone starting a company. The day AFTER the version above starts, deliberately: ending that one
// on the day it started would give it an empty period, and a version that was published, deployed
// and read back through the live API would have been in force on no day at all. The history trigger
// permits closing a started version from today on, but permitted is not the same as true.
const SCOPED = '2026-09-17'

// Where a reader is in their journey, not whether each duty binds them: each
// version for a founder opens its notes with the condition that does (SB-196).
const FOUNDER: ResearchVersion['criteria'] = [{ dimension: 'situation', value: 'company-founder' }]

export const CASE: ResearchCase = {
  document: 'company-formation',
  obligations: [
    {
      slug: 'form-a-limited-company',
      kind: 'registration',
      titles: {
        en: 'Form a limited company',
        fa: 'تأسیس شرکت با مسئولیت محدود',
      },
    },
    {
      slug: 'request-electronic-tax-notifications',
      kind: 'tax',
      titles: {
        en: 'Request electronic tax notifications',
        fa: 'درخواست ابلاغ الکترونیکی مالیاتی',
      },
    },
    {
      slug: 'get-a-tax-certificate',
      kind: 'tax',
      titles: { en: 'Get a tax certificate', fa: 'دریافت گواهی مالیاتی' },
    },
    {
      slug: 'register-an-employee-for-social-insurance',
      kind: 'insurance',
      titles: {
        en: 'Register an employee for social insurance',
        fa: 'ثبت کارمند در بیمه اجتماعی',
      },
    },
    {
      slug: 'get-a-workplace-licence',
      kind: 'permit',
      titles: { en: 'Get a workplace licence', fa: 'دریافت مجوز محل کسب' },
    },
    {
      slug: 'keep-company-books-electronically',
      kind: 'document',
      titles: {
        en: 'Keep company books electronically',
        fa: 'نگهداری الکترونیکی دفاتر شرکت',
      },
    },
  ],
  sources: {
    commercialCodeFormation: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf',
      name: 'Türk Ticaret Kanunu (6102), Madde 585',
      read: READ,
    },
    companyTypes: {
      url: 'https://ticaret.gov.tr/ic-ticaret/sirketler/sirket-bilgiler',
      name: 'Ticaret Bakanlığı, Şirket Bilgileri',
      read: READ,
    },
    commercialCodeCashCapital: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf',
      name: 'Türk Ticaret Kanunu (6102), Madde 585 ve 344',
      read: READ,
    },
    feesLaw: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.492.pdf',
      name: 'Harçlar Kanunu (492), Madde 123',
      read: READ,
    },
    competitionLaw: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.4054.pdf',
      name: 'Rekabetin Korunması Hakkında Kanun (4054), Madde 39',
      read: READ,
    },
    taxBrochureNotifications: {
      url: 'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fonceki-dokumanlar%2Fise_yeni_baslayan_kurumlar_vergisi_mukellefleri_2026.pdf',
      name: 'Gelir İdaresi Başkanlığı, İşe Yeni Başlayan Kurumlar Vergisi Mükelleflerinin Hak ve Ödevleri (Nisan 2026), Elektronik Tebligat',
      read: READ,
    },
    taxBrochureCertificate: {
      url: 'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fonceki-dokumanlar%2Fise_yeni_baslayan_kurumlar_vergisi_mukellefleri_2026.pdf',
      name: 'Gelir İdaresi Başkanlığı, İşe Yeni Başlayan Kurumlar Vergisi Mükelleflerinin Hak ve Ödevleri (Nisan 2026), Vergi Levhası',
      read: READ,
    },
    taxProcedureCommunique408: {
      url: 'https://gib.gov.tr/mevzuat/kanun/434/teblig/8006',
      name: "408 Sıra No'lu Vergi Usul Kanunu Genel Tebliği, 2.3 Vergi Levhasının Alınması ve Bulundurulması",
      read: READ,
    },
    employerDuties: {
      url: 'https://www.sgk.gov.tr/Content/Post/d9d838d8-6585-40f5-bbcc-47bd43c59bb4/Isverenin-Yukumlulukleri-2022-05-15-06-17-29',
      name: 'SGK, İşverenin Yükümlülükleri',
      read: READ,
    },
    workplaceLicenceRegulation: {
      url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=20059207&MevzuatTur=21&MevzuatTertip=5',
      name: 'İşyeri Açma ve Çalışma Ruhsatlarına İlişkin Yönetmelik, Madde 4 ve 6',
      // SB-213: this page was read again for Article 4, which is what says who issues the licence, so both of its
      // definitions carry that day. Every label of a version must be read on the day its source names.
      read: RUHSAT_READ,
    },
    electronicBooksAnnouncement: {
      url: 'https://ticaret.gov.tr/haberler/1-ocak-2026-tarihinden-sonra-kurulacak-sirketlerde-elektronik-ticari-defter-sistemi-zorunlu-olacak',
      name: 'Ticaret Bakanlığı, 1 Ocak 2026 tarihinden sonra kurulacak şirketlerde Elektronik Ticari Defter Sistemi zorunlu olacak',
      read: READ,
    },
  },
  versions: [
    {
      obligation: 'form-a-limited-company',
      document: 'company-formation',
      validFrom: READ,
      // SB-204: ended, and replaced by the successor below. Kept exactly as it was published,
      // because an answer asked for a day in this period is still served from it.
      validTo: ENDED,
      criteria: [],
      source: 'commercialCodeFormation',
      labels: ['ttk-585-1-limited'],
      facts: [
        {
          key: 'minimumCapital',
          operator: 'atLeast',
          numericValue: 50000,
          currency: 'TRY',
          source: 'companyTypes',
          labels: ['ticaret-limited-50000'],
        },
        {
          key: 'cashCapitalPaidWithin',
          operator: 'within',
          numericValue: 24,
          unit: 'months',
          source: 'commercialCodeCashCapital',
          labels: ['ttk-585-1-limited', 'ttk-344-1-twenty-four-months'],
        },
        {
          key: 'formationFee',
          operator: 'none',
          source: 'feesLaw',
          labels: ['law492-123-formation-exempt'],
        },
        {
          key: 'competitionLevy',
          operator: 'equals',
          numericValue: 0.04,
          unit: 'percent',
          source: 'competitionLaw',
          labels: ['law4054-39-c-levy'],
        },
      ],
      notes: {
        en: 'Forming a limited company, the same everywhere in Turkey: the minimum capital, how long cash capital may take to pay, the registry fee formation is exempt from, and the Competition Authority levy on the subscribed capital. Each chamber charges its own fees, which follow where the company registers and are not here.',
      },
    },
    {
      // SB-204: the same rule, stated with a fee key as wide as its evidence. Madde 123 exempts the
      // listed formation transactions from the fees written in LAW 492, not from a charge called the
      // registry fee, so formationFee told anything reading the key alone that forming a company is
      // free. It is not: the levy, the Gazette and the chamber all charge.
      //
      // The paragraph's "yargi harclari haric" is NOT an exception to this one, and reading it as
      // ours put a condition into the document that its own evidence does not carry. Footnote 50 of
      // the consolidated text shows the 6322 amendment adding that parenthesis inside the CREDIT
      // transactions clause, so it qualifies those and not company formation. The research
      // conversation caught it; it is written here so nobody restores it from the quote alone.
      // A started version is history, so the correction is this successor and not an edit, and the
      // version above is ended on the day this one starts. The law did not change on 2026-09-16: a
      // version records what this product served from a date, which is what changed.
      obligation: 'form-a-limited-company',
      document: 'company-formation',
      validFrom: ENDED,
      // SB-207: ended in turn, and replaced by the scoped version below. It said the right fees to
      // the wrong people: every reader arriving in Turkey, not only one starting a company.
      validTo: SCOPED,
      criteria: [],
      source: 'commercialCodeFormation',
      labels: ['ttk-585-1-limited'],
      facts: [
        {
          key: 'minimumCapital',
          operator: 'atLeast',
          numericValue: 50000,
          currency: 'TRY',
          source: 'companyTypes',
          labels: ['ticaret-limited-50000'],
        },
        {
          key: 'cashCapitalPaidWithin',
          operator: 'within',
          numericValue: 24,
          unit: 'months',
          source: 'commercialCodeCashCapital',
          labels: ['ttk-585-1-limited', 'ttk-344-1-twenty-four-months'],
        },
        {
          key: 'feesUnderLaw492',
          operator: 'none',
          source: 'feesLaw',
          labels: ['law492-123-formation-exempt'],
        },
        {
          key: 'competitionLevy',
          operator: 'equals',
          numericValue: 0.04,
          unit: 'percent',
          source: 'competitionLaw',
          labels: ['law4054-39-c-levy'],
        },
      ],
      notes: {
        en: 'Forming a limited company, the same everywhere in Turkey: the minimum capital, how long cash capital may take to pay, the fees of Law 492 that formation is exempt from, and the Competition Authority levy on the subscribed capital. That exemption is not the cost of forming a company: the levy, the Trade Registry Gazette and your chamber all charge, and each chamber charges its own fees, which follow where the company registers and are not here.',
      },
    },
    {
      // SB-207: the same rule, told only to someone starting a company. Written with no criteria, it
      // reached every reader arriving in Turkey, so a student was told to form a company they have no
      // reason to form while the duties that FOLLOW registration, which SB-196 scoped, first asked
      // them what they were doing. The owner, 2026-09-14: what is shown follows what the reader needs.
      //
      // The note is unchanged, deliberately. The five duties after registration each open by naming
      // the separate legal trigger that binds them, because each has one; here the act is the scope,
      // so 'Forming a limited company' already says who it is for and a rewrite would add no accuracy.
      obligation: 'form-a-limited-company',
      document: 'company-formation',
      validFrom: SCOPED,
      criteria: FOUNDER,
      source: 'commercialCodeFormation',
      labels: ['ttk-585-1-limited'],
      facts: [
        {
          key: 'minimumCapital',
          operator: 'atLeast',
          numericValue: 50000,
          currency: 'TRY',
          source: 'companyTypes',
          labels: ['ticaret-limited-50000'],
        },
        {
          key: 'cashCapitalPaidWithin',
          operator: 'within',
          numericValue: 24,
          unit: 'months',
          source: 'commercialCodeCashCapital',
          labels: ['ttk-585-1-limited', 'ttk-344-1-twenty-four-months'],
        },
        {
          key: 'feesUnderLaw492',
          operator: 'none',
          source: 'feesLaw',
          labels: ['law492-123-formation-exempt'],
        },
        {
          key: 'competitionLevy',
          operator: 'equals',
          numericValue: 0.04,
          unit: 'percent',
          source: 'competitionLaw',
          labels: ['law4054-39-c-levy'],
        },
      ],
      notes: {
        en: 'Forming a limited company, the same everywhere in Turkey: the minimum capital, how long cash capital may take to pay, the fees of Law 492 that formation is exempt from, and the Competition Authority levy on the subscribed capital. That exemption is not the cost of forming a company: the levy, the Trade Registry Gazette and your chamber all charge, and each chamber charges its own fees, which follow where the company registers and are not here.',
      },
    },
    {
      obligation: 'request-electronic-tax-notifications',
      document: 'company-formation',
      validFrom: READ,
      criteria: FOUNDER,
      source: 'taxBrochureNotifications',
      labels: ['gib-brochure-2026-e-tebligat'],
      facts: [
        {
          key: 'requestAfterCommencement',
          operator: 'within',
          numericValue: 15,
          unit: 'days',
          source: 'taxBrochureNotifications',
          labels: ['gib-brochure-2026-e-tebligat'],
        },
      ],
      notes: {
        en: 'For a corporate taxpayer, which a limited company is: request electronic notifications from the Revenue Administration within fifteen days of the day the company starts business, and use the e-Tebligat system from then on.',
      },
    },
    {
      obligation: 'get-a-tax-certificate',
      document: 'company-formation',
      validFrom: READ,
      criteria: FOUNDER,
      source: 'taxBrochureCertificate',
      labels: ['gib-brochure-2026-certificate-month'],
      facts: [
        {
          key: 'firstAfterLiability',
          operator: 'within',
          numericValue: 1,
          unit: 'months',
          source: 'taxBrochureCertificate',
          labels: ['gib-brochure-2026-certificate-month'],
        },
        {
          key: 'renewEachYearBy',
          operator: 'equals',
          textValue: '31 May',
          source: 'taxBrochureCertificate',
          labels: ['gib-brochure-2026-certificate-may'],
        },
        {
          key: 'renewAfterDeclarationDeadlineInSpecialPeriod',
          operator: 'within',
          numericValue: 1,
          unit: 'months',
          source: 'taxProcedureCommunique408',
          labels: ['gib-teblig-408-special-period'],
        },
      ],
      notes: {
        en: "For a corporate taxpayer, which a limited company is: get the tax certificate within a month of the company's tax liability being set up, then again each year by 31 May. A company with a special accounting period renews it within a month after its own declaration deadline instead of by 31 May.",
      },
    },
    {
      obligation: 'register-an-employee-for-social-insurance',
      document: 'company-formation',
      validFrom: READ,
      criteria: FOUNDER,
      source: 'employerDuties',
      labels: ['sgk-employer-one-day'],
      facts: [
        {
          key: 'registerBeforeStart',
          operator: 'atLeast',
          numericValue: 1,
          unit: 'days',
          source: 'employerDuties',
          labels: ['sgk-employer-one-day'],
        },
      ],
      notes: {
        en: 'Once the company employs someone under a service contract: register them with SGK through e-sigorta at least a day before they start work. Construction, fishing and agriculture workplaces may register a worker on the day they start at the latest.',
      },
    },
    {
      obligation: 'get-a-workplace-licence',
      document: 'company-formation',
      validFrom: READ,
      criteria: FOUNDER,
      source: 'workplaceLicenceRegulation',
      // Article 6 says the licence comes from the authorised administrations and that they close premises opened
      // without one; Article 4 is what allocates them. The note rests on both, so the version names both (SB-213).
      labels: ['isyeri-ruhsat-reg-6-before-open', 'isyeri-ruhsat-reg-4-yetkili-idare'],
      facts: [
        {
          key: 'obtainBefore',
          operator: 'equals',
          textValue: 'opening',
          source: 'workplaceLicenceRegulation',
          labels: ['isyeri-ruhsat-reg-6-before-open'],
        },
      ],
      notes: {
        en: 'Where the premises and what is done there need an opening and operating licence: get it from the authorised administration before the premises open or operate. Premises opened without one are closed by that administration. Which administration issues the licence depends on where the premises are and which authority the law makes responsible.',
      },
    },
    {
      obligation: 'keep-company-books-electronically',
      document: 'company-formation',
      validFrom: READ,
      criteria: FOUNDER,
      source: 'electronicBooksAnnouncement',
      labels: ['ticaret-etds-2026'],
      facts: [
        {
          key: 'keptIn',
          operator: 'equals',
          textValue: 'ETDS',
          source: 'electronicBooksAnnouncement',
          labels: ['ticaret-etds-2026'],
        },
        {
          key: 'opensWith',
          operator: 'equals',
          textValue: 'registration',
          source: 'electronicBooksAnnouncement',
          labels: ['ticaret-etds-2026'],
        },
      ],
      notes: {
        en: "For a company registered from 1 January 2026: its share register and its general meeting minutes book are kept in the Ministry of Trade's electronic commercial books system, ETDS, which opens with the registration and needs no other step.",
      },
    },
  ],
}
