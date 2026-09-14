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
import type { ResearchRules, ResearchStatus } from '../src/rules/research/rows.js'
import { TURKEY } from '../src/rules/research/turkey.js'
import { seed } from '../prisma/seed.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-190: researched rules reach the database only from src/rules/research,
// every version and fact resting on verified definitions of its agreed document,
// and a load is fill-only, append-only and serialised under one lock. SB-194:
// the residence statuses a file names are written first, in its order, and a
// deployed one is never moved. SB-209: an answer carries its rule's notes.

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
      const definitions = definitionsOf(rules.research, version.document)
      const uses = [
        { what: `${rules.country} ${version.obligation}`, source: version.source, labels: version.labels },
        ...version.facts.map((fact) => ({ what: `${rules.country} ${version.obligation}.${fact.key}`, source: fact.source, labels: fact.labels })),
      ]
      for (const use of uses) {
        const page = rules.sources[use.source]
        expect(page, `${use.what} names ${use.source}, which is not a source`).toBeDefined()
        expect(use.labels.length, `${use.what} names no definition`).toBeGreaterThan(0)
        for (const label of use.labels) {
          const definition = definitions.get(label)
          expect(definition, `${use.what}: ${label} is not a definition in ${version.document}.md`).toBeDefined()
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
  query Move($residenceStatuses: [String!], $locale: String) {
    move(from: "de", to: "tr", residenceStatuses: $residenceStatuses, locale: $locale) {
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

/** Turkey's answer for one obligation to a reader arriving from Germany, or undefined where no rule of it applies to them. */
const entryFor = async (slug: string, residenceStatuses?: string[], locale?: string): Promise<Entry | undefined> => {
  const response = await graphql(MOVE, { ...(residenceStatuses ? { residenceStatuses } : {}), ...(locale ? { locale } : {}) })
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
  expect(report).toEqual({ statusesAdded: TURKEY.statuses.length, obligationsAdded: TURKEY.obligations.length, versionsAdded: TURKEY.versions.length })

  const formation = await entryFor('form-a-limited-company')
  expect(formation?.verdict).toBe('newInDestination')
  const expected = factsOf('form-a-limited-company')
  expect(expected).toHaveLength(4)
  expect(formation?.to?.facts).toEqual(expected)
})

test("joining Turkey's general health insurance answers a residence permit holder, or a holder of a kind of one, with its five facts on their pages, asks a reader who has not said what they hold, and is never told to a visitor on a visa exemption", async () => {
  await prisma.residenceStatus.createMany({
    data: [
      { code: 'tr.residence-permit.student', countryCode: 'tr', parentCode: 'tr.residence-permit', name: 'Student residence permit' },
      { code: 'tr.visa-exemption', countryCode: 'tr', parentCode: null, name: 'Visa exemption' },
    ],
  })
  const expected = factsOf('join-general-health-insurance')
  expect(expected).toHaveLength(5)

  for (const held of ['tr.residence-permit', 'tr.residence-permit.student']) {
    const insurance = await entryFor('join-general-health-insurance', [held])
    expect(insurance?.verdict, held).toBe('newInDestination')
    expect(insurance?.to?.facts, held).toEqual(expected)
  }

  expect(await entryFor('join-general-health-insurance')).toMatchObject({ verdict: 'needsDetail', needs: ['residenceStatus'], to: null })
  expect(await entryFor('join-general-health-insurance', ['tr.visa-exemption'])).toBeUndefined()
})

test("joining general health insurance carries its rule's notes in English, and asked in Persian says they are only in English", async () => {
  const notes = TURKEY.versions.find((version) => version.obligation === 'join-general-health-insurance')?.notes.en
  expect(notes?.split('. ')[0]).toContain("not insured under a foreign country's law")

  const { id: version } = await prisma.ruleVersion.findFirstOrThrow({
    where: { countryCode: 'tr', obligation: { slug: 'join-general-health-insurance' } },
    select: { id: true },
  })
  const english = await entryFor('join-general-health-insurance', ['tr.residence-permit'])
  expect(english?.to?.notes).toEqual([{ ruleVersionId: version, text: notes, locale: 'en-US', translationMissing: false }])

  const persian = await entryFor('join-general-health-insurance', ['tr.residence-permit'], 'fa-IR')
  expect(persian?.to?.notes).toEqual([{ ruleVersionId: version, text: notes, locale: 'en-US', translationMissing: true }])
})

const counts = () =>
  Promise.all([
    prisma.residenceStatus.count(),
    prisma.residenceStatusText.count(),
    prisma.obligation.count(),
    prisma.obligationText.count(),
    prisma.ruleVersion.count(),
    prisma.ruleFact.count(),
    prisma.eligibilityCriterion.count(),
    prisma.ruleText.count(),
  ])

test('a second load, and the seed run beside it, add nothing', async () => {
  const before = await counts()
  expect(await loadResearchRules(prisma, COUNTRIES)).toEqual({ statusesAdded: 0, obligationsAdded: 0, versionsAdded: 0 })
  await seed(prisma)
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
