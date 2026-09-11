/**
 * The locales the app ships with.
 *
 * `dir` lives here rather than being derived at the call site, because the
 * document direction, the MUI theme direction and the emotion cache all have to
 * agree, and three places deciding it independently is how a layout ends up
 * half mirrored. `path` is here for the same reason: a locale cannot be added
 * without deciding what it looks like in a URL.
 */
export const locales = {
  // `dates`: the design writes a date day first, "24 Aug 2026", which is the
  // British English order; Persian keeps its own calendar and order. `months`:
  // where the month's NAME comes from, because en-GB writes Sept and the
  // design writes Sep (SB-151).
  'en-US': { label: 'English', dir: 'ltr', catalog: 'en', path: 'en', dates: 'en-GB', months: 'en-US' },
  'fa-IR': { label: 'فارسی', dir: 'rtl', catalog: 'fa', path: 'fa', dates: 'fa-IR', months: 'fa-IR' },
} as const

export type Locale = keyof typeof locales
export type Direction = (typeof locales)[Locale]['dir']

export const defaultLocale: Locale = 'en-US'

export const isLocale = (value: string): value is Locale => value in locales

/** The tag a person's browser asks for, mapped to one we actually have. */
export const nearestLocale = (requested: readonly string[]): Locale => {
  for (const tag of requested) {
    if (isLocale(tag)) return tag
    const language = tag.split('-')[0]?.toLowerCase()
    const match = (Object.keys(locales) as Locale[]).find((locale) => locale.split('-')[0]?.toLowerCase() === language)
    if (match) return match
  }
  return defaultLocale
}

type Form = 'day' | 'short' | 'long'

const SHAPES: Record<Form | 'month', Intl.DateTimeFormatOptions> = {
  day: { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' },
  short: { month: 'short', year: 'numeric', timeZone: 'UTC' },
  long: { month: 'long', year: 'numeric', timeZone: 'UTC' },
  month: { month: 'short', timeZone: 'UTC' },
}

// One formatter per tag and form: building one loads that language's calendar
// data, which every date on a guide did again (SB-161).
const formatters = new Map<string, Intl.DateTimeFormat>()
const formatter = (tag: string, form: Form | 'month'): Intl.DateTimeFormat => {
  const key = `${tag} ${form}`
  const cached = formatters.get(key)
  if (cached) return cached
  const made = new Intl.DateTimeFormat(tag, SHAPES[form])
  formatters.set(key, made)
  return made
}

/**
 * The order from `dates`, the month's name from `months` (SB-151). Current ICU
 * abbreviates September as "Sept" in en-GB, which is where the day-first order
 * comes from, and the design writes "Sep". Where the two tags are the same,
 * Persian, the parts are simply joined back together.
 */
const written = (isoDate: string, locale: Locale, form: Form): string => {
  const date = new Date(isoDate)
  const { dates, months } = locales[locale]
  const parts = formatter(dates, form).formatToParts(date)
  if (months === dates) return parts.map((part) => part.value).join('')
  const name = form === 'long' ? formatter(months, 'long').formatToParts(date).find((part) => part.type === 'month')?.value : formatter(months, 'month').format(date)
  return parts.map((part) => (part.type === 'month' ? (name ?? part.value) : part.value)).join('')
}

/** A calendar date from the API, "2026-08-24", as the design writes one. */
export const formatDay = (isoDate: string, locale: Locale): string => written(isoDate, locale, 'day')

/** Its month and year, "Aug 2026", or "August 2026" long, for a line that only needs that much. */
export const formatMonth = (isoDate: string, locale: Locale, month: 'short' | 'long' = 'short'): string => written(isoDate, locale, month)
