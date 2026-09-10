import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'

/**
 * Sample content, illustrative and not verified, mostly the design's own
 * sample copy. The design prints its own caveat on Home: figures, timings and
 * requirements are sample content for review, not verified legal information.
 *
 * The owner's order of 2026-09-10 is to build the screens and publish them so
 * they can be seen, and the database behind the deployment is a test one. So
 * the entrypoint runs this on every start. Before a real launch it comes out of
 * the entrypoint, which is one line; see PHASE-NEXT.md.
 *
 * FILL-ONLY: it creates what is missing and never overwrites a row that
 * exists, so an editor's change survives a restart, and it can run on every
 * start at all.
 *
 * It keeps the thing that is easy to get wrong: **one task shared between two
 * countries**, with country-specific categories, guides and sources hanging
 * off it. `{country}` in a task's text is the country's name, filled in by the
 * reader's app in the reader's language, because the task itself is global.
 */

const VERIFIED = new Date('2026-09-10')

// The twelve goals of Home, Figma 67:1261, in its order and with its copy.
// Where the design names Turkey the text says {country}, and "Hiring Turkish
// and foreign employees" says local, because this row is the same everywhere.
const TASKS = [
  { slug: 'getting-settled', en: 'Getting Settled', fa: 'استقرار اولیه', enSub: 'Essential services to help you start everyday life in {country}.', faSub: 'خدمات ضروری برای شروع زندگی روزمره در {country}.' },
  { slug: 'get-a-residence-permit', en: 'Get a residence permit', fa: 'دریافت اجازه اقامت', enSub: 'Short-term, student, family and work permits', faSub: 'اقامت کوتاه‌مدت، دانشجویی، خانوادگی و کاری' },
  { slug: 'study', en: 'Study in {country}', fa: 'تحصیل در {country}', enSub: 'Applications, diploma recognition and student documents', faSub: 'درخواست پذیرش، ارزشیابی مدرک و مدارک دانشجویی' },
  { slug: 'work', en: 'Work in {country}', fa: 'کار در {country}', enSub: 'Work permits, contracts and social security', faSub: 'مجوز کار، قرارداد و تأمین اجتماعی' },
  { slug: 'hire-someone', en: 'Hire someone', fa: 'استخدام نیرو', enSub: 'Hiring local and foreign employees', faSub: 'استخدام نیروی محلی و خارجی' },
  {
    slug: 'start-a-business',
    en: 'Start a business',
    fa: 'راه‌اندازی کسب‌وکار',
    enSub: 'Company types, registration and first obligations',
    faSub: 'انواع شرکت، ثبت و نخستین تعهدات',
    // The task hub's copy, Figma 81:566, 81:585, 81:647 and 81:692.
    hub: {
      en: {
        heading: 'Start a business in {country}',
        intro: 'Understand the main decisions, registrations and ongoing responsibilities involved in setting up a business in {country}.',
        areasIntro: 'These are the areas most founders deal with. They are deliberately not numbered — the order that applies to you depends on your situation.',
        dependsNote: 'Your nationality, residence status, company structure, and whether you plan to work in the company or hire staff can each change which of these areas apply and in what order.',
        otherRoutesIntro: 'Not part of company registration. These are separate routes some founders look into.',
      },
      fa: {
        heading: 'راه‌اندازی کسب‌وکار در {country}',
        intro: 'با تصمیم‌های اصلی، ثبت‌ها و مسئولیت‌های مستمری که راه‌اندازی کسب‌وکار در {country} در بر دارد آشنا شوید.',
        areasIntro: 'این‌ها حوزه‌هایی هستند که بیشتر بنیان‌گذاران با آن‌ها سروکار دارند. عمدا شماره‌گذاری نشده‌اند، چون ترتیبی که برای شما صدق می‌کند به موقعیت شما بستگی دارد.',
        dependsNote: 'ملیت، وضعیت اقامت، ساختار شرکت، و اینکه قصد دارید در شرکت کار کنید یا نیرو استخدام کنید، هر کدام می‌تواند تعیین کند کدام حوزه‌ها و به چه ترتیبی برای شما صدق می‌کنند.',
        otherRoutesIntro: 'بخشی از ثبت شرکت نیستند. این‌ها مسیرهای جداگانه‌ای هستند که برخی بنیان‌گذاران بررسی می‌کنند.',
      },
    },
  },
  { slug: 'banking-and-money', en: 'Banking & money', fa: 'بانک و پول', enSub: 'Tax numbers, bank accounts and moving money', faSub: 'شماره مالیاتی، حساب بانکی و انتقال پول' },
  { slug: 'taxes', en: 'Taxes', fa: 'مالیات', enSub: 'What you may owe, when and how filing works', faSub: 'چه مالیاتی ممکن است بدهکار باشید، کی، و اظهارنامه چگونه است' },
  { slug: 'renting-a-home', en: 'Renting a Home', fa: 'اجاره خانه', enSub: 'Contracts, deposits and utility responsibilities.', faSub: 'قرارداد، ودیعه و مسئولیت قبوض.' },
  { slug: 'transportation', en: 'Transportation', fa: 'حمل‌ونقل', enSub: 'Driving licences, vehicles and getting around.', faSub: 'گواهی‌نامه رانندگی، خودرو و رفت‌وآمد.' },
  { slug: 'health-and-insurance', en: 'Health & Insurance', fa: 'سلامت و بیمه', enSub: 'Public and private coverage and how to use it', faSub: 'پوشش دولتی و خصوصی و نحوه استفاده از آن' },
  { slug: 'family', en: 'Family', fa: 'خانواده', enSub: 'Family residence, marriage, births and schooling', faSub: 'اقامت خانوادگی، ازدواج، تولد و مدرسه' },
].map((task, position) => ({ ...task, position }))

