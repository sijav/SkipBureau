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

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5495

let app: INestApplication
let prisma: PrismaService
let stopDatabase: () => Promise<void>

beforeAll(async () => {
  const database = await startPglite(PORT)
  stopDatabase = database.stop
  process.env.DATABASE_URL = database.url

  // Async: PGlite's server runs in this process, so a synchronous child would
  // block the event loop and never be accepted.
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
  query Move($from: String!, $to: String!, $nationality: String, $situation: String) {
    move(from: $from, to: $to, nationality: $nationality, situation: $situation) {
      obligationSlug
      verdict
      reason
      differences { key known from { operator numericValue unit textValue } to { operator numericValue unit textValue } }
    }
  }
`

const verdicts = (entries: { obligationSlug: string; verdict: string }[]) =>
  Object.fromEntries(entries.map((entry) => [entry.obligationSlug, entry.verdict]))

test('moving from Turkey to Germany answers in the four kinds', async () => {
  const response = await graphql(MOVE, { from: 'tr', to: 'de', nationality: 'ir' })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()

  const seen = verdicts(response.body.data.move)

  // Both countries want an address registration, on different deadlines.
  expect(seen['register-your-address']).toBe('changed')
  // Germany requires health insurance of everyone; the Turkish rule is for
  // students, and this person is not one.
  expect(seen['hold-health-insurance']).toBe('newInDestination')
  // The Turkish tax number stops applying.
  expect(seen['get-a-tax-number']).toBe('endsOnLeaving')
})

test('a changed obligation says which fact changed, not just that it changed', async () => {
  // The point of storing facts rather than paragraphs. "Something is different
  // about registering your address" is what a folder of articles can already
  // tell you.
  const response = await graphql(MOVE, { from: 'tr', to: 'de', nationality: 'ir' })
  const entry = response.body.data.move.find((e: { obligationSlug: string }) => e.obligationSlug === 'register-your-address')

  const deadline = entry.differences.find((d: { key: string }) => d.key === 'deadline')
  expect(deadline.from.numericValue).toBe('20')
  expect(deadline.to.numericValue).toBe('14')
  expect(deadline.from.unit).toBe('days')

  // Germany also wants a document Turkey does not. Turkey records that it asks
  // for none, so this is a checked difference and not a gap (SB-082).
  const document = entry.differences.find((d: { key: string }) => d.key === 'requiredDocument')
  expect(document.from.operator).toBe('none')
  expect(document.to.textValue).toBe('Wohnungsgeberbestaetigung')
  expect(document.known).toBe(true)
})

test('a fact recorded on one side only is a gap, and one recorded as none is a change', async () => {
  // SB-082. The later version adds a fee. Where the earlier one never recorded
  // a fee, nobody knows whether it had one; where it recorded none, it had none.
  const obligation = await prisma.obligation.findUniqueOrThrow({ where: { slug: 'hold-health-insurance' } })
  const common = { countryCode: 'tr', obligationId: obligation.id, sourceUrl: 'https://example.gov', sourceName: 'test', verifiedAt: new Date('2026-09-10') }
  const deadline = { key: 'deadline', operator: 'within' as const, numericValue: 30, unit: 'days' }
  const fee = { key: 'fee', numericValue: 100, currency: 'TRY' }
  const earlier = { validFrom: new Date('2024-01-01'), validTo: new Date('2025-01-01') }
  const later = { validFrom: new Date('2025-01-01') }
  const as = (value: string) => ({ create: [{ dimension: 'situation' as const, value }] })

  await prisma.ruleVersion.create({ data: { ...common, ...earlier, criteria: as('researcher'), facts: { create: [deadline] } } })
  await prisma.ruleVersion.create({ data: { ...common, ...later, criteria: as('researcher'), facts: { create: [deadline, fee] } } })
  await prisma.ruleVersion.create({
    data: { ...common, ...earlier, criteria: as('au-pair'), facts: { create: [deadline, { key: 'fee', operator: 'none' }] } },
  })
  await prisma.ruleVersion.create({ data: { ...common, ...later, criteria: as('au-pair'), facts: { create: [deadline, fee] } } })

  const changes = async (situation: string) => {
    const query = `query C { changes(country: "tr", since: "2024-06-01", until: "2026-06-01", situation: "${situation}") { obligationSlug verdict differences { key known } } }`
    const response = await graphql(query)
    expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
    return response.body.data.changes.find((e: { obligationSlug: string }) => e.obligationSlug === 'hold-health-insurance')
  }

  const gap = await changes('researcher')
  expect(gap.verdict).toBe('unknown')
  expect(gap.differences).toEqual([{ key: 'fee', known: false }])

  const none = await changes('au-pair')
  expect(none.verdict).toBe('changed')
  expect(none.differences).toEqual([{ key: 'fee', known: true }])
})

test('a situation-specific rule applies only to that situation', async () => {
  const asStudent = await graphql(MOVE, { from: 'de', to: 'tr', nationality: 'ir', situation: 'student' })
  const asWorker = await graphql(MOVE, { from: 'de', to: 'tr', nationality: 'ir', situation: 'worker' })

  // Turkish student health insurance exists for one and not the other.
  expect(verdicts(asStudent.body.data.move)['hold-health-insurance']).toBe('identical')
  expect(verdicts(asWorker.body.data.move)['hold-health-insurance']).toBe('endsOnLeaving')
})

test('a nationality group rule applies through membership, not by name', async () => {
  // A French national needs no German residence permit; an Iranian one does.
  const french = await graphql(MOVE, { from: 'tr', to: 'de', nationality: 'fr' })
  const iranian = await graphql(MOVE, { from: 'tr', to: 'de', nationality: 'ir' })

  expect(verdicts(french.body.data.move)['get-a-residence-permit']).toBe('changed')
  expect(verdicts(iranian.body.data.move)['get-a-residence-permit']).toBe('endsOnLeaving')
})

test('group membership is read at the date asked about, not today', async () => {
  // The UK left the EU on 2020-02-01 in this data, and the rules themselves
  // start on 2020-01-01, so the window where both hold is January 2020. The
  // same question, two
  // dates, two answers, which is the whole reason membership is dated.
  const query = `query M($at: String) { move(from: "tr", to: "de", nationality: "gb", at: $at) { obligationSlug verdict } }`

  const before = await graphql(query, { at: '2020-01-15' })
  const after = await graphql(query, { at: '2026-06-01' })

  expect(verdicts(before.body.data.move)['get-a-residence-permit']).toBe('changed')
  expect(verdicts(after.body.data.move)['get-a-residence-permit']).toBe('endsOnLeaving')
})

test('two rules that both apply, with neither more specific, need a person', async () => {
  // An EU rule and a student rule are both one criterion and neither covers
  // the other. Picking one would be guessing at a rule a reader acts on.
  const obligation = await prisma.obligation.findUniqueOrThrow({ where: { slug: 'get-a-tax-number' } })
  const common = { obligationId: obligation.id, countryCode: 'de', validFrom: new Date('2020-01-01'), sourceUrl: 'https://example.gov', sourceName: 'test', verifiedAt: new Date('2026-09-10') }

  await prisma.ruleVersion.create({
    data: { ...common, criteria: { create: [{ dimension: 'nationalityGroup', value: 'eu' }] }, facts: { create: [{ key: 'fee', numericValue: 0, currency: 'EUR' }] } },
  })
  await prisma.ruleVersion.create({
    data: { ...common, criteria: { create: [{ dimension: 'situation', value: 'student' }] }, facts: { create: [{ key: 'fee', numericValue: 5, currency: 'EUR' }] } },
  })

  const response = await graphql(MOVE, { from: 'tr', to: 'de', nationality: 'fr', situation: 'student' })
  const entry = response.body.data.move.find((e: { obligationSlug: string }) => e.obligationSlug === 'get-a-tax-number')

  expect(entry.verdict).toBe('needsReview')
  expect(entry.reason).toContain('none is more specific')
})

test('a version that has been closed cannot be edited, and the database says so', async () => {
  // "A change is a new row" was a convention in a comment until this trigger.
  const obligation = await prisma.obligation.findUniqueOrThrow({ where: { slug: 'open-a-blocked-account' } })
  const closed = await prisma.ruleVersion.create({
    data: {
      countryCode: 'de',
      obligationId: obligation.id,
      validFrom: new Date('2018-01-01'),
      validTo: new Date('2019-01-01'),
      sourceUrl: 'https://example.gov',
      sourceName: 'test',
      verifiedAt: new Date('2026-09-10'),
      criteria: { create: [{ dimension: 'situation', value: 'retiree' }] },
    },
  })

  await expect(
    prisma.ruleVersion.update({ where: { id: closed.id }, data: { sourceName: 'rewritten' } }),
  ).rejects.toThrow(/closed history/)

  const unchanged = await prisma.ruleVersion.findUniqueOrThrow({ where: { id: closed.id } })
  expect(unchanged.sourceName).toBe('test')
})

test('two versions for the same people cannot be in force at once', async () => {
  const obligation = await prisma.obligation.findUniqueOrThrow({ where: { slug: 'open-a-blocked-account' } })
  const overlapping = {
    countryCode: 'tr',
    obligationId: obligation.id,
    validFrom: new Date('2021-01-01'),
    sourceUrl: 'https://example.gov',
    sourceName: 'test',
    verifiedAt: new Date('2026-09-10'),
  }

  await prisma.ruleVersion.create({ data: overlapping })
  await expect(prisma.ruleVersion.create({ data: overlapping })).rejects.toThrow(/overlapping period/)
})

test('validity is half open, so a rule ending and one starting on the same day do not clash', async () => {
  // The boundary every naive range check gets wrong.
  const obligation = await prisma.obligation.findUniqueOrThrow({ where: { slug: 'get-a-residence-permit' } })
  const common = { countryCode: 'tr', obligationId: obligation.id, sourceUrl: 'https://example.gov', sourceName: 'test', verifiedAt: new Date('2026-09-10') }
  const criteria = { create: [{ dimension: 'situation' as const, value: 'retiree' }] }

  await prisma.ruleVersion.create({
    data: { ...common, criteria, validFrom: new Date('2024-01-01'), validTo: new Date('2025-01-01'), facts: { create: [{ key: 'fee', numericValue: 50, currency: 'USD' }] } },
  })
  await prisma.ruleVersion.create({
    data: { ...common, criteria, validFrom: new Date('2025-01-01'), facts: { create: [{ key: 'fee', numericValue: 80, currency: 'USD' }] } },
  })

  const query = `query C { changes(country: "tr", since: "2024-06-01", until: "2026-06-01", situation: "retiree") { obligationSlug verdict differences { key from { numericValue } to { numericValue } } } }`
  const response = await graphql(query)
  const entry = response.body.data.changes.find((e: { obligationSlug: string }) => e.obligationSlug === 'get-a-residence-permit')

  expect(entry.verdict).toBe('changed')
  const fee = entry.differences.find((d: { key: string }) => d.key === 'fee')
  expect([fee.from.numericValue, fee.to.numericValue]).toEqual(['50', '80'])
})
