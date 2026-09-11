import { useLingui } from '@lingui/react/macro'
import { useEffect } from 'react'
import { useCountry } from 'src/core/country'
import { PageLanguages, type PageLanguagesProps } from 'src/shared/page-languages'
import { documentTitle } from './title'

export type PageHeadProps = PageLanguagesProps & {
  /** What the page calls itself, as its heading does. */
  title: string
  /** The sentence a search result shows under the title. */
  description?: string | null | undefined
}

/**
 * SB-085: a page's title and description, with its languages (SB-086). React
 * 19 lifts all of it into the head and takes it out when the page goes.
 */
export const PageHead = ({ title, description, ...languages }: PageHeadProps) => {
  const { i18n } = useLingui()
  const { name } = useCountry()

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
    </>
  )
}
