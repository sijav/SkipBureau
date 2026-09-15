import { Prisma, type PrismaClient } from '../../generated/prisma/client.js'
import type { ResearchFact, ResearchRules, ResearchSource, ResearchVersion } from './rows.js'

/** What a load wrote. A row claimed from another owner, or none, counts as changed. */
export type LoadReport = {
  statusesAdded: number
  statusesChanged: number
  statusesRemoved: number
  regionsAdded: number
  regionsChanged: number
  regionsRemoved: number
  groupsAdded: number
  groupsChanged: number
  groupsRemoved: number
  membershipsAdded: number
  membershipsRemoved: number
  obligationsAdded: number
  versionsAdded: number
  versionsChanged: number
  versionsRemoved: number
}

const nothing = (): LoadReport => ({
  statusesAdded: 0,
  statusesChanged: 0,
  statusesRemoved: 0,
  regionsAdded: 0,
  regionsChanged: 0,
  regionsRemoved: 0,
  groupsAdded: 0,
  groupsChanged: 0,
  groupsRemoved: 0,
  membershipsAdded: 0,
  membershipsRemoved: 0,
  obligationsAdded: 0,
  versionsAdded: 0,
  versionsChanged: 0,
  versionsRemoved: 0,
})

// Two containers starting together queue on this, so a version is only ever
// created once: the clash trigger compares the rows it can see and is not a lock.
const LOCK = 'skipbureau_research_rules'

// Prisma's interactive transaction counts the whole callback, the wait for the
// lock included, so this covers a start that waits behind one other container's
// full load and then does its own, with room for a remote database.
const TIMEOUT_MS = 120_000

const PLACES: readonly string[] = ['residenceRegion', 'workRegion']
const STATUS = 'residenceStatus'

const day = (value: string): Date => new Date(`${value}T00:00:00.000Z`)
const iso = (value: Date): string => value.toISOString().slice(0, 10)

const criteriaKey = (criteria: readonly { dimension: string; value: string }[]): string =>
  JSON.stringify(criteria.map((criterion) => `${criterion.dimension}:${criterion.value}`).sort())

/** A version's identity: its country, obligation, first day and the people it is for. */
const identity = (country: string, obligation: string, validFrom: string, criteria: readonly { dimension: string; value: string }[]): string =>
  `${country}|${obligation}|${validFrom}|${criteriaKey(criteria)}`

const pageOf = (rules: ResearchRules, key: string, what: string): ResearchSource => {
  const page = rules.sources[key]
  if (!page) throw new Error(`Researched rule ${what} names ${key}, which is not one of ${rules.research}'s sources.`)
  return page
}

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

type Stored = Prisma.RuleVersionGetPayload<{ include: { criteria: true; facts: true; texts: true; obligation: { select: { slug: true } } } }>
type Listed = { rules: ResearchRules; version: ResearchVersion }
type Node = { code: string; parentCode: string | null }

/** Whether a stored version says exactly what the file's does: its page, its end, its facts and its notes. */
const sameVersion = (stored: Stored, { rules, version }: Listed): boolean => {
  const what = `${rules.country} ${version.obligation} from ${version.validFrom}`
  const page = pageOf(rules, version.source, what)
  if (stored.sourceUrl !== page.url || stored.sourceName !== page.name || iso(stored.verifiedAt) !== page.read) return false
  if ((stored.validTo === null ? undefined : iso(stored.validTo)) !== version.validTo) return false

  const wanted = new Map(version.facts.map((fact) => [fact.key, fact]))
  if (stored.facts.length !== version.facts.length || wanted.size !== version.facts.length) return false
  for (const fact of stored.facts) {
    const file = wanted.get(fact.key)
    if (!file) return false
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
    if (!same) return false
  }

  return stored.texts.find((text) => text.locale === 'en-US')?.notes === version.notes.en
}

