import { useLocale } from 'src/core/i18n'
import { useSiteOrigin } from 'src/core/site'
import { absolute, pageLanguages, type PageLanguagesProps } from './languages'

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
