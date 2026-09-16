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

// SB-189: what a reader holds in a country, a residence permit, a kind of one
// or a visa exemption, is a detail a rule can depend on. Every refusal is
// attempted against the database itself, and the rows are read back afterwards.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5467

let app: INestApplication
let prisma: PrismaService
let stopDatabase: () => Promise<void>

const IN_FORCE = new Date('2020-01-01')
const NEXT_MONTH = new Date(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
const source = { sourceUrl: 'https://example.gov', sourceName: 'test', verifiedAt: new Date('2026-09-14') }

// Written in one statement, each kind after the status it is a kind of.
const STATUSES = [
  { code: 'tr.residence-permit', countryCode: 'tr', parentCode: null, name: 'Residence permit' },
  { code: 'tr.visa-exemption', countryCode: 'tr', parentCode: null, name: 'Visa exemption' },
  { code: 'tr.residence-permit.student', countryCode: 'tr', parentCode: 'tr.residence-permit', name: 'Student residence permit' },
  { code: 'tr.residence-permit.short-term', countryCode: 'tr', parentCode: 'tr.residence-permit', name: 'Short-term residence permit' },
  { code: 'de.national-visa', countryCode: 'de', parentCode: null, name: 'National visa' },
]

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
  await prisma.residenceStatus.createMany({ data: STATUSES })
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

const graphql = (query: string, variables: Record<string, unknown> = {}) =>
  request(app.getHttpServer()).post('/graphql').send({ query, variables })

const MOVE = `
  query Move($residenceStatuses: [String!]) {
    move(from: "de", to: "tr", residenceStatuses: $residenceStatuses) {
      obligationSlug
      verdict
      needs
      to { ruleVersionId facts { key } }
    }
  }
`

type Entry = { obligationSlug: string; verdict: string; needs: string[]; to: { ruleVersionId: string; facts: { key: string }[] } | null }

/** Turkey's answer for one obligation to a reader arriving from Germany, or undefined where no rule of it applies to them. */
const entryFor = async (slug: string, residenceStatuses?: string[]): Promise<Entry | undefined> => {
  const response = await graphql(MOVE, residenceStatuses ? { residenceStatuses } : {})
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  const entries: Entry[] = response.body.data.move
  return entries.find((entry) => entry.obligationSlug === slug)
}

let obligations = 0

/** An obligation of its own per test, so no seeded rule and no other test's version answers beside it. */
const obligation = () => prisma.obligation.create({ data: { slug: `status-${++obligations}`, kind: 'registration' } })

type CriterionInput = { dimension: 'nationality' | 'nationalityGroup' | 'situation' | 'residenceRegion' | 'workRegion' | 'residenceStatus'; value: string }

const holds = (value: string): CriterionInput => ({ dimension: 'residenceStatus', value })

const version = (
  obligationId: string,
  criteria: CriterionInput[],
  facts: { key: string; numericValue: number }[],
  { validFrom = IN_FORCE, countryCode = 'tr' }: { validFrom?: Date; countryCode?: string } = {},
) =>
  prisma.ruleVersion.create({
    data: { countryCode, obligationId, validFrom, ...source, criteria: { create: criteria }, facts: { create: facts } },
  })

test('a rule for residence-permit holders applies to a reader holding one or a kind of one, asks a reader who has not said, and never reaches a visitor on a visa exemption', async () => {
  const duty = await obligation()
  const permit = await version(duty.id, [holds('tr.residence-permit')], [{ key: 'deadline', numericValue: 20 }])

  expect((await entryFor(duty.slug, ['tr.residence-permit']))?.to?.ruleVersionId).toBe(permit.id)
  expect((await entryFor(duty.slug, ['tr.residence-permit.student']))?.to?.ruleVersionId).toBe(permit.id)

  expect(await entryFor(duty.slug)).toMatchObject({ verdict: 'needsDetail', needs: ['residenceStatus'], to: null })
  // A visa held in Germany says nothing about what the reader holds in Turkey.
  expect(await entryFor(duty.slug, ['de.national-visa'])).toMatchObject({ verdict: 'needsDetail', needs: ['residenceStatus'], to: null })

  // No rule of this obligation applies to a visitor on a visa exemption, so they are not told the duty at all.
  expect(await entryFor(duty.slug, ['tr.visa-exemption'])).toBeUndefined()
})

test('a rule for one kind of permit is more specific than one for every permit, and inherits nothing from it', async () => {
  const fee = await obligation()
  const permit = await version(fee.id, [holds('tr.residence-permit')], [
    { key: 'deadline', numericValue: 20 },
    { key: 'fee', numericValue: 10 },
  ])
  const student = await version(fee.id, [holds('tr.residence-permit.student')], [{ key: 'fee', numericValue: 5 }])

  const studentAnswer = await entryFor(fee.slug, ['tr.residence-permit.student'])
  expect(studentAnswer?.to?.ruleVersionId).toBe(student.id)
  // A status is scope, not a place: the deadline stays a gap of the student rule.
  expect(studentAnswer?.to?.facts.map((fact) => fact.key)).toEqual(['fee'])

  expect((await entryFor(fee.slug, ['tr.residence-permit.short-term']))?.to?.ruleVersionId).toBe(permit.id)

  // Someone who said only that they hold a residence permit could hold the student kind, which says something else.
  expect(await entryFor(fee.slug, ['tr.residence-permit'])).toMatchObject({ verdict: 'needsDetail', needs: ['residenceStatus'], to: null })
})

test("a status that is not one, or two statuses of one country, are refused as the caller's mistake", async () => {
  const unknown = await graphql(MOVE, { residenceStatuses: ['tr.tourist'] })
  expect(unknown.status).toBe(200)
  expect(unknown.body.data).toBeNull()
  expect(unknown.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
  expect(unknown.body.errors[0].message).toBe('Not a residence status: tr.tourist.')

  const two = await graphql(MOVE, { residenceStatuses: ['tr.residence-permit', 'tr.visa-exemption'] })
  expect(two.body.data).toBeNull()
  expect(two.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
  expect(two.body.errors[0].message).toContain('tr.residence-permit, tr.visa-exemption')
})

test("a status criterion names a status of its version's own country, and a region criterion never names a status", async () => {
  const wrong = await obligation()
  const counts = () => Promise.all([prisma.ruleVersion.count(), prisma.eligibilityCriterion.count()])
  const before = await counts()

  const german = { validFrom: NEXT_MONTH, countryCode: 'de' }
  await expect(version(wrong.id, [holds('tr.residence-permit')], [], german)).rejects.toThrow(/must name a residence status of its version's own country/)
  await expect(version(wrong.id, [holds('DE-SN')], [], german)).rejects.toThrow(/must name a residence status of its version's own country/)
  await expect(version(wrong.id, [{ dimension: 'residenceRegion', value: 'de.national-visa' }], [], german)).rejects.toThrow(
    /must name a region of its version's own country/,
  )
  expect(await counts()).toEqual(before)
})

test('the status tree keeps a status inside its own country and never inside itself, and a status a rule names through a kind inside it stays put until that rule is removed', async () => {
  const before = await prisma.residenceStatus.count()
  await expect(prisma.residenceStatus.create({ data: { code: 'de.wrong', countryCode: 'de', parentCode: 'tr.residence-permit', name: 'Wrong' } })).rejects.toThrow(
    /Residence status de.wrong must be inside a residence status of its own country/,
  )
  await expect(prisma.residenceStatus.create({ data: { code: 'tr.itself', countryCode: 'tr', parentCode: 'tr.itself', name: 'Itself' } })).rejects.toThrow(
    /Residence status tr.itself cannot be inside tr.itself, which is inside it/,
  )
  expect(await prisma.residenceStatus.count()).toBe(before)

  await prisma.residenceStatus.createMany({
    data: [
      { code: 'tr.protection', countryCode: 'tr', name: 'International protection' },
      { code: 'tr.protection.applicant', countryCode: 'tr', parentCode: 'tr.protection', name: 'International protection applicant' },
    ],
  })
  const draft = await version((await obligation()).id, [holds('tr.protection.applicant')], [{ key: 'deadline', numericValue: 20 }], { validFrom: NEXT_MONTH })

  await expect(prisma.residenceStatus.update({ where: { code: 'tr.protection' }, data: { code: 'tr.asylum' } })).rejects.toThrow(
    /Residence status tr.protection is named by a rule's criteria, itself or through a status inside it, so it cannot be deleted or recoded, or moved/,
  )
  await expect(prisma.residenceStatus.update({ where: { code: 'tr.protection.applicant' }, data: { parentCode: null } })).rejects.toThrow(
    /cannot be deleted or recoded, or moved/,
  )
  expect(await prisma.residenceStatus.findUniqueOrThrow({ where: { code: 'tr.protection.applicant' } })).toMatchObject({ parentCode: 'tr.protection' })

  await prisma.ruleVersion.delete({ where: { id: draft.id } })
  await prisma.residenceStatus.update({ where: { code: 'tr.protection.applicant' }, data: { parentCode: null } })
  expect(await prisma.residenceStatus.findUniqueOrThrow({ where: { code: 'tr.protection.applicant' } })).toMatchObject({ parentCode: null })
})

// Every two-key advisory lock one country's rows hold, named by the tree whose
// key it is: SB-186's region tree, SB-189's status tree, or anything else.
const TREE_LOCKS = `
  SELECT
    CASE classid
      WHEN hashtext('skipbureau_status_tree')::oid THEN 'status'
      WHEN hashtext('skipbureau_region_tree')::oid THEN 'region'
      ELSE 'other'
    END AS tree,
    mode,
    granted
  FROM pg_locks
  WHERE locktype = 'advisory' AND objsubid = 2 AND objid = hashtext($1)::oid
  ORDER BY tree, mode`

type Held = { tree: string; mode: string; granted: boolean }[]

// SB-181: a reader holds one residence status per country, which checkProfile already enforces, so
// two status criteria on one version are as unsatisfiable as two regions. The card names four
// dimensions and is silent on this one; the refusal covers all five.
test('a version cannot carry two residence statuses, which no reader could hold at once', async () => {
  const both = await obligation()
  const twoStatuses = prisma.ruleVersion.create({
    data: {
      countryCode: 'tr',
      obligationId: both.id,
      validFrom: NEXT_MONTH,
      ...source,
      // Both are real Turkish statuses this spec plants, so SB-189's trigger passes them and the
      // only thing left that can refuse the write is the one value per dimension rule.
      criteria: { create: [holds('tr.residence-permit'), holds('tr.visa-exemption')] },
    },
  })
  await expect(twoStatuses).rejects.toThrow(/one_value_per_single_valued_dimension/)
  expect(await prisma.ruleVersion.count({ where: { obligationId: both.id } })).toBe(0)
})

// SB-180: the same two guards for the status tree. The lock is EXCLUSIVE: a shared one conflicts
// only with an exclusive one, so a criterion writer holding it shared and a country move holding it
// shared would each validate without seeing the other and both commit the cross-country criterion.
test("a draft does not leave its status criteria in another country, a status code names its country, and a country move locks both trees exclusively", async () => {
  const moving = await obligation()
  const turkish = await version(moving.id, [holds('tr.residence-permit')], [], { validFrom: NEXT_MONTH })
  await expect(prisma.ruleVersion.update({ where: { id: turkish.id }, data: { countryCode: 'de' } })).rejects.toThrow(/cannot move to/)
  expect(await prisma.ruleVersion.findUnique({ where: { id: turkish.id } })).toMatchObject({ countryCode: 'tr' })
  await prisma.ruleVersion.delete({ where: { id: turkish.id } })

  await expect(prisma.residenceStatus.create({ data: { code: 'de.wrong-country', countryCode: 'tr', name: 'Wrong' } })).rejects.toThrow(
    /ResidenceStatus_code_names_its_country/,
  )
  expect(await prisma.residenceStatus.findUnique({ where: { code: 'de.wrong-country' } })).toBeNull()

  // A move that succeeds, so the locks it took can be read: both trees, exclusively, for the country
  // being left AND the one being moved into (SB-353). Taken before the criteria are walked, so a
  // move that will be refused holds them too, which is the whole point of them.
  //
  // Both reads are inside the transaction because these are pg_advisory_xact_lock locks: they are
  // released at commit, so a read afterwards sees nothing and would pass for the wrong reason.
  const [left, entered] = await prisma.$transaction(async (tx) => {
    const free = await tx.ruleVersion.create({
      data: { countryCode: 'tr', obligationId: moving.id, validFrom: NEXT_MONTH, ...source, criteria: { create: [{ dimension: 'nationality', value: 'ir' }] } },
    })
    await tx.ruleVersion.update({ where: { id: free.id }, data: { countryCode: 'de' } })
    return Promise.all([tx.$queryRawUnsafe<Held>(TREE_LOCKS, 'tr'), tx.$queryRawUnsafe<Held>(TREE_LOCKS, 'de')])
  })

  const bothTreesExclusive = [
    { tree: 'region', mode: 'ExclusiveLock', granted: true },
    { tree: 'status', mode: 'ExclusiveLock', granted: true },
  ]
  expect(left).toEqual(bothTreesExclusive)
  // The half SB-180 proved by reading the migration rather than by a test. It is what makes a move
  // wait on a transaction writing a criterion under the country being moved INTO, so an edit that
  // dropped it would leave the suite green and reopen the race the exclusive locks closed.
  expect(entered).toEqual(bothTreesExclusive)
})

test("a status criterion holds the status tree's lock shared, a change to the status tree holds it exclusively, and neither holds the region tree's", async () => {
  const locked = await obligation()
  await prisma.residenceStatus.createMany({
    data: [
      { code: 'tr.locking', countryCode: 'tr', name: 'Locking' },
      { code: 'tr.locking.kind', countryCode: 'tr', parentCode: 'tr.locking', name: 'Locking kind' },
    ],
  })

  const named = await prisma.$transaction(async (tx) => {
    await tx.ruleVersion.create({
      data: { countryCode: 'tr', obligationId: locked.id, validFrom: NEXT_MONTH, ...source, criteria: { create: [holds('tr.visa-exemption')] } },
    })
    return tx.$queryRawUnsafe<Held>(TREE_LOCKS, 'tr')
  })
  expect(named).toEqual([{ tree: 'status', mode: 'ShareLock', granted: true }])

  const moved = await prisma.$transaction(async (tx) => {
    await tx.residenceStatus.update({ where: { code: 'tr.locking.kind' }, data: { parentCode: null } })
    const held = await tx.$queryRawUnsafe<Held>(TREE_LOCKS, 'tr')
    await tx.residenceStatus.update({ where: { code: 'tr.locking.kind' }, data: { parentCode: 'tr.locking' } })
    return held
  })
  expect(moved).toEqual([{ tree: 'status', mode: 'ExclusiveLock', granted: true }])
  expect(await prisma.$queryRawUnsafe<Held>(TREE_LOCKS, 'tr')).toEqual([])

  const place = await prisma.$transaction(async (tx) => {
    await tx.ruleVersion.create({
      data: { countryCode: 'de', obligationId: locked.id, validFrom: NEXT_MONTH, ...source, criteria: { create: [{ dimension: 'workRegion', value: 'DE-SN' }] } },
    })
    return tx.$queryRawUnsafe<Held>(TREE_LOCKS, 'de')
  })
  expect(place).toEqual([{ tree: 'region', mode: 'ShareLock', granted: true }])
})

test('the seed, run a second time on a database with residence statuses, adds nothing and fails nothing', async () => {
  const counts = () =>
    Promise.all([
      prisma.ruleVersion.count(),
      prisma.eligibilityCriterion.count(),
      prisma.region.count(),
      prisma.residenceStatus.count(),
      prisma.obligation.count(),
    ])

  const before = await counts()
  await seed(prisma)
  expect(await counts()).toEqual(before)
})
