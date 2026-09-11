import type { CountryCode } from 'src/core/country'
import { paths } from 'src/core/router'
import type { PageHeadProps } from 'src/shared/page-head'

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
