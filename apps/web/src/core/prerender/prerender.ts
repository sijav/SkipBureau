import { setupI18n, type I18n } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { AnyVariables, Client, DocumentInput } from 'urql'
import { validated, type CountryCode } from 'src/core/country'
import { CategoryHubQuery, CountriesQuery, createClient, GuideQuery, GuidesQuery, HomeQuery, TaskHubQuery } from 'src/core/graphql'
import { isLocale, loadCatalog, locales, type Locale } from 'src/core/i18n'
import { paths } from 'src/core/router'
import { dark } from 'src/core/theme'
import { categoryHubData, categoryHubHead, guideData, guideHead, homeData, homeHead, isWritten, onlyArea, taskHubData, taskHubHead } from 'src/screens'
import { documentTitle, pageSharing, type MetaTag, type PageHeadProps } from 'src/shared/page-head'
import { absolute, pageLanguages, type LanguageLinks } from 'src/shared/page-languages'
import { JSON_LD, jsonLd, type StructuredDatum } from 'src/shared/structured-data'
import { renderPage, type RenderedPage } from './page'
import { robots, sitemap } from './sitemap'

/** A page as its file says it: where it lives, and what its head carries. */
export type Page = {
  /** Its address under the site, which is also where its file goes. */
  address: string
  locale: Locale
  title: string
  description: string | null
  links: LanguageLinks
  /** Schema.org markup, a guide's (SB-087); empty for any other page. */
  structuredData: readonly StructuredDatum[]
  /** The page's own date, for the sitemap (SB-088); null where it has none. */
  lastModified: string | null
  /** What a link preview reads (SB-089). */
  sharing: readonly MetaTag[]
  /** The page itself, rendered (SB-155); null until `collect` renders it. */
  body: RenderedPage | null
  /** The module its route's screen is built from, as Vite's manifest names it (SB-159). */
  screen: string | null
}

export type PrerenderedFile = { file: string; content: string }

type Extras = { structuredData?: readonly StructuredDatum[]; lastModified?: string | null | undefined }

// The module each screen is built from (SB-159). The route decides it, not the
// head: a goal with one area is the task hub's screen showing that area.
const SCREEN = {
  home: 'src/screens/home/index.ts',
  taskHub: 'src/screens/task-hub/index.ts',
  categoryHub: 'src/screens/category-hub/index.ts',
  guide: 'src/screens/guide/index.ts',
} as const

const ask = async <Data, Variables extends AnyVariables>(client: Client, query: DocumentInput<Data, Variables>, variables: Variables): Promise<Data> => {
  const { data, error } = await client.query(query, variables, { requestPolicy: 'network-only' }).toPromise()
  if (error) throw error
  if (!data) throw new Error('the API answered with no data')
  return data
}

const newest = (dates: readonly string[]): string | null => dates.reduce<string | null>((latest, date) => (!latest || date > latest ? date : latest), null)

