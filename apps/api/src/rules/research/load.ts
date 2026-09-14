import { Prisma, type PrismaClient } from '../../generated/prisma/client.js'
import type { ResearchFact, ResearchRules, ResearchSource, ResearchVersion } from './rows.js'

/** What a load added; everything else was already there. */
export type LoadReport = { statusesAdded: number; obligationsAdded: number; versionsAdded: number }

/**
 * A deployed researched version, or a residence status the file names, that no
 * longer says what the file says. The load stops rather than write over history
 * or leave the database quietly different from the repository: a changed rule
 * is a new version (SB-202).
 */
export class ResearchRulesMismatch extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResearchRulesMismatch'
  }
}

// Two containers starting together queue on this, so a version is only ever
// created once: the clash trigger compares the rows it can see and is not a lock.
const LOCK = 'skipbureau_research_rules'

// Prisma's interactive transaction counts the whole callback, the wait for the
// lock included, so this covers a start that waits behind one other container's
// full load and then does its own, with room for a remote database.
const TIMEOUT_MS = 120_000

const day = (value: string): Date => new Date(`${value}T00:00:00.000Z`)
const iso = (value: Date): string => value.toISOString().slice(0, 10)

const criteriaKey = (criteria: readonly { dimension: string; value: string }[]): string =>
  JSON.stringify(criteria.map((criterion) => `${criterion.dimension}:${criterion.value}`).sort())

const pageOf = (rules: ResearchRules, key: string, what: string): ResearchSource => {
  const page = rules.sources[key]
  if (!page) throw new Error(`Researched rule ${what} names ${key}, which is not one of ${rules.research}'s sources.`)
  return page
}

const placeOf = (country: string, parent: string | null): string => (parent === null ? `in ${country} with nothing above it` : `in ${country} inside ${parent}`)

const factRow = (fact: ResearchFact, rules: ResearchRules, what: string) => {
  const page = pageOf(rules, fact.source, what)
  return {
    key: fact.key,
    operator: fact.operator,
    numericValue: fact.numericValue ?? null,
    textValue: fact.textValue ?? null,
    unit: fact.unit ?? null,
    currency: fact.currency ?? null,
    sourceUrl: page.url,
    sourceName: page.name,
    verifiedAt: day(page.read),
  }
}

type Stored = Prisma.RuleVersionGetPayload<{ include: { criteria: true; facts: true; texts: true } }>

/** What a stored version no longer shares with the file's, in words, or null where it shares everything. */
const differenceOf = (stored: Stored, version: ResearchVersion, rules: ResearchRules, what: string): string | null => {
  const page = pageOf(rules, version.source, what)
  if (stored.sourceUrl !== page.url || stored.sourceName !== page.name || iso(stored.verifiedAt) !== page.read) return 'its own source'
  if (stored.validTo !== null) return 'its end date'

  const wanted = new Map(version.facts.map((fact) => [fact.key, fact]))
  if (stored.facts.length !== wanted.size) return 'its list of facts'
  for (const fact of stored.facts) {
    const file = wanted.get(fact.key)
    if (!file) return `its fact ${fact.key}`
    const factPage = pageOf(rules, file.source, `${what}, ${file.key}`)
    const same =
      fact.operator === file.operator &&
      (fact.numericValue === null ? null : fact.numericValue.toString()) === (file.numericValue === undefined ? null : String(file.numericValue)) &&
      fact.textValue === (file.textValue ?? null) &&
      fact.unit === (file.unit ?? null) &&
      fact.currency === (file.currency ?? null) &&
      fact.sourceUrl === factPage.url &&
      fact.sourceName === factPage.name &&
      (fact.verifiedAt === null ? null : iso(fact.verifiedAt)) === factPage.read
    if (!same) return `its fact ${fact.key}`
  }

  if (stored.texts.find((text) => text.locale === 'en-US')?.notes !== version.notes.en) return 'its notes'
  return null
}

/**
 * One country's researched rules, written through the transaction client it
 * is given, fill-only and append-only, its residence statuses first and in the
 * file's order so its versions' criteria can name them. It takes the research
 * lock first and uses that client for every read and write, never the base
 * one, so the caller's transaction is what the lock protects.
 */
