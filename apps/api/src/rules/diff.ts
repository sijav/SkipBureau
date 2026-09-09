export type Fact = {
  key: string
  operator: string
  numericValue: string | null
  textValue: string | null
  unit: string | null
  currency: string | null
}

export type Resolved = {
  obligationSlug: string
  ruleVersionId: string
  facts: readonly Fact[]
}

export type FactDifference = {
  key: string
  from: Fact | null
  to: Fact | null
}

/** What happens to one obligation. Lives here, in the pure module, so the
 * comparison can be tested without Nest; rules.model.ts registers it with
 * GraphQL rather than declaring a second copy. */
export enum Verdict {
  identical = 'identical',
  changed = 'changed',
  newInDestination = 'newInDestination',
  endsOnLeaving = 'endsOnLeaving',
  needsReview = 'needsReview',
}

export type Entry = {
  obligationSlug: string
  verdict: Verdict
  from: Resolved | null
  to: Resolved | null
  differences: FactDifference[]
  /** Why this needs a person, when it does. Empty otherwise. */
  reason: string | null
}

const sameFact = (a: Fact, b: Fact): boolean =>
  a.operator === b.operator &&
  a.numericValue === b.numericValue &&
  a.textValue === b.textValue &&
  a.unit === b.unit &&
  a.currency === b.currency

const byKey = (facts: readonly Fact[]) => new Map(facts.map((fact) => [fact.key, fact]))

const differences = (from: Resolved, to: Resolved): FactDifference[] => {
  const before = byKey(from.facts)
  const after = byKey(to.facts)

  return [...new Set([...before.keys(), ...after.keys()])]
    .sort()
    .flatMap((key) => {
      const a = before.get(key) ?? null
      const b = after.get(key) ?? null
      if (a && b && sameFact(a, b)) return []
      return [{ key, from: a, to: b }]
    })
}

export type Side = { resolved: Resolved | null; ambiguous: string | null }

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

    const reason = from?.ambiguous ?? to?.ambiguous ?? null
    if (reason) {
      return {
        obligationSlug,
        verdict: Verdict.needsReview,
        from: from?.resolved ?? null,
        to: to?.resolved ?? null,
        differences: [],
        reason,
      }
    }

    const before = from?.resolved ?? null
    const after = to?.resolved ?? null

    if (before && after) {
      const changed = differences(before, after)
      return {
        obligationSlug,
        verdict: changed.length ? Verdict.changed : Verdict.identical,
        from: before,
        to: after,
        differences: changed,
        reason: null,
      }
    }

    return {
      obligationSlug,
      verdict: after ? Verdict.newInDestination : Verdict.endsOnLeaving,
      from: before,
      to: after,
      differences: [],
      reason: null,
    }
  })
}
