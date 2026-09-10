import { looksLikeCountry, type CountryCode } from '../country/countries'
import { isLocale, locales, type Locale } from '../i18n/locales'

/**
 * Every URL in the app is built here, never assembled at a call site.
 *
 * A URL carries the short public form of a language, `en`, not the lingui tag
 * `en-US`. The mapping lives in `locales.ts` beside `dir` and `catalog`, so a
 * locale cannot be added without deciding its URL form.
 */
export const localeSegment = (locale: Locale): string => locales[locale].path

/** Strict: the short public form only. Anything else is Not Found. */
export const localeFromSegment = (segment: string): Locale | null =>
  (Object.keys(locales) as Locale[]).find((locale) => locales[locale].path === segment) ?? null

/**
 * The lingui tag, accepted only so it can be redirected to the short form.
 *
 * A link someone already shared as `/en-US/tr/...` keeps working, but there is
 * one canonical URL per page rather than two that both render.
 */
export const aliasedLocale = (segment: string): Locale | null => (isLocale(segment) ? segment : null)

/**
 * Shape only. Whether the country EXISTS is a database answer, and the route
 * guard is what asks it. This cannot know, and pretending it could is exactly
 * what the hardcoded table was doing.
 */
export const countryFromSegment = (segment: string): string | null => (looksLikeCountry(segment) ? segment : null)

/** The prefix every page below the root sits under. */
const at = (locale: Locale, country: CountryCode) => `/${localeSegment(locale)}/${country}`

export const paths = {
  home: (locale: Locale, country: CountryCode) => at(locale, country),
  taskHub: (locale: Locale, country: CountryCode, goal: string) => `${at(locale, country)}/t/${goal}`,
  categoryHub: (locale: Locale, country: CountryCode, goal: string, category: string) =>
    `${at(locale, country)}/t/${goal}/${category}`,
  guide: (locale: Locale, country: CountryCode, guide: string) => `${at(locale, country)}/g/${guide}`,
  suggest: (locale: Locale, country: CountryCode, guide: string) => `${at(locale, country)}/g/${guide}/suggest`,
} as const

export type Place = { pathname: string; search?: string; hash?: string }

/**
 * The same page in another language, for the language control.
 *
 * Search and hash come along. Someone reading the sources section of a guide
 * and switching language has to land on that section, not at the top of a
 * different page, and a filter they set has to survive.
 */
export const samePageIn = ({ pathname, search = '', hash = '' }: Place, locale: Locale): string => {
  const [, first, ...rest] = pathname.split('/')
  if (first === undefined || (localeFromSegment(first) === null && aliasedLocale(first) === null)) {
    return `${pathname}${search}${hash}`
  }
  return `${['', localeSegment(locale), ...rest].join('/')}${search}${hash}`
}
