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

// SB-186: a rule belongs to a place at any level, the country, a province, a
// city or an area, and a narrower place's version states only what differs
// there, taking the rest from the wider places'. Every refusal is attempted
// against the database itself, and the rows are read back afterwards.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5465

let app: INestApplication
let prisma: PrismaService
let stopDatabase: () => Promise<void>

const day = (offset = 0) => new Date(new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10))
const NEXT_MONTH = day(30)
const AFTER_NEXT_MONTH = day(31).toISOString().slice(0, 10)
const source = { sourceUrl: 'https://example.gov', sourceName: 'test', verifiedAt: new Date('2026-09-14') }

// Istanbul and Bursa are provinces. Kadıköy and Beşiktaş are districts of
// Istanbul, the city a reader names; Moda and Fenerbahçe are neighbourhoods of
// Kadıköy. Written in one statement, a place after the one it is inside.
const PLACES = [
  { code: 'TR-34', parentCode: null, name: 'Istanbul' },
  { code: 'TR-16', parentCode: null, name: 'Bursa' },
  { code: 'TR-34.kadikoy', parentCode: 'TR-34', name: 'Kadıköy' },
  { code: 'TR-34.besiktas', parentCode: 'TR-34', name: 'Beşiktaş' },
  { code: 'TR-34.kadikoy.moda', parentCode: 'TR-34.kadikoy', name: 'Moda' },
  { code: 'TR-34.kadikoy.fenerbahce', parentCode: 'TR-34.kadikoy', name: 'Fenerbahçe' },
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
  await prisma.region.createMany({ data: PLACES.map((place) => ({ ...place, countryCode: 'tr' })) })
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

const graphql = (query: string, variables: Record<string, unknown> = {}) =>
  request(app.getHttpServer()).post('/graphql').send({ query, variables })

const MOVE = `
  query Move(
    $from: String!
    $to: String!
    $at: String
    $nationality: String
    $residenceRegions: [String!]
    $workRegions: [String!]
    $fromResidenceRegions: [String!]
    $toResidenceRegions: [String!]
    $fromWorkRegions: [String!]
    $toWorkRegions: [String!]
  ) {
    move(
      from: $from
      to: $to
      at: $at
      nationality: $nationality
      residenceRegions: $residenceRegions
      workRegions: $workRegions
      fromResidenceRegions: $fromResidenceRegions
      toResidenceRegions: $toResidenceRegions
      fromWorkRegions: $fromWorkRegions
      toWorkRegions: $toWorkRegions
    ) {
      obligationSlug
      verdict
      reason
      needs
      from { ruleVersionId facts { key operator numericValue textValue ruleVersionId } }
      to { ruleVersionId facts { key operator numericValue textValue ruleVersionId } notes { ruleVersionId text locale translationMissing } }
      differences { key known from { numericValue ruleVersionId } to { numericValue ruleVersionId } }
    }
  }
`

type Fact = { key: string; operator: string; numericValue: string | null; textValue: string | null; ruleVersionId: string }
type Note = { ruleVersionId: string; text: string; locale: string; translationMissing: boolean }
type Side = { ruleVersionId: string; facts: Fact[]; notes?: Note[] } | null
type Value = { numericValue: string | null; ruleVersionId: string } | null
type Entry = {
  obligationSlug: string
  verdict: string
  reason: string | null
  needs: string[]
  from: Side
  to: Side
  differences: { key: string; known: boolean; from: Value; to: Value }[]
}

/** A move within Turkey unless the variables say otherwise, asked about after next month. */
const entryFor = async (slug: string, variables: Record<string, unknown>): Promise<Entry> => {
  const response = await graphql(MOVE, { from: 'tr', to: 'tr', at: AFTER_NEXT_MONTH, ...variables })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  const found = (response.body.data.move as Entry[]).find((entry) => entry.obligationSlug === slug)
  expect(found, `no entry for ${slug}`).toBeDefined()
  return found!
}

/** What a reader arriving from Germany to live in one place in Turkey is told, or asked. */
const livingIn = (slug: string, place: string | null, variables: Record<string, unknown> = {}) =>
  entryFor(slug, { from: 'de', toResidenceRegions: place ? [place] : [], ...variables })

/** A side's facts as each key's value and the version it was read from. */
const told = (side: Side) =>
  Object.fromEntries(
    (side?.facts ?? []).map((fact) => [fact.key, [fact.operator === 'none' ? 'none' : (fact.numericValue ?? fact.textValue), fact.ruleVersionId]]),
  )

let obligations = 0

/** An obligation of its own per test, so no seeded rule and no other test's version answers beside it. */
const obligation = async () => (await prisma.obligation.create({ data: { slug: `place-${++obligations}`, kind: 'registration' } })).slug

type CriterionInput = { dimension: 'nationality' | 'nationalityGroup' | 'situation' | 'residenceRegion' | 'workRegion'; value: string }
type FactInput = { key: string; operator?: 'equals' | 'none'; numericValue?: number; textValue?: string }

/** A version in Turkey starting next month, with an English note where one is given. */
const version = async (slug: string, criteria: CriterionInput[], facts: FactInput[], note?: string) =>
  prisma.ruleVersion.create({
    data: {
      countryCode: 'tr',
      obligationId: (await prisma.obligation.findUniqueOrThrow({ where: { slug } })).id,
      validFrom: NEXT_MONTH,
      ...source,
      criteria: { create: criteria },
      facts: { create: facts },
      ...(note ? { texts: { create: [{ locale: 'en-US', notes: note }] } } : {}),
    },
  })

const lives = (value: string): CriterionInput => ({ dimension: 'residenceRegion', value })
const works = (value: string): CriterionInput => ({ dimension: 'workRegion', value })

test('a city and an area are stored under the places they are in', async () => {
  const moda = await prisma.region.findUniqueOrThrow({ where: { code: 'TR-34.kadikoy.moda' }, include: { parent: { include: { parent: true } } } })

  expect(moda.parent?.code).toBe('TR-34.kadikoy')
  expect(moda.parent?.parent?.code).toBe('TR-34')
  expect(moda.parent?.parent?.parentCode).toBeNull()
})

test("a reader in a city is told the city's fact and the country's other one, and a reader elsewhere both of the country's", async () => {
  const slug = await obligation()
  const country = await version(slug, [], [
    { key: 'fee', numericValue: 100 },
    { key: 'deadline', numericValue: 30 },
  ])
  const city = await version(slug, [lives('TR-34.kadikoy')], [{ key: 'fee', numericValue: 150 }])

  const kadikoy = await livingIn(slug, 'TR-34.kadikoy')
  expect(kadikoy.verdict).toBe('newInDestination')
  expect(kadikoy.to?.ruleVersionId).toBe(city.id)
  expect(told(kadikoy.to)).toEqual({ deadline: ['30', country.id], fee: ['150', city.id] })

  const bursa = await livingIn(slug, 'TR-16')
  expect(bursa.to?.ruleVersionId).toBe(country.id)
  expect(told(bursa.to)).toEqual({ deadline: ['30', country.id], fee: ['100', country.id] })

  // A reader in a neighbourhood of the city is in the city.
  expect(told((await livingIn(slug, 'TR-34.kadikoy.moda')).to)).toEqual({ deadline: ['30', country.id], fee: ['150', city.id] })

  // One who has named only the province, or no place at all, could be in the city, and is asked.
  expect(await livingIn(slug, 'TR-34')).toMatchObject({ verdict: 'needsDetail', needs: ['residenceRegion'], to: null })
  expect(await livingIn(slug, null)).toMatchObject({ verdict: 'needsDetail', needs: ['residenceRegion'], to: null })
})

test('a rule for an area applies to a reader in that area only, and a reader who named only the city is asked where in it', async () => {
  const slug = await obligation()
  const country = await version(slug, [], [
    { key: 'fee', numericValue: 100 },
    { key: 'deadline', numericValue: 30 },
  ])
  const city = await version(slug, [lives('TR-34.kadikoy')], [{ key: 'fee', numericValue: 150 }])
  const area = await version(slug, [lives('TR-34.kadikoy.moda')], [{ key: 'deadline', numericValue: 15 }])

  const moda = await livingIn(slug, 'TR-34.kadikoy.moda')
  expect(moda.to?.ruleVersionId).toBe(area.id)
  expect(told(moda.to)).toEqual({ deadline: ['15', area.id], fee: ['150', city.id] })

  const fenerbahce = await livingIn(slug, 'TR-34.kadikoy.fenerbahce')
  expect(fenerbahce.to?.ruleVersionId).toBe(city.id)
  expect(told(fenerbahce.to)).toEqual({ deadline: ['30', country.id], fee: ['150', city.id] })

  expect(await livingIn(slug, 'TR-34.kadikoy')).toMatchObject({ verdict: 'needsDetail', needs: ['residenceRegion'], to: null })

  expect(told((await livingIn(slug, 'TR-34.besiktas')).to)).toEqual({ deadline: ['30', country.id], fee: ['100', country.id] })
})

test('an area rule that would tell a reader in the city nothing new asks them nothing', async () => {
  const slug = await obligation()
  await version(slug, [], [
    { key: 'fee', numericValue: 100 },
    { key: 'deadline', numericValue: 30 },
  ])
  const city = await version(slug, [lives('TR-34.kadikoy')], [{ key: 'fee', numericValue: 150 }])
  // Restates the country's deadline, so completed from the city and the country it says what the city's rule says.
  await version(slug, [lives('TR-34.kadikoy.moda')], [{ key: 'deadline', numericValue: 30 }])

  const kadikoy = await livingIn(slug, 'TR-34.kadikoy')
  expect(kadikoy).toMatchObject({ verdict: 'newInDestination', needs: [] })
  expect(kadikoy.to?.ruleVersionId).toBe(city.id)
})

test("a reader in a city is told the city's facts completed from the province's and then the country's, a different office included", async () => {
  const slug = await obligation()
  const country = await version(slug, [], [
    { key: 'fee', numericValue: 100 },
    { key: 'deadline', numericValue: 30 },
    { key: 'office', textValue: 'Provincial Directorate' },
  ])
  const province = await version(slug, [lives('TR-34')], [
    { key: 'fee', numericValue: 120 },
    { key: 'deadline', numericValue: 20 },
  ])
  const city = await version(slug, [lives('TR-34.kadikoy')], [{ key: 'office', textValue: 'Kadıköy District Directorate' }])

  expect(told((await livingIn(slug, 'TR-34.kadikoy')).to)).toEqual({
    deadline: ['20', province.id],
    fee: ['120', province.id],
    office: ['Kadıköy District Directorate', city.id],
  })
  expect(told((await livingIn(slug, 'TR-34.besiktas')).to)).toEqual({
    deadline: ['20', province.id],
    fee: ['120', province.id],
    office: ['Provincial Directorate', country.id],
  })
})

test("a city that states it has no fee is not given the country's", async () => {
  const slug = await obligation()
  const country = await version(slug, [], [
    { key: 'fee', numericValue: 100 },
    { key: 'deadline', numericValue: 30 },
  ])
  const city = await version(slug, [lives('TR-34.kadikoy')], [{ key: 'fee', operator: 'none' }])

  expect(told((await livingIn(slug, 'TR-34.kadikoy')).to)).toEqual({ deadline: ['30', country.id], fee: ['none', city.id] })
})

test("a rule for a group of nationalities inherits nothing from the country's, and a key it leaves out stays a gap", async () => {
  const slug = await obligation()
  await version(slug, [], [
    { key: 'fee', numericValue: 100 },
    { key: 'deadline', numericValue: 30 },
  ])
  const eu = await version(slug, [{ dimension: 'nationalityGroup', value: 'eu' }], [{ key: 'fee', numericValue: 0 }])
  const euInKadikoy = await version(slug, [{ dimension: 'nationalityGroup', value: 'eu' }, lives('TR-34.kadikoy')], [{ key: 'deadline', numericValue: 10 }])

  expect(told((await livingIn(slug, 'TR-16', { nationality: 'de' })).to)).toEqual({ fee: ['0', eu.id] })

  // Within one scope a place still inherits: the EU rule for Kadıköy takes its fee from the EU rule, never the country's.
  expect(told((await livingIn(slug, 'TR-34.kadikoy', { nationality: 'de' })).to)).toEqual({ deadline: ['10', euInKadikoy.id], fee: ['0', eu.id] })
})

test('a rule for where a reader lives and works takes one missing key from a rule for their province of residence and another from one for their province of work', async () => {
  const slug = await obligation()
  await version(slug, [], [
    { key: 'fee', numericValue: 100 },
    { key: 'deadline', numericValue: 30 },
    { key: 'office', textValue: 'Provincial Directorate' },
  ])
  const both = await version(slug, [lives('TR-34.kadikoy'), works('TR-34.besiktas')], [{ key: 'fee', numericValue: 150 }])
  const residence = await version(slug, [lives('TR-34')], [{ key: 'deadline', numericValue: 20 }])
  const work = await version(slug, [works('TR-34')], [{ key: 'office', textValue: 'Istanbul Labour Office' }])

  const entry = await livingIn(slug, 'TR-34.kadikoy', { toWorkRegions: ['TR-34.besiktas'] })
  expect(entry.to?.ruleVersionId).toBe(both.id)
  expect(told(entry.to)).toEqual({ deadline: ['20', residence.id], fee: ['150', both.id], office: ['Istanbul Labour Office', work.id] })
})

test('a residence rule and a work rule the narrower rule inherits from, stating one key differently, are for a person to decide', async () => {
  const slug = await obligation()
  await version(slug, [lives('TR-34.kadikoy'), works('TR-34.besiktas')], [{ key: 'fee', numericValue: 150 }])
  const residence = await version(slug, [lives('TR-34')], [{ key: 'deadline', numericValue: 20 }])
  const work = await version(slug, [works('TR-34')], [{ key: 'deadline', numericValue: 25 }])

  const entry = await livingIn(slug, 'TR-34.kadikoy', { toWorkRegions: ['TR-34.besiktas'] })
  expect(entry).toMatchObject({ verdict: 'needsReview', to: null })
  expect(entry.reason).toContain('deadline')
  expect(entry.reason).toContain(residence.id)
  expect(entry.reason).toContain(work.id)
})

test('a move from Istanbul to Bursa reports only the facts that differ', async () => {
  const slug = await obligation()
  const country = await version(slug, [], [
    { key: 'fee', numericValue: 100 },
    { key: 'deadline', numericValue: 30 },
  ])
  const istanbul = await version(slug, [lives('TR-34')], [{ key: 'fee', numericValue: 150 }])

  const entry = await entryFor(slug, { fromResidenceRegions: ['TR-34'], toResidenceRegions: ['TR-16'] })

  expect(entry.verdict).toBe('changed')
  expect(entry.differences).toEqual([
    { key: 'fee', known: true, from: { numericValue: '150', ruleVersionId: istanbul.id }, to: { numericValue: '100', ruleVersionId: country.id } },
  ])
})

test("a side's own list replaces the shared one, an empty list says nowhere, and a null list is refused", async () => {
  const slug = await obligation()
  await version(slug, [], [{ key: 'fee', numericValue: 100 }])
  await version(slug, [lives('TR-34')], [{ key: 'fee', numericValue: 150 }])

  expect(await entryFor(slug, { residenceRegions: ['TR-34'] })).toMatchObject({ verdict: 'identical', needs: [] })
  expect(await entryFor(slug, { residenceRegions: ['TR-34'], toResidenceRegions: ['TR-16'] })).toMatchObject({ verdict: 'changed' })

  // Nowhere in Turkey after the move: whether Istanbul's rule is theirs there is not known, so it is asked.
  expect(await entryFor(slug, { residenceRegions: ['TR-34'], toResidenceRegions: [] })).toMatchObject({
    verdict: 'needsDetail',
    needs: ['residenceRegion'],
  })

  const refused = await graphql(MOVE, { from: 'tr', to: 'tr', residenceRegions: ['TR-34'], toResidenceRegions: null, fromWorkRegions: null })
  expect(refused.status).toBe(200)
  expect(refused.body.data).toBeNull()
  expect(refused.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
  expect(refused.body.errors[0].message).toContain('toResidenceRegions')
  expect(refused.body.errors[0].message).toContain('fromWorkRegions')
})

test('the tree refuses a parent in another country and a place inside itself, and a region does not leave its places in another country', async () => {
  await prisma.region.createMany({
    data: [
      { code: 'TR-06', countryCode: 'tr', name: 'Ankara' },
      { code: 'TR-06.cankaya', countryCode: 'tr', parentCode: 'TR-06', name: 'Çankaya' },
      { code: 'TR-06.cankaya.kizilay', countryCode: 'tr', parentCode: 'TR-06.cankaya', name: 'Kızılay' },
    ],
  })
  const regions = await prisma.region.count()

  await expect(prisma.region.create({ data: { code: 'DE-BY.muenchen', countryCode: 'de', parentCode: 'TR-06', name: 'München' } })).rejects.toThrow(
    /inside a region of its own country/,
  )
  await expect(prisma.region.create({ data: { code: 'TR-06.itself', countryCode: 'tr', parentCode: 'TR-06.itself', name: 'Itself' } })).rejects.toThrow(
    /cannot be inside TR-06.itself/,
  )
  await expect(prisma.region.update({ where: { code: 'TR-06' }, data: { parentCode: 'TR-06.cankaya.kizilay' } })).rejects.toThrow(
    /cannot be inside TR-06.cankaya.kizilay, which is inside it/,
  )
  // SB-180 refuses this one step earlier now, and with its own words: a CHECK is evaluated before
  // an AFTER trigger, and TR-06 in Germany breaks the rule that a code names the country its row is
  // in. The row is still refused. The tree's own branch, a region leaving its places behind, is
  // reached only by changing the code and the country together, which is SB-352.
  await expect(prisma.region.update({ where: { code: 'TR-06' }, data: { countryCode: 'de' } })).rejects.toThrow(/Region_code_names_its_country/)

  expect(await prisma.region.count()).toBe(regions)
  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-06' } })).toMatchObject({ countryCode: 'tr', parentCode: null })
})

// SB-200: the freeze walks DOWN from the row being changed, so it catches a named descendant and
// misses a named ancestor. With a version naming Ordu, moving Altınordu under Rize takes every
// reader in Altınordu out of Ordu's rule and into Rize's, without any version changing.
//
// On places of its own, because every seeded place is already named by an earlier test's criteria.
// The downward walk refuses those first, with its own message, so a case built on them would pass
// without the guard under test ever running.
test('a place a rule reaches through the place it is inside cannot be moved out from under it', async () => {
  await prisma.region.createMany({
    data: [
      { code: 'TR-52', countryCode: 'tr', name: 'Ordu' },
      { code: 'TR-52.altinordu', countryCode: 'tr', parentCode: 'TR-52', name: 'Altınordu' },
      { code: 'TR-53', countryCode: 'tr', name: 'Rize' },
      { code: 'TR-53.pazar', countryCode: 'tr', parentCode: 'TR-53', name: 'Pazar' },
    ],
  })
  await version(await obligation(), [lives('TR-52')], [{ key: 'fee', numericValue: 10 }])

  await expect(prisma.region.update({ where: { code: 'TR-52.altinordu' }, data: { parentCode: 'TR-53' } })).rejects.toThrow(
    /Region TR-52.altinordu is inside TR-52, which a rule's criteria name, so it cannot be moved/,
  )
  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-52.altinordu' } })).toMatchObject({ parentCode: 'TR-52' })

  // Not a blanket freeze: a rename keeps the parent, so the rule still reaches it, and a place no
  // criterion names above, at or below still moves.
  await prisma.region.update({ where: { code: 'TR-52.altinordu' }, data: { name: 'Altınordu District' } })
  await prisma.region.update({ where: { code: 'TR-53.pazar' }, data: { parentCode: null } })
  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-53.pazar' } })).toMatchObject({ parentCode: null })
})

// SB-361: the upward walk reads the tree as the statement has left it so far, because a row-level
// BEFORE trigger sees rows already processed by the same command. One statement pointing two places
// at each other therefore puts a cycle in front of a third row's walk. Before this was fixed the
// statement below never returned and the probe had to be killed.
test('one update that points two places at each other terminates, and is refused rather than hanging', async () => {
  await prisma.region.createMany({
    data: [
      { code: 'TR-70', countryCode: 'tr', name: 'Ordu named' },
      { code: 'TR-70.p', countryCode: 'tr', name: 'P' },
      { code: 'TR-70.q', countryCode: 'tr', name: 'Q' },
      { code: 'TR-70.r', countryCode: 'tr', parentCode: 'TR-70.p', name: 'R' },
    ],
  })
  await version(await obligation(), [lives('TR-70')], [{ key: 'fee', numericValue: 1 }])

  // p and q point at each other, and r, whose parent is p, moves. r's walk meets that cycle. The
  // refusal comes from the tree guard, which owns cycles, and the point of the test is that it
  // ARRIVES at all.
  await expect(
    prisma.$executeRawUnsafe(
      `UPDATE "Region" AS reg SET "parentCode" = v.parent
       FROM (VALUES ('TR-70.p','TR-70.q'),('TR-70.q','TR-70.p'),('TR-70.r','TR-70')) AS v(code,parent)
       WHERE reg.code = v.code`,
    ),
  ).rejects.toThrow(/cannot be inside/)

  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-70.r' } })).toMatchObject({ parentCode: 'TR-70.p' })
  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-70.p' } })).toMatchObject({ parentCode: null })
})

// SB-361, the harder half. A temporary cycle stops the upward walk, so in principle a statement could
// use one to hide a named ancestor, then undo it before the AFTER guard looks at the final tree. It
// cannot, and this holds that down: every row on the path between the moved row and the named
// ancestor is itself protected by the same walk, so the statement is refused at whichever of them the
// executor visits first, and a row with no parent is on nobody's upward path until it is moved onto
// one, which means moving a protected row again.
test('a statement cannot hide a named ancestor behind a temporary cycle and move a place out from under it', async () => {
  await prisma.region.createMany({
    data: [
      { code: 'TR-71', countryCode: 'tr', name: 'Rize named' },
      { code: 'TR-71.b', countryCode: 'tr', parentCode: 'TR-71', name: 'B' },
      { code: 'TR-71.c', countryCode: 'tr', parentCode: 'TR-71.b', name: 'C' },
      { code: 'TR-71.d', countryCode: 'tr', parentCode: 'TR-71.b', name: 'D' },
    ],
  })
  await version(await obligation(), [lives('TR-71')], [{ key: 'fee', numericValue: 2 }])

  // SB-362: the refusal names the ancestor and its own kind, never which row was visited first. An
  // UPDATE may visit its rows in any order, and b, c and d each name themselves while all three
  // correctly name TR-71. This still fails if the upward walk is removed: the final tree here is
  // acyclic, so the AFTER cycle guard would not refuse it either and the statement would commit.
  await expect(
    prisma.$executeRawUnsafe(
      `UPDATE "Region" AS reg SET "parentCode" = v.parent
       FROM (VALUES ('TR-71.b','TR-71.c'),('TR-71.d',NULL::varchar),('TR-71.c','TR-71')) AS v(code,parent)
       WHERE reg.code = v.code`,
    ),
  ).rejects.toThrow(/is inside TR-71, which a rule's criteria name, so it cannot be moved/)

  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-71.d' } })).toMatchObject({ parentCode: 'TR-71.b' })
  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-71.c' } })).toMatchObject({ parentCode: 'TR-71.b' })
})

test('a region a rule names through a place inside it keeps its code, country and parent until that rule is removed', async () => {
  await prisma.region.createMany({
    data: [
      { code: 'TR-35', countryCode: 'tr', name: 'Izmir' },
      { code: 'TR-35.konak', countryCode: 'tr', parentCode: 'TR-35', name: 'Konak' },
      { code: 'TR-35.konak.alsancak', countryCode: 'tr', parentCode: 'TR-35.konak', name: 'Alsancak' },
    ],
  })
  const alsancak = await version(await obligation(), [lives('TR-35.konak.alsancak')], [{ key: 'fee', numericValue: 10 }])

  await expect(prisma.region.update({ where: { code: 'TR-35.konak' }, data: { parentCode: 'TR-16' } })).rejects.toThrow(/cannot be deleted or recoded, or moved/)
  await expect(prisma.region.update({ where: { code: 'TR-35' }, data: { code: 'TR-35-X' } })).rejects.toThrow(/cannot be deleted or recoded, or moved/)
  await expect(prisma.region.update({ where: { code: 'TR-35' }, data: { countryCode: 'de' } })).rejects.toThrow(/cannot be deleted or recoded, or moved/)
  await expect(prisma.region.delete({ where: { code: 'TR-35.konak' } })).rejects.toThrow(/cannot be deleted or recoded, or moved/)
  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-35.konak' } })).toMatchObject({ countryCode: 'tr', parentCode: 'TR-35' })

  // Its name and official code stay editable.
  await prisma.region.update({ where: { code: 'TR-35.konak' }, data: { name: 'Konak District', officialCode: 'test-code' } })
  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-35.konak' } })).toMatchObject({ name: 'Konak District', officialCode: 'test-code' })

  // Freed by removing the draft, though a place is still not removed from under the places inside it.
  await prisma.ruleVersion.delete({ where: { id: alsancak.id } })
  await expect(prisma.region.delete({ where: { code: 'TR-35.konak' } })).rejects.toThrow()
  expect(await prisma.region.count({ where: { code: { startsWith: 'TR-35.' } } })).toBe(2)

  await prisma.region.delete({ where: { code: 'TR-35.konak.alsancak' } })
  await prisma.region.delete({ where: { code: 'TR-35.konak' } })
  expect(await prisma.region.count({ where: { code: { startsWith: 'TR-35.' } } })).toBe(0)
})

// Turkey's lock on the region tree, by its two integer keys, which pg_locks shows
// as classid and objid with objsubid 2, apart from the single-key lock Prisma's
// migrate holds on this one-session database. One session also means this shows
// each lock taken and released, not two sessions waiting on each other.
const TREE_LOCKS = `
  SELECT mode, granted FROM pg_locks
  WHERE locktype = 'advisory' AND objsubid = 2
    AND classid = hashtext('skipbureau_region_tree')::oid AND objid = hashtext('tr')::oid
  ORDER BY mode`

type Held = { mode: string; granted: boolean }[]

test("a change to the tree holds the country's lock exclusively, and a criterion naming a place holds it shared", async () => {
  await prisma.region.createMany({
    data: [
      { code: 'TR-01', countryCode: 'tr', name: 'Adana' },
      { code: 'TR-01.seyhan', countryCode: 'tr', parentCode: 'TR-01', name: 'Seyhan' },
    ],
  })
  const obligationId = (await prisma.obligation.findUniqueOrThrow({ where: { slug: await obligation() } })).id

  const renamed = await prisma.$transaction(async (tx) => {
    await tx.region.update({ where: { code: 'TR-01.seyhan' }, data: { name: 'Seyhan District' } })
    return tx.$queryRawUnsafe<Held>(TREE_LOCKS)
  })
  expect(renamed).toEqual([])

  const moved = await prisma.$transaction(async (tx) => {
    await tx.region.update({ where: { code: 'TR-01.seyhan' }, data: { parentCode: null } })
    const held = await tx.$queryRawUnsafe<Held>(TREE_LOCKS)
    await tx.region.update({ where: { code: 'TR-01.seyhan' }, data: { parentCode: 'TR-01' } })
    return held
  })
  expect(moved).toEqual([{ mode: 'ExclusiveLock', granted: true }])
  expect(await prisma.$queryRawUnsafe<Held>(TREE_LOCKS)).toEqual([])

  const named = await prisma.$transaction(async (tx) => {
    await tx.ruleVersion.create({ data: { countryCode: 'tr', obligationId, validFrom: NEXT_MONTH, ...source, criteria: { create: [lives('TR-01.seyhan')] } } })
    return tx.$queryRawUnsafe<Held>(TREE_LOCKS)
  })
  expect(named).toEqual([{ mode: 'ShareLock', granted: true }])
  expect(await prisma.$queryRawUnsafe<Held>(TREE_LOCKS)).toEqual([])
})

test('the seed, run a second time on a database with places below the first level, adds nothing and fails nothing', async () => {
  const counts = () =>
    Promise.all([
      prisma.ruleVersion.count(),
      prisma.eligibilityCriterion.count(),
      prisma.region.count(),
      prisma.regionText.count(),
      prisma.obligation.count(),
    ])

  const before = await counts()
  await seed(prisma)
  expect(await counts()).toEqual(before)
})

/** The notes a side carries, as the version each belongs to and its text. */
const noted = (side: Side) => (side?.notes ?? []).map((note) => [note.ruleVersionId, note.text])

test('an answer carries the notes of the rules its facts come from, widest place first, and a wider rule it takes no fact from gives none', async () => {
  const inherits = await obligation()
  const country = await version(
    inherits,
    [],
    [
      { key: 'fee', numericValue: 100 },
      { key: 'deadline', numericValue: 30 },
    ],
    'the country',
  )
  const city = await version(inherits, [lives('TR-34.kadikoy')], [{ key: 'fee', numericValue: 150 }], 'the city')

  expect(noted((await livingIn(inherits, 'TR-34.kadikoy')).to)).toEqual([
    [country.id, 'the country'],
    [city.id, 'the city'],
  ])
  expect(noted((await livingIn(inherits, 'TR-16')).to)).toEqual([[country.id, 'the country']])

  // A city rule that states every fact the country's does replaces it there, note and all.
  const replaced = await obligation()
  await version(replaced, [], [{ key: 'fee', numericValue: 100 }], 'the country')
  const whole = await version(replaced, [lives('TR-34.kadikoy')], [{ key: 'fee', numericValue: 150 }], 'the city')
  expect(noted((await livingIn(replaced, 'TR-34.kadikoy')).to)).toEqual([[whole.id, 'the city']])
})

test('where two wider rules state the same value, only the version whose fact the answer kept gives a note', async () => {
  const slug = await obligation()
  const istanbul = await version(slug, [lives('TR-34')], [{ key: 'fee', numericValue: 100 }], 'where you live')
  const bursa = await version(slug, [works('TR-16')], [{ key: 'fee', numericValue: 100 }], 'where you work')
  const both = await version(slug, [lives('TR-34.kadikoy'), works('TR-16')], [{ key: 'deadline', numericValue: 10 }], 'both')
  const [kept] = [istanbul, bursa].sort((a, b) => (a.id < b.id ? -1 : 1))

  const answer = await livingIn(slug, 'TR-34.kadikoy', { toWorkRegions: ['TR-16'] })
  expect(told(answer.to).fee).toEqual(['100', kept?.id])
  expect(noted(answer.to)).toEqual([
    [kept?.id, kept?.id === istanbul.id ? 'where you live' : 'where you work'],
    [both.id, 'both'],
  ])
})

// SB-352: SB-180's CHECK is evaluated before this AFTER trigger, so a country change that keeps the code is refused
// by the CHECK and the tree's own branch is never reached. It is reachable only by changing the code and the country
// together, which satisfies the CHECK, because Region_code_names_its_country wants upper(countryCode) and a dash.
//
// On scratch codes rather than the seeded ones. TR-16, which SB-352 suggested, has nothing inside it, so the branch's
// EXISTS would find no child and the test would pass without reaching the guard; and works('TR-16') names it later in
// this file, so the freeze would refuse the recode first with its own message.
test('a region cannot take its code and country to another country while a place inside it stays behind', async () => {
  await prisma.region.createMany({
    data: [
      { code: 'TR-77', countryCode: 'tr', name: 'Scratch province' },
      { code: 'TR-77.inside', countryCode: 'tr', parentCode: 'TR-77', name: 'Scratch district' },
    ],
  })

  await expect(prisma.region.update({ where: { code: 'TR-77' }, data: { code: 'DE-77', countryCode: 'de' } })).rejects.toThrow(
    /while a place inside it is in another country/,
  )

  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-77' } })).toMatchObject({ countryCode: 'tr' })
  expect(await prisma.region.findUniqueOrThrow({ where: { code: 'TR-77.inside' } })).toMatchObject({ parentCode: 'TR-77', countryCode: 'tr' })
})
