import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import request from 'supertest'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { AppModule } from '../src/app.module.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { seed } from '../prisma/seed.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-168: a rule can belong to a region, reached through where the reader lives
// or where they work. Every refusal is attempted against the database itself,
// and the rows are read back afterwards.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5463

let app: INestApplication
let prisma: PrismaService
let stopDatabase: () => Promise<void>

const day = (offset = 0) => new Date(new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10))
const NEXT_MONTH = day(30)
const AFTER_NEXT_MONTH = day(31).toISOString().slice(0, 10)
const source = { sourceUrl: 'https://example.gov', sourceName: 'test', verifiedAt: new Date('2026-09-14') }

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

const MOVE = `
  query Move($from: String!, $to: String!, $residenceRegions: [String!], $workRegions: [String!], $at: String) {
    move(from: $from, to: $to, residenceRegions: $residenceRegions, workRegions: $workRegions, at: $at) {
      obligationSlug
      verdict
      reason
      from { ruleVersionId facts { key numericValue } }
      to { ruleVersionId facts { key numericValue } }
    }
  }
`

type Side = { ruleVersionId: string; facts: { key: string; numericValue: string | null }[] } | null
type Entry = { obligationSlug: string; verdict: string; reason: string | null; from: Side; to: Side }

const moveFromTurkey = async (variables: Record<string, unknown>): Promise<Entry[]> => {
  const response = await graphql(MOVE, { from: 'tr', to: 'de', ...variables })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  return response.body.data.move
}

const entryFor = (entries: Entry[], slug: string): Entry => {
  const found = entries.find((entry) => entry.obligationSlug === slug)
  expect(found, `no entry for ${slug}`).toBeDefined()
  return found!
}

/** The care insurance split a mover to Germany is told, as numbers. */
const careSplit = async (variables: Record<string, unknown>) => {
  const to = entryFor(await moveFromTurkey(variables), 'pay-care-insurance').to
  const shares = Object.fromEntries((to?.facts ?? []).map((fact) => [fact.key, Number(fact.numericValue)]))
  return { employee: shares['employeeShare'], employer: shares['employerShare'], version: to?.ruleVersionId }
}

const obligationId = async (slug: string) => (await prisma.obligation.findUniqueOrThrow({ where: { slug } })).id

/** A version starting next month, scoped to one region by one connection. */
const draft = async (country: string, slug: string, dimension: 'residenceRegion' | 'workRegion', value: string) =>
  prisma.ruleVersion.create({
    data: {
      countryCode: country,
      obligationId: await obligationId(slug),
      validFrom: NEXT_MONTH,
      ...source,
      criteria: { create: [{ dimension, value }] },
      facts: { create: [{ key: 'fee', numericValue: 16, currency: 'EUR' }] },
    },
  })

test('a rule for one region is returned for a reader working there, and the national rule for a reader working elsewhere', async () => {
  const saxony = await careSplit({ workRegions: ['DE-SN'] })
  expect(saxony).toMatchObject({ employee: 2.3, employer: 1.3 })

  const brandenburg = await careSplit({ workRegions: ['DE-BB'] })
  expect(brandenburg).toMatchObject({ employee: 1.8, employer: 1.8 })
  expect(saxony.version).not.toBe(brandenburg.version)

  // A reader who has said nothing about where they work is asked rather than
  // told the national split: SB-176, in needs.e2e.spec.ts.
})

test("Saxony's split follows where the reader works, not where they live", async () => {
  expect(await careSplit({ residenceRegions: ['DE-BB'], workRegions: ['DE-SN'] })).toMatchObject({ employee: 2.3, employer: 1.3 })
  expect(await careSplit({ residenceRegions: ['DE-SN'], workRegions: ['DE-BB'] })).toMatchObject({ employee: 1.8, employer: 1.8 })
})

test('a version scoped by where the reader lives and another by where they work, both matching, is for a person to decide', async () => {
  const lives = await draft('de', 'register-your-address', 'residenceRegion', 'DE-HH')
  const works = await draft('de', 'register-your-address', 'workRegion', 'DE-BB')

  const address = entryFor(await moveFromTurkey({ residenceRegions: ['DE-HH'], workRegions: ['DE-BB'], at: AFTER_NEXT_MONTH }), 'register-your-address')

  expect(address.verdict).toBe('needsReview')
  expect(address.reason).toContain(lives.id)
  expect(address.reason).toContain(works.id)
})

