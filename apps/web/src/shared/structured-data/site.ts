import type { OrganizationLeaf, WebSite, WithContext } from 'schema-dts'
import { SITE_NAME } from './guide'

export type SiteContext = {
  /** The site's own address, absolute. */
  site: string
  /** The icon a search engine may show for the publisher, absolute and at least 112px. */
  logo: string
  /** The language the page is in. */
  locale: string
}

/**
 * SB-158: who publishes this and what the site is called, for a country's
 * home. Google reads WebSite's name only for a site at a domain's root, which
 * a GitHub project page is not; the Organization and its logo it reads anyway.
 */
export const homeStructuredData = ({ site, logo, locale }: SiteContext): [WithContext<WebSite>, WithContext<OrganizationLeaf>] => [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: site, inLanguage: locale },
  { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: site, logo },
]
