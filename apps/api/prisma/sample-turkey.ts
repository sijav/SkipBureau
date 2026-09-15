import { ADDRESS_GUIDE } from '../src/guide/obligation-groups.js'
import { WAS_FIRST_WEEK, type Both, type CountrySeed, type Kind } from '../src/sample-content.js'
import { SIM_CARD } from './sample-sim-card.js'

/**
 * Turkey's sample content, a test fixture since SB-282. The owner answered on 2026-09-15 that every Turkish sample row
 * is deleted from the deployed database and never refilled, so production's sample content no longer fills it and
 * retires what an earlier start wrote. prisma/seed.ts fills it for the tests, the e2e build and a local database, which
 * keep the Persian guide text and the steps their tests assert.
 */

// The eight areas of the Task hub design, Figma 81:589, for Start a business,
// and the one other route, 81:695. A kind only where the design labels one.
const BUSINESS: [slug: string, kind: Kind | null, en: string, fa: string, enDesc: string, faDesc: string][] = [
  [
    'choose-a-company-type',
    'decision',
    'Choose a company type',
    'انتخاب نوع شرکت',
    'Understand the main company structures and which situations they are commonly used for.',
    'با ساختارهای اصلی شرکت و موقعیت‌هایی که معمولا برای آن‌ها به کار می‌روند آشنا شوید.',
  ],
  [
    'register-your-company',
    null,
    'Register your company',
    'ثبت شرکت',
    'Understand the registration process and what needs to be prepared.',
    'با روند ثبت و آنچه باید آماده شود آشنا شوید.',
  ],
  [
    'get-a-business-address',
    null,
    'Get a business address',
    'تهیه نشانی تجاری',
    'Understand address requirements and what options may be available.',
    'با الزامات نشانی و گزینه‌های احتمالی آشنا شوید.',
  ],
  [
    'get-your-tax-setup-ready',
    null,
    'Get your tax setup ready',
    'آماده‌سازی امور مالیاتی',
    'Understand tax registration and the first administrative obligations.',
    'با ثبت مالیاتی و نخستین تعهدات اداری آشنا شوید.',
  ],
  [
    'open-a-business-bank-account',
    null,
    'Open a business bank account',
    'افتتاح حساب بانکی تجاری',
    'Understand when a business account is needed and what may be requested.',
    'بدانید چه زمانی حساب تجاری لازم است و چه مدارکی ممکن است خواسته شود.',
  ],
  [
    'work-in-your-own-company',
    'ifItApplies',
    'Work in your own company',
    'کار در شرکت خودتان',
    'Understand when founders may need separate permission to work.',
    'بدانید بنیان‌گذاران چه زمانی ممکن است به مجوز کار جداگانه نیاز داشته باشند.',
  ],
  [
    'hire-employees',
    'ifItApplies',
    'Hire employees',
    'استخدام کارمند',
    'Understand the basics of employing Turkish or foreign staff.',
    'با اصول استخدام نیروی ترک یا خارجی آشنا شوید.',
  ],
  [
    'set-up-accounting-and-invoicing',
    'ongoing',
    'Set up accounting & invoicing',
    'راه‌اندازی حسابداری و صدور فاکتور',
    'Understand ongoing accounting, invoicing and reporting responsibilities.',
    'با مسئولیت‌های مستمر حسابداری، صدور فاکتور و گزارش‌دهی آشنا شوید.',
  ],
  [
    'startup-and-tech-visa-programmes',
    'alternativeRoute',
    'Startup and tech visa programmes',
    'برنامه‌های ویزای استارتاپ و فناوری',
    'For founders exploring startup-specific immigration routes.',
    'برای بنیان‌گذارانی که مسیرهای مهاجرتی ویژه استارتاپ را بررسی می‌کنند.',
  ],
]

// The six guides of the Task hub design, Figma 81:659: titles and dates only.
// Their one source is the institution the design's citation card names.
const TRADE_REGISTRY = { url: 'https://ticaret.gov.tr/', name: 'Ministry of Trade · Trade Registry', publisher: 'Republic of Türkiye' }
const BUSINESS_GUIDES: [slug: string, category: string, en: string, fa: string, verified: string][] = [
  ['company-types', 'choose-a-company-type', 'Company types in Turkey', 'انواع شرکت در ترکیه', '2026-08-24'],
  ['how-company-registration-works', 'register-your-company', 'How company registration works', 'روند ثبت شرکت چگونه است', '2026-08-24'],
  ['business-addresses-explained', 'get-a-business-address', 'Business addresses explained', 'توضیح نشانی تجاری', '2026-07-15'],
  [
    'working-in-your-own-company',
    'work-in-your-own-company',
    'Working in your own company as a foreign founder',
    'کار در شرکت خودتان به‌عنوان بنیان‌گذار خارجی',
    '2026-08-24',
  ],
  ['hiring-foreign-employees', 'hire-employees', 'Hiring foreign employees', 'استخدام کارمند خارجی', '2026-08-24'],
  [
    'accounting-basics',
    'set-up-accounting-and-invoicing',
    'Accounting basics for new companies',
    'مبانی حسابداری برای شرکت‌های تازه‌تأسیس',
    '2026-07-15',
  ],
]

