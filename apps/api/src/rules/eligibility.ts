export type Profile = {
  nationality?: string | undefined
  situation?: string | undefined
  /** Where the reader lives, as region codes at any level, one per country, so a move can carry one on each side. */
  residenceRegions?: readonly string[] | undefined
  /** Where the reader works, the same way. */
  workRegions?: readonly string[] | undefined
  /** What the reader holds in each country, as residence status codes at any level, one per country (SB-189). */
  residenceStatuses?: readonly string[] | undefined
}

export type Criterion = {
  dimension: 'nationality' | 'nationalityGroup' | 'situation' | 'residenceRegion' | 'workRegion' | 'residenceStatus'
  value: string
}

/** Groups the profile's nationality belonged to on the date being asked about. */
export type GroupsAt = ReadonlySet<string>

/**
 * One country's rows of a tree, each with the row it is inside, or null for a
 * row with nothing above it: its places (SB-186) or its residence statuses
 * (SB-189). A code a reader gives that is not a key here belongs to another
 * country.
 */
export type Tree = ReadonlyMap<string, string | null>

/** A country's two trees, read once per answer. */
export type Trees = { places: Tree; statuses: Tree }

/**
 * A detail a reader can be asked for, named as the profile names it. A rule for
 * a nationality group asks for the nationality, never the group (SB-176).
 */
export enum Detail {
  nationality = 'nationality',
  situation = 'situation',
  residenceRegion = 'residenceRegion',
  workRegion = 'workRegion',
  residenceStatus = 'residenceStatus',
}

const isPlace = (criterion: Criterion) => criterion.dimension === 'residenceRegion' || criterion.dimension === 'workRegion'

/** The tree a criterion's value is a row of, where it is one. */
const treeOf = (criterion: Criterion, trees: Trees): Tree | undefined => {
  if (isPlace(criterion)) return trees.places
  if (criterion.dimension === 'residenceStatus') return trees.statuses
  return undefined
}

/** Whether a row is the other one or inside it, at any depth. */
const within = (row: string, container: string, tree: Tree): boolean => {
  // The database refuses a cycle; the set only keeps a row it missed from hanging a request.
  const seen = new Set<string>()
  let current: string | null | undefined = row
  while (current && !seen.has(current)) {
    if (current === container) return true
    seen.add(current)
    current = tree.get(current)
  }
  return false
}

type CriterionFit = 'matches' | 'contradicted' | Detail

// A tree answers per country: a mover who lives in TR-34 has not said where
// they will live in Germany, and a permit held in Turkey says nothing about
// what they will hold there, so a German criterion is open for them. Within the
// country, a rule for the reader's row or a row it is inside is theirs; one for
// a row inside theirs may be, and they have not said; one for any other row of
// the country is not (SB-186, SB-189).
const treeFit = (value: string, given: readonly string[] | undefined, detail: Detail, tree: Tree): CriterionFit => {
  const here = (given ?? []).filter((code) => tree.has(code))
  if (here.some((code) => within(code, value, tree))) return 'matches'
  if (here.length === 0 || here.some((code) => within(value, code, tree))) return detail
  return 'contradicted'
}

const fitOne = (criterion: Criterion, profile: Profile, groups: GroupsAt, trees: Trees): CriterionFit => {
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
      return treeFit(criterion.value, profile.residenceRegions, Detail.residenceRegion, trees.places)
    case 'workRegion':
      return treeFit(criterion.value, profile.workRegions, Detail.workRegion, trees.places)
    case 'residenceStatus':
      return treeFit(criterion.value, profile.residenceStatuses, Detail.residenceStatus, trees.statuses)
  }
}

const isDetail = (fit: CriterionFit): fit is Detail => fit !== 'matches' && fit !== 'contradicted'

/**
 * How a version's criteria meet a profile: contradicted by something the reader
 * said, or open on the details they have not said, or neither, which is a match.
 * A criterion the reader has not answered is not a criterion they fail (SB-176).
 * `trees` are the places and statuses of the version's own country.
 */
export const fitToProfile = (
  criteria: readonly Criterion[],
  profile: Profile,
  groups: GroupsAt,
  trees: Trees,
): { contradicted: boolean; open: Detail[] } => {
  const fits = criteria.map((criterion) => fitOne(criterion, profile, groups, trees))
  if (fits.includes('contradicted')) return { contradicted: true, open: [] }
  return { contradicted: false, open: [...new Set(fits.filter(isDetail))].sort() }
}

