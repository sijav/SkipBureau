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

export const tasks = [
  { slug: 'getting-settled', title: 'Getting Settled', subtitle: 'The first weeks after you arrive', position: 0 },
  { slug: 'start-a-business', title: 'Start a business', subtitle: 'Registering and running a company', position: 1 },
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