type Kind = 'decision' | 'ifItApplies' | 'ongoing' | 'alternativeRoute'

// The eight areas of the Task hub design, Figma 81:589, for Start a business,
// and the one other route, 81:695. A kind only where the design labels one.
const BUSINESS: [slug: string, kind: Kind | null, en: string, fa: string, enDesc: string, faDesc: string][] = [
  ['choose-a-company-type', 'decision', 'Choose a company type', 'انتخاب نوع شرکت', 'Understand the main company structures and which situations they are commonly used for.', 'با ساختارهای اصلی شرکت و موقعیت‌هایی که معمولا برای آن‌ها به کار می‌روند آشنا شوید.'],
  ['register-your-company', null, 'Register your company', 'ثبت شرکت', 'Understand the registration process and what needs to be prepared.', 'با روند ثبت و آنچه باید آماده شود آشنا شوید.'],
  ['get-a-business-address', null, 'Get a business address', 'تهیه نشانی تجاری', 'Understand address requirements and what options may be available.', 'با الزامات نشانی و گزینه‌های احتمالی آشنا شوید.'],
  ['get-your-tax-setup-ready', null, 'Get your tax setup ready', 'آماده‌سازی امور مالیاتی', 'Understand tax registration and the first administrative obligations.', 'با ثبت مالیاتی و نخستین تعهدات اداری آشنا شوید.'],
  ['open-a-business-bank-account', null, 'Open a business bank account', 'افتتاح حساب بانکی تجاری', 'Understand when a business account is needed and what may be requested.', 'بدانید چه زمانی حساب تجاری لازم است و چه مدارکی ممکن است خواسته شود.'],
  ['work-in-your-own-company', 'ifItApplies', 'Work in your own company', 'کار در شرکت خودتان', 'Understand when founders may need separate permission to work.', 'بدانید بنیان‌گذاران چه زمانی ممکن است به مجوز کار جداگانه نیاز داشته باشند.'],
  ['hire-employees', 'ifItApplies', 'Hire employees', 'استخدام کارمند', 'Understand the basics of employing Turkish or foreign staff.', 'با اصول استخدام نیروی ترک یا خارجی آشنا شوید.'],
  ['set-up-accounting-and-invoicing', 'ongoing', 'Set up accounting & invoicing', 'راه‌اندازی حسابداری و صدور فاکتور', 'Understand ongoing accounting, invoicing and reporting responsibilities.', 'با مسئولیت‌های مستمر حسابداری، صدور فاکتور و گزارش‌دهی آشنا شوید.'],
  ['startup-and-tech-visa-programmes', 'alternativeRoute', 'Startup and tech visa programmes', 'برنامه‌های ویزای استارتاپ و فناوری', 'For founders exploring startup-specific immigration routes.', 'برای بنیان‌گذارانی که مسیرهای مهاجرتی ویژه استارتاپ را بررسی می‌کنند.'],
]

