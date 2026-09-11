import type { CountryCode } from 'src/core/country'
import type { Locale } from 'src/core/i18n'
import { paths, type Journey } from 'src/core/router'
import type { PageHeadProps } from 'src/shared/page-head'
import { absolute, pageLanguages } from 'src/shared/page-languages'
import { guideStructuredData, type GuideForData, type StructuredDatum } from 'src/shared/structured-data'

type GuideHeadData = {
  slug: string
  title: string
  description?: string | null | undefined
  intro?: string | null | undefined
  locale: string
  locales: readonly string[]
}

// Shared with the prerender (SB-076), so the file a crawler reads and the page
// a person gets say the same thing.
export const guideHead = (guide: GuideHeadData, country: CountryCode): PageHeadProps => ({
  title: guide.title,
  // Several guides have no description of their own; their intro says the same.
  description: guide.description ?? guide.intro,
  path: (locale) => paths.guide({ locale, origin: null, country }, guide.slug),
  languages: guide.locales,
  shown: guide.locale,
})

type Writing = { sections: readonly unknown[]; options: readonly unknown[]; quickAnswer?: string | null | undefined }

/** Listed on a hub but not written yet, a guide is its Coming soon page, never an empty guide. */
export const isWritten = (guide: Writing): boolean => guide.sections.length > 0 || guide.options.length > 0 || Boolean(guide.quickAnswer)

type Place = { goalSlug: string; categorySlug: string; categoryTitle: string; goalAreas: number } | null | undefined

/** Where a guide's breadcrumb leads back to: its area, the goal where that is its only area, or home. */
export const guideArea = (place: Place, journey: Journey): string =>
  place
    ? place.goalAreas > 1
      ? paths.categoryHub(journey, place.goalSlug, place.categorySlug)
      : paths.taskHub(journey, place.goalSlug)
    : paths.home(journey)

/**
 * SB-087: the guide's schema.org markup at canonical addresses, the trail the
 * page shows included, for the page and the prerendered file alike. `home` is
 * the breadcrumb's word for home, in the page's language.
 */
export const guideData = (
  guide: GuideHeadData & GuideForData & { place?: Place },
  country: CountryCode,
  locale: Locale,
  origin: string,
  home: string,
): StructuredDatum[] => {
  const { canonical } = pageLanguages(guideHead(guide, country), locale)
  const url = absolute(canonical, origin)
  const area = absolute(guideArea(guide.place, { locale, origin: null, country }), origin)
  return guideStructuredData(guide, {
    url,
    site: absolute('/', origin),
    trail: [
      { name: guide.place?.categoryTitle ?? home, url: area },
      { name: guide.title, url },
    ],
  })
}