// Getting Settled's category hub, Figma 133:690.
const SETTLED_GUIDES: [slug: string, minutes: number, en: string, fa: string, enDesc: string, faDesc: string][] = [
  [
    'sim-card',
    4,
    'Get a SIM Card or eSIM',
    'تهیه سیم‌کارت یا eSIM',
    'Compare mobile operators and understand what documents you need.',
    'اپراتورهای تلفن همراه را مقایسه کنید و بدانید چه مدارکی لازم دارید.',
  ],
  [
    'register-your-phone',
    3,
    'Register Your Foreign Phone / IMEI',
    'ثبت گوشی خارجی / IMEI',
    'Understand when an imported phone needs to be registered in Turkey.',
    'بدانید چه زمانی گوشی واردشده باید در ترکیه ثبت شود.',
  ],
  [
    'home-internet',
    5,
    'Set Up Home Internet',
    'راه‌اندازی اینترنت خانگی',
    'Check infrastructure, compare providers and understand internet contracts.',
    'زیرساخت را بررسی کنید، ارائه‌دهندگان را مقایسه کنید و قراردادهای اینترنت را بشناسید.',
  ],
  [
    'utilities',
    4,
    'Connect Electricity, Water and Gas',
    'اتصال برق، آب و گاز',
    'Learn how to start or transfer utility subscriptions for your home.',
    'یاد بگیرید اشتراک خدمات خانه را چگونه آغاز یا منتقل کنید.',
  ],
  [
    'turkish-address',
    3,
    'Understand Your Turkish Address',
    'آشنایی با نشانی ترکیه‌ای',
    'Learn how Turkish addresses are structured and where your official address is used.',
    'یاد بگیرید نشانی‌های ترکیه چه ساختاری دارند و نشانی رسمی شما کجا به کار می‌رود.',
  ],
  [
    'essential-apps',
    4,
    'Essential Apps and Services',
    'برنامه‌ها و خدمات ضروری',
    'Find useful apps for transport, banking, delivery and everyday services.',
    'برنامه‌های کاربردی برای حمل‌ونقل، بانک، خرید و خدمات روزمره را پیدا کنید.',
  ],
]

const SETTLED_CHECKLIST: Both[] = [
  { en: 'Get a SIM Card or eSIM', fa: 'تهیه سیم‌کارت یا eSIM' },
  { en: 'Check whether your phone needs IMEI registration', fa: 'بررسی اینکه آیا گوشی شما به ثبت IMEI نیاز دارد' },
  { en: 'Arrange home internet', fa: 'ترتیب دادن اینترنت خانگی' },
  { en: 'Connect or transfer utility services', fa: 'اتصال یا انتقال خدمات شهری' },
  { en: 'Confirm your correct Turkish address', fa: 'اطمینان از درستی نشانی ترکیه‌ای خود' },
  { en: 'Install essential local apps', fa: 'نصب برنامه‌های محلی ضروری' },
]

export const TURKEY_SAMPLE: CountrySeed = {
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
    ...BUSINESS.map(([slug, kind, en, fa, enDesc, faDesc], position) => ({
      slug,
      task: 'start-a-business',
      position,
      kind,
      en,
      fa,
      enDesc,
      faDesc,
    })),
  ],
  details: [SIM_CARD],
  // Home's Common questions, Figma 60:742.
  questions: [
    {
      slug: 'company-without-residence',
      en: {
        question: 'Can I start a company without a residence permit?',
        answer: 'Yes — ownership and residence are separate. You can own 100% of a Turkish company.',
      },
      fa: {
        question: 'آیا بدون اجازه اقامت می‌توانم شرکت ثبت کنم؟',
        answer: 'بله، مالکیت و اقامت از هم جدا هستند. می‌توانید مالک صددرصد یک شرکت ترکیه‌ای باشید.',
      },
    },
    {
      slug: 'student-residence-documents',
      en: {
        question: 'What documents do I need for student residence?',
        answer: 'Nine documents. Three of them change depending on your nationality.',
      },
      fa: { question: 'برای اقامت دانشجویی به چه مدارکی نیاز دارم؟', answer: 'نه مدرک. سه مورد از آن‌ها بسته به ملیت شما تغییر می‌کند.' },
    },
    {
      slug: 'hire-an-iranian-employee',
      en: {
        question: 'Can my Turkish company hire an Iranian employee?',
        answer: 'Yes, subject to employment-ratio and salary conditions on the company.',
      },
      fa: {
        question: 'آیا شرکت ترکیه‌ای من می‌تواند کارمند ایرانی استخدام کند؟',
        answer: 'بله، به شرط رعایت نسبت استخدام و شرایط حقوق از سوی شرکت.',
      },
    },
    {
      slug: 'residence-by-buying-a-house',
      en: {
        question: 'Can I get residence if I buy a house?',
        answer: 'Buying property does not grant residence by itself, but it can support a short-term permit.',
      },
      fa: {
        question: 'آیا با خرید خانه می‌توانم اقامت بگیرم؟',
        answer: 'خرید ملک به‌تنهایی اقامت نمی‌دهد، اما می‌تواند پشتوانه اقامت کوتاه‌مدت باشد.',
      },
    },
  ],
  guides: [
    {
      slug: 'register-your-address',
      category: 'first-week',
      obligations: ADDRESS_GUIDE,
      en: {
        title: 'Register your address',
        description: 'What address registration in Turkey involves, and where it is done.',
        quickAnswer:
          'Go to the district population directorate once you have somewhere to live. Take your passport and your rental contract.',
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
            {
              en: 'Get a tax number first, because everything else asks for it.',
              fa: 'ابتدا شماره مالیاتی بگیرید، چون بقیه کارها آن را می‌خواهند.',
            },
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
      sources:
        index < 2
          ? [
              {
                url: 'https://www.btk.gov.tr/',
                name: 'Information and Communication Technologies Authority',
                publisher: 'Republic of Türkiye',
              },
            ]
          : [],
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
}
