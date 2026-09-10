import type { ResultOf } from '@graphql-typed-document-node/core'
import type { CountriesQuery, GuideQuery } from './documents'

// Real reads of generated result types. Without one of these the contract is
// theatre: a field could vanish from the schema and nothing in the app would
// stop compiling, because nothing was looking at it.

export type Countries = ResultOf<typeof CountriesQuery>
export type Guide = ResultOf<typeof GuideQuery>

/** The codes a reader can browse, in the order the server returned them. */
export const countryCodes = (data: Countries): string[] => data.countries.map((country) => country.code)

/**
 * Whether this guide is being shown in a language the reader did not ask for.
 *
 * The server answers it rather than the app guessing from an empty title,
 * which is the distinction SB-049 turns on.
 */
export const isUntranslated = (data: Guide): boolean => data.guide?.translationMissing ?? false

/** The most recent date anything on this page was checked. */
export const lastVerified = (data: Guide): string | null => {
  const guide = data.guide
  if (!guide) return null

  const dates = [guide.verifiedAt, ...guide.sources.map((source) => source.verifiedAt)]
  return dates.reduce((latest, date) => (date > latest ? date : latest), guide.verifiedAt)
}
