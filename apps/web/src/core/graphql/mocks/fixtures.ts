/**
 * The data stories and tests render from.
 *
 * One module, shared by both, so a story and its test cannot disagree about
 * what the server said. Shaped like the real seed rather than invented, so a
 * component that looks right here looks right against the API.
 */

export const countries = [
  { code: 'tr', name: 'Turkey' },
  { code: 'de', name: 'Germany' },
]

/** The names the API's bootstrap gives in Persian. */
export const persianNames: Record<string, string> = { tr: 'ترکیه', de: 'آلمان' }

// The twelve goals as the API's sample content has them, `{country}` included.
export const tasks = [
  ['getting-settled', 'Getting Settled', 'Essential services to help you start everyday life in {country}.'],
  ['get-a-residence-permit', 'Get a residence permit', 'Short-term, student, family and work permits'],
  ['study', 'Study in {country}', 'Applications, diploma recognition and student documents'],
  ['work', 'Work in {country}', 'Work permits, contracts and social security'],
  ['hire-someone', 'Hire someone', 'Hiring local and foreign employees'],
  ['start-a-business', 'Start a business', 'Company types, registration and first obligations'],
  ['banking-and-money', 'Banking & money', 'Tax numbers, bank accounts and moving money'],
  ['taxes', 'Taxes', 'What you may owe, when and how filing works'],
  ['renting-a-home', 'Renting a Home', 'Contracts, deposits and utility responsibilities.'],
  ['transportation', 'Transportation', 'Driving licences, vehicles and getting around.'],
  ['health-and-insurance', 'Health & Insurance', 'Public and private coverage and how to use it'],
  ['family', 'Family', 'Family residence, marriage, births and schooling'],
].map(([slug = '', title = '', subtitle = ''], position) => ({ slug, title, subtitle, position }))

/** Turkey's categories: only two goals have any, so ten tiles are Coming soon. */
export const categories = [
  { slug: 'first-week', taskSlug: 'getting-settled' },
  { slug: 'choose-a-company-type', taskSlug: 'start-a-business' },
  { slug: 'register-your-company', taskSlug: 'start-a-business' },
]

export const questions = [
  {
    slug: 'company-without-residence',
    question: 'Can I start a company without a residence permit?',
    answer: 'Yes — ownership and residence are separate. You can own 100% of a Turkish company.',
    guideSlug: null,
  },
  {
    slug: 'student-residence-documents',
    question: 'What documents do I need for student residence?',
    answer: 'Nine documents. Three of them change depending on your nationality.',
    guideSlug: null,
  },
  {
    slug: 'hire-an-iranian-employee',
    question: 'Can my Turkish company hire an Iranian employee?',
    answer: 'Yes, subject to employment-ratio and salary conditions on the company.',
    guideSlug: null,
  },
  {
    slug: 'residence-by-buying-a-house',
    question: 'Can I get residence if I buy a house?',
    answer: 'Buying property does not grant residence by itself, but it can support a short-term permit.',
    guideSlug: 'register-your-address',
  },
]

export const guide = {
  slug: 'register-your-address',
  title: 'Register your address',
  quickAnswer:
    'Go to the district population directorate once you have somewhere to live. Take your passport and your rental contract.',
  verifiedAt: '2026-09-10',
  locale: 'en-US',
  translationMissing: false,
  sources: [{ url: 'https://www.nvi.gov.tr/', name: 'Nufus ve Vatandaslik Isleri Genel Mudurlugu', verifiedAt: '2026-09-10' }],
}

/** The same guide asked for in Persian, which this one does not have. */
export const untranslatedGuide = { ...guide, locale: 'en-US', translationMissing: true }

