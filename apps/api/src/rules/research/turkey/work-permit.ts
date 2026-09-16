import type { ResearchCase, ResearchVersion } from '../rows.js'

// Written from research/agreed/turkey/work-permit.md and nothing else, one file per research
// case, which the country's file composes (SB-232).

const READ = '2026-09-14'

// The same for a reader who works, or is coming to work, in Turkey (SB-193).
const WORKER: ResearchVersion['criteria'] = [{ dimension: 'situation', value: 'worker' }]

// SB-216: Law 6735 Article 22(1) puts the fifteen day report on the employer, so a founder who employs a foreigner
// is told it as well, by a version of their own. Neither scope covers the other, so a reader who has said which they
// are gets one of them and a reader who has said neither is still asked.
const FOUNDER: ResearchVersion['criteria'] = [{ dimension: 'situation', value: 'company-founder' }]

export const CASE: ResearchCase = {
  document: 'work-permit',
  obligations: [
    {
      slug: 'get-a-work-permit',
      kind: 'permit',
      titles: { en: 'Get a work permit', fa: 'دریافت مجوز کار' },
    },
    {
      slug: 'report-employment-starting-and-ending',
      kind: 'deadline',
      titles: {
        en: 'Report when employment starts or ends',
        fa: 'گزارش شروع و پایان اشتغال',
      },
    },
    {
      slug: 'apply-for-a-residence-permit-after-a-work-permit',
      kind: 'permit',
      titles: {
        en: 'Apply for a residence permit after a work permit ends',
        fa: 'درخواست اجازه اقامت پس از پایان مجوز کار',
      },
    },
    {
      slug: 'keep-working-while-an-extension-is-assessed',
      kind: 'permit',
      titles: {
        en: 'Keep working while an extension is assessed',
        fa: 'ادامه کار در زمان بررسی تمدید',
      },
    },
  ],
  sources: {
    workPermitCriteria: {
      url: 'https://www.csgb.gov.tr/uigm/calisma-izni/calisma-izni-degerlendirme-kriterleri/',
      name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Çalışma İzni Değerlendirme Kriterleri',
      read: READ,
    },
    workPermitFeePage: {
      url: 'https://www.csgb.gov.tr/uigm/genel-bilgi/harc-ve-degerli-k%C3%A2git-bedelinin-odenmesi/',
      name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Harç ve Değerli Kâğıt Bedelinin Ödenmesi',
      read: READ,
    },
    workPermitQuestions: {
      url: 'https://www.csgb.gov.tr/sikca-sorulan-sorular/uluslararasi-%C4%B1sgucu-genel-mudurlugu/calisma-%C4%B1zni/',
      name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Çalışma İzni Sıkça Sorulan Sorular',
      read: READ,
    },
    minimumWagePage: {
      url: 'https://www.csgb.gov.tr/tr/poco-pages/asgari-ucret/',
      name: 'Çalışma ve Sosyal Güvenlik Bakanlığı, Asgari Ücret',
      read: READ,
    },
    internationalLabourLaw: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6735.pdf',
      name: 'Uluslararası İşgücü Kanunu (6735), Madde 22',
      read: READ,
    },
    foreignersRegulationArticle21: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.21460.pdf',
      name: 'Yabancılar ve Uluslararası Koruma Kanununun Uygulanmasına İlişkin Yönetmelik, Madde 21',
      read: READ,
    },
    labourForceRegulation: {
      url: 'https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.39337.pdf',
      name: 'Uluslararası İşgücü Kanunu Uygulama Yönetmeliği, Madde 27',
      read: READ,
    },
  },
  versions: [
    {
      obligation: 'get-a-work-permit',
      document: 'work-permit',
      validFrom: READ,
      criteria: WORKER,
      source: 'workPermitCriteria',
      labels: ['csgb-criteria-a-1-1'],
      facts: [
        {
          key: 'permitFeeUpToOneYear',
          operator: 'equals',
          numericValue: 12574.9,
          currency: 'TRY',
          source: 'workPermitFeePage',
          labels: ['csgb-fee-page-12574'],
        },
        {
          key: 'cardFee',
          operator: 'equals',
          numericValue: 964,
          currency: 'TRY',
          source: 'workPermitFeePage',
          labels: ['csgb-fee-page-card-964'],
        },
        {
          key: 'residencePermitIssuedForAtLeast',
          operator: 'atLeast',
          numericValue: 6,
          unit: 'months',
          source: 'workPermitQuestions',
          labels: ['csgb-faq-9-six-months'],
        },
        {
          key: 'residencePermitValidOn',
          operator: 'equals',
          textValue: 'the day of application',
          source: 'workPermitQuestions',
          labels: ['csgb-faq-9-six-months'],
        },
        {
          key: 'turkishEmployeesPerForeigner',
          operator: 'atLeast',
          numericValue: 5,
          unit: 'Turkish employees for each foreigner',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-1-1'],
        },
        {
          key: 'paidInCapitalNewBusiness',
          operator: 'atLeast',
          numericValue: 500000,
          currency: 'TRY',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-2'],
        },
        {
          key: 'paidInCapitalEstablishedBusiness',
          operator: 'atLeast',
          numericValue: 500000,
          currency: 'TRY',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-2'],
        },
        {
          key: 'netSalesEstablishedBusiness',
          operator: 'atLeast',
          numericValue: 8000000,
          currency: 'TRY',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-2'],
        },
        {
          key: 'exportsEstablishedBusiness',
          operator: 'atLeast',
          numericValue: 150000,
          currency: 'USD',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-2'],
        },
        {
          key: 'salarySeniorExecutivesAndPilots',
          operator: 'atLeast',
          numericValue: 5,
          unit: 'times the gross minimum wage',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-3-1'],
        },
        {
          key: 'salaryEngineersAndArchitects',
          operator: 'atLeast',
          numericValue: 4,
          unit: 'times the gross minimum wage',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-3-1'],
        },
        {
          key: 'salaryOtherManagers',
          operator: 'atLeast',
          numericValue: 3,
          unit: 'times the gross minimum wage',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-3-1'],
        },
        {
          key: 'salaryExpertiseOrMastery',
          operator: 'atLeast',
          numericValue: 2,
          unit: 'times the gross minimum wage',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-3-1'],
        },
        {
          key: 'salaryDomesticAndOtherWork',
          operator: 'atLeast',
          numericValue: 1,
          unit: 'times the gross minimum wage',
          source: 'workPermitCriteria',
          labels: ['csgb-criteria-a-3-1'],
        },
        {
          key: 'grossMinimumWage',
          operator: 'equals',
          numericValue: 33030,
          unit: 'per month',
          currency: 'TRY',
          source: 'minimumWagePage',
          labels: ['csgb-minimum-wage-2026'],
        },
        {
          key: 'netMinimumWage',
          operator: 'equals',
          numericValue: 28075.5,
          unit: 'per month',
          currency: 'TRY',
          source: 'minimumWagePage',
          labels: ['csgb-minimum-wage-2026-net'],
        },
      ],
      notes: {
        en: "Where your employer applies for your work permit, as it normally does: applied for from inside Turkey, it needs a residence permit issued for at least six months and still valid that day, which is not six months remaining. A business keeping a balance sheet needs five Turkish employees for each foreigner, and 500,000 lira of paid-in capital if it is new; an established one needs that capital, 8 million lira of net sales or 150,000 US dollars of exports, any one of them. The salary must be at least the multiple of the gross minimum wage in force on the day of application for the kind of job, and no official page publishing the multiplied figures was found. The employee quota is waived for up to five foreigners where last year's net sales reach 50 million lira. From 3 August 2026, for an application made from inside Turkey, the employment and financial criteria are not applied for up to three foreigners who lawfully stayed in Turkey for at least a year of the last three under a work permit, a residence permit or international protection, and in a workplace using that relief the foreigners working there on a permit may not outnumber its Turkish employees. A long-term residence permit holder, or a foreigner married to a Turkish citizen for at least three years, is exempt from the employment, financial and salary criteria, shown with documents from public bodies.",
      },
    },
    {
      obligation: 'report-employment-starting-and-ending',
      document: 'work-permit',
      validFrom: READ,
      criteria: WORKER,
      source: 'internationalLabourLaw',
      labels: ['law6735-22-1-fifteen-days'],
      facts: [
        {
          key: 'reportWithin',
          operator: 'within',
          numericValue: 15,
          unit: 'days',
          source: 'internationalLabourLaw',
          labels: ['law6735-22-1-fifteen-days'],
        },
      ],
      notes: {
        en: 'For a worker: your employer must tell the Ministry within fifteen days when work under your permit or exemption starts or ends, or when cancellation is required. If you hold an indefinite or independent work permit, you have that reporting duty yourself. It is a reporting duty and not a grace period for the worker, whose permit is liable to cancellation when the employment ends.',
      },
    },
    {
      // SB-216: the same duty as the employer's own, since Article 22(1) puts it on them. Its own version rather than
      // a wider scope, because neither situation covers the other and a reader who has said neither must still be
      // asked which they are.
      obligation: 'report-employment-starting-and-ending',
      document: 'work-permit',
      validFrom: READ,
      criteria: FOUNDER,
      source: 'internationalLabourLaw',
      labels: ['law6735-22-1-fifteen-days'],
      facts: [
        {
          key: 'reportWithin',
          operator: 'within',
          numericValue: 15,
          unit: 'days',
          source: 'internationalLabourLaw',
          labels: ['law6735-22-1-fifteen-days'],
        },
      ],
      notes: {
        en: "For the employer: tell the Ministry within fifteen days when work under a foreign employee's permit or exemption starts or ends, or when cancellation is required. This is your reporting duty.",
      },
    },
    {
      obligation: 'apply-for-a-residence-permit-after-a-work-permit',
      document: 'work-permit',
      validFrom: READ,
      criteria: WORKER,
      source: 'foreignersRegulationArticle21',
      labels: ['yukk-reg-21-6-ten-days'],
      facts: [
        {
          key: 'applyWithin',
          operator: 'within',
          numericValue: 10,
          unit: 'days',
          source: 'foreignersRegulationArticle21',
          labels: ['yukk-reg-21-6-ten-days'],
        },
      ],
      notes: {
        en: 'Once your work permit has been cancelled or has ended: a residence permit application you make within ten days is decided under Article 22 of Law 6458. It gives neither permission to work nor an unconditional period to look for a job, and the day the ten days run from, and whether the days before the application count as lawful residence, could not be verified. The residence right that came with the work permit ends with it, but a separate residence permit that is still valid is not invalidated.',
      },
    },
    {
      obligation: 'keep-working-while-an-extension-is-assessed',
      document: 'work-permit',
      validFrom: READ,
      criteria: WORKER,
      source: 'labourForceRegulation',
      labels: ['ilf-reg-27-5-ninety-days'],
      facts: [
        {
          key: 'workWhileAssessedAtMost',
          operator: 'atMost',
          numericValue: 90,
          unit: 'days',
          source: 'labourForceRegulation',
          labels: ['ilf-reg-27-5-ninety-days'],
        },
      ],
      notes: {
        en: 'Only while a timely application to extend your work permit is assessed, for the same work at the same workplace: you may keep working from the day the permit ends, for no more than ninety days. A first application gives no such right, and no rule was found that extends your stay while a first application is decided.',
      },
    },
  ],
}
