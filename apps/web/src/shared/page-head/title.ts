import type { I18n } from '@lingui/core'
import { msg } from '@lingui/core/macro'

/**
 * What a browser tab and a search result call a page: its own words, the
 * country where they do not already name it, then the site. The country is
 * what a search for one of these actually contains, and what keeps two
 * countries' guides of the same name from being the same result.
 */
export const documentTitle = (i18n: I18n, title: string, place: string): string => {
  const named = title.includes(place) ? title : i18n._(msg`${title} in ${place}`)
  // The name as the wordmark writes it (Figma 43:523).
  return i18n._(msg`${named} · Skipbureau`)
}
