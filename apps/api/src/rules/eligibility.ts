export type Profile = {
  nationality?: string | undefined
  situation?: string | undefined
  /** Where the reader lives, as region codes at any level, one per country, so a move can carry one on each side. */
  residenceRegions?: readonly string[] | undefined
  /** Where the reader works, the same way. */
  workRegions?: readonly string[] | undefined
}

export type Criterion = { dimension: 'nationality' | 'nationalityGroup' | 'situation' | 'residenceRegion' | 'workRegion'; value: string }

/** Groups the profile's nationality belonged to on the date being asked about. */
export type GroupsAt = ReadonlySet<string>

/**
 * One country's regions, each with the region it is inside, or null for a
 * first-level division (SB-186). A code a reader gives that is not a key here
 * is a place in another country.
 */
export type Places = ReadonlyMap<string, string | null>

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

const isPlace = (criterion: Criterion) => criterion.dimension === 'residenceRegion' || criterion.dimension === 'workRegion'

/** Whether a place is the other one or inside it, at any depth. */
const within = (place: string, container: string, places: Places): boolean => {
  // The database refuses a cycle; the set only keeps a row it missed from hanging a request.
  const seen = new Set<string>()
  let current: string | null | undefined = place
  while (current && !seen.has(current)) {
    if (current === container) return true
    seen.add(current)
    current = places.get(current)
  }
  return false
}

type CriterionFit = 'matches' | 'contradicted' | Detail

// A region answers per country: a mover who lives in TR-34 has not said where
// they will live in Germany, so a German region criterion is open for them.
// Within the country, a rule for the reader's place or a place it is inside is
// theirs; one for a place inside theirs may be, and they have not said; one for
// anywhere else in the country is not (SB-186).
const regionFit = (value: string, given: readonly string[] | undefined, detail: Detail, places: Places): CriterionFit => {
  const here = (given ?? []).filter((code) => places.has(code))
  if (here.some((code) => within(code, value, places))) return 'matches'
  if (here.length === 0 || here.some((code) => within(value, code, places))) return detail
  return 'contradicted'
}

const fitOne = (criterion: Criterion, profile: Profile, groups: GroupsAt, places: Places): CriterionFit => {
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
      return regionFit(criterion.value, profile.residenceRegions, Detail.residenceRegion, places)
    case 'workRegion':
      return regionFit(criterion.value, profile.workRegions, Detail.workRegion, places)
  }
}

const isDetail = (fit: CriterionFit): fit is Detail => fit !== 'matches' && fit !== 'contradicted'

/**
 * How a version's criteria meet a profile: contradicted by something the reader
 * said, or open on the details they have not said, or neither, which is a match.
 * A criterion the reader has not answered is not a criterion they fail (SB-176).
 * `places` are the regions of the version's own country.
 */
export const fitToProfile = (
  criteria: readonly Criterion[],
  profile: Profile,
  groups: GroupsAt,
  places: Places,
): { contradicted: boolean; open: Detail[] } => {
  const fits = criteria.map((criterion) => fitOne(criterion, profile, groups, places))
  if (fits.includes('contradicted')) return { contradicted: true, open: [] }
  return { contradicted: false, open: [...new Set(fits.filter(isDetail))].sort() }
}

export const matchesProfile = (criteria: readonly Criterion[], profile: Profile, groups: GroupsAt, places: Places): boolean => {
  const fit = fitToProfile(criteria, profile, groups, places)
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

/**
 * Codes that share a country with a different code in the same list, by the
 * country each region is stored under, since a key below the first level is
 * the product's own and not a code to parse.
 */
export const regionsInConflict = (profile: Profile, countries: ReadonlyMap<string, string>): string[] => {
  const countryOf = (code: string) => countries.get(code)
  const conflicting = [profile.residenceRegions ?? [], profile.workRegions ?? []].flatMap((list) =>
    list.filter((code) => countryOf(code) !== undefined && list.some((other) => other !== code && countryOf(other) === countryOf(code))),
  )
  return [...new Set(conflicting)]
}

const key = (criterion: Criterion) => `${criterion.dimension}:${criterion.value}`

/** A criterion says at least what another does: the same, or for a place, a place inside it. */
const coversOne = (specific: Criterion, general: Criterion, places: Places): boolean =>
  specific.dimension === general.dimension && (specific.value === general.value || (isPlace(general) && within(specific.value, general.value, places)))

/** Every criterion of the general set is met by one of the specific set's. */
const coversAll = (specific: readonly Criterion[], general: readonly Criterion[], places: Places): boolean =>
  general.every((criterion) => specific.some((candidate) => coversOne(candidate, criterion, places)))

/**
 * The first set says everything the second does and something more. Set
 * inclusion, with a place standing in for every place it is inside, so a city's
 * version is more specific than its province's and both than the country's
 * (SB-186).
 */
export const strictlyCovers = (specific: readonly Criterion[], general: readonly Criterion[], places: Places): boolean =>
  coversAll(specific, general, places) && !coversAll(general, specific, places)

/**
 * The candidates left after removing every one that another strictly covers.
 *
 * Specificity is set inclusion, not a count. A rule for EU nationals and a rule
 * for students both have one criterion and neither is more specific than the
 * other: this returns both, and the caller reports that as needing review
 * rather than picking one. Guessing which rule governs a residence permit is
 * the same kind of harm as inventing one, which this product already refused.
 */
export const mostSpecific = <T extends { criteria: readonly Criterion[] }>(candidates: readonly T[], places: Places): T[] =>
  candidates.filter((candidate) => !candidates.some((other) => other !== candidate && strictlyCovers(other.criteria, candidate.criteria, places)))

/**
 * A version's criteria other than places, in a form two versions compare by.
 * Versions of one scope differ only in where they apply, which is what lets one
 * inherit from another (SB-186).
 */
export const scopeOf = (criteria: readonly Criterion[]): string =>
  JSON.stringify(
    criteria
      .filter((criterion) => !isPlace(criterion))
      .map(key)
      .sort(),
  )