/** Every page a search engine should find in one language, asked of the API the built site calls. */
const pagesIn = async (client: Client, locale: Locale, origin: string): Promise<Page[]> => {
  const i18n: I18n = setupI18n({ locale, messages: { [locale]: await loadCatalog(locale) } })
  const at = (country: CountryCode) => ({ locale, origin: null, country })
  const { countries } = await ask(client, CountriesQuery, { locale })
  const pages: Page[] = []

  for (const { code, name } of countries) {
    // The API has just listed it, which is what `validated` records.
    const country = validated(code)
    const add = (address: string, screen: string, head: PageHeadProps, { structuredData = [], lastModified = null }: Extras = {}) =>
      pages.push({
        address,
        locale,
        title: documentTitle(i18n, head.title, name),
        description: head.description ?? null,
        links: pageLanguages(head, locale),
        structuredData,
        lastModified,
        sharing: pageSharing(head, { i18n, place: name, locale, origin }),
        body: null,
        screen,
      })

    const home = i18n._(msg`Home`)

    // The country's home has no date of its own, and gets none invented.
    add(paths.home(at(country)), SCREEN.home, homeHead(i18n, country, name), { structuredData: homeData(locale, origin) })

    // A goal is open once it has an area, which is how the home page decides.
    const { categories } = await ask(client, HomeQuery, { country, locale })
    for (const goal of new Set(categories.map((category) => category.taskSlug))) {
      const { taskHub } = await ask(client, TaskHubQuery, { country, slug: goal, locale })
      if (!taskHub) continue
      const only = onlyArea(taskHub)
      if (!only) {
        // Dated by its newest source check, as the page says it was reviewed.
        const lastModified = newest(taskHub.sources.map((source) => source.verifiedAt))
        add(paths.taskHub(at(country), goal), SCREEN.taskHub, taskHubHead(taskHub, country, name), {
          structuredData: taskHubData(taskHub, country, locale, origin, home, name),
          lastModified,
        })
        continue
      }
      // The goal's address shows its only area, and its head is that area's.
      const { categoryHub } = await ask(client, CategoryHubQuery, { country, goal, slug: only, locale })
      if (categoryHub) {
        add(paths.taskHub(at(country), goal), SCREEN.taskHub, categoryHubHead(categoryHub, country, name), {
          structuredData: categoryHubData(categoryHub, country, locale, origin, home, name),
          lastModified: categoryHub.lastReviewed,
        })
      }
    }

    for (const category of categories) {
      const { categoryHub } = await ask(client, CategoryHubQuery, { country, goal: category.taskSlug, slug: category.slug, locale })
      if (categoryHub) {
        const address = paths.categoryHub(at(country), category.taskSlug, category.slug)
        add(address, SCREEN.categoryHub, categoryHubHead(categoryHub, country, name), {
          structuredData: categoryHubData(categoryHub, country, locale, origin, home, name),
          lastModified: categoryHub.lastReviewed,
        })
      }
    }

    // A guide listed but not written yet is its Coming soon page, which no
    // search engine should list, so it keeps the fallback.
    const { guides } = await ask(client, GuidesQuery, { country, locale })
    for (const { slug } of guides) {
      const { guide } = await ask(client, GuideQuery, { country, slug, locale })
      if (guide && isWritten(guide)) {
        add(paths.guide(at(country), slug), SCREEN.guide, guideHead(guide, country), {
          structuredData: guideData(guide, country, locale, origin, home),
          lastModified: guide.verifiedAt,
        })
      }
    }
  }

  return pages
}

/**
 * Every page, in every language, with `origin` the site the links and markup
 * point at. One request at a time: the API runs on a tenth of a CPU.
 */
export const collect = async (origin: string, endpoint?: string): Promise<Page[]> => {
  const client = createClient(endpoint)
  const pages: Page[] = []
  for (const locale of Object.keys(locales).filter(isLocale)) pages.push(...(await pagesIn(client, locale, origin)))
  // Then each page itself, one at a time: the render reads lingui's shared
  // instance, which holds one language at once.
  for (const page of pages) page.body = await renderPage({ address: page.address, locale: page.locale, origin, ...(endpoint ? { endpoint } : {}) })
  return pages
}

const escape = (text: string): string => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const HTML = /<html[^>]*>/
const TITLE = /<title[^>]*>[^<]*<\/title>/
const HEAD_END = '</head>'
const ROOT = '<div id="root"></div>'

// The snapshot is drawn in the light palette, the only one a build can know
// (SB-108). A reader who prefers dark keeps an empty dark canvas until the page
// is rendered in dark, which beats a flash of the wrong theme: the snapshot is
// hidden, and so is the light ground its own baseline styles would paint on
// the body (`html body` outranks the baseline's `body`). AppRoot removes the
// mark in the same frame React replaces the snapshot.
const SNAPSHOT_STYLE = `<style data-prerendered>@media (prefers-color-scheme: dark){#root[data-snapshot]{visibility:hidden}html body{background-color:${dark.background}}}</style>`

// A value as a script's source: a `<` in any text cannot close the tag early.
const scriptJson = (value: unknown): string => JSON.stringify(value).replaceAll('<', '\\u003c')

// emotion writes each style inline, just before the first element that uses
// it. Hydration (SB-160) needs #root to hold only what the client renders, so
// the styles move to the head, in the same order, where the client's caches
// find them by key and register them instead of inserting them again. Not
// marked `data-prerendered`: those are removed once the page renders, and
// these are the page's styles.
const EMOTION_STYLE = /<style data-emotion="[^"]*"[^>]*>[\s\S]*?<\/style>/g
const hoistStyles = (html: string): { styles: string[]; markup: string } => ({
  styles: html.match(EMOTION_STYLE) ?? [],
  markup: html.replace(EMOTION_STYLE, ''),
})

