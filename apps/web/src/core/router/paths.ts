import { isRegion, looksLikeCountry, type CountryCode } from 'src/core/country'
import { locales, type Locale } from 'src/core/i18n'

/**
 * Every URL in the app is built here, never assembled at a call site.
 *
 * The owner's shape, 2026-09-10: `/en-TR/DE` reads "in English, from Turkey,
 * moving to Germany". The first segment is the language's short public form,
 * and where the reader comes from once they have said so; the second is where
 * they are going. Countries are written in capitals, as ISO writes them, and
 * pages are named in words: `/tasks/`, `/guides/`.
 */

/** Who is reading: in which language, and from where, if they have said. */
export type Reader = {
  locale: Locale
  /** A country code, lowercase as the app keeps codes. */
  origin: string | null
}

/** A reader and where they are going, which is everything a page's address says before the page. */
export type Journey = Reader & { country: CountryCode }

/** The language alone, `en`. The mapping lives in `locales.ts`, so a locale cannot be added without deciding its URL form. */
export const localeSegment = (locale: Locale): string => locales[locale].path

/** Strict: the short public form only, in either case. */
export const localeFromSegment = (segment: string): Locale | null =>
  (Object.keys(locales) as Locale[]).find((locale) => locales[locale].path === segment.toLowerCase()) ?? null

/** `en` or `en-TR`. A lingui tag such as `en-US` now reads as English, from the United States. */
export const readerFromSegment = (segment: string): Reader | null => {
  const [language = '', origin, ...rest] = segment.split('-')
  const locale = localeFromSegment(language)
  if (!locale || rest.length > 0) return null
  if (origin === undefined) return { locale, origin: null }
  return isRegion(origin) ? { locale, origin: origin.toLowerCase() } : null
}

export const readerSegment = ({ locale, origin }: Reader): string => (origin ? `${localeSegment(locale)}-${origin.toUpperCase()}` : localeSegment(locale))

/**
 * Shape only, two letters in either case, lowercased as the database keeps
 * codes. Whether the country EXISTS is a database answer, and the route guard
 * is what asks it.
 */
export const countryFromSegment = (segment: string): string | null => {
  const code = segment.toLowerCase()
  return looksLikeCountry(code) ? code : null
}

export const countrySegment = (country: string): string => country.toUpperCase()

/** The prefix every page below the root sits under. */
const at = (journey: Journey) => `/${readerSegment(journey)}/${countrySegment(journey.country)}`

export const paths = {
  home: (journey: Journey) => at(journey),
  taskHub: (journey: Journey, goal: string) => `${at(journey)}/tasks/${goal}`,
  categoryHub: (journey: Journey, goal: string, category: string) => `${at(journey)}/tasks/${goal}/${category}`,
  /** The guided setup a task hub offers, which is not built yet. */
  setup: (journey: Journey, goal: string) => `${at(journey)}/setup/${goal}`,
  /** Every guide, which is not built yet either. */
  guides: (journey: Journey) => `${at(journey)}/guides`,
  guide: (journey: Journey, guide: string) => `${at(journey)}/guides/${guide}`,
  suggest: (journey: Journey, guide: string) => `${at(journey)}/guides/${guide}/suggest`,
  search: (journey: Journey, question: string) => `${at(journey)}/search?q=${encodeURIComponent(question)}`,
} as const

// The markers pages had before they were spelled out, kept so a link someone
// already shared still arrives.
const MOVED: Readonly<Record<string, string>> = { t: 'tasks', g: 'guides' }

/**
 * The one address a page has: the reader and the country as they are written,
 * the old markers spelled out. Null for a path that is not one of ours, which
 * is Not Found's to answer.
 */
export const canonicalPath = (pathname: string): string | null => {
  const [, first = '', second = '', ...rest] = pathname.split('/')
  const reader = readerFromSegment(first)
  const country = countryFromSegment(second)
  if (!reader || !country) return null
  const [marker, ...below] = rest
  const page = marker === undefined ? [] : [MOVED[marker] ?? marker, ...below]
  return ['', readerSegment(reader), countrySegment(country), ...page].join('/')
}

export type Place = { pathname: string; search?: string; hash?: string }

const withReader = ({ pathname, search = '', hash = '' }: Place, change: (reader: Reader) => Reader): string => {
  const [, first = '', ...rest] = pathname.split('/')
  const reader = readerFromSegment(first)
  if (!reader) return `${pathname}${search}${hash}`
  return `${['', readerSegment(change(reader)), ...rest].join('/')}${search}${hash}`
}

/**
 * The same page in another language, for the language control. Where the
 * reader comes from stays, and so do search and hash: someone reading the
 * sources section of a guide and switching language lands on that section.
 */
export const samePageIn = (place: Place, locale: Locale): string => withReader(place, (reader) => ({ ...reader, locale }))

/** The same page for a reader from somewhere else, or from nowhere they have said, for the context panel. */
export const samePageFrom = (place: Place, origin: string | null): string =>
  withReader(place, (reader) => ({ ...reader, origin: origin ? origin.toLowerCase() : null }))
