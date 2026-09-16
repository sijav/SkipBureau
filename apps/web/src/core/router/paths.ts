import { isRegion, looksLikeCountry, type CountryCode } from 'src/core/country'
import { locales, type Locale } from 'src/core/i18n'

/**
 * Every URL in the app is built here, never assembled at a call site.
 *
 * The owner's shape, 2026-09-10: `/en-TR/DE` reads "in English, from Turkey,
 * moving to Germany". The first segment is the language's short public form,
 * and where the reader comes from once they have said so; the second is where
 * they are going, and the place in it where they live once they have said
 * that too, `/en-IR/TR-35` (SB-256). Countries are written in capitals, as ISO
 * writes them, and pages are named in words: `/tasks/`, `/guides/`.
 */

/** Who is reading: in which language, and from where, if they have said. */
export type Reader = {
  locale: Locale
  /** A country code, lowercase as the app keeps codes. */
  origin: string | null
}

/**
 * A reader and where they are going, which is everything a page's address says before the page: the country, the place
 * in it where they live, as the API codes it, `DE-HH` or `DE-BY.muenchen`, and the residence status they hold there,
 * `tr.residence-permit`, each once they have said (SB-256), and their role, a situation the country's rules name, such
 * as `worker` (SB-286).
 */
export type Journey = Reader & {
  country: CountryCode
  place: string | null
  status: string | null
  situation: string | null
  /** Where they work, which is not where they live, and which some rules turn on (SB-313). */
  work: string | null
}

/** Where an address points below the reader: a country, and a place in it where one is named. */
export type Destination = { country: string; place: string | null }

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

// A country's two letters; then a hyphen and its subdivision; then a dot and the key of a place inside that. Any casing.
const DESTINATION = /^([a-z]{2})(?:-([a-z0-9]{1,3})(?:\.([a-z0-9-]+))?)?$/i

/**
 * Shape only, in either case: whether the country or the place EXISTS is a
 * database answer, and the route guard is what asks it. The country comes back
 * lowercased, as the database keeps codes, and the place spelled as the API
 * codes it, country and subdivision in capitals and a key in lower case.
 */
export const destinationFromSegment = (segment: string): Destination | null => {
  const found = DESTINATION.exec(segment)
  if (!found) return null
  const [, letters = '', subdivision, key] = found
  const country = letters.toLowerCase()
  if (!looksLikeCountry(country)) return null
  const place = subdivision ? `${letters.toUpperCase()}-${subdivision.toUpperCase()}${key ? `.${key.toLowerCase()}` : ''}` : null
  return { country, place }
}

/** The country a segment names, whether or not a place in it is named too. */
export const countryFromSegment = (segment: string): string | null => destinationFromSegment(segment)?.country ?? null

export const countrySegment = (country: string): string => country.toUpperCase()

/** Where the reader is going, as an address writes it: the place where they have named one, else the country. */
export const destinationSegment = ({ country, place }: Destination): string => place ?? countrySegment(country)

/** The residence status an address carries in its query, or null. */
export const statusFromSearch = (search: string): string | null => new URLSearchParams(search).get('status') || null

/** The role an address carries in its query, a situation the country's rules name, or null (SB-286). */
export const situationFromSearch = (search: string): string | null => new URLSearchParams(search).get('situation') || null

/** The place an address carries in its query as where the reader works, a place in the same country, or null (SB-313). */
export const workFromSearch = (search: string): string | null => new URLSearchParams(search).get('work') || null

// What the reader has said of their status, role and workplace, after whatever query a page has of its own.
const readerQuery = ({ status, situation, work }: Pick<Journey, 'status' | 'situation' | 'work'>, joiner: '?' | '&'): string => {
  const parts = [
    status ? `status=${encodeURIComponent(status)}` : '',
    situation ? `situation=${encodeURIComponent(situation)}` : '',
    work ? `work=${encodeURIComponent(work)}` : '',
  ].filter((part) => part !== '')
  return parts.length > 0 ? `${joiner}${parts.join('&')}` : ''
}

