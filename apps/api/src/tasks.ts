// The design's structure, not sample content: sample content and the researched guides' loader both read the goals
// from here, so a database without sample content still gets the goal a researched guide hangs its area on (SB-258).

// The twelve goals of Home, Figma 67:1261, in its order and with its copy.
// Where the design names Turkey the text says {country}, and "Hiring Turkish
// and foreign employees" says local, because this row is the same everywhere.
export const TASKS = [
  {
    slug: 'getting-settled',
    en: 'Getting Settled',
    fa: 'استقرار اولیه',
    enSub: 'Essential services to help you start everyday life in {country}.',
    faSub: 'خدمات ضروری برای شروع زندگی روزمره در {country}.',
  },
  {
    slug: 'get-a-residence-permit',
    en: 'Get a residence permit',
    fa: 'دریافت اجازه اقامت',
    enSub: 'Short-term, student, family and work permits',
    faSub: 'اقامت کوتاه‌مدت، دانشجویی، خانوادگی و کاری',
  },
  {
    slug: 'study',
    en: 'Study in {country}',
    fa: 'تحصیل در {country}',
    enSub: 'Applications, diploma recognition and student documents',
    faSub: 'درخواست پذیرش، ارزشیابی مدرک و مدارک دانشجویی',
  },
  {
    slug: 'work',
    en: 'Work in {country}',
    fa: 'کار در {country}',
    enSub: 'Work permits, contracts and social security',
    faSub: 'مجوز کار، قرارداد و تأمین اجتماعی',
  },
  {
    slug: 'hire-someone',
    en: 'Hire someone',
    fa: 'استخدام نیرو',
    enSub: 'Hiring local and foreign employees',
    faSub: 'استخدام نیروی محلی و خارجی',
  },
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
        areasIntro:
          'These are the areas most founders deal with. They are deliberately not numbered — the order that applies to you depends on your situation.',
        dependsNote:
          'Your nationality, residence status, company structure, and whether you plan to work in the company or hire staff can each change which of these areas apply and in what order.',
        otherRoutesIntro: 'Not part of company registration. These are separate routes some founders look into.',
      },
      fa: {
        heading: 'راه‌اندازی کسب‌وکار در {country}',
        intro: 'با تصمیم‌های اصلی، ثبت‌ها و مسئولیت‌های مستمری که راه‌اندازی کسب‌وکار در {country} در بر دارد آشنا شوید.',
        areasIntro:
          'این‌ها حوزه‌هایی هستند که بیشتر بنیان‌گذاران با آن‌ها سروکار دارند. عمدا شماره‌گذاری نشده‌اند، چون ترتیبی که برای شما صدق می‌کند به موقعیت شما بستگی دارد.',
        dependsNote:
          'ملیت، وضعیت اقامت، ساختار شرکت، و اینکه قصد دارید در شرکت کار کنید یا نیرو استخدام کنید، هر کدام می‌تواند تعیین کند کدام حوزه‌ها و به چه ترتیبی برای شما صدق می‌کنند.',
        otherRoutesIntro: 'بخشی از ثبت شرکت نیستند. این‌ها مسیرهای جداگانه‌ای هستند که برخی بنیان‌گذاران بررسی می‌کنند.',
      },
    },
  },
  {
    slug: 'banking-and-money',
    en: 'Banking & money',
    fa: 'بانک و پول',
    enSub: 'Tax numbers, bank accounts and moving money',
    faSub: 'شماره مالیاتی، حساب بانکی و انتقال پول',
  },
  {
    slug: 'taxes',
    en: 'Taxes',
    fa: 'مالیات',
    enSub: 'What you may owe, when and how filing works',
    faSub: 'چه مالیاتی ممکن است بدهکار باشید، کی، و اظهارنامه چگونه است',
  },
  {
    slug: 'renting-a-home',
    en: 'Renting a Home',
    fa: 'اجاره خانه',
    enSub: 'Contracts, deposits and utility responsibilities.',
    faSub: 'قرارداد، ودیعه و مسئولیت قبوض.',
  },
  {
    slug: 'transportation',
    en: 'Transportation',
    fa: 'حمل‌ونقل',
    enSub: 'Driving licences, vehicles and getting around.',
    faSub: 'گواهی‌نامه رانندگی، خودرو و رفت‌وآمد.',
  },
  {
    slug: 'health-and-insurance',
    en: 'Health & Insurance',
    fa: 'سلامت و بیمه',
    enSub: 'Public and private coverage and how to use it',
    faSub: 'پوشش دولتی و خصوصی و نحوه استفاده از آن',
  },
  {
    slug: 'family',
    en: 'Family',
    fa: 'خانواده',
    enSub: 'Family residence, marriage, births and schooling',
    faSub: 'اقامت خانوادگی، ازدواج، تولد و مدرسه',
  },
].map((task, position) => ({ ...task, position }))
