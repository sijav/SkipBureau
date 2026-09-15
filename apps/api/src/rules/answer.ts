import { sameFact, type Fact } from './diff.js'
import { mostSpecific, scopeOf, strictlyCovers, type Criterion, type Detail, type Trees } from './eligibility.js'

// A rule version's answer completed from the versions it narrows. The resolver answers readers with it and the research
// publish reads the deployed API back against it, so both compute one answer (SB-249).

export type Candidate = { id: string; criteria: readonly Criterion[]; facts: readonly Fact[]; open: readonly Detail[] }

/**
 * What a version would tell a reader were it the rule: its facts completed from
 * the versions it narrows, and why a person has to settle them when they cannot
 * be.
 */
export type Answer = { facts: readonly Fact[]; disputed: string | null }

const byKey = (a: Fact, b: Fact) => (a.key < b.key ? -1 : 1)
const ordered = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

// Equal statements of one key are taken in the order of the page they were read on, then of their version, so the
// choice rests on what a research file and the database both hold, not on ids only one of them has (SB-249).
const byPage = (a: Fact, b: Fact) =>
  ordered(a.sourceUrl, b.sourceUrl) ||
  ordered(a.sourceName, b.sourceName) ||
  ordered(a.verifiedAt, b.verifiedAt) ||
  ordered(a.ruleVersionId, b.ruleVersionId)

/**
 * A version's facts, completed from the versions it narrows by place alone
 * (SB-186).
 *
 * Those are the versions it strictly covers with exactly its other criteria:
 * each of their places is this one's place of the same kind or one it is
 * inside, and a kind of place this one lacks cannot be among them. A key this
 * version states is its own, `none` included, so a city with no fee is never
 * handed the country's. A key it leaves out comes from the most specific of
 * them that states it. A version for EU nationals narrows nothing national, so
 * a key left out there stays a gap. Two that state one key differently where
 * neither covers the other, one for where the reader lives and one for where
 * they work, are not ranked.
 */
export const answerOf = (version: Candidate, standing: readonly Candidate[], trees: Trees): Answer => {
  const scope = scopeOf(version.criteria)
  const chain = standing.filter(
    (other) => other !== version && scopeOf(other.criteria) === scope && strictlyCovers(version.criteria, other.criteria, trees),
  )

  const facts = new Map(version.facts.map((fact) => [fact.key, fact]))
  const disputes: { key: string; versions: string[] }[] = []

  for (const key of [...new Set(chain.flatMap((other) => other.facts.map((fact) => fact.key)))].sort()) {
    if (facts.has(key)) continue
    const nearest = mostSpecific(
      chain.filter((other) => other.facts.some((fact) => fact.key === key)),
      trees,
    )
    const stated = nearest.flatMap((other) => other.facts.filter((fact) => fact.key === key))
    const [first] = [...stated].sort(byPage)
    if (!first) continue
    if (stated.every((fact) => sameFact(fact, first))) facts.set(key, first)
    else disputes.push({ key, versions: stated.map((fact) => fact.ruleVersionId).sort() })
  }

  const disputed =
    disputes.length === 0
      ? null
      : `The rules ${version.id} inherits from state ${disputes.map((dispute) => dispute.key).join(', ')} differently, and none is more specific than the others: ${[...new Set(disputes.flatMap((dispute) => dispute.versions))].join(', ')}`

  return { facts: [...facts.values()].sort(byKey), disputed }
}
