import type { I18n } from '@lingui/core'
import type { Locale } from 'src/core/i18n'
import { absolute, pageLanguages } from 'src/shared/page-languages'
import { SITE_NAME } from 'src/shared/structured-data'
import type { PageHeadProps } from './PageHead'
import { pageName } from './title'

export type Sharing = {
  /** The page's name with its country, without the site, which og:site_name carries. */
  title: string
  description?: string | null | undefined
  /** The canonical address, absolute. */
  url: string
  /** The canonical page's language. */
  locale: Locale
  /** Every language the page exists in; the others are its og:locale:alternate. */
  available: readonly Locale[]
  kind: 'website' | 'article'
  /** An article's verified date. */
  modified?: string | null | undefined
  /** The share image, absolute. */
  image: string
}

export type MetaTag = { property: string; content: string } | { name: string; content: string }

/** The one image every shared page shows, drawn by scripts/icons.mjs. */
export const SHARE_IMAGE = { path: '/og.png', width: 1200, height: 630 } as const

// Open Graph writes a locale with an underscore: en_US, fa_IR.
const ogLocale = (locale: Locale): string => locale.replace('-', '_')

/**
 * SB-089: what a link preview reads. WhatsApp, Telegram, X and the rest build
 * their card from these and run no script, which is why the prerendered file
 * carries them too. X falls back to the og: tags for its title and text.
 */
export const sharingTags = ({ title, description, url, locale, available, kind, modified, image }: Sharing): MetaTag[] => [
  { property: 'og:site_name', content: SITE_NAME },
  { property: 'og:type', content: kind },
  { property: 'og:title', content: title },
  ...(description ? [{ property: 'og:description', content: description }] : []),
  { property: 'og:url', content: url },
  { property: 'og:locale', content: ogLocale(locale) },
  ...available.filter((each) => each !== locale).map((each) => ({ property: 'og:locale:alternate', content: ogLocale(each) })),
  { property: 'og:image', content: image },
  { property: 'og:image:width', content: String(SHARE_IMAGE.width) },
  { property: 'og:image:height', content: String(SHARE_IMAGE.height) },
  { property: 'og:image:alt', content: SITE_NAME },
  ...(kind === 'article' && modified ? [{ property: 'article:modified_time', content: modified }] : []),
  { name: 'twitter:card', content: 'summary_large_image' },
]

type Reading = { i18n: I18n; place: string; locale: Locale; origin: string }

/** A page's sharing tags from its head, the same for the page and the prerendered file. */
export const pageSharing = (head: PageHeadProps, { i18n, place, locale, origin }: Reading): MetaTag[] => {
  const links = pageLanguages(head, locale)
  return sharingTags({
    title: pageName(i18n, head.title, place),
    description: head.description,
    url: absolute(links.canonical, origin),
    locale: links.canonicalLocale,
    available: links.available,
    kind: head.kind ?? 'website',
    modified: head.modified,
    image: absolute(SHARE_IMAGE.path, origin),
  })
}
