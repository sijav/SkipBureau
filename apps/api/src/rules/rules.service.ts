import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { compare, sameFact, sameFacts, type Entry, type Fact, type Side } from './diff.js'
import {
  fitToProfile,
  mostSpecific,
  RegionProfileError,
  regionsInConflict,
  scopeOf,
  strictlyCovers,
  type Criterion,
  type Detail,
  type Places,
  type Profile,
} from './eligibility.js'
import { inForceAt } from './selection.js'
import { sourceOf } from './source.js'

type Candidate = { id: string; criteria: readonly Criterion[]; facts: readonly Fact[]; open: readonly Detail[] }

/**
 * What a version would tell a reader were it the rule: its facts completed from
 * the versions it narrows, and why a person has to settle them when they cannot
 * be.
 */
type Answer = { facts: readonly Fact[]; disputed: string | null }

type Answered = Candidate & { answer: Answer }

const byKey = (a: Fact, b: Fact) => (a.key < b.key ? -1 : 1)
const byVersion = (a: Fact, b: Fact) => (a.ruleVersionId < b.ruleVersionId ? -1 : 1)

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
const answerOf = (version: Candidate, standing: readonly Candidate[], places: Places): Answer => {
  const scope = scopeOf(version.criteria)
  const chain = standing.filter(
    (other) => other !== version && scopeOf(other.criteria) === scope && strictlyCovers(version.criteria, other.criteria, places),
  )

  const facts = new Map(version.facts.map((fact) => [fact.key, fact]))
  const disputes: { key: string; versions: string[] }[] = []

  for (const key of [...new Set(chain.flatMap((other) => other.facts.map((fact) => fact.key)))].sort()) {
    if (facts.has(key)) continue
    const nearest = mostSpecific(
      chain.filter((other) => other.facts.some((fact) => fact.key === key)),
      places,
    )
    const stated = nearest.flatMap((other) => other.facts.filter((fact) => fact.key === key)).sort(byVersion)
    const [first] = stated
    if (!first) continue
    if (stated.every((fact) => sameFact(fact, first))) facts.set(key, first)
    else disputes.push({ key, versions: stated.map((fact) => fact.ruleVersionId) })
  }

  const disputed =
    disputes.length === 0
      ? null
      : `The rules ${version.id} inherits from state ${disputes.map((dispute) => dispute.key).join(', ')} differently, and none is more specific than the others: ${[...new Set(disputes.flatMap((dispute) => dispute.versions))].join(', ')}`

  return { facts: [...facts.values()].sort(byKey), disputed }
}

const sameAnswer = (a: Answer, b: Answer): boolean => a.disputed === null && b.disputed === null && sameFacts(a.facts, b.facts)

/**
 * Whether answering what an open version leaves unanswered could change what
 * the reader is told (SB-176). With no winner it could become the answer. With
 * one, it would win or tie, which changes nothing a reader sees when both would
 * tell them the same, each completed from the places it narrows (SB-186). With
 * a tie, only a version covering every tied one could settle it; anything else
 * could only join the tie.
 */
const matters = (open: Answered, winners: readonly Answered[], places: Places): boolean => {
  const [only] = winners
  if (!only) return true
  if (winners.length === 1) return !sameAnswer(open.answer, only.answer)
  return winners.every((winner) => strictlyCovers(open.criteria, winner.criteria, places))
}

