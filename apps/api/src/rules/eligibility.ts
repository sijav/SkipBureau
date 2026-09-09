export type Profile = {
  nationality?: string | undefined
  situation?: string | undefined
}

export type Criterion = { dimension: 'nationality' | 'nationalityGroup' | 'situation'; value: string }

/** Groups the profile's nationality belonged to on the date being asked about. */
export type GroupsAt = ReadonlySet<string>

export const matchesProfile = (criteria: readonly Criterion[], profile: Profile, groups: GroupsAt): boolean =>
  criteria.every((criterion) => {
    if (criterion.dimension === 'nationality') return profile.nationality === criterion.value
    if (criterion.dimension === 'situation') return profile.situation === criterion.value
    return groups.has(criterion.value)
  })

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
