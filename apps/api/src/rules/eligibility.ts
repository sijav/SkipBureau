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

export const matchesProfile = (criteria: readonly Criterion[], profile: Profile, groups: GroupsAt): boolean =>
  criteria.every((criterion) => {
    if (criterion.dimension === 'nationality') return profile.nationality === criterion.value
    if (criterion.dimension === 'situation') return profile.situation === criterion.value
    if (criterion.dimension === 'residenceRegion') return profile.residenceRegions?.includes(criterion.value) ?? false
    if (criterion.dimension === 'workRegion') return profile.workRegions?.includes(criterion.value) ?? false
    return groups.has(criterion.value)
  })

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

const countryOf = (code: string) => code.split('-')[0] ?? code

/** Codes that share a country with a different code in the same list. */
export const regionsInConflict = (profile: Profile): string[] => {
  const conflicting = [profile.residenceRegions ?? [], profile.workRegions ?? []].flatMap((list) =>
    list.filter((code) => list.some((other) => other !== code && countryOf(other) === countryOf(code))),
  )
  return [...new Set(conflicting)]
}

const key = (criterion: Criterion) => `${criterion.dimension}:${criterion.value}`

const covers = (wider: readonly Criterion[], narrower: readonly Criterion[]): boolean => {
  const set = new Set(wider.map(key))
  return narrower.every((criterion) => set.has(key(criterion)))
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
  candidates.filter(
    (candidate) =>
      !candidates.some(
        (other) =>
          other !== candidate &&
          covers(other.criteria, candidate.criteria) &&
          other.criteria.length > candidate.criteria.length,
      ),
  )