test('a mover can say where they live in each country, and each side is answered for its own region', async () => {
  await prisma.region.create({ data: { code: 'TR-34', countryCode: 'tr', name: 'Istanbul' } })
  const istanbul = await draft('tr', 'get-a-tax-number', 'residenceRegion', 'TR-34')
  const hamburg = await draft('de', 'get-a-tax-number', 'residenceRegion', 'DE-HH')

  const tax = entryFor(await moveFromTurkey({ residenceRegions: ['TR-34', 'DE-HH'], at: AFTER_NEXT_MONTH }), 'get-a-tax-number')

  expect(tax.from?.ruleVersionId).toBe(istanbul.id)
  expect(tax.to?.ruleVersionId).toBe(hamburg.id)
})

test("regions that contradict each other, or are not regions, are refused as the caller's mistake", async () => {
  const twoStates = await graphql(MOVE, { from: 'tr', to: 'de', residenceRegions: ['DE-SN', 'DE-BB'] })
  expect(twoStates.status).toBe(200)
  expect(twoStates.body.data).toBeNull()
  expect(twoStates.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
  expect(twoStates.body.errors[0].message).toMatch(/DE-SN, DE-BB/)

  const unknown = await graphql(MOVE, { from: 'tr', to: 'de', workRegions: ['DE-XX'] })
  expect(unknown.body.data).toBeNull()
  expect(unknown.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
  expect(unknown.body.errors[0].message).toContain('DE-XX')
})

test('a region criterion must name a region of its own country, and a region a rule names keeps its code', async () => {
  await prisma.region.upsert({ where: { code: 'TR-35' }, update: {}, create: { code: 'TR-35', countryCode: 'tr', name: 'Izmir' } })
  const versions = await prisma.ruleVersion.count()
  const criteria = await prisma.eligibilityCriterion.count()

  await expect(draft('de', 'hold-health-insurance', 'residenceRegion', 'TR-35')).rejects.toThrow(/region of its version's own country/)
  await expect(draft('de', 'hold-health-insurance', 'workRegion', 'DE-XX')).rejects.toThrow(/region of its version's own country/)
  expect(await prisma.ruleVersion.count()).toBe(versions)
  expect(await prisma.eligibilityCriterion.count()).toBe(criteria)

  // Saxony's care split names DE-SN: its name can change, its code cannot, and it cannot go.
  await expect(prisma.region.delete({ where: { code: 'DE-SN' } })).rejects.toThrow(/cannot be deleted or recoded/)
  await expect(prisma.region.update({ where: { code: 'DE-SN' }, data: { code: 'DE-SX' } })).rejects.toThrow(/cannot be deleted or recoded/)
  await prisma.region.update({ where: { code: 'DE-SN' }, data: { name: 'Sachsen' } })
  expect(await prisma.region.findUnique({ where: { code: 'DE-SN' } })).toMatchObject({ countryCode: 'de', name: 'Sachsen' })
  await prisma.region.update({ where: { code: 'DE-SN' }, data: { name: 'Saxony' } })

  // Named only by a draft: removing the draft frees the region, which can then be corrected or removed.
  await prisma.region.create({ data: { code: 'DE-TH', countryCode: 'de', name: 'Thuringia' } })
  const thuringia = await draft('de', 'hold-health-insurance', 'workRegion', 'DE-TH')
  await expect(prisma.region.delete({ where: { code: 'DE-TH' } })).rejects.toThrow(/cannot be deleted or recoded/)
  expect(await prisma.region.findUnique({ where: { code: 'DE-TH' } })).not.toBeNull()

  await prisma.ruleVersion.delete({ where: { id: thuringia.id } })
  await prisma.region.update({ where: { code: 'DE-TH' }, data: { code: 'DE-TX' } })
  await prisma.region.delete({ where: { code: 'DE-TX' } })
  expect(await prisma.region.findUnique({ where: { code: 'DE-TH' } })).toBeNull()
  expect(await prisma.region.findUnique({ where: { code: 'DE-TX' } })).toBeNull()
})

test('the seed, run a second time on the same database, adds nothing and fails nothing', async () => {
  const counts = () =>
    Promise.all([
      prisma.ruleVersion.count(),
      prisma.eligibilityCriterion.count(),
      prisma.nationalityGroupMember.count(),
      prisma.region.count(),
      prisma.regionText.count(),
      prisma.obligation.count(),
    ])

  const before = await counts()
  await seed(prisma)
  expect(await counts()).toEqual(before)
})
