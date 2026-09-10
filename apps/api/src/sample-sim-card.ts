import type { GuideDetailSeed } from './sample-types.js'

/**
 * The design's one fully written guide, Figma 143:734, Get a SIM Card or eSIM,
 * with its copy. Sample content like the rest: illustrative, not verified.
 */
export const SIM_CARD: GuideDetailSeed = {
  slug: 'sim-card',
  showDisclaimer: true,
  intro: {
    en: 'Get a Turkish mobile number and mobile data using a physical SIM or eSIM. Here’s what to prepare, which option may suit you, and what to check before choosing a plan.',
    fa: 'با سیم‌کارت فیزیکی یا eSIM یک شماره موبایل ترکیه و اینترنت همراه بگیرید. اینجا می‌بینید چه چیزهایی را آماده کنید، کدام گزینه ممکن است به کارتان بیاید، و پیش از انتخاب طرح چه چیزهایی را بررسی کنید.',
  },
  quickAnswer: {
    en: 'You can get a physical SIM or, if your phone supports it, an eSIM from a Turkish mobile operator. As a foreign customer you will usually need to show a valid identity document in store. If you brought your phone from abroad, check the separate IMEI registration rules before relying on it long-term.',
    fa: 'می‌توانید از یک اپراتور تلفن همراه ترکیه سیم‌کارت فیزیکی یا، اگر گوشی‌تان پشتیبانی کند، eSIM بگیرید. به‌عنوان مشتری خارجی معمولا باید در فروشگاه یک مدرک هویتی معتبر نشان دهید. اگر گوشی را از خارج آورده‌اید، پیش از اینکه برای مدت طولانی به آن تکیه کنید، قوانین جداگانه ثبت IMEI را بررسی کنید.',
  },
  cost: { en: 'Varies by operator, plan, SIM type and campaign', fa: 'بسته به اپراتور، طرح، نوع سیم‌کارت و جشنواره‌ها متفاوت است' },
  time: { en: 'Usually a short visit in store; depends on the operator and your documents', fa: 'معمولا یک مراجعه کوتاه به فروشگاه؛ بسته به اپراتور و مدارک شما' },
  costNote: {
    en: 'We do not publish prices or activation times here. Telecom pricing changes often, and any figure shown would be out of date before you read it — check the operator directly.',
    fa: 'ما اینجا قیمت یا زمان فعال‌سازی منتشر نمی‌کنیم. قیمت‌های مخابراتی اغلب تغییر می‌کنند و هر عددی پیش از خواندن شما کهنه می‌شود؛ مستقیما از اپراتور بپرسید.',
  },
  options: [
    {
      title: { en: 'Physical SIM', fa: 'سیم‌کارت فیزیکی' },
      body: { en: 'A card you put into your phone. Works with any phone that has a compatible SIM slot.', fa: 'کارتی که داخل گوشی قرار می‌دهید. با هر گوشی که شیار سیم‌کارت سازگار دارد کار می‌کند.' },
      bestFor: { en: 'Phones without eSIM support · moving the card between compatible devices', fa: 'گوشی‌های بدون پشتیبانی eSIM · جابه‌جا کردن کارت بین دستگاه‌های سازگار' },
    },
    {
      title: { en: 'eSIM', fa: 'eSIM' },
      body: { en: 'A digital SIM activated without a card, where your phone and the operator both support it.', fa: 'سیم‌کارت دیجیتالی که بدون کارت فعال می‌شود، به شرطی که گوشی و اپراتور هر دو پشتیبانی کنند.' },
      bestFor: { en: 'Newer compatible phones · keeping more than one SIM profile', fa: 'گوشی‌های سازگار جدیدتر · نگه داشتن بیش از یک پروفایل سیم‌کارت' },
      caveat: { en: 'Not every operator or plan offers eSIM. Check before you choose.', fa: 'همه اپراتورها یا طرح‌ها eSIM ارائه نمی‌دهند. پیش از انتخاب بررسی کنید.' },
    },
    {
      title: { en: 'Prepaid', fa: 'اعتباری' },
      body: { en: 'You pay up front and use the balance or package, with no regular monthly bill.', fa: 'از پیش پرداخت می‌کنید و از اعتبار یا بسته استفاده می‌کنید، بدون صورت‌حساب ماهانه.' },
      bestFor: { en: 'Short stays · simpler spending control · not committing yet', fa: 'اقامت‌های کوتاه · کنترل ساده‌تر هزینه · بدون تعهد، فعلا' },
    },
    {
      title: { en: 'Contract / postpaid', fa: 'قراردادی / دائمی' },
      body: { en: 'A monthly plan billed regularly on the operator’s terms.', fa: 'طرح ماهانه‌ای که طبق شرایط اپراتور به‌طور منظم صورت‌حساب می‌شود.' },
      bestFor: { en: 'Longer stays · a predictable monthly setup', fa: 'اقامت‌های طولانی‌تر · هزینه ماهانه قابل پیش‌بینی' },
      caveat: {
        en: 'Eligibility and required documents vary by operator. Not every plan is open to every customer.',
        fa: 'شرایط و مدارک لازم بسته به اپراتور متفاوت است. همه طرح‌ها برای همه مشتریان در دسترس نیستند.',
      },
    },
  ],
  sections: [
    {
      kind: 'yourOptions',
      body: { en: 'Two decisions really: how the SIM reaches your phone, and how you pay for it.', fa: 'در واقع دو تصمیم: سیم‌کارت چگونه به گوشی شما می‌رسد، و هزینه آن را چگونه می‌پردازید.' },
    },
    {
      kind: 'beforeYouStart',
      title: { en: 'Before you get a SIM', fa: 'پیش از تهیه سیم‌کارت' },
      steps: [
        { title: { en: 'Check whether your phone takes a physical SIM, an eSIM, or both.', fa: 'بررسی کنید گوشی شما سیم‌کارت فیزیکی، eSIM یا هر دو را می‌پذیرد.' } },
        { title: { en: 'Make sure your phone is unlocked and can use a Turkish mobile network.', fa: 'مطمئن شوید گوشی شما قفل نیست و می‌تواند از شبکه تلفن همراه ترکیه استفاده کند.' } },
        { title: { en: 'Decide whether you mainly need a Turkish phone number, or mainly mobile data.', fa: 'تصمیم بگیرید بیشتر به شماره تلفن ترکیه نیاز دارید یا به اینترنت همراه.' } },
        { title: { en: 'If you brought your phone from abroad, check whether IMEI registration applies to it.', fa: 'اگر گوشی را از خارج آورده‌اید، بررسی کنید آیا ثبت IMEI برای آن لازم است.' } },
      ],
    },
    {
      kind: 'whatYouNeed',
      note: {
        en: 'Requirements for foreign customers vary by operator and service. Check the operator’s current requirements before visiting a store.',
        fa: 'الزامات برای مشتریان خارجی بسته به اپراتور و خدمت متفاوت است. پیش از مراجعه به فروشگاه، الزامات فعلی اپراتور را بررسی کنید.',
      },
      steps: [
        { title: { en: 'Identity document', fa: 'مدرک هویتی' }, body: { en: 'A valid identity document that the operator accepts.', fa: 'یک مدرک هویتی معتبر که اپراتور بپذیرد.' } },
        {
          title: { en: 'Your phone', fa: 'گوشی شما' },
          body: { en: 'Bring the device you intend to use, or its details if you are buying an eSIM.', fa: 'دستگاهی را که می‌خواهید استفاده کنید همراه ببرید، یا اگر eSIM می‌خرید مشخصات آن را.' },
        },
        { title: { en: 'Payment method', fa: 'روش پرداخت' }, body: { en: 'For the SIM and for the first plan or package.', fa: 'برای سیم‌کارت و نخستین طرح یا بسته.' } },
        {
          title: { en: 'Your preferred plan', fa: 'طرح دلخواه شما' },
          body: { en: 'Optional, but it speeds things up if you already know what you want.', fa: 'اختیاری است، اما اگر از قبل بدانید چه می‌خواهید کار سریع‌تر پیش می‌رود.' },
        },
      ],
    },
    {
      kind: 'howToDoIt',
      title: { en: 'How to get it', fa: 'چگونه آن را بگیرید' },
      steps: [
        {
          title: { en: 'Choose an operator and SIM type', fa: 'انتخاب اپراتور و نوع سیم‌کارت' },
          body: { en: 'Decide whether you want a physical SIM or an eSIM, and which operator you want to use.', fa: 'تصمیم بگیرید سیم‌کارت فیزیکی می‌خواهید یا eSIM، و از کدام اپراتور.' },
        },
        {
          title: { en: 'Check the plan and its conditions', fa: 'بررسی طرح و شرایط آن' },
          body: { en: 'Look at the current plan, pricing, activation conditions and eligibility requirements.', fa: 'طرح فعلی، قیمت، شرایط فعال‌سازی و الزامات واجد شرایط بودن را ببینید.' },
        },
        {
          title: { en: 'Go to a store, or use an official digital channel', fa: 'مراجعه به فروشگاه یا استفاده از کانال دیجیتال رسمی' },
          body: {
            en: 'Some operators offer digital onboarding for some customers. Foreign customers may need to visit a store.',
            fa: 'برخی اپراتورها برای برخی مشتریان ثبت‌نام دیجیتال دارند. مشتریان خارجی ممکن است لازم باشد به فروشگاه بروند.',
          },
        },
        {
          title: { en: 'Provide identification and complete the subscription', fa: 'ارائه مدرک هویتی و تکمیل اشتراک' },
          body: { en: 'The operator will tell you which documents they accept.', fa: 'اپراتور به شما می‌گوید کدام مدارک را می‌پذیرد.' },
        },
        {
          title: { en: 'Activate and test it', fa: 'فعال‌سازی و آزمایش' },
          body: {
            en: 'Check mobile data, calls, SMS and your new Turkish number before you leave the store.',
            fa: 'پیش از ترک فروشگاه، اینترنت همراه، تماس، پیامک و شماره جدید ترکیه‌ای خود را بررسی کنید.',
          },
          note: {
            en: 'If you brought your phone from abroad, read the IMEI section below — a working SIM does not mean a registered device.',
            fa: 'اگر گوشی را از خارج آورده‌اید، بخش IMEI را در ادامه بخوانید؛ سیم‌کارتی که کار می‌کند به معنای دستگاه ثبت‌شده نیست.',
          },
        },
      ],
    },
    {
      kind: 'importantToKnow',
      title: { en: 'If you’re using a foreign phone', fa: 'اگر از گوشی خارجی استفاده می‌کنید' },
      callout: { en: 'Getting a SIM and registering your phone are two separate things', fa: 'تهیه سیم‌کارت و ثبت گوشی دو کار جدا هستند' },
      calloutBody: {
        en: 'A Turkish SIM does not register your device. According to BTK, a phone brought from abroad can generally be used in Türkiye for up to 120 days without IMEI registration. If the device is not registered within the applicable period, mobile communications can be blocked.',
        fa: 'سیم‌کارت ترکیه دستگاه شما را ثبت نمی‌کند. به گفته BTK، گوشی‌ای که از خارج آورده شده معمولا تا ۱۲۰ روز بدون ثبت IMEI در ترکیه قابل استفاده است. اگر دستگاه در مهلت مقرر ثبت نشود، ارتباط تلفن همراه آن ممکن است مسدود شود.',
      },
      calloutSource: { en: 'Source: BTK — Merkezi Cihaz Kayıt Sistemi', fa: 'منبع: BTK — Merkezi Cihaz Kayıt Sistemi' },
      link: 'register-your-phone',
    },
    {
      kind: 'whatToCheck',
      title: { en: 'What to check before choosing a plan', fa: 'پیش از انتخاب طرح چه چیزهایی را بررسی کنید' },
      note: {
        en: 'Prices, campaigns, eligibility and plan conditions change. Check the operator’s current terms before you buy.',
        fa: 'قیمت‌ها، جشنواره‌ها، شرایط و ضوابط طرح‌ها تغییر می‌کنند. پیش از خرید، شرایط فعلی اپراتور را بررسی کنید.',
      },
      steps: [
        { title: { en: 'How much mobile data is included?', fa: 'چه مقدار اینترنت همراه شامل می‌شود؟' } },
        { title: { en: 'How many minutes and SMS are included?', fa: 'چند دقیقه مکالمه و پیامک شامل می‌شود؟' } },
        { title: { en: 'Is the plan prepaid or billed monthly?', fa: 'طرح اعتباری است یا ماهانه صورت‌حساب می‌شود؟' } },
        { title: { en: 'Is there a minimum commitment period?', fa: 'آیا حداقل مدت تعهد وجود دارد؟' } },
        { title: { en: 'What happens when your data allowance runs out?', fa: 'وقتی حجم اینترنت تمام شود چه اتفاقی می‌افتد؟' } },
        { title: { en: 'Are there activation or setup fees?', fa: 'آیا هزینه فعال‌سازی یا راه‌اندازی دارد؟' } },
        { title: { en: 'Does the plan support eSIM, if you need it?', fa: 'اگر نیاز دارید، آیا طرح از eSIM پشتیبانی می‌کند؟' } },
        { title: { en: 'Can you keep the number if you later change plan or operator?', fa: 'اگر بعدا طرح یا اپراتور را عوض کنید، می‌توانید شماره را نگه دارید؟' } },
        { title: { en: 'Are there conditions that apply specifically to foreign customers?', fa: 'آیا شرایطی ویژه مشتریان خارجی وجود دارد؟' } },
      ],
    },
    {
      kind: 'whereToDoIt',
      steps: [
        {
          label: { en: 'In person', fa: 'حضوری' },
          title: { en: 'Operator stores', fa: 'فروشگاه‌های اپراتور' },
          body: {
            en: 'Visit an official mobile operator store to compare plans, show identification, and activate a SIM or eSIM.',
            fa: 'به فروشگاه رسمی یک اپراتور تلفن همراه بروید تا طرح‌ها را مقایسه کنید، مدرک هویتی نشان دهید و سیم‌کارت یا eSIM را فعال کنید.',
          },
        },
        {
          label: { en: 'Online', fa: 'آنلاین' },
          title: { en: 'Official operator websites and apps', fa: 'وب‌سایت‌ها و برنامه‌های رسمی اپراتور' },
          body: {
            en: 'Use official digital channels to check current plans, requirements and available activation options.',
            fa: 'از کانال‌های دیجیتال رسمی برای بررسی طرح‌ها، الزامات و گزینه‌های فعال‌سازی موجود استفاده کنید.',
          },
        },
      ],
    },
    {
      kind: 'commonProblems',
      steps: [
        {
          title: { en: '“My phone has no service after inserting the SIM.”', fa: '«پس از گذاشتن سیم‌کارت، گوشی آنتن نمی‌دهد.»' },
          body: {
            en: 'Check whether the SIM has been activated, whether your phone is unlocked, and whether the mobile network settings are correct. If none of that explains it, the device itself may have an IMEI-related restriction.',
            fa: 'بررسی کنید سیم‌کارت فعال شده باشد، گوشی قفل نباشد و تنظیمات شبکه تلفن همراه درست باشد. اگر هیچ‌کدام علت نبود، ممکن است خود دستگاه محدودیت مربوط به IMEI داشته باشد.',
          },
        },
        {
          title: { en: '“My foreign phone stopped working with the Turkish SIM.”', fa: '«گوشی خارجی‌ام با سیم‌کارت ترکیه از کار افتاد.»' },
          body: {
            en: 'The SIM and the phone’s IMEI status are separate. If a foreign device reaches the applicable registration limit, it can be blocked from mobile communication until the registration requirements are met. See the IMEI guide below.',
            fa: 'سیم‌کارت و وضعیت IMEI گوشی دو چیز جدا هستند. اگر دستگاه خارجی به سقف مهلت ثبت برسد، ممکن است تا انجام الزامات ثبت، ارتباط تلفن همراه آن مسدود شود. راهنمای IMEI را در ادامه ببینید.',
          },
        },
        {
          title: { en: '“I cannot get the plan I wanted.”', fa: '«نمی‌توانم طرحی را که می‌خواستم بگیرم.»' },
          body: {
            en: 'Eligibility and required documents vary by operator and plan. Ask the operator which plans are currently available to foreign customers.',
            fa: 'شرایط و مدارک لازم بسته به اپراتور و طرح متفاوت است. از اپراتور بپرسید در حال حاضر کدام طرح‌ها برای مشتریان خارجی در دسترس است.',
          },
        },
      ],
    },
  ],
  // Figma 181:1012 to 181:1060. Not translated: an institution's name and what
  // it is the source for are kept as the design gives them.
  sources: [
    { url: 'https://tuketici.btk.gov.tr/mobil', publisher: 'BTK', name: 'Mobile services — tuketici.btk.gov.tr/mobil' },
    {
      url: 'https://tuketici.btk.gov.tr/merkezi-cihaz-kayit-sistemi',
      publisher: 'BTK',
      name: 'Central Device Registration System — tuketici.btk.gov.tr/merkezi-cihaz-kayit-sistemi',
      note: 'Source for the 120-day figure and foreign-device rules',
    },
    { url: 'https://www.turkiye.gov.tr/btk-imei-kaydet', publisher: 'e-Devlet', name: 'IMEI registration — turkiye.gov.tr/btk-imei-kaydet', note: 'The official registration route' },
    {
      url: 'https://www.turkcell.com.tr/',
      publisher: 'Turkcell',
      name: 'Requirements for foreign customers — turkcell.com.tr',
      official: false,
      note: 'One operator’s own requirements — not a general rule for Türkiye',
    },
  ],
  related: ['register-your-phone', 'essential-apps'],
}
