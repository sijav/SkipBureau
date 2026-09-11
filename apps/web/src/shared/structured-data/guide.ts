import type { Article, BreadcrumbList, HowTo, Organization, WithContext } from 'schema-dts'

/** The slice of a guide the markup needs, which the guide query already carries. */
export type GuideForData = {
  title: string
  description?: string | null | undefined
  intro?: string | null | undefined
  /** The language the content is actually in, which may not be the page's. */
  locale: string
  verifiedAt: string
  cost?: string | null | undefined
  sections: readonly { kind: string; steps: readonly { title: string; body?: string | null | undefined }[] }[]
  sources: readonly { url: string; name: string; publisher?: string | null | undefined }[]
}

export type Crumb = { name: string; url: string }

export type GuideDataContext = {
  /** The guide's canonical address, absolute. */
  url: string
  /** The site's home, absolute, for who publishes it. */
  site: string
  /** The trail the page shows, at absolute addresses, the guide last. */
  trail: readonly Crumb[]
}

export type StructuredDatum = WithContext<Article> | WithContext<BreadcrumbList> | WithContext<HowTo>

export const JSON_LD = 'application/ld+json'

const SITE_NAME = 'SkipBureau'

/**
 * SB-087. Article carries the verified date, which is what Google reads a
 * page's date from; BreadcrumbList carries the trail. HowTo is what a guide
 * is, and Google no longer shows it, so it is for the engines and assistants
 * that still read schema.org. Only what the guide has is said: no steps, no
 * HowTo, and no totalTime, because the guide's time is prose and HowTo wants
 * an ISO 8601 duration.
 */
export const guideStructuredData = (guide: GuideForData, { url, site, trail }: GuideDataContext): StructuredDatum[] => {
  const description = guide.description ?? guide.intro
  const publisher: Organization = { '@type': 'Organization', name: SITE_NAME, url: site }
  const steps = guide.sections.filter((section) => section.kind === 'howToDoIt').flatMap((section) => section.steps)
  const supplies = guide.sections.filter((section) => section.kind === 'whatYouNeed').flatMap((section) => section.steps)

  const article: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    ...(description ? { description } : {}),
    inLanguage: guide.locale,
    dateModified: guide.verifiedAt,
    mainEntityOfPage: url,
    author: publisher,
    publisher,
    ...(guide.sources.length > 0
      ? {
          citation: guide.sources.map((source) => ({
            '@type': 'CreativeWork' as const,
            name: source.name,
            url: source.url,
            ...(source.publisher ? { publisher: { '@type': 'Organization' as const, name: source.publisher } } : {}),
          })),
        }
      : {}),
  }

  const breadcrumbs: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: crumb.url })),
  }

  if (steps.length === 0) return [article, breadcrumbs]

  const howTo: WithContext<HowTo> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    ...(description ? { description } : {}),
    inLanguage: guide.locale,
    ...(guide.cost ? { estimatedCost: guide.cost } : {}),
    ...(supplies.length > 0 ? { supply: supplies.map((item) => ({ '@type': 'HowToSupply' as const, name: item.title })) } : {}),
    step: steps.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, name: step.title, text: step.body ?? step.title })),
  }

  return [article, breadcrumbs, howTo]
}

/** As it goes into an HTML file: a `<` in any text cannot close the script tag early. */
export const jsonLd = (datum: StructuredDatum): string => JSON.stringify(datum).replaceAll('<', '\\u003c')
