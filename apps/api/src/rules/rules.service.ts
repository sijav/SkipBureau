import { Injectable } from '@nestjs/common'
import { FALLBACK } from '../locale.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { compare, sameFacts, type Entry, type Fact, type Note, type Side } from './diff.js'
import {
  fitToProfile,
  inConflict,
  mostSpecific,
  ProfileError,
  strictlyCovers,
  type Criterion,
  type Profile,
  type Trees,
} from './eligibility.js'
import { answerOf, type Answer, type Candidate } from './answer.js'
import { notesOf } from './note.js'
import { inForceAt } from './selection.js'
import { sourceOf } from './source.js'

type Answered = Candidate & { answer: Answer }

const sameAnswer = (a: Answer, b: Answer): boolean => a.disputed === null && b.disputed === null && sameFacts(a.facts, b.facts)

/**
 * Whether answering what an open version leaves unanswered could change what
 * the reader is told (SB-176). With no winner it could become the answer. With
 * one, it would win or tie, which changes nothing a reader sees when both would
 * tell them the same, each completed from the places it narrows (SB-186). With
 * a tie, only a version covering every tied one could settle it; anything else
 * could only join the tie.
 */
const matters = (open: Answered, winners: readonly Answered[], trees: Trees): boolean => {
  const [only] = winners
  if (!only) return true
  if (winners.length === 1) return !sameAnswer(open.answer, only.answer)
  return winners.every((winner) => strictlyCovers(open.criteria, winner.criteria, trees))
}