/** The prefix every page below the root sits under. */
const at = (journey: Journey) => `/${readerSegment(journey)}/${destinationSegment(journey)}`

/** What follows a page that has no query of its own: the reader's status, role and workplace, where they have said them. */
const tail = (journey: Journey) => readerQuery(journey, '?')

export const paths = {
  home: (journey: Journey) => `${at(journey)}${tail(journey)}`,
  taskHub: (journey: Journey, goal: string) => `${at(journey)}/tasks/${goal}${tail(journey)}`,
  categoryHub: (journey: Journey, goal: string, category: string) => `${at(journey)}/tasks/${goal}/${category}${tail(journey)}`,
  /** The guided setup a task hub offers, which is not built yet. */
  setup: (journey: Journey, goal: string) => `${at(journey)}/setup/${goal}${tail(journey)}`,
  /** Every guide, which is not built yet either. */
  guides: (journey: Journey) => `${at(journey)}/guides${tail(journey)}`,
  guide: (journey: Journey, guide: string) => `${at(journey)}/guides/${guide}${tail(journey)}`,
  suggest: (journey: Journey, guide: string) => `${at(journey)}/guides/${guide}/suggest${tail(journey)}`,
  search: (journey: Journey, question: string) =>
    `${at(journey)}/search?q=${encodeURIComponent(question)}${readerQuery(journey, '&')}`,
} as const

// The markers pages had before they were spelled out, kept so a link someone
// already shared still arrives.
const MOVED: Readonly<Record<string, string>> = { t: 'tasks', g: 'guides' }

/**
 * The one address a page has: the reader and the destination as they are
 * written, the old markers spelled out. Null for a path that is not one of
 * ours, which is Not Found's to answer.
 */
export const canonicalPath = (pathname: string): string | null => {
  const [, first = '', second = '', ...rest] = pathname.split('/')
  const reader = readerFromSegment(first)
  const destination = destinationFromSegment(second)
  if (!reader || !destination) return null
  const [marker, ...below] = rest
  const page = marker === undefined ? [] : [MOVED[marker] ?? marker, ...below]
  return ['', readerSegment(reader), destinationSegment(destination), ...page].join('/')
}

/** An address as the router holds it: a pathname, and its query and fragment. */
export type Address = { pathname: string; search?: string; hash?: string }

const withReader = ({ pathname, search = '', hash = '' }: Address, change: (reader: Reader) => Reader): string => {
  const [, first = '', ...rest] = pathname.split('/')
  const reader = readerFromSegment(first)
  if (!reader) return `${pathname}${search}${hash}`
  return `${['', readerSegment(change(reader)), ...rest].join('/')}${search}${hash}`
}

// A query with one thing the reader has said, their status, their role or where they work, set or taken out, and
// every other part of it as it was written.
const searchWith = (search: string, key: 'status' | 'situation' | 'work', value: string | null): string => {
  const kept = search
    .replace(/^\?/, '')
    .split('&')
    .filter((part) => part !== '' && part.split('=')[0] !== key)
  const parts = value ? [...kept, `${key}=${encodeURIComponent(value)}`] : kept
  return parts.length > 0 ? `?${parts.join('&')}` : ''
}

// A query with none of what the reader has said of themselves, their status, their role or where they work, for a
// page that no longer has them.
const searchWithout = (search: string): string =>
  searchWith(searchWith(searchWith(search, 'status', null), 'situation', null), 'work', null)

/**
 * The same page in another language, for the language control. Where the
 * reader comes from stays, and so do search and hash: someone reading the
 * sources section of a guide and switching language lands on that section.
 */
export const samePageIn = (address: Address, locale: Locale): string => withReader(address, (reader) => ({ ...reader, locale }))

/** The same page for a reader from somewhere else, or from nowhere they have said, for the context panel. */
export const samePageFrom = (address: Address, origin: string | null): string =>
  withReader(address, (reader) => ({ ...reader, origin: origin ? origin.toLowerCase() : null }))

/**
 * The same page for a reader who says where in the country they live, or
 * takes it back, for the context panel's City row (SB-256). The place is one
 * of the address's country's; the reader, the page, the query and the fragment
 * stay.
 */