/**
 * A reader's nationality as the rules hold it (SB-277).
 *
 * An ISO 3166 code is the same code in either case, and memberships are stored lower case, so a caller sending the
 * conventional upper-case code matched no group and was told there was no rule. A nationality is the one reader code
 * nothing validates: a region or a status in the wrong case is refused by name, and this was answered silently.
 */
export const canonicalNationality = (profile: Profile): Profile =>
  profile.nationality === undefined ? profile : { ...profile, nationality: profile.nationality.toLowerCase() }

export const matchesProfile = (criteria: readonly Criterion[], profile: Profile, groups: GroupsAt, trees: Trees): boolean => {
  const fit = fitToProfile(criteria, profile, groups, trees)
  return !fit.contradicted && fit.open.length === 0
}

/**
 * What a profile cannot hold.
 *
 * Two regions of one country in the same list say the reader lives, or works,
 * in two places at once, two statuses of one country that they hold two things
 * there at once, and a code that is no region or no status would match nothing
 * and hand them the national rule without a word. All are the caller's mistake
 * rather than a question of law, so they are refused before anything is
 * resolved instead of being reported as an ambiguity (SB-168, SB-189).
 */
export class ProfileError extends Error {
  readonly codes: readonly string[]

  constructor(codes: readonly string[], message: string) {
    super(message)
    this.name = 'ProfileError'
    this.codes = codes
  }
}

/**
 * Codes in one list that share a country with a different code in it, by the
 * country each row is stored under, since a key is the product's own and not a
 * code to parse.
 */
export const inConflict = (list: readonly string[], countries: ReadonlyMap<string, string>): string[] => {
  const countryOf = (code: string) => countries.get(code)
  return [...new Set(list.filter((code) => countryOf(code) !== undefined && list.some((other) => other !== code && countryOf(other) === countryOf(code))))]
}

const key = (criterion: Criterion) => `${criterion.dimension}:${criterion.value}`

/** A criterion says at least what another does: the same, or for a row of a tree, a row inside it. */
const coversOne = (specific: Criterion, general: Criterion, trees: Trees): boolean => {
  if (specific.dimension !== general.dimension) return false
  if (specific.value === general.value) return true
  const tree = treeOf(general, trees)
  return tree !== undefined && within(specific.value, general.value, tree)
}

/** Every criterion of the general set is met by one of the specific set's. */
const coversAll = (specific: readonly Criterion[], general: readonly Criterion[], trees: Trees): boolean =>
  general.every((criterion) => specific.some((candidate) => coversOne(candidate, criterion, trees)))

/**
 * The first set says everything the second does and something more. Set
 * inclusion, with a row of a tree standing in for every row it is inside, so a
 * city's version is more specific than its province's, and a student residence
 * permit's than a residence permit's (SB-186, SB-189).
 */
export const strictlyCovers = (specific: readonly Criterion[], general: readonly Criterion[], trees: Trees): boolean =>
  coversAll(specific, general, trees) && !coversAll(general, specific, trees)

/**
 * The candidates left after removing every one that another strictly covers.
 *
 * Specificity is set inclusion, not a count. A rule for EU nationals and a rule
 * for students both have one criterion and neither is more specific than the
 * other: this returns both, and the caller reports that as needing review
 * rather than picking one. Guessing which rule governs a residence permit is
 * the same kind of harm as inventing one, which this product already refused.
 */
export const mostSpecific = <T extends { criteria: readonly Criterion[] }>(candidates: readonly T[], trees: Trees): T[] =>
  candidates.filter((candidate) => !candidates.some((other) => other !== candidate && strictlyCovers(other.criteria, candidate.criteria, trees)))

/**
 * A version's criteria other than places, in a form two versions compare by.
 * Versions of one scope differ only in where they apply, which is what lets one
 * inherit from another (SB-186). A residence status is scope, not a place, so a
 * version for one kind of permit inherits nothing from one for every permit.
 */
export const scopeOf = (criteria: readonly Criterion[]): string =>
  JSON.stringify(
    criteria
      .filter((criterion) => !isPlace(criterion))
      .map(key)
      .sort(),
  )