// The six guides of the Task hub design, Figma 81:659: titles and dates only.
// Their one source is the institution the design's citation card names.
const TRADE_REGISTRY = { url: 'https://ticaret.gov.tr/', name: 'Ministry of Trade · Trade Registry', publisher: 'Republic of Türkiye' }
const BUSINESS_GUIDES: [slug: string, category: string, en: string, fa: string, verified: string][] = [
  ['company-types', 'choose-a-company-type', 'Company types in Turkey', 'انواع شرکت در ترکیه', '2026-08-24'],
  ['how-company-registration-works', 'register-your-company', 'How company registration works', 'روند ثبت شرکت چگونه است', '2026-08-24'],
  ['business-addresses-explained', 'get-a-business-address', 'Business addresses explained', 'توضیح نشانی تجاری', '2026-07-15'],
  ['working-in-your-own-company', 'work-in-your-own-company', 'Working in your own company as a foreign founder', 'کار در شرکت خودتان به‌عنوان بنیان‌گذار خارجی', '2026-08-24'],
  ['hiring-foreign-employees', 'hire-employees', 'Hiring foreign employees', 'استخدام کارمند خارجی', '2026-08-24'],
  ['accounting-basics', 'set-up-accounting-and-invoicing', 'Accounting basics for new companies', 'مبانی حسابداری برای شرکت‌های تازه‌تأسیس', '2026-07-15'],
]

type GuideText = { title: string; description?: string; quickAnswer?: string; cost?: string; time?: string }

type GuideSeed = {
  slug: string
  category: string
  obligation?: string
  verifiedAt?: Date
  position?: number
  readingMinutes?: number
  en: GuideText
  fa?: GuideText
  sections: { kind: 'whatYouNeed' | 'howToDoIt' | 'whereToDoIt' | 'importantToKnow'; en: string; fa?: string; steps?: { en: string; fa?: string }[] }[]
  options?: { en: string; fa?: string }[]
  sources: { url: string; name: string; publisher?: string }[]
}

type Both = { en: string; fa: string }

type CategorySeed = {
  slug: string
  task: string
  position: number
  kind?: Kind | null
  en: string
  fa: string
  enDesc?: string
  faDesc?: string
  /** A title this sample content used to give it, replaced where it is still exactly that. */
  was?: Both
  /** The category hub's recommended guide, by slug, and why to start there. */
  start?: string
  startReason?: Both
  askPrompt?: Both
  checklist?: Both[]
  /** Goals it points on to, by slug. */
  related?: string[]
}

