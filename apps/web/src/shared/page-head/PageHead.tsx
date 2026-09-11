import { useLingui } from '@lingui/react/macro'
import { useEffect } from 'react'
import { useCountry } from 'src/core/country'
import { useLocale } from 'src/core/i18n'
import { useSiteOrigin } from 'src/core/site'
import { PageLanguages, type PageLanguagesProps } from 'src/shared/page-languages'
import { pageSharing } from './sharing'
import { documentTitle } from './title'

export type PageHeadProps = PageLanguagesProps & {
  title: string
  description?: string | null | undefined
  kind?: 'article' | undefined
  modified?: string | null | undefined
}

export const PageHead = (props: PageHeadProps) => {
  const { title, description, kind, modified, ...languages } = props
  const { i18n } = useLingui()
  const { locale } = useLocale()
  const { name } = useCountry()
  const origin = useSiteOrigin()
  const sharing = pageSharing({ title, description, kind, modified, ...languages }, { i18n, place: name, locale, origin })

  // What the prerender wrote (SB-076) belongs to the address the file was
  // written for. Once this page has its own, it goes, so leaving the page
  // never leaves a canonical behind.
  useEffect(() => {
    for (const node of window.document.head.querySelectorAll('[data-prerendered]')) node.remove()
  }, [])

  // Rendered at build time (SB-155), the page's head is the file's already.
  if (typeof window === 'undefined') return null

  return (
    <>
      <title>{documentTitle(i18n, title, name)}</title>
      {description && <meta name="description" content={description} />}
      <PageLanguages {...languages} />
      {sharing.map((tag) =>
        'property' in tag ? (
          <meta key={`${tag.property} ${tag.content}`} property={tag.property} content={tag.content} />
        ) : (
          <meta key={tag.name} name={tag.name} content={tag.content} />
        ),
      )}
    </>
  )
}