/** One side of a move: a country, and the person as they are there. */
export type Place = { country: string; profile: Profile }

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** How many versions, places, statuses and groups each research file owns, and the digest its last load wrote, by file (SB-202, SB-232). */
  async researchRows(): Promise<{ research: string; versions: number; places: number; statuses: number; groups: number; digest: string | null }[]> {
    const counted = (rows: readonly { research: string | null }[]) => {
      const counts = new Map<string, number>()
      for (const { research } of rows) if (research !== null) counts.set(research, (counts.get(research) ?? 0) + 1)
      return counts
    }
    const versions = counted(await this.prisma.ruleVersion.findMany({ where: { research: { not: null } }, select: { research: true } }))
    const places = counted(await this.prisma.region.findMany({ where: { research: { not: null } }, select: { research: true } }))
    const statuses = counted(await this.prisma.residenceStatus.findMany({ where: { research: { not: null } }, select: { research: true } }))
    const groups = counted(await this.prisma.nationalityGroup.findMany({ where: { research: { not: null } }, select: { research: true } }))
    const receipts = new Map((await this.prisma.researchLoad.findMany({ select: { research: true, digest: true } })).map((row) => [row.research, row.digest]))
    return [...new Set([...versions.keys(), ...places.keys(), ...statuses.keys(), ...groups.keys(), ...receipts.keys()])].sort().map((research) => ({
      research,
      versions: versions.get(research) ?? 0,
      places: places.get(research) ?? 0,
      statuses: statuses.get(research) ?? 0,
      groups: groups.get(research) ?? 0,
      digest: receipts.get(research) ?? null,
    }))
  }

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
   * Refuses what a profile cannot hold, before anything is resolved: a code
   * that is no region or no residence status, two regions of one country in
   * the same list, or two statuses of one country. Here rather than in the
   * resolver, so that every caller is refused the same way, a guide asked for a
   * reader included (SB-255).
   */
  async checkProfile(profile: Profile): Promise<void> {
    const regionCodes = [...new Set([...(profile.residenceRegions ?? []), ...(profile.workRegions ?? [])])]
    const statusCodes = [...new Set(profile.residenceStatuses ?? [])]

    const regions: { code: string; countryCode: string }[] =
      regionCodes.length === 0 ? [] : await this.prisma.region.findMany({ where: { code: { in: regionCodes } }, select: { code: true, countryCode: true } })
    const statuses: { code: string; countryCode: string }[] =
      statusCodes.length === 0
        ? []
        : await this.prisma.residenceStatus.findMany({ where: { code: { in: statusCodes } }, select: { code: true, countryCode: true } })

    const regionCountries = new Map(regions.map((region) => [region.code, region.countryCode]))
    const statusCountries = new Map(statuses.map((status) => [status.code, status.countryCode]))

    const unknownRegions = regionCodes.filter((code) => !regionCountries.has(code))
    if (unknownRegions.length > 0) throw new ProfileError(unknownRegions, `Not a region: ${unknownRegions.join(', ')}.`)
    const unknownStatuses = statusCodes.filter((code) => !statusCountries.has(code))
    if (unknownStatuses.length > 0) throw new ProfileError(unknownStatuses, `Not a residence status: ${unknownStatuses.join(', ')}.`)

    const conflictingRegions = [
      ...new Set([...inConflict(profile.residenceRegions ?? [], regionCountries), ...inConflict(profile.workRegions ?? [], regionCountries)]),
    ]
    if (conflictingRegions.length > 0) {
      throw new ProfileError(
        conflictingRegions,
        `Only one region per country can be where a reader lives, and one where they work: ${conflictingRegions.join(', ')}.`,
      )
    }

    const conflictingStatuses = inConflict(profile.residenceStatuses ?? [], statusCountries)
    if (conflictingStatuses.length > 0) {
      throw new ProfileError(conflictingStatuses, `Only one residence status per country can be what a reader holds: ${conflictingStatuses.join(', ')}.`)
    }
  }

  /** A country's places and residence statuses, each with the row it is inside, read once per answer rather than walked per criterion. */
  private async treesOf(countryCode: string): Promise<Trees> {
    const places = await this.prisma.region.findMany({ where: { countryCode }, select: { code: true, parentCode: true } })
    const statuses = await this.prisma.residenceStatus.findMany({ where: { countryCode }, select: { code: true, parentCode: true } })
    return {
      places: new Map(places.map((place) => [place.code, place.parentCode])),
      statuses: new Map(statuses.map((status) => [status.code, status.parentCode])),
    }
  }

  /**
   * Exactly one rule per obligation, or a note that a person has to decide.
   *
   * Half open on the dates: a version ending on the first and another starting
   * that day do not both apply, which is the boundary every naive range check
   * gets wrong.
   */
  async resolve(countryCode: string, profile: Profile, at: Date, locale = FALLBACK): Promise<Map<string, Side>> {
    await this.checkProfile(profile)
    return this.resolveChecked(countryCode, profile, at, locale)
  }

  /** `resolve` for a profile already checked, so a caller resolving twice checks once. */
  private async resolveChecked(countryCode: string, profile: Profile, at: Date, locale: string): Promise<Map<string, Side>> {
    const groups = await this.groupsAt(profile.nationality, at)
    const trees = await this.treesOf(countryCode)

    const versions = await this.prisma.ruleVersion.findMany({
      where: { countryCode, ...inForceAt(at) },
      include: { criteria: true, facts: true, obligation: true, texts: true },
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
      const fit = fitToProfile(criteria, profile, groups, trees)
      if (fit.contradicted) continue
      const slug = version.obligation.slug
      const candidate = { id: version.id, criteria, facts: version.facts.map((fact) => toFact(fact, version)), open: fit.open }
      byObligation.set(slug, [...(byObligation.get(slug) ?? []), candidate])
    }

    const textsOf = new Map(versions.map((version) => [version.id, version.texts]))

    // An answer's notes come from the versions its finished facts name, never
    // from walking the wider rules: a wider rule whose every fact the answer
    // restates, or whose equal fact it did not keep, gives none (SB-209). Widest
    // place first, each after every other it strictly covers, ties by id.
    const noted = (winner: Answered, standing: readonly Candidate[]): Note[] => {
      const named = new Set([winner.id, ...winner.answer.facts.map((fact) => fact.ruleVersionId)])
      const giving = standing.filter((candidate) => named.has(candidate.id))
      const depth = (candidate: Candidate) => giving.filter((other) => other !== candidate && strictlyCovers(candidate.criteria, other.criteria, trees)).length
      return giving
        .map((candidate) => ({ candidate, depth: depth(candidate) }))
        .sort((a, b) => a.depth - b.depth || (a.candidate.id < b.candidate.id ? -1 : 1))
        .flatMap(({ candidate }) => notesOf(candidate.id, textsOf.get(candidate.id) ?? [], locale))
    }

    const resolved = new Map<string, Side>()

    for (const [slug, standing] of byObligation) {
      // Every version's answer is completed, an open one's too, so that what an
      // open version could change is judged by what it would actually say.
      const answered = standing.map((candidate): Answered => ({ ...candidate, answer: answerOf(candidate, standing, trees) }))
      const winners = mostSpecific(
        answered.filter((candidate) => candidate.open.length === 0),
        trees,
      )
      const needs = [
        ...new Set(answered.filter((candidate) => candidate.open.length > 0 && matters(candidate, winners, trees)).flatMap((candidate) => candidate.open)),
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
        resolved:
          winner && !ambiguous && needs.length === 0
            ? { obligationSlug: slug, ruleVersionId: winner.id, facts: winner.answer.facts, notes: noted(winner, standing) }
            : null,
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
  async move(from: Place, to: Place, at: Date, locale = FALLBACK): Promise<Entry[]> {
    await Promise.all([this.checkProfile(from.profile), this.checkProfile(to.profile)])
    const [origin, destination] = await Promise.all([
      this.resolveChecked(from.country, from.profile, at, locale),
      this.resolveChecked(to.country, to.profile, at, locale),
    ])
    return compare(origin, destination)
  }

  /**
   * What changed in one country between two dates.
   *
   * The same machinery with two dates instead of two countries, which is the
   * reason a change is a new row rather than an edit.
   */
  async changes(countryCode: string, profile: Profile, since: Date, until: Date, locale = FALLBACK): Promise<Entry[]> {
    await this.checkProfile(profile)
    const [before, after] = await Promise.all([
      this.resolveChecked(countryCode, profile, since, locale),
      this.resolveChecked(countryCode, profile, until, locale),
    ])
    return compare(before, after)
  }
}