// Getting Settled's category hub, Figma 133:690.
const SETTLED_GUIDES: [slug: string, minutes: number, en: string, fa: string, enDesc: string, faDesc: string][] = [
  ['sim-card', 4, 'Get a SIM Card or eSIM', 'تهیه سیم‌کارت یا eSIM', 'Compare mobile operators and understand what documents you need.', 'اپراتورهای تلفن همراه را مقایسه کنید و بدانید چه مدارکی لازم دارید.'],
  ['register-your-phone', 3, 'Register Your Foreign Phone / IMEI', 'ثبت گوشی خارجی / IMEI', 'Understand when an imported phone needs to be registered in Turkey.', 'بدانید چه زمانی گوشی واردشده باید در ترکیه ثبت شود.'],
  ['home-internet', 5, 'Set Up Home Internet', 'راه‌اندازی اینترنت خانگی', 'Check infrastructure, compare providers and understand internet contracts.', 'زیرساخت را بررسی کنید، ارائه‌دهندگان را مقایسه کنید و قراردادهای اینترنت را بشناسید.'],
  ['utilities', 4, 'Connect Electricity, Water and Gas', 'اتصال برق، آب و گاز', 'Learn how to start or transfer utility subscriptions for your home.', 'یاد بگیرید اشتراک خدمات خانه را چگونه آغاز یا منتقل کنید.'],
  ['turkish-address', 3, 'Understand Your Turkish Address', 'آشنایی با نشانی ترکیه‌ای', 'Learn how Turkish addresses are structured and where your official address is used.', 'یاد بگیرید نشانی‌های ترکیه چه ساختاری دارند و نشانی رسمی شما کجا به کار می‌رود.'],
  ['essential-apps', 4, 'Essential Apps and Services', 'برنامه‌ها و خدمات ضروری', 'Find useful apps for transport, banking, delivery and everyday services.', 'برنامه‌های کاربردی برای حمل‌ونقل، بانک، خرید و خدمات روزمره را پیدا کنید.'],
]

const SETTLED_CHECKLIST: Both[] = [
  { en: 'Get a SIM Card or eSIM', fa: 'تهیه سیم‌کارت یا eSIM' },
  { en: 'Check whether your phone needs IMEI registration', fa: 'بررسی اینکه آیا گوشی شما به ثبت IMEI نیاز دارد' },
  { en: 'Arrange home internet', fa: 'ترتیب دادن اینترنت خانگی' },
  { en: 'Connect or transfer utility services', fa: 'اتصال یا انتقال خدمات شهری' },
  { en: 'Confirm your correct Turkish address', fa: 'اطمینان از درستی نشانی ترکیه‌ای خود' },
  { en: 'Install essential local apps', fa: 'نصب برنامه‌های محلی ضروری' },
]

// The old sample title of the one Getting Settled category each country has.
const WAS_FIRST_WEEK = { en: 'Your first week', fa: 'هفته اول شما' }

const CATEGORY_TEXT_FILLS = ['startReason', 'askPrompt'] as const

const HUB_FIELDS = ['heading', 'intro', 'areasIntro', 'dependsNote', 'otherRoutesIntro'] as const
type HubCopy = Record<(typeof HUB_FIELDS)[number], string>

type QuestionText = { question: string; answer: string }

type QuestionSeed = { slug: string; guide?: string; en: QuestionText; fa?: QuestionText }

type CountrySeed = {
  code: string
  categories: CategorySeed[]
  guides: GuideSeed[]
  questions?: QuestionSeed[]
}

