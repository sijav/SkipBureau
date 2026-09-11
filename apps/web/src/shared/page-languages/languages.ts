import { defaultLocale, isLocale, locales, type Locale } from 'src/core/i18n'

export type PageLanguagesProps = {
  /** The page's address in a language, without where the reader comes from. */
  path: (locale: Locale) => string
  /** The languages the page is actually written in. */
  languages: readonly string[]
  /** The language its content is in, where that is not the one asked for. */
  shown?: string | undefined
}

export type LanguageLinks = {
  /** The one address the page has, relative to the site. */
  canonical: string
  /** The language of the canonical page. */
  canonicalLocale: Locale
  /** Every language the page is written in. */
  available: Locale[]
  /** One per language and x-default; none for a page in one language, which names no other. */
  alternates: { hreflang: string; path: string }[]
}

/**
 * The canonical address and the alternates of a page read in `locale`. A
 * function rather than inside the component, because the prerender (SB-076)
 * writes the same links into the file a crawler reads, and two copies of this
 * choice would drift.
 */
export const pageLanguages = ({ path, languages, shown }: PageLanguagesProps, locale: Locale): LanguageLinks => {
  const available = Object.keys(locales)
    .filter(isLocale)
    .filter((each) => languages.includes(each))
  // Read in a language it is not written in, the page is the one it was
  // written in, framed differently; that page is its canonical.
  const written = shown && isLocale(shown) ? shown : undefined
  const canonical = available.includes(locale) ? locale : (written ?? available[0] ?? locale)
  if (available.length < 2) return { canonical: path(canonical), canonicalLocale: canonical, available, alternates: [] }
  // x-default is the base language where the page has it.
  const fallback = available.includes(defaultLocale) ? defaultLocale : (available[0] ?? locale)
  return {
    canonical: path(canonical),
    canonicalLocale: canonical,
    available,
    alternates: [
      ...available.map((each) => ({ hreflang: locales[each].path, path: path(each) })),
      { hreflang: 'x-default', path: path(fallback) },
    ],
  }
}

// The address a search engine is given, absolute and under the base path the
// router serves from: /SkipBureau/ on GitHub Pages, / anywhere else.
export const absolute = (path: string, origin: string): string => new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`, origin).href