/** Start a business in Turkey, as the API's sample content has it: Figma 81:523. */
export const taskHub = {
  slug: 'start-a-business',
  title: 'Start a business',
  heading: 'Start a business in {country}',
  intro: 'Understand the main decisions, registrations and ongoing responsibilities involved in setting up a business in {country}.',
  areasIntro: 'These are the areas most founders deal with. They are deliberately not numbered — the order that applies to you depends on your situation.',
  dependsNote:
    'Your nationality, residence status, company structure, and whether you plan to work in the company or hire staff can each change which of these areas apply and in what order.',
  otherRoutesIntro: 'Not part of company registration. These are separate routes some founders look into.',
  locale: 'en-US',
  translationMissing: false,
  areas: [
    ['choose-a-company-type', 'decision', 'Choose a company type', 'Understand the main company structures and which situations they are commonly used for.'],
    ['register-your-company', null, 'Register your company', 'Understand the registration process and what needs to be prepared.'],
    ['get-a-business-address', null, 'Get a business address', 'Understand address requirements and what options may be available.'],
    ['get-your-tax-setup-ready', null, 'Get your tax setup ready', 'Understand tax registration and the first administrative obligations.'],
    ['open-a-business-bank-account', null, 'Open a business bank account', 'Understand when a business account is needed and what may be requested.'],
    ['work-in-your-own-company', 'ifItApplies', 'Work in your own company', 'Understand when founders may need separate permission to work.'],
    ['hire-employees', 'ifItApplies', 'Hire employees', 'Understand the basics of employing Turkish or foreign staff.'],
    ['set-up-accounting-and-invoicing', 'ongoing', 'Set up accounting & invoicing', 'Understand ongoing accounting, invoicing and reporting responsibilities.'],
    ['startup-and-tech-visa-programmes', 'alternativeRoute', 'Startup and tech visa programmes', 'For founders exploring startup-specific immigration routes.'],
  ].map(([slug = '', kind = null, title = '', description = ''], position) => ({ slug, position, kind, title, description })),
  guides: [
    ['company-types', 'Company types in Turkey', '2026-08-24'],
    ['how-company-registration-works', 'How company registration works', '2026-08-24'],
    ['business-addresses-explained', 'Business addresses explained', '2026-07-15'],
    ['working-in-your-own-company', 'Working in your own company as a foreign founder', '2026-08-24'],
    ['hiring-foreign-employees', 'Hiring foreign employees', '2026-08-24'],
    ['accounting-basics', 'Accounting basics for new companies', '2026-07-15'],
  ].map(([slug = '', title = '', verifiedAt = '']) => ({ slug, title, verifiedAt })),
  sources: [{ url: 'https://ticaret.gov.tr/', name: 'Ministry of Trade · Trade Registry', publisher: 'Republic of Türkiye', verifiedAt: '2026-08-24' }],
}

/** Getting Settled in Turkey, as the API's sample content has it: Figma 133:690. */
export const categoryHub = {
  slug: 'first-week',
  title: 'Getting Settled',
  description: 'Essential services to help you start everyday life in Turkey.',
  askPrompt: 'Ask about getting settled in Turkey and find the most relevant guide.',
  locale: 'en-US',
  translationMissing: false,
  goalSlug: 'getting-settled',
  goalTitle: 'Getting Settled',
  goalAreas: 1,
  lastReviewed: '2026-09-10',
  start: {
    guideSlug: 'sim-card',
    title: 'Get a SIM Card or eSIM',
    reason: 'Get connected first so you can use banking, transport, delivery and government services more easily.',
  },
  guides: [
    ['sim-card', 'Get a SIM Card or eSIM', 'Compare mobile operators and understand what documents you need.', 4],
    ['register-your-phone', 'Register Your Foreign Phone / IMEI', 'Understand when an imported phone needs to be registered in Turkey.', 3],
    ['home-internet', 'Set Up Home Internet', 'Check infrastructure, compare providers and understand internet contracts.', 5],
    ['utilities', 'Connect Electricity, Water and Gas', 'Learn how to start or transfer utility subscriptions for your home.', 4],
    ['turkish-address', 'Understand Your Turkish Address', 'Learn how Turkish addresses are structured and where your official address is used.', 3],
    ['essential-apps', 'Essential Apps and Services', 'Find useful apps for transport, banking, delivery and everyday services.', 4],
  ].map(([slug, title, description, readingMinutes]) => ({ slug, title, description, readingMinutes })),
  checklist: [
    'Get a SIM Card or eSIM',
    'Check whether your phone needs IMEI registration',
    'Arrange home internet',
    'Connect or transfer utility services',
    'Confirm your correct Turkish address',
    'Install essential local apps',
  ],
  related: [
    { slug: 'renting-a-home', title: 'Renting a Home', subtitle: 'Contracts, deposits and utility responsibilities.', open: false },
    { slug: 'start-a-business', title: 'Start a business', subtitle: 'Company types, registration and first obligations', open: true },
  ],
}
