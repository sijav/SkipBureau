import type { Detail } from './eligibility.js'

export type Fact = {
  key: string
  operator: string
  numericValue: string | null
  textValue: string | null
  unit: string | null
  currency: string | null
  /**
   * The version this fact was read from. A place's answer takes what its own
   * version does not change from the wider places' versions, each with its own
   * source and verified date (SB-186).
   */
  ruleVersionId: string
  /** The page this figure was read on, its name and the day it was read: the fact's own, or its version's (SB-188). */
  sourceUrl: string
  sourceName: string
  verifiedAt: string
}

/** A rule version's note, in the language it is in (SB-209). */
export type Note = {
  ruleVersionId: string
  text: string
  locale: string
  /** True where the version has no note in the language asked for, so this one is in another. */
  translationMissing: boolean
}

export type Resolved = {
  obligationSlug: string
  /** The most specific version that applies; each fact names the version it came from. */
  ruleVersionId: string
  facts: readonly Fact[]
  /**
   * The notes of the version that applies and of each wider place's version one
   * of its facts came from, widest place first. Never compared: a note changes
   * no verdict (SB-209).
   */
  notes: readonly Note[]
}

export type FactDifference = {
  key: string
  from: Fact | null
  to: Fact | null
  /**
   * False where one side has no row for the key at all. That is a gap in what
   * was recorded, not a difference anyone checked; a side that was checked and
   * has none of it says so with the `none` operator (SB-082).
   */
  known: boolean
}

/** What happens to one obligation. Lives here, in the pure module, so the
 * comparison can be tested without Nest; rules.model.ts registers it with
 * GraphQL rather than declaring a second copy. */
export enum Verdict {
  identical = 'identical',
  changed = 'changed',
  /** Nothing known differs, but a fact is recorded on one side only, so whether it differs is not known. */
  unknown = 'unknown',
  newInDestination = 'newInDestination',
  endsOnLeaving = 'endsOnLeaving',
  needsReview = 'needsReview',
  /** The answer depends on details this person has not given, named in `needs`. */
  needsDetail = 'needsDetail',
}

export type Entry = {
  obligationSlug: string
  verdict: Verdict
  from: Resolved | null
  to: Resolved | null
  differences: FactDifference[]
  /** Why this needs a person, when it does. Empty otherwise. */
  reason: string | null
  /** Details this person has not given that could change the answer, on either side. */
  needs: readonly Detail[]
}

/** The same value, whichever version it was read from. */
export const sameFact = (a: Fact, b: Fact): boolean =>
  a.operator === b.operator &&
  a.numericValue === b.numericValue &&
  a.textValue === b.textValue &&
  a.unit === b.unit &&
  a.currency === b.currency

const byKey = (facts: readonly Fact[]) => new Map(facts.map((fact) => [fact.key, fact]))

/**
 * The same facts under the same keys, by the rule the diff uses. A key on one
 * side only is a difference here too: `none` is a checked answer, a missing key
 * is a gap, and neither is the other.
 */
export const sameFacts = (a: readonly Fact[], b: readonly Fact[]): boolean => {
  const before = byKey(a)
  const after = byKey(b)
  return (
    before.size === after.size &&
    [...before].every(([key, fact]) => {
      const other = after.get(key)
      return other !== undefined && sameFact(fact, other)
    })
  )
}

const differences = (from: Resolved, to: Resolved): FactDifference[] => {
  const before = byKey(from.facts)
  const after = byKey(to.facts)

  return [...new Set([...before.keys(), ...after.keys()])]
    .sort()
    .flatMap((key) => {
      const a = before.get(key) ?? null
      const b = after.get(key) ?? null
      if (a && b && sameFact(a, b)) return []
      return [{ key, from: a, to: b, known: a !== null && b !== null }]
    })
}

/**
 * One country's answer for one obligation. `needs` is independent of the other
 * two: a side can be tied now and also say which detail could break the tie.
 * When it is not empty `resolved` is null, because a provisional answer beside
 * a question is the answer the question exists to replace (SB-176).
 */
export type Side = { resolved: Resolved | null; ambiguous: string | null; needs: readonly Detail[] }

/**
 * Compares two already-resolved sides.
 *
 * Resolution happens first and separately, on purpose. Joining raw rows would
 * let a historic version, a general rule and an exception all answer at once,
 * and the diff would be between things nobody is subject to.
 */
export const compare = (origin: ReadonlyMap<string, Side>, destination: ReadonlyMap<string, Side>): Entry[] => {
  const slugs = [...new Set([...origin.keys(), ...destination.keys()])].sort()

  return slugs.map((obligationSlug) => {
    const from = origin.get(obligationSlug)
    const to = destination.get(obligationSlug)
    const needs = [...new Set([...(from?.needs ?? []), ...(to?.needs ?? [])])].sort()

    // An ambiguity is never hidden behind a question: a caller that reads only
    // the verdict still learns a person has to decide, and `needs` says what
    // could still be asked.
    const reason = from?.ambiguous ?? to?.ambiguous ?? null
    if (reason || needs.length > 0) {
      return {
        obligationSlug,
        verdict: reason ? Verdict.needsReview : Verdict.needsDetail,
        from: from?.resolved ?? null,
        to: to?.resolved ?? null,
        differences: [],
        reason,
        needs,
      }
    }

    const before = from?.resolved ?? null
    const after = to?.resolved ?? null

    if (before && after) {
      const found = differences(before, after)
      // One known difference is enough to say it changed; the gaps are still
      // listed beside it, each saying it is one.
      const verdict = found.some((difference) => difference.known) ? Verdict.changed : found.length ? Verdict.unknown : Verdict.identical
      return {
        obligationSlug,
        verdict,
        from: before,
        to: after,
        differences: found,
        reason: null,
        needs,
      }
    }

    return {
      obligationSlug,
      verdict: after ? Verdict.newInDestination : Verdict.endsOnLeaving,
      from: before,
      to: after,
      differences: [],
      reason: null,
      needs,
    }
  })
}
