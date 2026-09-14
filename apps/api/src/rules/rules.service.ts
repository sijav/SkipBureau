import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { compare, sameFacts, type Entry, type Fact, type Side } from './diff.js'
import { fitToProfile, mostSpecific, RegionProfileError, regionsInConflict, strictlyCovers, type Criterion, type Detail, type Profile } from './eligibility.js'
import { inForceAt } from './selection.js'

type Candidate = { criteria: readonly Criterion[]; facts: readonly Fact[]; open: readonly Detail[] }

/**
 * Whether answering what an open version leaves unanswered could change what
 * the reader is told (SB-176). With no winner it could become the answer. With
 * one, it would win or tie, which changes nothing a reader sees when it says the
 * same. With a tie, only a version covering every tied one could settle it;
 * anything else could only join the tie.
 */
const matters = (open: Candidate, winners: readonly Candidate[]): boolean => {
  const [only] = winners
  if (!only) return true
  if (winners.length === 1) return !sameFacts(open.facts, only.facts)
  return winners.every((winner) => strictlyCovers(open.criteria, winner.criteria))
}

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
   * Refuses regions a profile cannot hold, before anything is resolved: two of
   * one country in the same list, or a code that is not a region. Here rather
   * than in the resolver, so that every caller is refused the same way.
   */
  private async checkRegions(profile: Profile): Promise<void> {
    const conflicting = regionsInConflict(profile)
    if (conflicting.length > 0) {
      throw new RegionProfileError(
        conflicting,
        `Only one region per country can be where a reader lives, and one where they work: ${conflicting.join(', ')}.`,
      )
    }

    const codes = [...new Set([...(profile.residenceRegions ?? []), ...(profile.workRegions ?? [])])]
    if (codes.length === 0) return

    const regions = await this.prisma.region.findMany({ where: { code: { in: codes } }, select: { code: true } })
    const known = new Set(regions.map((region) => region.code))
    const unknown = codes.filter((code) => !known.has(code))
    if (unknown.length > 0) throw new RegionProfileError(unknown, `Not a region: ${unknown.join(', ')}.`)
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

    const versions = await this.prisma.ruleVersion.findMany({
      where: { countryCode, ...inForceAt(at) },
      include: { criteria: true, facts: true, obligation: true },
    })

    const toFact = (fact: (typeof versions)[number]['facts'][number]): Fact => ({
      key: fact.key,
      operator: fact.operator,
      numericValue: fact.numericValue === null ? null : fact.numericValue.toString(),
      textValue: fact.textValue,
      unit: fact.unit,
      currency: fact.currency,
    })

    // Every version not contradicted by what the reader said, grouped before
    // matching: an obligation whose only versions are open must still answer,
    // with the question, rather than vanish.
    const byObligation = new Map<string, (Candidate & { id: string })[]>()
    for (const version of versions) {
      const criteria = version.criteria.map((criterion): Criterion => ({ dimension: criterion.dimension, value: criterion.value }))
      const fit = fitToProfile(criteria, profile, groups)
      if (fit.contradicted) continue
      const slug = version.obligation.slug
      const candidate = { id: version.id, criteria, facts: version.facts.map(toFact), open: fit.open }
      byObligation.set(slug, [...(byObligation.get(slug) ?? []), candidate])
    }

    const resolved = new Map<string, Side>()

    for (const [slug, standing] of byObligation) {
      const winners = mostSpecific(standing.filter((candidate) => candidate.open.length === 0))
      const needs = [
        ...new Set(standing.filter((candidate) => candidate.open.length > 0 && matters(candidate, winners)).flatMap((candidate) => candidate.open)),
      ].sort()

      const ambiguous =
        winners.length > 1
          ? `${winners.length} rules apply to this person and none is more specific than the others: ${winners.map((winner) => winner.id).join(', ')}`
          : null
      const [winner] = winners

      if (!winner && needs.length === 0) continue

      resolved.set(slug, {
        ambiguous,
        needs,
        resolved: winner && !ambiguous && needs.length === 0 ? { obligationSlug: slug, ruleVersionId: winner.id, facts: winner.facts } : null,
      })
    }

    return resolved
  }

  /** What changes for this person on moving from one country to another. */
  async move(from: string, to: string, profile: Profile, at: Date): Promise<Entry[]> {
    await this.checkRegions(profile)
    const [origin, destination] = await Promise.all([this.resolveChecked(from, profile, at), this.resolveChecked(to, profile, at)])
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
