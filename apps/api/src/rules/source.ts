/** Where a figure was read: the page, its name, and the day it was read, as YYYY-MM-DD. */
export type Source = { sourceUrl: string; sourceName: string; verifiedAt: string }

type FactSource = { sourceUrl: string | null; sourceName: string | null; verifiedAt: Date | null }
type VersionSource = { sourceUrl: string; sourceName: string; verifiedAt: Date }

const day = (value: Date): string => value.toISOString().slice(0, 10)

/**
 * The page a fact was read on: its own, or where it has none, its version's.
 * All three fields from one or all three from the other, never one from each,
 * because a URL from one page with a date from another cites nothing (SB-188).
 *
 * `version` is the version the fact belongs to, never the one whose answer it
 * ends up in: a fact a Bursa answer inherits was read on the national page.
 */
export const sourceOf = (fact: FactSource, version: VersionSource): Source =>
  fact.sourceUrl !== null && fact.sourceName !== null && fact.verifiedAt !== null
    ? { sourceUrl: fact.sourceUrl, sourceName: fact.sourceName, verifiedAt: day(fact.verifiedAt) }
    : { sourceUrl: version.sourceUrl, sourceName: version.sourceName, verifiedAt: day(version.verifiedAt) }
