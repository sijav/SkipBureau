/**
 * Which rule version is in force, in one place.
 *
 * `RulesService.resolve` answers it for a person, and a guide answers it for
 * nobody in particular. Those are different questions with the same core, and
 * writing the core twice is how the two drift until a guide and the move view
 * disagree about the same rule.
 */

/**
 * Half open: `validFrom <= at < validTo`, and a null `validTo` means in force.
 *
 * A version dated next year is not current. `verifiedAt` says when someone
 * checked the source; it does not make a future rule apply today.
 */
export const inForceAt = (at: Date) => ({
  validFrom: { lte: at },
  OR: [{ validTo: null }, { validTo: { gt: at } }],
})

/**
 * The version that applies to everyone in a country: in force, and carrying no
 * eligibility criteria at all.
 *
 * A version scoped to students is NOT a general answer merely because it is the
 * only record that exists. Treating it as one would show a student's rule to a
 * worker, silently, which is the same guess this product already refuses to
 * make about an ambiguous match.
 */
export const generalVersionAt = (countryCode: string, at: Date) => ({
  countryCode,
  ...inForceAt(at),
  criteria: { none: {} },
})
