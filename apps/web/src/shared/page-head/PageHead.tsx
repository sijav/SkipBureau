import { useLingui } from '@lingui/react/macro'
import { useEffect } from 'react'
import { useCountry } from 'src/core/country'
import { useLocale } from 'src/core/i18n'
import { PageLanguages, type PageLanguagesProps } from 'src/shared/page-languages'
import { pageSharing } from './sharing'
import { documentTitle } from './title'

export type PageHeadProps = PageLanguagesProps & {
  /** What the page calls itself, as its heading does. */
  title: string
  /** The sentence a search result shows under the title. */
  description?: string | null | undefined
  /** A guide is an article to a link preview; any other page is the site. */
  kind?: 'article' | undefined
  /** An article's verified date. */
  modified?: string | null | undefined
}

/**
 * SB-085: a page's title and description, with its languages (SB-086) and
 * what a shared link shows (SB-089). React 19 lifts all of it into the head
 * and takes it out when the page goes.
 */
export const PageHead = (props: PageHeadProps) => {
  const { title, description, kind, modified, ...languages } = props
  const { i18n } = useLingui()
  const { locale } = useLocale()
  const { name } = useCountry()
  const sharing = pageSharing({ title, description, kind, modified, ...languages }, { i18n, place: name, locale, origin: window.location.origin })

  // What the prerender wrote (SB-076) belongs to the address the file was
  // written for. Once this page has its own, it goes, so leaving the page
  // never leaves a canonical behind.
  useEffect(() => {
    for (const node of window.document.head.querySelectorAll('[data-prerendered]')) node.remove()
  }, [])

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
