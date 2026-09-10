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
