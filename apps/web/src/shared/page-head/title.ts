import type { I18n } from '@lingui/core'
import { msg } from '@lingui/core/macro'

/**
 * What a browser tab and a search result call a page: its own words, the
 * country where they do not already name it, then the site. The country is
 * what a search for one of these actually contains, and what keeps two
 * countries' guides of the same name from being the same result.
 */
export type Naming = {
  title: string
  /** The country's name, in the language the page is read in. */
  place: string
  /** The language the title is actually written in, which is not always the page's (SB-291). */
  shown?: string | undefined
  /** The language the page is read in. */
  locale: string
}

export const documentTitle = (i18n: I18n, naming: Naming): string => {
  const named = pageName(i18n, naming)
  // The name as the wordmark writes it (Figma 43:523).
  return i18n._(msg`${named} · Skipbureau`)
}

/** The page's words and its country, without the site: what a link preview titles it (SB-089). */
export const pageName = (i18n: I18n, { title, place, shown, locale }: Naming): string => {
  // SB-291: the country suffix is a translated template, so it belongs only on a title written in the page's own
  // language. A guide with no text in this language keeps its own title, because appending one language's words to
  // another's names the country twice, in two languages, in every search result and link preview for that page.
  if (shown && shown !== locale) return title
  return title.includes(place) ? title : i18n._(msg`${title} in ${place}`)
}