/** Every row of a tree inside the given ones, the given ones included, as the tree stands. */
const inside = (roots: ReadonlySet<string>, tree: readonly Node[]): Set<string> => {
  const children = new Map<string, string[]>()
  for (const node of tree) if (node.parentCode !== null) children.set(node.parentCode, [...(children.get(node.parentCode) ?? []), node.code])
  const found = new Set<string>()
  const queue = [...roots]
  for (let code = queue.pop(); code !== undefined; code = queue.pop()) {
    if (found.has(code)) continue
    found.add(code)
    queue.push(...(children.get(code) ?? []))
  }
  return found
}

/** The rows given, those most deeply nested in the tree first, so none is removed from under another. */
const deepestFirst = <Row extends Node>(rows: readonly Row[], tree: readonly Node[]): Row[] => {
  const parentOf = new Map(tree.map((node) => [node.code, node.parentCode]))
  const depth = (code: string): number => {
    let levels = 0
    for (let at = parentOf.get(code) ?? null; at !== null && levels <= tree.length; at = parentOf.get(at) ?? null) levels += 1
    return levels
  }
  return [...rows].sort((a, b) => depth(b.code) - depth(a.code))
}

/**
 * The researched rules of every file given, written through the transaction
 * client it is given so that they say exactly what the files say (SB-202). A row
 * a file lists becomes that file's; a row a file of this load owns and no file of
 * it lists is removed; a row of no file of this load is never touched.
 *
 * In this order. Versions step aside first, those no file lists as they stand
 * and those naming a place or status the files move or drop, or one inside it,
 * because the tree triggers refuse to move or remove a row a rule names. Then
 * statuses and places, parents before what is inside them and removed the other
 * way round, then groups, obligations, and the versions the files list.
 *
 * It takes the research lock and sets `skipbureau.research_load`, which only this
 * transaction sees and which lets it past the history triggers, and it uses that
 * client for every read and write, never the base one.
 */
