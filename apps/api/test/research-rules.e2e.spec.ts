import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import request from 'supertest'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { AppModule } from '../src/app.module.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { loadInto, loadResearchRules, ResearchRulesMismatch } from '../src/rules/research/load.js'
import type { ResearchMembership, ResearchRules, ResearchStatus } from '../src/rules/research/rows.js'
import { TURKEY } from '../src/rules/research/turkey.js'
import { seed } from '../prisma/seed.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-190: researched rules reach the database only from src/rules/research,
// every version and fact resting on verified definitions of its agreed document,
// and a load is fill-only, append-only and serialised under one lock. SB-194:
// the residence statuses a file names are written first, in its order, and a
// deployed one is never moved. SB-209: an answer carries its rule's notes.
// SB-192: a nationality group the file declares keeps the memberships it says.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5468
const COUNTRIES: readonly ResearchRules[] = [TURKEY]

let app: INestApplication
let prisma: PrismaService
let stopDatabase: () => Promise<void>

beforeAll(async () => {
  const database = await startPglite(PORT)
  stopDatabase = database.stop
  process.env.DATABASE_URL = database.url

  await promisify(execFile)(
    process.execPath,
    [createRequire(import.meta.url).resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    { cwd: API, env: { ...process.env, DATABASE_URL: database.url }, encoding: 'utf8' },
  )

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = moduleRef.createNestApplication()
  await app.init()

  prisma = app.get(PrismaService)
  await seed(prisma)
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

const graphql = (query: string, variables: Record<string, unknown> = {}) =>
  request(app.getHttpServer()).post('/graphql').send({ query, variables })

type Definition = { url: string | null; status: string; read: string }

const isMeta = (value: unknown): value is { status: string; read: string } =>
  typeof value === 'object' && value !== null && 'status' in value && typeof value.status === 'string' && 'read' in value && typeof value.read === 'string'

/** Every footnote definition of one agreed document, by its label. */
const definitionsOf = (research: string, document: string): Map<string, Definition> => {
  const text = readFileSync(join(API, 'prisma/research/agreed', research, `${document}.md`), 'utf8')
  const definitions = new Map<string, Definition>()
  for (const line of text.split(/\r?\n/)) {
    const found = /^\[\^([^\]]+)\]: (?:<([^>]+)>|calculated) \| (\{.*\})$/.exec(line)
    const meta: unknown = found?.[3] ? JSON.parse(found[3]) : undefined
    if (found?.[1] && isMeta(meta)) definitions.set(found[1], { url: found[2] ?? null, status: meta.status, read: meta.read })
  }
  return definitions
}

test('every researched version and fact rests on verified definitions of its own agreed document, on the page and the day the file names', () => {
  let checked = 0
  for (const rules of COUNTRIES) {
    for (const version of rules.versions) {
      const uses = [
        { what: `${rules.country} ${version.obligation}`, document: version.document, source: version.source, labels: version.labels },
        ...version.facts.map((fact) => ({
          what: `${rules.country} ${version.obligation}.${fact.key}`,
          document: fact.document ?? version.document,
          source: fact.source,
          labels: fact.labels,
        })),
      ]
      for (const use of uses) {
        const definitions = definitionsOf(rules.research, use.document)
        const page = rules.sources[use.source]
        expect(page, `${use.what} names ${use.source}, which is not a source`).toBeDefined()
        expect(use.labels.length, `${use.what} names no definition`).toBeGreaterThan(0)
        for (const label of use.labels) {
          const definition = definitions.get(label)
          expect(definition, `${use.what}: ${label} is not a definition in ${use.document}.md`).toBeDefined()
          expect(definition?.status, `${use.what}: ${label} is ${definition?.status}, not verified`).toBe('verified')
          expect(definition?.url, `${use.what}: ${label} is on another page`).toBe(page?.url)
          expect(definition?.read, `${use.what}: ${label} was read on another day`).toBe(page?.read)
          checked += 1
        }
      }
    }
  }
  expect(checked).toBeGreaterThan(0)
})

const MOVE = `
  query Move($residenceStatuses: [String!], $nationality: String, $situation: String, $locale: String) {
    move(from: "de", to: "tr", residenceStatuses: $residenceStatuses, nationality: $nationality, situation: $situation, locale: $locale) {
      obligationSlug
      verdict
      needs
      to {
        facts { key operator numericValue textValue unit currency sourceUrl sourceName verifiedAt }
        notes { ruleVersionId text locale translationMissing }
      }
    }
  }
`

type Shown = {
  key: string
  operator: string
  numericValue: string | null
  textValue: string | null
  unit: string | null
  currency: string | null
  sourceUrl: string
  sourceName: string
  verifiedAt: string
}

type Note = { ruleVersionId: string; text: string; locale: string; translationMissing: boolean }

type Entry = { obligationSlug: string; verdict: string; needs: string[]; to: { facts: Shown[]; notes: Note[] } | null }

/** What a reader has said about themselves, and the language they asked in. */
type Asked = { residenceStatuses?: string[]; nationality?: string; situation?: string; locale?: string }

/** Turkey's answer for one obligation to a reader arriving from Germany, or undefined where no rule of it applies to them. */
const entryFor = async (slug: string, asked: Asked = {}): Promise<Entry | undefined> => {
  const response = await graphql(MOVE, asked)
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  const entries: Entry[] = response.body.data.move
  return entries.find((entry) => entry.obligationSlug === slug)
}

/** The facts Turkey's file holds for one obligation, as the move query shows them, in key order. */
const factsOf = (slug: string) =>
  (TURKEY.versions.find((version) => version.obligation === slug)?.facts ?? [])
    .map((fact) => {
      const page = TURKEY.sources[fact.source]
      return {
        key: fact.key,
        operator: fact.operator,
        numericValue: fact.numericValue === undefined ? null : String(fact.numericValue),
        textValue: fact.textValue ?? null,
        unit: fact.unit ?? null,
        currency: fact.currency ?? null,
        sourceUrl: page?.url,
        sourceName: page?.name,
        verifiedAt: page?.read,
      }
    })
    .sort((a, b) => (a.key < b.key ? -1 : 1))

test("after a load, Turkey's limited company formation answers with every fact the file holds, each on its own page", async () => {
  const started = Date.now()
  const report = await loadResearchRules(prisma, COUNTRIES)
  console.log(`a full load of researched rules took ${Date.now() - started} ms`)
  expect(report).toEqual({
    statusesAdded: TURKEY.statuses.length,
    groupsAdded: TURKEY.nationalityGroups.length,
    membershipsAdded: TURKEY.nationalityGroups.reduce((sum, group) => sum + group.members.length, 0),
    obligationsAdded: TURKEY.obligations.length,
    versionsAdded: TURKEY.versions.length,
  })

  const formation = await entryFor('form-a-limited-company')
  expect(formation?.verdict).toBe('newInDestination')
  const expected = factsOf('form-a-limited-company')
  expect(expected).toHaveLength(4)
  expect(formation?.to?.facts).toEqual(expected)
})

test("joining Turkey's general health insurance answers a residence permit holder, or a holder of a kind of one, with its five facts on their pages, asks a reader who has not said what they hold, and is never told to a visitor on a visa exemption", async () => {
  await prisma.residenceStatus.createMany({
    data: [{ code: 'tr.residence-permit.student', countryCode: 'tr', parentCode: 'tr.residence-permit', name: 'Student residence permit' }],
  })
  const expected = factsOf('join-general-health-insurance')
  expect(expected).toHaveLength(5)

  for (const held of ['tr.residence-permit', 'tr.residence-permit.student']) {
    const insurance = await entryFor('join-general-health-insurance', { residenceStatuses: [held] })
    expect(insurance?.verdict, held).toBe('newInDestination')
    expect(insurance?.to?.facts, held).toEqual(expected)
  }

  expect(await entryFor('join-general-health-insurance')).toMatchObject({ verdict: 'needsDetail', needs: ['residenceStatus'], to: null })
  expect(await entryFor('join-general-health-insurance', { residenceStatuses: ['tr.short-stay.visa-exemption'] })).toBeUndefined()
})

test("joining general health insurance carries its rule's notes in English, and asked in Persian says they are only in English", async () => {
  const notes = TURKEY.versions.find((version) => version.obligation === 'join-general-health-insurance')?.notes.en
  expect(notes?.split('. ')[0]).toContain("not insured under a foreign country's law")

  const { id: version } = await prisma.ruleVersion.findFirstOrThrow({
    where: { countryCode: 'tr', obligation: { slug: 'join-general-health-insurance' } },
    select: { id: true },
  })
  const english = await entryFor('join-general-health-insurance', { residenceStatuses: ['tr.residence-permit'] })
  expect(english?.to?.notes).toEqual([{ ruleVersionId: version, text: notes, locale: 'en-US', translationMissing: false }])

  const persian = await entryFor('join-general-health-insurance', { residenceStatuses: ['tr.residence-permit'], locale: 'fa-IR' })
  expect(persian?.to?.notes).toEqual([{ ruleVersionId: version, text: notes, locale: 'en-US', translationMissing: true }])
})

// Each duty that follows registration, and the condition its notes must open
// with, since a founder is not bound by every one of them (SB-196).
const COMPANY_DUTIES: readonly [slug: string, opening: string][] = [
  ['request-electronic-tax-notifications', 'For a corporate taxpayer, which a limited company is'],
  ['get-a-tax-certificate', 'For a corporate taxpayer, which a limited company is'],
  ['register-an-employee-for-social-insurance', 'Once the company employs someone under a service contract'],
  ['get-a-workplace-licence', 'Where the premises and what is done there need an opening and operating licence'],
  ['keep-company-books-electronically', 'For a company registered from 1 January 2026'],
]

// Each moment of the work permit, and the condition its notes must open with,
// since every figure binds only under one (SB-193).
const WORKER_DUTIES: readonly [slug: string, opening: string][] = [
  ['get-a-work-permit', 'Where your employer applies for your work permit, as it normally does'],
  ['report-employment-starting-and-ending', 'For the employer, or a foreigner holding an indefinite or independent work permit'],
  ['apply-for-a-residence-permit-after-a-work-permit', 'Once your work permit has been cancelled or has ended'],
  ['keep-working-while-an-extension-is-assessed', 'Only while a timely application to extend your work permit is assessed, for the same work at the same workplace'],
]

/**
 * Each duty of a situation is told to a reader in it, with its facts on their
 * pages and its notes as served, opening with its condition; a reader who has
 * not said is asked for their situation; a student is told none of them.
 */
const toldInSituation = async (duties: readonly [slug: string, opening: string][], situation: string) => {
  for (const [slug, opening] of duties) {
    const version = TURKEY.versions.find((candidate) => candidate.obligation === slug)
    expect(version, `${slug} is in Turkey's file`).toBeDefined()

    const reader = await entryFor(slug, { situation })
    expect(reader?.verdict, slug).toBe('newInDestination')
    expect(reader?.to?.facts, slug).toEqual(factsOf(slug))
    expect(reader?.to?.notes, slug).toEqual([{ ruleVersionId: expect.any(String), text: version?.notes.en, locale: 'en-US', translationMissing: false }])
    expect(reader?.to?.notes[0]?.text.startsWith(opening), `${slug}'s notes open with its condition`).toBe(true)

    expect(await entryFor(slug), slug).toMatchObject({ verdict: 'needsDetail', needs: ['situation'], to: null })
    expect(await entryFor(slug, { situation: 'student' }), slug).toBeUndefined()
  }
}

test("a reader starting a company is told each duty that follows registration, its facts on their pages and its condition first in its notes, a reader who has not said is asked, and a student is not told them", () =>
  toldInSituation(COMPANY_DUTIES, 'company-founder'))

test("a reader who works in Turkey is told each moment of the work permit, its figures on their pages and its condition first in its notes, a reader who has not said is asked, and a student is not told them", async () => {
  expect(factsOf('get-a-work-permit')).toHaveLength(16)
  await toldInSituation(WORKER_DUTIES, 'worker')
})

test('a reader on a visa or a visa exemption is told how to get a short-term residence permit, its figures on their pages and its condition first in its notes, a residence permit holder is not told it, and a reader who has not said is asked', async () => {
  const slug = 'get-a-short-term-residence-permit'
  const version = TURKEY.versions.find((candidate) => candidate.obligation === slug)
  const expected = factsOf(slug)
  expect(expected).toHaveLength(17)

  for (const held of ['tr.short-stay.visa-exemption', 'tr.short-stay.visa']) {
    const permit = await entryFor(slug, { residenceStatuses: [held] })
    expect(permit?.verdict, held).toBe('newInDestination')
    expect(permit?.to?.facts, held).toEqual(expected)
    expect(permit?.to?.notes.map((note) => note.text), held).toEqual([version?.notes.en])
    expect(permit?.to?.notes[0]?.text.startsWith('Only while your visa or visa-exempt stay is still valid'), held).toBe(true)
  }

  expect(await entryFor(slug, { residenceStatuses: ['tr.residence-permit'] })).toBeUndefined()
  expect(await entryFor(slug)).toMatchObject({ verdict: 'needsDetail', needs: ['residenceStatus'], to: null })
})

test('a reader of a nationality the fee page exempts is told there is no permit charge, a reader of another is not told the charge, and a reader who has not said is asked', async () => {
  const slug = 'pay-the-residence-permit-charge'
  const version = TURKEY.versions.find((candidate) => candidate.obligation === slug)

  const danish = await entryFor(slug, { nationality: 'dk' })
  expect(danish?.verdict).toBe('newInDestination')
  expect(danish?.to?.facts).toEqual(factsOf(slug))
  expect(danish?.to?.facts.map((fact) => [fact.key, fact.operator])).toEqual([['charge', 'none']])
  expect(danish?.to?.notes.map((note) => note.text)).toEqual([version?.notes.en])

  expect(await entryFor(slug, { nationality: 'ir' })).toBeUndefined()
  expect(await entryFor(slug)).toMatchObject({ verdict: 'needsDetail', needs: ['nationality'], to: null })
})

const counts = () =>
  Promise.all([
    prisma.residenceStatus.count(),
    prisma.residenceStatusText.count(),
    prisma.nationalityGroup.count(),
    prisma.nationalityGroupMember.count(),
    prisma.obligation.count(),
    prisma.obligationText.count(),
    prisma.ruleVersion.count(),
    prisma.ruleFact.count(),
    prisma.eligibilityCriterion.count(),
    prisma.ruleText.count(),
  ])

test('a second load, and the seed run beside it, add nothing', async () => {
  const before = await counts()
  expect(await loadResearchRules(prisma, COUNTRIES)).toEqual({ statusesAdded: 0, groupsAdded: 0, membershipsAdded: 0, obligationsAdded: 0, versionsAdded: 0 })
  await seed(prisma)
  expect(await counts()).toEqual(before)
})

test('a group the file declares stops the load where its deployed memberships differ from the file, a member dropped, a member ended or an identical second membership, and the load writes nothing', async () => {
  const [exempt] = TURKEY.nationalityGroups
  if (!exempt) throw new Error("Turkey's file declares no nationality group")
  const withMembers = (members: readonly ResearchMembership[]): ResearchRules => ({
    ...TURKEY,
    nationalityGroups: TURKEY.nationalityGroups.map((group) => (group.code === exempt.code ? { ...group, members } : group)),
  })
  const before = await counts()

  const dropped = withMembers(exempt.members.filter((member) => member.nationality !== 'dk'))
  await expect(loadResearchRules(prisma, [dropped])).rejects.toThrow(ResearchRulesMismatch)
  await expect(loadResearchRules(prisma, [dropped])).rejects.toThrow(
    /tr.residence-permit-charge-exempt has dk from 2026-09-14 deployed, which src\/rules\/research does not list/,
  )

  const ended = withMembers(exempt.members.map((member) => (member.nationality === 'dk' ? { ...member, until: '2027-01-01' } : member)))
  await expect(loadResearchRules(prisma, [ended])).rejects.toThrow(
    /tr.residence-permit-charge-exempt has dk from 2026-09-14 deployed open, and src\/rules\/research has it until 2027-01-01/,
  )
  expect(await counts()).toEqual(before)

  // A membership that has started is history and cannot be removed, so the
  // duplicate is written inside a transaction that is then rolled back.
  const rollback = 'rolled back after the duplicate was refused'
  await expect(
    prisma.$transaction(async (tx) => {
      await tx.nationalityGroupMember.create({ data: { groupCode: exempt.code, nationality: 'dk', validFrom: new Date('2026-09-14') } })
      const withDuplicate = await Promise.all([tx.nationalityGroupMember.count(), tx.ruleVersion.count()])
      await expect(loadInto(tx, TURKEY)).rejects.toThrow(/tr.residence-permit-charge-exempt has dk from 2026-09-14 deployed, which src\/rules\/research does not list/)
      expect(await Promise.all([tx.nationalityGroupMember.count(), tx.ruleVersion.count()])).toEqual(withDuplicate)
      throw new Error(rollback)
    }),
  ).rejects.toThrow(rollback)
  expect(await counts()).toEqual(before)
})

test('a deployed version that no longer matches the file stops the load, and nothing is written', async () => {
  const changed: ResearchRules = {
    ...TURKEY,
    versions: TURKEY.versions.map((version) => ({
      ...version,
      facts: version.facts.map((fact) => (fact.key === 'minimumCapital' ? { ...fact, numericValue: 60000 } : fact)),
    })),
  }
  const before = await counts()

  await expect(loadResearchRules(prisma, [changed])).rejects.toThrow(ResearchRulesMismatch)
  await expect(loadResearchRules(prisma, [changed])).rejects.toThrow(
    /tr form-a-limited-company from 2026-09-14 is deployed as version \S+, and its fact minimumCapital no longer matches/,
  )
  expect(await counts()).toEqual(before)
})

/** A status of a test's own file, named by its code. */
const status = (code: string, parent: string | null): ResearchStatus => ({ code, parent, names: { en: code, fa: code } })

test('a deployed residence status the file puts inside another status, or in another country, stops the load, and nothing is written', async () => {
  const before = await counts()

  const inside: ResearchRules = { ...TURKEY, statuses: [status('tr.residence-permit', 'tr.permits')] }
  await expect(loadResearchRules(prisma, [inside])).rejects.toThrow(ResearchRulesMismatch)
  await expect(loadResearchRules(prisma, [inside])).rejects.toThrow(
    /Residence status tr.residence-permit is deployed in tr with nothing above it, and src\/rules\/research has it in tr inside tr.permits/,
  )

  const elsewhere: ResearchRules = { ...TURKEY, country: 'de', statuses: [status('tr.residence-permit', null)], obligations: [], versions: [] }
  await expect(loadResearchRules(prisma, [elsewhere])).rejects.toThrow(
    /Residence status tr.residence-permit is deployed in tr with nothing above it, and src\/rules\/research has it in de with nothing above it/,
  )

  expect(await counts()).toEqual(before)
})

test('a kind listed before the status it is a kind of stops the load, and nothing is written', async () => {
  const misordered: ResearchRules = { ...TURKEY, statuses: [status('tr.protection.applicant', 'tr.protection'), status('tr.protection', null), ...TURKEY.statuses] }
  const before = await counts()

  // Refused by the parent's foreign key or the status tree's own check, whichever fires first.
  await expect(loadResearchRules(prisma, [misordered])).rejects.toThrow()
  expect(await counts()).toEqual(before)
})

// The research lock's single integer key, reassembled from how pg_locks shows a
// one-key advisory lock, so it is told apart from Prisma migrate's own.
const RESEARCH_LOCKS = `
  SELECT mode, granted FROM pg_locks
  WHERE locktype = 'advisory' AND objsubid = 1
    AND ((classid::bigint << 32) | objid::bigint) = hashtext('skipbureau_research_rules')::bigint`

test('a load holds the research lock in the transaction that runs it', async () => {
  const held = await prisma.$transaction(async (tx) => {
    await loadInto(tx, TURKEY)
    return tx.$queryRawUnsafe<{ mode: string; granted: boolean }[]>(RESEARCH_LOCKS)
  })
  expect(held).toEqual([{ mode: 'ExclusiveLock', granted: true }])
  expect(await prisma.$queryRawUnsafe<{ mode: string; granted: boolean }[]>(RESEARCH_LOCKS)).toEqual([])
})
