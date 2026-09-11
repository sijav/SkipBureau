import { useLocale } from 'src/core/i18n'
import { useSiteOrigin } from 'src/core/site'
import { absolute, pageLanguages, type PageLanguagesProps } from './languages'

/**
 * SB-086: the canonical address of a page and, where it exists in more than
 * one language, an alternate per language and x-default. React 19 lifts these
 * links into the head wherever they are rendered, and takes them out when
 * the page goes. A page in one language says nothing about others, so a
 * reader is never pointed at a translation that does not exist.
 */
export const PageLanguages = (props: PageLanguagesProps) => {
  const { locale } = useLocale()
  const { canonical, alternates } = pageLanguages(props, locale)
  const origin = useSiteOrigin()

  return (
    <>
      <link rel="canonical" href={absolute(canonical, origin)} />
      {alternates.map((each) => (
        <link key={each.hreflang} rel="alternate" hrefLang={each.hreflang} href={absolute(each.path, origin)} />
      ))}
    </>
  )
}
