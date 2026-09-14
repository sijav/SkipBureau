import type { EligibilityDimension, FactOperator, ObligationKind } from '../../generated/prisma/client.js'

/** A page a researched version or fact is read on. */
export type ResearchSource = {
  url: string
  /** A short name for the page, in the page's own language. */
  name: string
  /** The day the page was read, YYYY-MM-DD, as its definitions' `read` says. */
  read: string
}

/** A residence status a researched version names (SB-194), listed after the status it is a kind of. */
export type ResearchStatus = {
  code: string
  /** The status this is a kind of, or null for one with nothing above it. */
  parent: string | null
  names: { en: string; fa: string }
}

/** A place a reader can say they are in (SB-210), listed after the place it is inside. */
export type ResearchRegion = {
  code: string
  /** The place this one is inside, or null for a first-level division such as a province. */
  parent: string | null
  /** Its official name, as the list the file names prints it. */
  name: string
  /** How the page that codes it spells its name, where that differs from `name`: read by the check, never written. */
  isoName?: string
}

/** One definition of an agreed document, on a page of the file's own. */
export type ResearchReading = {
  /** The key in `sources` of the page. */
  source: string
  label: string
}

/** The agreed document a file's regions are read from, and its two definitions, each quoting one passage per region. */
export type ResearchRegionSource = {
  document: string
  /** Whose passages each hold a region's code beside its name as that page spells it. */
  codes: ResearchReading
  /** Whose passages are each exactly one region's official name. */
  names: ResearchReading
}

/** One nationality's membership of a group (SB-192). */
export type ResearchMembership = {
  nationality: string
  /** YYYY-MM-DD, the first day it holds. */
  from: string
  /** YYYY-MM-DD, the first day it no longer holds; left out while it holds. */
  until?: string
}

/** A nationality group a researched version names, whose memberships the file owns (SB-192). */
export type ResearchNationalityGroup = {
  code: string
  name: string
  members: readonly ResearchMembership[]
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
  /** The agreed document this fact is read from, where it is not its version's own (SB-192). */
  document?: string
  /** The key in `sources` of the page this fact is read on. */
  source: string
  /** The definitions of the fact's agreed document that state this fact on that page. */
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
  /** Written before any version and in this order, so a status comes before any kind of it. */
  statuses: readonly ResearchStatus[]
  /** Written after statuses and in this order, so a place comes before any place inside it. */
  regions: readonly ResearchRegion[]
  /** Where the regions are read from, which a file with any regions must say (SB-210). */
  regionsFrom?: ResearchRegionSource
  /** Written before any version, and compared with the memberships deployed. */
  nationalityGroups: readonly ResearchNationalityGroup[]
  obligations: readonly ResearchObligation[]
  sources: Readonly<Record<string, ResearchSource>>
  versions: readonly ResearchVersion[]
}
