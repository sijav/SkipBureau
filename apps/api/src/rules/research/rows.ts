import type { EligibilityDimension, FactOperator, ObligationKind } from '../../generated/prisma/client.js'

/** A page a researched version or fact is read on. */
export type ResearchSource = {
  url: string
  /** A short name for the page, in the page's own language. */
  name: string
  /** The day the page was read, YYYY-MM-DD, as its definitions' `read` says. */
  read: string
}

export type ResearchObligation = {
  slug: string
  kind: ObligationKind
  titles: { en: string; fa: string }
}

export type ResearchFact = {
  key: string
  operator: FactOperator
  numericValue?: number
  textValue?: string
  unit?: string
  currency?: string
  /** The key in `sources` of the page this fact is read on. */
  source: string
  /** The definitions of the version's agreed document that state this fact on that page. */
  labels: readonly string[]
}

export type ResearchVersion = {
  obligation: string
  /** The agreed document this version is written from, research/agreed/<research>/<document>.md. */
  document: string
  /** YYYY-MM-DD. */
  validFrom: string
  criteria: readonly { dimension: EligibilityDimension; value: string }[]
  /** The key in `sources` of the page for what the version itself states. */
  source: string
  /** The definitions of the agreed document that say it, on that page. */
  labels: readonly string[]
  facts: readonly ResearchFact[]
  notes: { en: string }
}

/**
 * One country's researched rules (SB-190): only what its agreed research
 * supports, as the rows the loader writes, every version and fact naming the
 * definitions of the agreed document it rests on so a test can read them back.
 */
export type ResearchRules = {
  country: string
  /** The folder under research/agreed that its documents are in. */
  research: string
  obligations: readonly ResearchObligation[]
  sources: Readonly<Record<string, ResearchSource>>
  versions: readonly ResearchVersion[]
}
