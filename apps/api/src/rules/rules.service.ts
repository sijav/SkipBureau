import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { compare, type Entry, type Fact, type Side } from './diff.js'
import { matchesProfile, mostSpecific, type Criterion, type Profile } from './eligibility.js'

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
   * Exactly one rule per obligation, or a note that a person has to decide.
   *
   * Half open on the dates: a version ending on the first and another starting
   * that day do not both apply, which is the boundary every naive range check
   * gets wrong.
   */
  async resolve(countryCode: string, profile: Profile, at: Date): Promise<Map<string, Side>> {
    const groups = await this.groupsAt(profile.nationality, at)

    const versions = await this.prisma.ruleVersion.findMany({
      where: {
        countryCode,
        validFrom: { lte: at },
        OR: [{ validTo: null }, { validTo: { gt: at } }],
      },
      include: { criteria: true, facts: true, obligation: true },
    })

    const applicable = versions
      .map((version) => ({
        version,
        criteria: version.criteria.map((criterion): Criterion => ({ dimension: criterion.dimension, value: criterion.value })),
      }))
      .filter((candidate) => matchesProfile(candidate.criteria, profile, groups))

    const byObligation = new Map<string, typeof applicable>()
    for (const candidate of applicable) {
      const slug = candidate.version.obligation.slug
      byObligation.set(slug, [...(byObligation.get(slug) ?? []), candidate])
    }

    const resolved = new Map<string, Side>()

    for (const [slug, candidates] of byObligation) {
      const winners = mostSpecific(candidates)

      if (winners.length > 1) {
        resolved.set(slug, {
          resolved: null,
          ambiguous: `${winners.length} rules apply to this person and none is more specific than the others: ${winners
            .map((winner) => winner.version.id)
            .join(', ')}`,
        })
        continue
      }

      const winner = winners[0]
      if (!winner) continue

      resolved.set(slug, {
        ambiguous: null,
        resolved: {
          obligationSlug: slug,
          ruleVersionId: winner.version.id,
          facts: winner.version.facts.map(
            (fact): Fact => ({
              key: fact.key,
              operator: fact.operator,
              numericValue: fact.numericValue === null ? null : fact.numericValue.toString(),
              textValue: fact.textValue,
              unit: fact.unit,
              currency: fact.currency,
            }),
          ),
        },
      })
    }

    return resolved
  }

  /** What changes for this person on moving from one country to another. */
  async move(from: string, to: string, profile: Profile, at: Date): Promise<Entry[]> {
    const [origin, destination] = await Promise.all([this.resolve(from, profile, at), this.resolve(to, profile, at)])
    return compare(origin, destination)
  }

  /**
   * What changed in one country between two dates.
   *
   * The same machinery with two dates instead of two countries, which is the
   * reason a change is a new row rather than an edit.
   */
  async changes(countryCode: string, profile: Profile, since: Date, until: Date): Promise<Entry[]> {
    const [before, after] = await Promise.all([
      this.resolve(countryCode, profile, since),
      this.resolve(countryCode, profile, until),
    ])
    return compare(before, after)
  }
}
