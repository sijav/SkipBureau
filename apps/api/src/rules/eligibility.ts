export type Profile = {
  nationality?: string | undefined
  situation?: string | undefined
  /** Where the reader lives, as ISO 3166-2 codes, one per country, so a move can carry one on each side. */
  residenceRegions?: readonly string[] | undefined
  /** Where the reader works, the same way. */
  workRegions?: readonly string[] | undefined
}

export type Criterion = { dimension: 'nationality' | 'nationalityGroup' | 'situation' | 'residenceRegion' | 'workRegion'; value: string }

/** Groups the profile's nationality belonged to on the date being asked about. */
export type GroupsAt = ReadonlySet<string>

/**
 * A detail a reader can be asked for, named as the profile names it. A rule for
 * a nationality group asks for the nationality, never the group (SB-176).
 */
export enum Detail {
  nationality = 'nationality',
  situation = 'situation',
  residenceRegion = 'residenceRegion',
  workRegion = 'workRegion',
}

const countryOf = (code: string) => code.split('-')[0] ?? code

type CriterionFit = 'matches' | 'contradicted' | Detail

// A region answers per country: a mover who lives in TR-34 has not said where
// they will live in Germany, so a German region criterion is open for them.
const regionFit = (value: string, given: readonly string[] | undefined, detail: Detail): CriterionFit => {
  const codes = given ?? []
  if (codes.includes(value)) return 'matches'
  return codes.some((code) => countryOf(code) === countryOf(value)) ? 'contradicted' : detail
}

const fitOne = (criterion: Criterion, profile: Profile, groups: GroupsAt): CriterionFit => {
  switch (criterion.dimension) {
    case 'nationality':
      if (!profile.nationality) return Detail.nationality
      return profile.nationality === criterion.value ? 'matches' : 'contradicted'
    case 'nationalityGroup':
      if (!profile.nationality) return Detail.nationality
      return groups.has(criterion.value) ? 'matches' : 'contradicted'
    case 'situation':
      if (!profile.situation) return Detail.situation
      return profile.situation === criterion.value ? 'matches' : 'contradicted'
    case 'residenceRegion':
      return regionFit(criterion.value, profile.residenceRegions, Detail.residenceRegion)
    case 'workRegion':
      return regionFit(criterion.value, profile.workRegions, Detail.workRegion)
  }
}

const isDetail = (fit: CriterionFit): fit is Detail => fit !== 'matches' && fit !== 'contradicted'

/**
 * How a version's criteria meet a profile: contradicted by something the reader
 * said, or open on the details they have not said, or neither, which is a match.
 * A criterion the reader has not answered is not a criterion they fail (SB-176).
 */
export const fitToProfile = (criteria: readonly Criterion[], profile: Profile, groups: GroupsAt): { contradicted: boolean; open: Detail[] } => {
  const fits = criteria.map((criterion) => fitOne(criterion, profile, groups))
  if (fits.includes('contradicted')) return { contradicted: true, open: [] }
  return { contradicted: false, open: [...new Set(fits.filter(isDetail))].sort() }
}

export const matchesProfile = (criteria: readonly Criterion[], profile: Profile, groups: GroupsAt): boolean => {
  const fit = fitToProfile(criteria, profile, groups)
  return !fit.contradicted && fit.open.length === 0
}

/**
 * Regions a profile cannot hold.
 *
 * Two of one country in the same list say the reader lives, or works, in two
 * places at once, and a code that is no region would match nothing and hand
 * them the national rule without a word. Both are the caller's mistake rather
 * than a question of law, so they are refused before anything is resolved
 * instead of being reported as an ambiguity (SB-168).
 */
export class RegionProfileError extends Error {
  readonly codes: readonly string[]

  constructor(codes: readonly string[], message: string) {
    super(message)
    this.name = 'RegionProfileError'
    this.codes = codes
  }
}

/** Codes that share a country with a different code in the same list. */
export const regionsInConflict = (profile: Profile): string[] => {
  const conflicting = [profile.residenceRegions ?? [], profile.workRegions ?? []].flatMap((list) =>
    list.filter((code) => list.some((other) => other !== code && countryOf(other) === countryOf(code))),
  )
  return [...new Set(conflicting)]
}

const key = (criterion: Criterion) => `${criterion.dimension}:${criterion.value}`

/** Every criterion of the narrower set is in the wider one, and the wider one has more. */
export const strictlyCovers = (wider: readonly Criterion[], narrower: readonly Criterion[]): boolean => {
  const set = new Set(wider.map(key))
  return wider.length > narrower.length && narrower.every((criterion) => set.has(key(criterion)))
}

/**
 * The candidates left after removing every one that another strictly covers.
 *
 * Specificity is set inclusion, not a count. A rule for EU nationals and a rule
 * for students both have one criterion and neither is more specific than the
 * other: this returns both, and the caller reports that as needing review
 * rather than picking one. Guessing which rule governs a residence permit is
 * the same kind of harm as inventing one, which this product already refused.
 */
export const mostSpecific = <T extends { criteria: readonly Criterion[] }>(candidates: readonly T[]): T[] =>
  candidates.filter((candidate) => !candidates.some((other) => other !== candidate && strictlyCovers(other.criteria, candidate.criteria)))
