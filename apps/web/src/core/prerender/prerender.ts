import { setupI18n, type I18n } from '@lingui/core'
import type { AnyVariables, Client, DocumentInput } from 'urql'
import { validated, type CountryCode } from 'src/core/country'
import { CategoryHubQuery, CountriesQuery, createClient, GuideQuery, GuidesQuery, HomeQuery, TaskHubQuery } from 'src/core/graphql'
import { isLocale, loadCatalog, locales, type Locale } from 'src/core/i18n'
import { paths } from 'src/core/router'
import { categoryHubHead, guideHead, homeHead, isWritten, onlyArea, taskHubHead } from 'src/screens'
import { documentTitle, type PageHeadProps } from 'src/shared/page-head'
import { absolute, pageLanguages, type LanguageLinks } from 'src/shared/page-languages'

/** A page as its file says it: where it lives, and what its head carries. */
export type Page = {
  /** Its address under the site, which is also where its file goes. */
  address: string
  locale: Locale
  title: string
  description: string | null
  links: LanguageLinks
}

export type PrerenderedFile = { file: string; html: string }

const ask = async <Data, Variables extends AnyVariables>(client: Client, query: DocumentInput<Data, Variables>, variables: Variables): Promise<Data> => {
  const { data, error } = await client.query(query, variables, { requestPolicy: 'network-only' }).toPromise()
  if (error) throw error
  if (!data) throw new Error('the API answered with no data')
  return data
}

/** Every page a search engine should find in one language, asked of the API the built site calls. */
const pagesIn = async (client: Client, locale: Locale): Promise<Page[]> => {
  const i18n: I18n = setupI18n({ locale, messages: { [locale]: await loadCatalog(locale) } })
  const at = (country: CountryCode) => ({ locale, origin: null, country })
  const { countries } = await ask(client, CountriesQuery, { locale })
  const pages: Page[] = []

  for (const { code, name } of countries) {
    // The API has just listed it, which is what `validated` records.
    const country = validated(code)
    const add = (address: string, head: PageHeadProps) =>
      pages.push({
        address,
        locale,
        title: documentTitle(i18n, head.title, name),
        description: head.description ?? null,
        links: pageLanguages(head, locale),
      })

    add(paths.home(at(country)), homeHead(i18n, country, name))

    // A goal is open once it has an area, which is how the home page decides.
    const { categories } = await ask(client, HomeQuery, { country, locale })
    for (const goal of new Set(categories.map((category) => category.taskSlug))) {
      const { taskHub } = await ask(client, TaskHubQuery, { country, slug: goal, locale })
      if (!taskHub) continue
      const only = onlyArea(taskHub)
      if (!only) {
        add(paths.taskHub(at(country), goal), taskHubHead(taskHub, country, name))
        continue
      }
      // The goal's address shows its only area, and its head is that area's.
      const { categoryHub } = await ask(client, CategoryHubQuery, { country, goal, slug: only, locale })
      if (categoryHub) add(paths.taskHub(at(country), goal), categoryHubHead(categoryHub, country, name))
    }

    for (const category of categories) {
      const { categoryHub } = await ask(client, CategoryHubQuery, { country, goal: category.taskSlug, slug: category.slug, locale })
      if (categoryHub) add(paths.categoryHub(at(country), category.taskSlug, category.slug), categoryHubHead(categoryHub, country, name))
    }

    // A guide listed but not written yet is its Coming soon page, which no
    // search engine should list, so it keeps the fallback.
    const { guides } = await ask(client, GuidesQuery, { country, locale })
    for (const { slug } of guides) {
      const { guide } = await ask(client, GuideQuery, { country, slug, locale })
      if (guide && isWritten(guide)) add(paths.guide(at(country), slug), guideHead(guide, country))
    }
  }

  return pages
}

/** Every page, in every language. One request at a time: the API runs on a tenth of a CPU. */
export const collect = async (endpoint?: string): Promise<Page[]> => {
  const client = createClient(endpoint)
  const pages: Page[] = []
  for (const locale of Object.keys(locales).filter(isLocale)) pages.push(...(await pagesIn(client, locale)))
  return pages
}

const escape = (text: string): string => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const HTML = /<html[^>]*>/
const TITLE = /<title[^>]*>[^<]*<\/title>/
const HEAD_END = '</head>'

/**
 * The built index.html filled in for each page, at `address.html`, which Pages
 * serves for `address`. Where other pages live below an address it is also a
 * folder, so the page goes at `address/index.html` too, and whichever of the
 * two Pages prefers serves it.
 */
export const render = (pages: readonly Page[], template: string, origin: string): PrerenderedFile[] => {
  if (!HTML.test(template) || !TITLE.test(template) || !template.includes(HEAD_END)) {
    throw new Error('index.html no longer has the <html>, <title> and </head> this fills in')
  }
  const addresses = pages.map((page) => page.address)

  return pages.flatMap((page) => {
    const tags = [
      page.description === null ? null : `<meta name="description" content="${escape(page.description)}" data-prerendered />`,
      `<link rel="canonical" href="${escape(absolute(page.links.canonical, origin))}" data-prerendered />`,
      ...page.links.alternates.map(
        (each) => `<link rel="alternate" hreflang="${each.hreflang}" href="${escape(absolute(each.path, origin))}" data-prerendered />`,
      ),
    ].filter((tag) => tag !== null)
    // Functions, not strings, as the replacements: a `$` in a title would
    // otherwise be read as a pattern.
    const html = template
      .replace(HTML, () => `<html lang="${page.locale}" dir="${locales[page.locale].dir}">`)
      .replace(TITLE, () => `<title data-prerendered>${escape(page.title)}</title>`)
      .replace(HEAD_END, () => `  ${tags.join('\n    ')}\n  ${HEAD_END}`)
    const file = page.address.slice(1)
    const folder = addresses.some((other) => other.startsWith(`${page.address}/`))
    return folder
      ? [
          { file: `${file}.html`, html },
          { file: `${file}/index.html`, html },
        ]
      : [{ file: `${file}.html`, html }]
  })
}
