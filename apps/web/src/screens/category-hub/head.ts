import { withCountry, type CountryCode } from 'src/core/country'
import { locales, type Locale } from 'src/core/i18n'
import { paths } from 'src/core/router'
import type { PageHeadProps } from 'src/shared/page-head'
import { absolute } from 'src/shared/page-languages'
import { breadcrumbList, type StructuredDatum } from 'src/shared/structured-data'

type CategoryHubHeadData = { slug: string; goalSlug: string; title: string; description?: string | null | undefined }

export const categoryHubHead = (hub: CategoryHubHeadData, country: CountryCode, name: string): PageHeadProps => ({
  title: hub.title,
  description: hub.description ? withCountry(hub.description, name) : null,
  path: (locale) => paths.categoryHub({ locale, origin: null, country }, hub.goalSlug, hub.slug),
  languages: Object.keys(locales),
})

/** A goal with one area opens it directly, so the goal is not a step on the way. */
export const showsGoal = (hub: { goalAreas: number }): boolean => hub.goalAreas > 1

type CategoryHubTrailData = CategoryHubHeadData & { goalTitle: string; goalAreas: number }

/** SB-158: the trail the page shows, as schema.org writes one. `home` is the breadcrumb's word. */
export const categoryHubData = (
  hub: CategoryHubTrailData,
  country: CountryCode,
  locale: Locale,
  origin: string,
  home: string,
  name: string,
): StructuredDatum[] => {
  const journey = { locale, origin: null, country }
  const goal = showsGoal(hub) ? [{ name: withCountry(hub.goalTitle, name), url: absolute(paths.taskHub(journey, hub.goalSlug), origin) }] : []
  return [
    breadcrumbList([
      { name: home, url: absolute(paths.home(journey), origin) },
      ...goal,
      { name: hub.title, url: absolute(paths.categoryHub(journey, hub.goalSlug, hub.slug), origin) },
    ]),
  ]
}