/** Vite's manifest, as much as the prerender reads: the file each module was built into, and the files that one imports. */
export type Manifest = Readonly<Record<string, { file: string; imports?: readonly string[]; isEntry?: boolean }>>

// A module's file and every file it imports, however deep.
const chunkFiles = (manifest: Manifest, key: string, found = new Set<string>()): Set<string> => {
  const chunk = manifest[key]
  if (!chunk || found.has(chunk.file)) return found
  found.add(chunk.file)
  for (const next of chunk.imports ?? []) chunkFiles(manifest, next, found)
  return found
}

/**
 * SB-159: what a page's first render needs beyond the app's own script, asked
 * for alongside it rather than once it has run: its screen and its catalog.
 * Whatever the entry imports, the template already preloads.
 */
const preloads = (manifest: Manifest, page: Page): string[] => {
  const entry = new Set(
    Object.keys(manifest)
      .filter((key) => manifest[key]?.isEntry)
      .flatMap((key) => [...chunkFiles(manifest, key)]),
  )
  const catalog = `src/locales/${locales[page.locale].catalog}.mjs`
  const files = new Set([page.screen, catalog].flatMap((key) => (key ? [...chunkFiles(manifest, key)] : [])))
  return [...files].filter((file) => !entry.has(file)).map((file) => `<link rel="modulepreload" crossorigin href="${escape(`${import.meta.env.BASE_URL}${file}`)}" />`)
}

/**
 * The built index.html filled in for each page, at `address.html`, which Pages
 * serves for `address`. Where other pages live below an address it is also a
 * folder, so the page goes at `address/index.html` too, and whichever of the
 * two Pages prefers serves it. Then the sitemap of those same pages, and the
 * robots.txt that names it.
 */
export const render = (pages: readonly Page[], template: string, origin: string, manifest: Manifest = {}): PrerenderedFile[] => {
  if (!HTML.test(template) || !TITLE.test(template) || !template.includes(HEAD_END) || !template.includes(ROOT)) {
    throw new Error('index.html no longer has the <html>, <title>, </head> and empty #root this fills in')
  }
  const addresses = pages.map((page) => page.address)

  const files = pages.flatMap((page) => {
    const tags = [
      ...preloads(manifest, page),
      page.description === null ? null : `<meta name="description" content="${escape(page.description)}" data-prerendered />`,
      `<link rel="canonical" href="${escape(absolute(page.links.canonical, origin))}" data-prerendered />`,
      ...page.links.alternates.map(
        (each) => `<link rel="alternate" hreflang="${each.hreflang}" href="${escape(absolute(each.path, origin))}" data-prerendered />`,
      ),
      ...page.sharing.map((tag) =>
        'property' in tag
          ? `<meta property="${tag.property}" content="${escape(tag.content)}" data-prerendered />`
          : `<meta name="${tag.name}" content="${escape(tag.content)}" data-prerendered />`,
      ),
      ...page.structuredData.map((datum) => `<script type="${JSON_LD}" data-prerendered>${jsonLd(datum)}</script>`),
      page.body ? SNAPSHOT_STYLE : null,
    ].filter((tag) => tag !== null)
    // The page as it renders (SB-155), and the results it was rendered from,
    // which the client starts from so its first render asks for nothing.
    const { styles, markup } = hoistStyles(page.body?.html ?? '')
    tags.push(...styles)
    const body = page.body
      ? `<div id="root" data-snapshot>${markup}</div>\n    <script>window.__SKIPBUREAU_DATA__=${scriptJson(page.body.data)}</script>`
      : ROOT
    // Functions, not strings, as the replacements: a `$` in a title would
    // otherwise be read as a pattern.
    const content = template
      .replace(HTML, () => `<html lang="${page.locale}" dir="${locales[page.locale].dir}">`)
      .replace(TITLE, () => `<title data-prerendered>${escape(page.title)}</title>`)
      .replace(HEAD_END, () => `  ${tags.join('\n    ')}\n  ${HEAD_END}`)
      .replace(ROOT, () => body)
    const file = page.address.slice(1)
    const folder = addresses.some((other) => other.startsWith(`${page.address}/`))
    return folder
      ? [
          { file: `${file}.html`, content },
          { file: `${file}/index.html`, content },
        ]
      : [{ file: `${file}.html`, content }]
  })

  return [...files, { file: 'sitemap.xml', content: sitemap(pages, origin) }, { file: 'robots.txt', content: robots(origin) }]
}