export const samePageWhere = ({ pathname, search = '', hash = '' }: Address, place: string | null): string => {
  const [, first = '', second = '', ...rest] = pathname.split('/')
  const reader = readerFromSegment(first)
  const destination = destinationFromSegment(second)
  if (!reader || !destination) return `${pathname}${search}${hash}`
  return `${['', readerSegment(reader), destinationSegment({ country: destination.country, place }), ...rest].join('/')}${search}${hash}`
}

/** The same page for a reader who says what residence status they hold, or takes it back, for the Residence status row (SB-256). */
export const samePageAs = ({ pathname, search = '', hash = '' }: Address, status: string | null): string => {
  const [, first = '', second = ''] = pathname.split('/')
  if (!readerFromSegment(first) || !destinationFromSegment(second)) return `${pathname}${search}${hash}`
  return `${pathname}${searchWith(search, 'status', status)}${hash}`
}

/** The same page for a reader who says what role they have there, or takes it back, for the Role row (SB-286). */
export const samePageInRole = ({ pathname, search = '', hash = '' }: Address, situation: string | null): string => {
  const [, first = '', second = ''] = pathname.split('/')
  if (!readerFromSegment(first) || !destinationFromSegment(second)) return `${pathname}${search}${hash}`
  return `${pathname}${searchWith(search, 'situation', situation)}${hash}`
}

/**
 * The same page for a reader who says where they work, or takes it back, for the Where you work row (SB-313). It is
 * a place of the same country as the one they are reading about, and it is not where they live: the rules that turn
 * on it, a trade registration fee and Saxony's care insurance split, follow the business and the job.
 */
export const samePageAtWork = ({ pathname, search = '', hash = '' }: Address, work: string | null): string => {
  const [, first = '', second = ''] = pathname.split('/')
  if (!readerFromSegment(first) || !destinationFromSegment(second)) return `${pathname}${search}${hash}`
  return `${pathname}${searchWith(search, 'work', work)}${hash}`
}

/**
 * The same page with nothing the reader has said about themselves, for Clear
 * all: no nationality, place, status, role or workplace. The language, the country, the
 * page, the rest of the query and the fragment stay.
 */
export const samePageCleared = ({ pathname, search = '', hash = '' }: Address): string => {
  const [, first = '', second = '', ...rest] = pathname.split('/')
  const reader = readerFromSegment(first)
  const destination = destinationFromSegment(second)
  if (!reader || !destination) return `${pathname}${search}${hash}`
  const page = ['', readerSegment({ ...reader, origin: null }), countrySegment(destination.country), ...rest].join('/')
  return `${page}${searchWithout(search)}${hash}`
}

// The pages that exist in every country we cover. Everything else belongs to
// one country and may not exist in another: a task hub for a goal a country has
// no areas for is Not Found, because `taskHub` answers null (SB-172).
const IN_EVERY_COUNTRY = new Set(['guides', 'search'])

/**
 * The same page in another country, for the context panel's Currently in row,
 * where the page exists there. Home, the guides index and a search are kept,
 * with their query and hash; any other page goes to the new country's home.
 * The reader, their language and where they come from, is kept either way; a
 * place, a status and a role belong to the country being left, whose rules name
 * them, so none is.
 */
export const samePageAt = ({ pathname, search = '', hash = '' }: Address, country: string): string => {
  const [, first = '', second = '', ...rest] = pathname.split('/')
  const reader = readerFromSegment(first)
  if (!reader || !destinationFromSegment(second)) return `${pathname}${search}${hash}`
  // React Router matches a trailing slash, and canonicalPath keeps one.
  const page = rest.at(-1) === '' ? rest.slice(0, -1) : rest
  const home = ['', readerSegment(reader), countrySegment(country)].join('/')
  const kept = searchWithout(search)
  const [only, ...below] = page
  if (only === undefined) return `${home}${kept}${hash}`
  if (below.length === 0 && IN_EVERY_COUNTRY.has(only)) return `${home}/${only}${kept}${hash}`
  return home
}