/** One side of a move: a country, and the person as they are there. */
export type Place = { country: string; profile: Profile }

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** The groups a nationality belonged to on a given date, not today. */
  private async groupsAt(nationality: string | undefined, at: Date): Promise<ReadonlySet<string>> {
    if (!nationality) return new Set()

    const memberships = await this.prisma.nationalityGroupMember.findMany({
      where: {
        nationality,
        validFrom: { lte: at },
        OR: [{ validTo: null }, { validTo: { gt: at } }],
      },
      select: { groupCode: true },
    })

    return new Set(memberships.map((membership) => membership.groupCode))
  }

  /**
   * Refuses regions a profile cannot hold, before anything is resolved: a code
   * that is not a region, or two of one country in the same list. Here rather
   * than in the resolver, so that every caller is refused the same way.
   */
  private async checkRegions(profile: Profile): Promise<void> {
    const codes = [...new Set([...(profile.residenceRegions ?? []), ...(profile.workRegions ?? [])])]
    if (codes.length === 0) return

    const regions = await this.prisma.region.findMany({ where: { code: { in: codes } }, select: { code: true, countryCode: true } })
    const countries = new Map(regions.map((region) => [region.code, region.countryCode]))
    const unknown = codes.filter((code) => !countries.has(code))
    if (unknown.length > 0) throw new RegionProfileError(unknown, `Not a region: ${unknown.join(', ')}.`)

    const conflicting = regionsInConflict(profile, countries)
    if (conflicting.length > 0) {
      throw new RegionProfileError(
        conflicting,
        `Only one region per country can be where a reader lives, and one where they work: ${conflicting.join(', ')}.`,
      )
    }
  }

  /** A country's regions and the region each is inside, read once per answer rather than walked per criterion. */
  private async placesOf(countryCode: string): Promise<Places> {
    const regions = await this.prisma.region.findMany({ where: { countryCode }, select: { code: true, parentCode: true } })
    return new Map(regions.map((region) => [region.code, region.parentCode]))
  }

  /**
   * Exactly one rule per obligation, or a note that a person has to decide.
   *
   * Half open on the dates: a version ending on the first and another starting
   * that day do not both apply, which is the boundary every naive range check
   * gets wrong.
   */
  async resolve(countryCode: string, profile: Profile, at: Date): Promise<Map<string, Side>> {
    await this.checkRegions(profile)
    return this.resolveChecked(countryCode, profile, at)
  }

  /** `resolve` for a profile already checked, so a caller resolving twice checks once. */
  private async resolveChecked(countryCode: string, profile: Profile, at: Date): Promise<Map<string, Side>> {
    const groups = await this.groupsAt(profile.nationality, at)
    const places = await this.placesOf(countryCode)

    const versions = await this.prisma.ruleVersion.findMany({
      where: { countryCode, ...inForceAt(at) },
      include: { criteria: true, facts: true, obligation: true },
    })

    type Version = (typeof versions)[number]

    // A fact's page is resolved here, against the version it was read from,
    // before any answer merges facts from several versions (SB-188).
    const toFact = (fact: Version['facts'][number], version: Version): Fact => ({
      key: fact.key,
      operator: fact.operator,
      numericValue: fact.numericValue === null ? null : fact.numericValue.toString(),
      textValue: fact.textValue,
      unit: fact.unit,
      currency: fact.currency,
      ruleVersionId: fact.ruleVersionId,
      ...sourceOf(fact, version),
    })

    // Every version not contradicted by what the reader said, grouped before
    // matching: an obligation whose only versions are open must still answer,
    // with the question, rather than vanish.
    const byObligation = new Map<string, Candidate[]>()
    for (const version of versions) {
      const criteria = version.criteria.map((criterion): Criterion => ({ dimension: criterion.dimension, value: criterion.value }))
      const fit = fitToProfile(criteria, profile, groups, places)
      if (fit.contradicted) continue
      const slug = version.obligation.slug
      const candidate = { id: version.id, criteria, facts: version.facts.map((fact) => toFact(fact, version)), open: fit.open }
      byObligation.set(slug, [...(byObligation.get(slug) ?? []), candidate])
    }

    const resolved = new Map<string, Side>()

    for (const [slug, standing] of byObligation) {
      // Every version's answer is completed, an open one's too, so that what an
      // open version could change is judged by what it would actually say.
      const answered = standing.map((candidate): Answered => ({ ...candidate, answer: answerOf(candidate, standing, places) }))
      const winners = mostSpecific(
        answered.filter((candidate) => candidate.open.length === 0),
        places,
      )
      const needs = [
        ...new Set(answered.filter((candidate) => candidate.open.length > 0 && matters(candidate, winners, places)).flatMap((candidate) => candidate.open)),
      ].sort()

      const [winner] = winners
      const ambiguous =
        winners.length > 1
          ? `${winners.length} rules apply to this person and none is more specific than the others: ${winners.map((candidate) => candidate.id).join(', ')}`
          : (winner?.answer.disputed ?? null)

      if (!winner && needs.length === 0) continue

      resolved.set(slug, {
        ambiguous,
        needs,
        resolved: winner && !ambiguous && needs.length === 0 ? { obligationSlug: slug, ruleVersionId: winner.id, facts: winner.answer.facts } : null,
      })
    }

    return resolved
  }

  /**
   * What changes for this person on moving from one place to another. Each side
   * is checked and answered for the person as they are there, so a move from
   * Istanbul to Bursa compares two Turkish answers rather than refusing two
   * places in one country (SB-186).
   */
  async move(from: Place, to: Place, at: Date): Promise<Entry[]> {
    await Promise.all([this.checkRegions(from.profile), this.checkRegions(to.profile)])
    const [origin, destination] = await Promise.all([
      this.resolveChecked(from.country, from.profile, at),
      this.resolveChecked(to.country, to.profile, at),
    ])
    return compare(origin, destination)
  }

  /**
   * What changed in one country between two dates.
   *
   * The same machinery with two dates instead of two countries, which is the
   * reason a change is a new row rather than an edit.
   */
  async changes(countryCode: string, profile: Profile, since: Date, until: Date): Promise<Entry[]> {
    await this.checkRegions(profile)
    const [before, after] = await Promise.all([
      this.resolveChecked(countryCode, profile, since),
      this.resolveChecked(countryCode, profile, until),
    ])
    return compare(before, after)
  }
}
