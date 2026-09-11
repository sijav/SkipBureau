import { defaultLocale, isLocale, locales, useLocale, type Locale } from 'src/core/i18n'

export type PageLanguagesProps = {
  /** The page's address in a language, without where the reader comes from. */
  path: (locale: Locale) => string
  /** The languages the page is actually written in. */
  languages: readonly string[]
  /** The language its content is in, where that is not the one asked for. */
  shown?: string | undefined
}

// The address a search engine is given, absolute and under the base path the
// router serves from: /SkipBureau/ on GitHub Pages, / anywhere else.
const absolute = (path: string): string => new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`, window.location.origin).href

/**
 * SB-086: the canonical address of a page and, where it exists in more than
 * one language, an alternate per language and x-default. React 19 lifts these
 * links into the head wherever they are rendered, and takes them out when
 * the page goes. A page in one language says nothing about others, so a
 * reader is never pointed at a translation that does not exist.
 */
export const PageLanguages = ({ path, languages, shown }: PageLanguagesProps) => {
  const { locale } = useLocale()
  const available = Object.keys(locales)
    .filter(isLocale)
    .filter((each) => languages.includes(each))
  // Read in a language it is not written in, the page is the one it was
  // written in, framed differently; that page is its canonical.
  const written = shown && isLocale(shown) ? shown : undefined
  const canonical = available.includes(locale) ? locale : (written ?? available[0] ?? locale)
  // x-default is the base language where the page has it.
  const fallback = available.includes(defaultLocale) ? defaultLocale : (available[0] ?? locale)

  return (
    <>
      <link rel="canonical" href={absolute(path(canonical))} />
      {available.length > 1 && (
        <>
          {available.map((each) => (
            <link key={each} rel="alternate" hrefLang={locales[each].path} href={absolute(path(each))} />
          ))}
          <link rel="alternate" hrefLang="x-default" href={absolute(path(fallback))} />
        </>
      )}
    </>
  )
}
