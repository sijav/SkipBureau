import { withCountry, type CountryCode } from 'src/core/country'
import { locales } from 'src/core/i18n'
import { paths } from 'src/core/router'
import type { PageHeadProps } from 'src/shared/page-head'

type CategoryHubHeadData = { slug: string; goalSlug: string; title: string; description?: string | null | undefined }

export const categoryHubHead = (hub: CategoryHubHeadData, country: CountryCode, name: string): PageHeadProps => ({
  title: hub.title,
  description: hub.description ? withCountry(hub.description, name) : null,
  path: (locale) => paths.categoryHub({ locale, origin: null, country }, hub.goalSlug, hub.slug),
  languages: Object.keys(locales),
})