export const loadInto = async (tx: Prisma.TransactionClient, rules: ResearchRules): Promise<LoadReport> => {
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${LOCK}))`

  // A status's names are an editor's once it exists, as an obligation's titles
  // are. Where it sits is not: moving one changes which readers every rule
  // naming it, or a status above it, reaches.
  let statusesAdded = 0
  for (const status of rules.statuses) {
    const existing = await tx.residenceStatus.findUnique({ where: { code: status.code } })
    if (existing && (existing.countryCode !== rules.country || existing.parentCode !== status.parent)) {
      throw new ResearchRulesMismatch(
        `Residence status ${status.code} is deployed ${placeOf(existing.countryCode, existing.parentCode)}, and src/rules/research has it ${placeOf(rules.country, status.parent)}. Moving a status changes which readers every rule naming it reaches, so a load never moves one.`,
      )
    }
    if (!existing) {
      await tx.residenceStatus.create({ data: { code: status.code, countryCode: rules.country, parentCode: status.parent, name: status.names.en } })
      statusesAdded += 1
    }
    await tx.residenceStatusText.createMany({
      data: [
        { statusCode: status.code, locale: 'en-US', name: status.names.en },
        { statusCode: status.code, locale: 'fa-IR', name: status.names.fa },
      ],
      skipDuplicates: true,
    })
  }

  let obligationsAdded = 0
  for (const obligation of rules.obligations) {
    const existing = await tx.obligation.findUnique({ where: { slug: obligation.slug } })
    const row = existing ?? (await tx.obligation.create({ data: { slug: obligation.slug, kind: obligation.kind } }))
    if (!existing) obligationsAdded += 1
    await tx.obligationText.createMany({
      data: [
        { obligationId: row.id, locale: 'en-US', title: obligation.titles.en },
        { obligationId: row.id, locale: 'fa-IR', title: obligation.titles.fa },
      ],
      skipDuplicates: true,
    })
  }

  let versionsAdded = 0
  for (const version of rules.versions) {
    const what = `${rules.country} ${version.obligation} from ${version.validFrom}`
    const obligation = await tx.obligation.findUnique({ where: { slug: version.obligation } })
    if (!obligation) throw new Error(`Researched rule ${what} names an obligation its file does not add.`)

    const candidates = await tx.ruleVersion.findMany({
      where: { countryCode: rules.country, obligationId: obligation.id, validFrom: day(version.validFrom) },
      include: { criteria: true, facts: true, texts: true },
    })
    const stored = candidates.find((candidate) => criteriaKey(candidate.criteria) === criteriaKey(version.criteria))
    if (stored) {
      const difference = differenceOf(stored, version, rules, what)
      if (difference) {
        throw new ResearchRulesMismatch(
          `Researched rule ${what} is deployed as version ${stored.id}, and ${difference} no longer matches src/rules/research. A deployed rule is history: record the change as a new version with a later validFrom (SB-202).`,
        )
      }
      continue
    }

    const page = pageOf(rules, version.source, what)
    await tx.ruleVersion.create({
      data: {
        countryCode: rules.country,
        obligationId: obligation.id,
        validFrom: day(version.validFrom),
        sourceUrl: page.url,
        sourceName: page.name,
        verifiedAt: day(page.read),
        criteria: { create: version.criteria.map((criterion) => ({ dimension: criterion.dimension, value: criterion.value })) },
        facts: { create: version.facts.map((fact) => factRow(fact, rules, `${what}, ${fact.key}`)) },
        texts: { create: [{ locale: 'en-US', notes: version.notes.en }] },
      },
    })
    versionsAdded += 1
  }

  return { statusesAdded, obligationsAdded, versionsAdded }
}

/** Every country's researched rules, in one transaction under the research lock, as a deploy loads them. */
export const loadResearchRules = async (prisma: PrismaClient, countries: readonly ResearchRules[]): Promise<LoadReport> => {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const report: LoadReport = { statusesAdded: 0, obligationsAdded: 0, versionsAdded: 0 }
        for (const rules of countries) {
          const added = await loadInto(tx, rules)
          report.statusesAdded += added.statusesAdded
          report.obligationsAdded += added.obligationsAdded
          report.versionsAdded += added.versionsAdded
        }
        return report
      },
      { timeout: TIMEOUT_MS },
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028') {
      throw new Error(`The startup load of researched rules ran out of its ${TIMEOUT_MS / 1000} seconds, waiting on another container's load or doing its own.`, {
        cause: error,
      })
    }
    throw error
  }
}
