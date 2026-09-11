import { withCountry, type CountryCode } from 'src/core/country'
import { locales, type Locale } from 'src/core/i18n'
import { paths } from 'src/core/router'
import type { PageHeadProps } from 'src/shared/page-head'
import { absolute } from 'src/shared/page-languages'
import { breadcrumbList, type StructuredDatum } from 'src/shared/structured-data'

type TaskHubHeadData = { slug: string; title: string; heading?: string | null | undefined; intro?: string | null | undefined }

export const taskHubHead = (hub: TaskHubHeadData, country: CountryCode, name: string): PageHeadProps => ({
  title: withCountry(hub.heading ?? hub.title, name),
  description: hub.intro ? withCountry(hub.intro, name) : null,
  path: (locale) => paths.taskHub({ locale, origin: null, country }, hub.slug),
  languages: Object.keys(locales),
})

/**
 * SB-158: a goal hub shows no breadcrumb, so its trail is only its place:
 * the country's home, then the goal. `home` is the word the breadcrumbs use.
 */
export const taskHubData = (hub: TaskHubHeadData, country: CountryCode, locale: Locale, origin: string, home: string, name: string): StructuredDatum[] => {
  const journey = { locale, origin: null, country }
  return [
    breadcrumbList([
      { name: home, url: absolute(paths.home(journey), origin) },
      { name: withCountry(hub.heading ?? hub.title, name), url: absolute(paths.taskHub(journey, hub.slug), origin) },
    ]),
  ]
}

type Areas = { heading?: string | null | undefined; areas: readonly { slug: string }[] }

/** One area and nothing of its own to say: the goal's address opens that area's hub. */
export const onlyArea = (hub: Areas): string | null => {
  const [only] = hub.areas
  return hub.areas.length === 1 && only && !hub.heading ? only.slug : null
}