const COUNTRIES: CountrySeed[] = [
  {
    code: 'tr',
    categories: [
      {
        slug: 'first-week',
        task: 'getting-settled',
        position: 0,
        en: 'Getting Settled',
        fa: 'استقرار اولیه',
        enDesc: 'Essential services to help you start everyday life in Turkey.',
        faDesc: 'خدمات ضروری برای شروع زندگی روزمره در ترکیه.',
        was: WAS_FIRST_WEEK,
        start: 'sim-card',
        startReason: {
          en: 'Get connected first so you can use banking, transport, delivery and government services more easily.',
          fa: 'اول به تلفن و اینترنت وصل شوید تا بانک، حمل‌ونقل، خرید اینترنتی و خدمات دولتی را راحت‌تر به کار ببرید.',
        },
        askPrompt: {
          en: 'Ask about getting settled in Turkey and find the most relevant guide.',
          fa: 'درباره استقرار در ترکیه بپرسید و مرتبط‌ترین راهنما را پیدا کنید.',
        },
        checklist: SETTLED_CHECKLIST,
        related: ['renting-a-home', 'banking-and-money', 'health-and-insurance'],
      },
      ...BUSINESS.map(([slug, kind, en, fa, enDesc, faDesc], position) => ({ slug, task: 'start-a-business', position, kind, en, fa, enDesc, faDesc })),
    ],
    // Home's Common questions, Figma 60:742.
    questions: [
      {
        slug: 'company-without-residence',
        en: { question: 'Can I start a company without a residence permit?', answer: 'Yes — ownership and residence are separate. You can own 100% of a Turkish company.' },
        fa: { question: 'آیا بدون اجازه اقامت می‌توانم شرکت ثبت کنم؟', answer: 'بله، مالکیت و اقامت از هم جدا هستند. می‌توانید مالک صددرصد یک شرکت ترکیه‌ای باشید.' },
      },
      {
        slug: 'student-residence-documents',
        en: { question: 'What documents do I need for student residence?', answer: 'Nine documents. Three of them change depending on your nationality.' },
        fa: { question: 'برای اقامت دانشجویی به چه مدارکی نیاز دارم؟', answer: 'نه مدرک. سه مورد از آن‌ها بسته به ملیت شما تغییر می‌کند.' },
      },
      {
        slug: 'hire-an-iranian-employee',
        en: { question: 'Can my Turkish company hire an Iranian employee?', answer: 'Yes, subject to employment-ratio and salary conditions on the company.' },
        fa: { question: 'آیا شرکت ترکیه‌ای من می‌تواند کارمند ایرانی استخدام کند؟', answer: 'بله، به شرط رعایت نسبت استخدام و شرایط حقوق از سوی شرکت.' },
      },
      {
        slug: 'residence-by-buying-a-house',
        en: { question: 'Can I get residence if I buy a house?', answer: 'Buying property does not grant residence by itself, but it can support a short-term permit.' },
        fa: { question: 'آیا با خرید خانه می‌توانم اقامت بگیرم؟', answer: 'خرید ملک به‌تنهایی اقامت نمی‌دهد، اما می‌تواند پشتوانه اقامت کوتاه‌مدت باشد.' },
      },
    ],
    guides: [
      {
        slug: 'register-your-address',
        category: 'first-week',
        obligation: 'register-your-address',
        en: {
          title: 'Register your address',
          description: 'What address registration in Turkey involves, and where it is done.',
          quickAnswer: 'Go to the district population directorate once you have somewhere to live. Take your passport and your rental contract.',
          cost: 'Free',
          time: 'One appointment, usually under an hour',
        },
        fa: {
          title: 'ثبت نشانی محل سکونت',
          description: 'ثبت نشانی در ترکیه شامل چیست و کجا انجام می‌شود.',
          quickAnswer: 'پس از پیدا کردن محل سکونت به اداره نفوس منطقه بروید. گذرنامه و قرارداد اجاره را همراه ببرید.',
          cost: 'رایگان',
          time: 'یک نوبت، معمولا کمتر از یک ساعت',
        },
        sections: [
          {
            kind: 'whatYouNeed',
            en: 'Your passport, your rental contract, and the tax number you got first.',
            fa: 'گذرنامه، قرارداد اجاره، و شماره مالیاتی که پیش‌تر گرفته‌اید.',
          },
          {
            kind: 'howToDoIt',
            en: 'Book an appointment, then attend in person.',
            fa: 'ابتدا نوبت بگیرید، سپس حضوری مراجعه کنید.',
            steps: [
              { en: 'Get a tax number first, because everything else asks for it.', fa: 'ابتدا شماره مالیاتی بگیرید، چون بقیه کارها آن را می‌خواهند.' },
              { en: 'Book an appointment online.', fa: 'به صورت آنلاین نوبت بگیرید.' },
              { en: 'Attend with your documents.', fa: 'با مدارک خود حاضر شوید.' },
            ],
          },
        ],
        sources: [{ url: 'https://www.nvi.gov.tr/', name: 'Nufus ve Vatandaslik Isleri Genel Mudurlugu' }],
      },
      ...SETTLED_GUIDES.map(([slug, minutes, en, fa, enDesc, faDesc], index) => ({
        slug,
        category: 'first-week',
        position: index + 1,
        readingMinutes: minutes,
        verifiedAt: new Date('2026-09-08'),
        en: { title: en, description: enDesc },
        fa: { title: fa, description: faDesc },
        sections: [],
        sources: index < 2 ? [{ url: 'https://www.btk.gov.tr/', name: 'Information and Communication Technologies Authority', publisher: 'Republic of Türkiye' }] : [],
      })),
      ...BUSINESS_GUIDES.map(([slug, category, en, fa, verified]) => ({
        slug,
        category,
        verifiedAt: new Date(verified),
        en: { title: en },
        fa: { title: fa },
        sections: [],
        sources: [TRADE_REGISTRY],
      })),
    ],
  },
  {
    code: 'de',
    categories: [
      {
        slug: 'first-week',
        task: 'getting-settled',
        position: 0,
        en: 'Getting Settled',
        fa: 'استقرار اولیه',
        enDesc: 'Essential services to help you start everyday life in Germany.',
        faDesc: 'خدمات ضروری برای شروع زندگی روزمره در آلمان.',
        was: WAS_FIRST_WEEK,
      },
    ],
    guides: [
      {
        slug: 'anmeldung',
        category: 'first-week',
        obligation: 'register-your-address',
        en: {
          title: 'Register your address',
          description: 'The Anmeldung, which almost everything else in Germany depends on.',
          quickAnswer: 'Book a Buergeramt appointment and bring the confirmation your landlord signs. Without this you cannot open a bank account or get a tax id.',
          cost: 'Free',
          time: 'One appointment, but the wait for it can be weeks',
        },
        // Deliberately English only. A Persian reader must be told this exists
        // in English rather than shown a blank page, which is SB-049.
        sections: [
          {
            kind: 'whatYouNeed',
            en: 'Your passport, and a Wohnungsgeberbestaetigung signed by whoever provides the flat.',
          },
          {
            kind: 'importantToKnow',
            en: 'Appointments are scarce. Book before you have moved if you can.',
          },
        ],
        options: [{ en: 'Book online at any Buergeramt in the city, not only your own district.' }],
        sources: [{ url: 'https://www.berlin.de/einwohnermeldeamt/', name: 'Berlin Einwohnermeldeamt' }],
      },
    ],
  },
]