export const loadInto = async (tx: Prisma.TransactionClient, files: readonly ResearchRules[]): Promise<LoadReport> => {
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${LOCK}))`
  await tx.$queryRaw`SELECT set_config('skipbureau.research_load', 'on', true) AS research_load`

  const report = nothing()
  const owners = new Set(files.map((rules) => rules.research))
  const ownedByLoad = (research: string | null): boolean => research !== null && owners.has(research)
  const countries = [...new Set(files.map((rules) => rules.country))]

  const listedStatuses = new Map(files.flatMap((rules) => rules.statuses.map((status) => [status.code, { rules, status }] as const)))
  const listedRegions = new Map(files.flatMap((rules) => rules.regions.map((region) => [region.code, { rules, region }] as const)))
  const listedGroups = new Set(files.flatMap((rules) => rules.nationalityGroups.map((group) => group.code)))
  const listedVersions = new Map<string, Listed>(
    files.flatMap((rules) =>
      rules.versions.map((version) => [identity(rules.country, version.obligation, version.validFrom, version.criteria), { rules, version }] as const),
    ),
  )

  // The trees as they stand before the load, which is what the triggers read.
  const statusTree = await tx.residenceStatus.findMany({ include: { texts: true } })
  const regionTree = await tx.region.findMany()

  const statusesAside = inside(
    new Set(
      statusTree
        .filter((stored) => {
          const listed = listedStatuses.get(stored.code)
          return listed ? stored.parentCode !== listed.status.parent || stored.countryCode !== listed.rules.country : ownedByLoad(stored.research)
        })
        .map((stored) => stored.code),
    ),
    statusTree,
  )
  const regionsAside = inside(
    new Set(
      regionTree
        .filter((stored) => {
          const listed = listedRegions.get(stored.code)
          return listed ? stored.parentCode !== listed.region.parent || stored.countryCode !== listed.rules.country : ownedByLoad(stored.research)
        })
        .map((stored) => stored.code),
    ),
    regionTree,
  )

  // 1. Versions step aside.
  const storedVersions: Stored[] = await tx.ruleVersion.findMany({
    where: { OR: [{ countryCode: { in: countries } }, { research: { in: [...owners] } }] },
    include: { criteria: true, facts: true, texts: true, obligation: { select: { slug: true } } },
  })
  const keyOf = (stored: Stored): string => identity(stored.countryCode, stored.obligation.slug, iso(stored.validFrom), stored.criteria)
  const namesAside = (stored: Stored): boolean =>
    stored.criteria.some(
      (criterion) => (PLACES.includes(criterion.dimension) && regionsAside.has(criterion.value)) || (criterion.dimension === STATUS && statusesAside.has(criterion.value)),
    )
  const aside = storedVersions.filter((stored) => {
    const listed = listedVersions.get(keyOf(stored))
    if (!listed) return ownedByLoad(stored.research)
    return !sameVersion(stored, listed) || namesAside(stored)
  })
  await tx.ruleVersion.deleteMany({ where: { id: { in: aside.map((stored) => stored.id) } } })
  const steppedAside = new Set(aside.map(keyOf))
  report.versionsRemoved = aside.filter((stored) => !listedVersions.has(keyOf(stored))).length

  // 2. Statuses, a status before its kinds.
  const storedStatuses = new Map(statusTree.map((stored) => [stored.code, stored]))
  for (const rules of files) {
    for (const status of rules.statuses) {
      const stored = storedStatuses.get(status.code)
      const texts = [
        { locale: 'en-US', name: status.names.en },
        { locale: 'fa-IR', name: status.names.fa },
      ]
      if (!stored) {
        await tx.residenceStatus.create({
          data: { code: status.code, countryCode: rules.country, parentCode: status.parent, name: status.names.en, research: rules.research, texts: { create: texts } },
        })
        report.statusesAdded += 1
        continue
      }
      const textsDiffer = texts.some((text) => stored.texts.find((had) => had.locale === text.locale)?.name !== text.name)
      if (
        stored.countryCode !== rules.country ||
        stored.parentCode !== status.parent ||
        stored.name !== status.names.en ||
        stored.research !== rules.research ||
        textsDiffer
      ) {
        await tx.residenceStatus.update({
          where: { code: status.code },
          data: { countryCode: rules.country, parentCode: status.parent, name: status.names.en, research: rules.research },
        })
        for (const text of texts) {
          await tx.residenceStatusText.upsert({
            where: { statusCode_locale: { statusCode: status.code, locale: text.locale } },
            update: { name: text.name },
            create: { statusCode: status.code, locale: text.locale, name: text.name },
          })
        }
        report.statusesChanged += 1
      }
    }
  }
  const droppedStatuses = statusTree.filter((stored) => ownedByLoad(stored.research) && !listedStatuses.has(stored.code))
  for (const stored of deepestFirst(droppedStatuses, statusTree)) {
    await tx.residenceStatus.delete({ where: { code: stored.code } })
    report.statusesRemoved += 1
  }

  // 3. Places, a place before the places inside it.
  const storedRegions = new Map(regionTree.map((stored) => [stored.code, stored]))
  for (const rules of files) {
    for (const region of rules.regions) {
      const stored = storedRegions.get(region.code)
      const wanted = { countryCode: rules.country, parentCode: region.parent, name: region.name, officialCode: region.officialCode ?? null, research: rules.research }
      if (!stored) {
        await tx.region.create({ data: { code: region.code, ...wanted } })
        report.regionsAdded += 1
      } else if (
        stored.countryCode !== wanted.countryCode ||
        stored.parentCode !== wanted.parentCode ||
        stored.name !== wanted.name ||
        stored.officialCode !== wanted.officialCode ||
        stored.research !== wanted.research
      ) {
        await tx.region.update({ where: { code: region.code }, data: wanted })
        report.regionsChanged += 1
      }
    }
  }
  const droppedRegions = regionTree.filter((stored) => ownedByLoad(stored.research) && !listedRegions.has(stored.code))
  for (const stored of deepestFirst(droppedRegions, regionTree)) {
    await tx.region.delete({ where: { code: stored.code } })
    report.regionsRemoved += 1
  }

  // 4. Groups. A group a file lists has exactly that file's memberships (SB-192).
  for (const rules of files) {
    for (const group of rules.nationalityGroups) {
      const stored = await tx.nationalityGroup.findUnique({ where: { code: group.code }, include: { members: { orderBy: { id: 'asc' } } } })
      if (!stored) {
        await tx.nationalityGroup.create({ data: { code: group.code, name: group.name, research: rules.research } })
        report.groupsAdded += 1
      } else if (stored.name !== group.name || stored.research !== rules.research) {
        await tx.nationalityGroup.update({ where: { code: group.code }, data: { name: group.name, research: rules.research } })
        report.groupsChanged += 1
      }

      const unmatched = [...(stored?.members ?? [])]
      const missing = group.members.filter((member) => {
        const at = unmatched.findIndex(
          (row) => row.nationality === member.nationality && iso(row.validFrom) === member.from && (row.validTo === null ? undefined : iso(row.validTo)) === member.until,
        )
        if (at === -1) return true
        unmatched.splice(at, 1)
        return false
      })
      await tx.nationalityGroupMember.deleteMany({ where: { id: { in: unmatched.map((row) => row.id) } } })
      report.membershipsRemoved += unmatched.length
      for (const member of missing) {
        await tx.nationalityGroupMember.create({
          data: { groupCode: group.code, nationality: member.nationality, validFrom: day(member.from), validTo: member.until ? day(member.until) : null },
        })
        report.membershipsAdded += 1
      }
    }
  }
  const droppedGroups = await tx.nationalityGroup.deleteMany({ where: { research: { in: [...owners] }, code: { notIn: [...listedGroups] } } })
  report.groupsRemoved = droppedGroups.count

  // 5. Obligations, added when missing. Their kind and titles are an editor's once they exist.
  for (const rules of files) {
    for (const obligation of rules.obligations) {
      const existing = await tx.obligation.findUnique({ where: { slug: obligation.slug } })
      const row = existing ?? (await tx.obligation.create({ data: { slug: obligation.slug, kind: obligation.kind } }))
      if (!existing) report.obligationsAdded += 1
      await tx.obligationText.createMany({
        data: [
          { obligationId: row.id, locale: 'en-US', title: obligation.titles.en },
          { obligationId: row.id, locale: 'fa-IR', title: obligation.titles.fa },
        ],
        skipDuplicates: true,
      })
    }
  }

  // 6. The versions the files list: written where missing, claimed where identical.
  const standing = new Map(storedVersions.filter((stored) => !steppedAside.has(keyOf(stored))).map((stored) => [keyOf(stored), stored]))
  for (const [key, { rules, version }] of listedVersions) {
    const what = `${rules.country} ${version.obligation} from ${version.validFrom}`
    const stored = standing.get(key)
    if (stored) {
      if (stored.research !== rules.research) {
        await tx.ruleVersion.update({ where: { id: stored.id }, data: { research: rules.research } })
        report.versionsChanged += 1
      }
      continue
    }

    const obligation = await tx.obligation.findUnique({ where: { slug: version.obligation } })
    if (!obligation) throw new Error(`Researched rule ${what} names an obligation no file of the load adds.`)
    const page = pageOf(rules, version.source, what)
    await tx.ruleVersion.create({
      data: {
        countryCode: rules.country,
        obligationId: obligation.id,
        validFrom: day(version.validFrom),
        validTo: version.validTo ? day(version.validTo) : null,
        sourceUrl: page.url,
        sourceName: page.name,
        verifiedAt: day(page.read),
        research: rules.research,
        criteria: { create: version.criteria.map((criterion) => ({ dimension: criterion.dimension, value: criterion.value })) },
        facts: { create: version.facts.map((fact) => factRow(fact, rules, `${what}, ${fact.key}`)) },
        texts: { create: [{ locale: 'en-US', notes: version.notes.en }] },
      },
    })
    if (steppedAside.has(key)) report.versionsChanged += 1
    else report.versionsAdded += 1
  }

  return report
}

/** Every researched file, in one transaction under the research lock, as a deploy loads them. */
export const loadResearchRules = async (prisma: PrismaClient, files: readonly ResearchRules[]): Promise<LoadReport> => {
  try {
    return await prisma.$transaction(async (tx) => loadInto(tx, files), { timeout: TIMEOUT_MS })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028') {
      throw new Error(`The startup load of researched rules ran out of its ${TIMEOUT_MS / 1000} seconds, waiting on another container's load or doing its own.`, {
        cause: error,
      })
    }
    throw error
  }
}
