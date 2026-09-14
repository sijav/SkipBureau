import type { ResearchRules, ResearchVersion } from './rows.js'

// Written from research/agreed/turkey and nothing else. A fact's page is chosen
// as this folder's SB-190 plan says, and test/research-rules.e2e.spec.ts reads
// every label back from the agreed document it names.

const READ = '2026-09-14'

// Where a reader is in their journey, not whether each duty binds them: each
// version for a founder opens its notes with the condition that does (SB-196).
const FOUNDER: ResearchVersion['criteria'] = [{ dimension: 'situation', value: 'company-founder' }]

export const TURKEY: ResearchRules = {
  country: 'tr',
  research: 'turkey',
  statuses: [{ code: 'tr.residence-permit', parent: null, names: { en: 'Residence permit', fa: 'اجازه اقامت' } }],
  obligations: [
    { slug: 'form-a-limited-company', kind: 'registration', titles: { en: 'Form a limited company', fa: 'تأسیس شرکت با مسئولیت محدود' } },
    { slug: 'join-general-health-insurance', kind: 'insurance', titles: { en: 'Join general health insurance', fa: 'ثبت‌نام در بیمه سلامت عمومی' } },
    { slug: 'request-electronic-tax-notifications', kind: 'tax', titles: { en: 'Request electronic tax notifications', fa: 'درخواست ابلاغ الکترونیکی مالیاتی' } },
    { slug: 'get-a-tax-certificate', kind: 'tax', titles: { en: 'Get a tax certificate', fa: 'دریافت گواهی مالیاتی' } },
    { slug: 'register-an-employee-for-social-insurance', kind: 'insurance', titles: { en: 'Register an employee for social insurance', fa: 'ثبت کارمند در بیمه اجتماعی' } },
    { slug: 'get-a-workplace-licence', kind: 'permit', titles: { en: 'Get a workplace licence', fa: 'دریافت مجوز محل کسب' } },
    { slug: 'keep-company-books-electronically', kind: 'document', titles: { en: 'Keep company books electronically', fa: 'نگهداری الکترونیکی دفاتر شرکت' } },
  ],
  sources: {
    companyTypes: { url: 'https://ticaret.gov.tr/ic-ticaret/sirketler/sirket-bilgiler', name: 'Ticaret Bakanlığı, Şirket Bilgileri', read: READ },
    commercialCodeFormation: { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf', name: 'Türk Ticaret Kanunu (6102), Madde 585', read: READ },
    commercialCodeCashCapital: { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf', name: 'Türk Ticaret Kanunu (6102), Madde 585 ve 344', read: READ },
    feesLaw: { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.492.pdf', name: 'Harçlar Kanunu (492), Madde 123', read: READ },
    competitionLaw: { url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.4054.pdf', name: 'Rekabetin Korunması Hakkında Kanun (4054), Madde 39', read: READ },
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
    socialInsuranceLawPremium: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5510.pdf',
      name: 'Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu (5510), Madde 81',
      read: READ,
    },
    healthServiceConditions: {
      url: 'https://www.sgk.gov.tr/Content/Post/4d85599f-e810-4755-a81b-02be5c253d60/Yurtici-2022-08-23-04-08-30',
      name: 'SGK, Sağlık Hizmetlerinden Yararlanma Şartları',
      read: READ,
    },
    healthInsuranceGuide: {
      url: 'https://www.sgk.gov.tr/Download/DownloadFileStatics?d=YAYINLARIMIZ&f=GSS_Sistemi_Kitabi_TR.pdf',
      name: 'SGK, Genel Sağlık Sigortası Sistemi, Prime Esas Kazançlar ve Prim Oranları',
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
      name: 'İşyeri Açma ve Çalışma Ruhsatlarına İlişkin Yönetmelik, Madde 6',
      read: READ,
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
        { key: 'premiumRate', operator: 'equals', numericValue: 12, unit: 'percent', source: 'socialInsuranceLawPremium', labels: ['sgb5510-81-1f-twelve-percent'] },
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
      facts: [{ key: 'registerBeforeStart', operator: 'atLeast', numericValue: 1, unit: 'days', source: 'employerDuties', labels: ['sgk-employer-one-day'] }],
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
      labels: ['isyeri-ruhsat-reg-6-before-open'],
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
        en: 'Where the premises and what is done there need an opening and operating licence: get it from the authorised administration before the premises open or operate. Premises opened without one are closed by that administration, and which administration issues it depends on where the premises are.',
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
        { key: 'keptIn', operator: 'equals', textValue: 'ETDS', source: 'electronicBooksAnnouncement', labels: ['ticaret-etds-2026'] },
        { key: 'opensWith', operator: 'equals', textValue: 'registration', source: 'electronicBooksAnnouncement', labels: ['ticaret-etds-2026'] },
      ],
      notes: {
        en: "For a company registered from 1 January 2026: its share register and its general meeting minutes book are kept in the Ministry of Trade's electronic commercial books system, ETDS, which opens with the registration and needs no other step.",
      },
    },
  ],
}