export const seedContent = async (prisma: PrismaClient): Promise<void> => {
  for (const task of TASKS) {
    const row = await prisma.task.upsert({
      where: { slug: task.slug },
      update: {},
      create: { slug: task.slug, position: task.position },
    })

    for (const [locale, title, subtitle, hub] of [
      ['en-US', task.en, task.enSub, 'hub' in task ? task.hub.en : null],
      ['fa-IR', task.fa, task.faSub, 'hub' in task ? task.hub.fa : null],
    ] as const) {
      const where = { taskId_locale: { taskId: row.id, locale } }
      const existing = await prisma.taskText.findUnique({ where })
      if (!existing) {
        await prisma.taskText.create({ data: { taskId: row.id, locale, title, subtitle, ...hub } })
        continue
      }

      // The hub's copy came after the goals did, so a row that exists may
      // still have it empty. Fill-only means empty columns too, never a
      // column an editor has written.
      const missing: Partial<HubCopy> = {}
      for (const field of HUB_FIELDS) if (hub && existing[field] === null) missing[field] = hub[field]
      if (Object.keys(missing).length > 0) await prisma.taskText.update({ where, data: missing })
    }
  }

  for (const country of COUNTRIES) {
    for (const category of country.categories) {
      const task = await prisma.task.findUniqueOrThrow({ where: { slug: category.task } })
      const row = await prisma.category.upsert({
        where: { countryCode_slug: { countryCode: country.code, slug: category.slug } },
        update: {},
        create: { countryCode: country.code, taskId: task.id, slug: category.slug, position: category.position, kind: category.kind ?? null },
      })
      // Kinds came after the categories did; fill one that is still empty.
      if (row.kind === null && category.kind) await prisma.category.update({ where: { id: row.id }, data: { kind: category.kind } })

      for (const [locale, title, description, was, extra] of [
        ['en-US', category.en, category.enDesc ?? null, category.was?.en, { startReason: category.startReason?.en, askPrompt: category.askPrompt?.en }],
        ['fa-IR', category.fa, category.faDesc ?? null, category.was?.fa, { startReason: category.startReason?.fa, askPrompt: category.askPrompt?.fa }],
      ] as const) {
        const where = { categoryId_locale: { categoryId: row.id, locale } }
        const existing = await prisma.categoryText.findUnique({ where })
        if (!existing) {
          await prisma.categoryText.create({ data: { categoryId: row.id, locale, title, description, startReason: extra.startReason ?? null, askPrompt: extra.askPrompt ?? null } })
          continue
        }

        // Fill-only: a column still empty, and a title still exactly what this
        // sample content used to give it. Never anything an editor wrote.
        const data: { title?: string; description?: string; startReason?: string; askPrompt?: string } = {}
        if (was !== undefined && existing.title === was) data.title = title
        if (existing.description === null && description !== null) data.description = description
        for (const field of CATEGORY_TEXT_FILLS) {
          const value = extra[field]
          if (existing[field] === null && value) data[field] = value
        }
        if (Object.keys(data).length > 0) await prisma.categoryText.update({ where, data })
      }
    }

    for (const guide of country.guides) {
      const category = await prisma.category.findUniqueOrThrow({
        where: { countryCode_slug: { countryCode: country.code, slug: guide.category } },
      })

      // A guide that exists is left alone whole: its options and sources have
      // no natural key, so filling them in again would duplicate them.
      const existing = await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode: country.code, slug: guide.slug } } })
      if (existing) continue

      const row = await prisma.guide.create({
        data: {
          countryCode: country.code,
          categoryId: category.id,
          slug: guide.slug,
          verifiedAt: guide.verifiedAt ?? VERIFIED,
          position: guide.position ?? 0,
          readingMinutes: guide.readingMinutes ?? null,
        },
      })

      const texts: [string, GuideSeed['en']][] = [['en-US', guide.en]]
      if (guide.fa) texts.push(['fa-IR', guide.fa])

      for (const [locale, text] of texts) {
        await prisma.guideText.upsert({
          where: { guideId_locale: { guideId: row.id, locale } },
          update: {},
          create: {
            guideId: row.id,
            locale,
            title: text.title,
            description: text.description ?? null,
            quickAnswer: text.quickAnswer ?? null,
            cost: text.cost ?? null,
            time: text.time ?? null,
          },
        })
      }

      for (const [position, section] of guide.sections.entries()) {
        const sectionRow = await prisma.guideSection.upsert({
          where: { guideId_kind: { guideId: row.id, kind: section.kind } },
          update: {},
          create: { guideId: row.id, kind: section.kind, position },
        })

        const bodies: [string, string][] = [['en-US', section.en]]
        if (section.fa) bodies.push(['fa-IR', section.fa])

        for (const [locale, body] of bodies) {
          await prisma.guideSectionText.upsert({
            where: { sectionId_locale: { sectionId: sectionRow.id, locale } },
            update: {},
            create: { sectionId: sectionRow.id, locale, body },
          })
        }

        for (const [stepPosition, step] of (section.steps ?? []).entries()) {
          const stepRow = await prisma.guideStep.upsert({
            where: { sectionId_position: { sectionId: sectionRow.id, position: stepPosition } },
            update: {},
            create: { sectionId: sectionRow.id, position: stepPosition },
          })

          const titles: [string, string][] = [['en-US', step.en]]
          if (step.fa) titles.push(['fa-IR', step.fa])

          for (const [locale, title] of titles) {
            await prisma.guideStepText.upsert({
              where: { stepId_locale: { stepId: stepRow.id, locale } },
              update: {},
              create: { stepId: stepRow.id, locale, title },
            })
          }
        }
      }

      for (const [position, option] of (guide.options ?? []).entries()) {
        const optionRow = await prisma.guideOption.create({ data: { guideId: row.id, position } })
        await prisma.guideOptionText.create({ data: { optionId: optionRow.id, locale: 'en-US', title: option.en } })
      }

      for (const [position, source] of guide.sources.entries()) {
        await prisma.guideSource.create({
          data: { guideId: row.id, url: source.url, name: source.name, publisher: source.publisher ?? null, verifiedAt: guide.verifiedAt ?? VERIFIED, position },
        })
      }

      if (guide.obligation) {
        const obligation = await prisma.obligation.findUnique({ where: { slug: guide.obligation } })
        if (obligation) {
          await prisma.guideObligation.upsert({
            where: { guideId_obligationId: { guideId: row.id, obligationId: obligation.id } },
            update: {},
            create: { guideId: row.id, obligationId: obligation.id, position: 0 },
          })
        }
      }
    }

    // After the guides: a category's recommended one, its checklist and the
    // goals it points on to. Each only where there is none yet.
    for (const category of country.categories) {
      const row = await prisma.category.findUniqueOrThrow({
        where: { countryCode_slug: { countryCode: country.code, slug: category.slug } },
        include: { checklist: true, related: true },
      })

      if (category.start && row.startGuideId === null) {
        const start = await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode: country.code, slug: category.start } } })
        if (start) await prisma.category.update({ where: { id: row.id }, data: { startGuideId: start.id } })
      }

      if (category.checklist && row.checklist.length === 0) {
        for (const [position, line] of category.checklist.entries()) {
          await prisma.checklistItem.create({
            data: {
              categoryId: row.id,
              position,
              texts: {
                create: [
                  { locale: 'en-US', label: line.en },
                  { locale: 'fa-IR', label: line.fa },
                ],
              },
            },
          })
        }
      }

      if (category.related && row.related.length === 0) {
        for (const [position, slug] of category.related.entries()) {
          const task = await prisma.task.findUnique({ where: { slug } })
          if (task) await prisma.relatedTask.create({ data: { categoryId: row.id, taskId: task.id, position } })
        }
      }
    }

    // After the guides, so a question can point at one.
    for (const [position, question] of (country.questions ?? []).entries()) {
      const guide = question.guide
        ? await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode: country.code, slug: question.guide } } })
        : null
      const row = await prisma.question.upsert({
        where: { countryCode_slug: { countryCode: country.code, slug: question.slug } },
        update: {},
        create: { countryCode: country.code, slug: question.slug, position, guideId: guide?.id ?? null },
      })

      const texts: [string, QuestionText][] = [['en-US', question.en]]
      if (question.fa) texts.push(['fa-IR', question.fa])

      for (const [locale, text] of texts) {
        await prisma.questionText.upsert({
          where: { questionId_locale: { questionId: row.id, locale } },
          update: {},
          create: { questionId: row.id, locale, question: text.question, answer: text.answer },
        })
      }
    }
  }
}

const main = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  try {
    await seedContent(prisma)
    console.log('sample content: filled in whatever was missing')
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1]?.includes('sample-content')) void main()
