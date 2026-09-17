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

// SB-176: a detail the reader has not given, where it could change what they
// are told, is asked for rather than answered as though it did not match.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5464

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

const MOVE = `
  query Move(
    $from: String!
    $to: String!
    $nationality: String
    $situation: String
    $residenceRegions: [String!]
    $workRegions: [String!]
    $at: String
  ) {
    move(
      from: $from
      to: $to
      nationality: $nationality
      situation: $situation
      residenceRegions: $residenceRegions
      workRegions: $workRegions
      at: $at
    ) {
      obligationSlug
      verdict
      reason
      needs
      differences { key known }
      from { ruleVersionId facts { key numericValue } }
      to { ruleVersionId facts { key numericValue } }
    }
  }
`

type Side = { ruleVersionId: string; facts: { key: string; numericValue: string | null }[] } | null
type Entry = {
  obligationSlug: string
  verdict: string
  reason: string | null
  needs: string[]
  differences: { key: string; known: boolean }[]
  from: Side
  to: Side
}

const moveFromTurkey = async (variables: Record<string, unknown>): Promise<Entry[]> => {
  const response = await request(app.getHttpServer())
    .post('/graphql')
    .send({ query: MOVE, variables: { from: 'tr', to: 'de', ...variables } })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  return response.body.data.move
}

// SB-181: a detail given as blank is the caller's mistake, not an unanswered detail. fitOne tests
// `!profile.situation`, so an empty string used to read as "not said" and the reader was asked for
// it again; reading it instead as a situation they gave would silently drop the duties scoped to
// their real one. checkProfile refuses it, so neither happens.
test('a blank situation is refused as the caller\'s mistake, and is never asked for', async () => {
  const response = await request(app.getHttpServer())
    .post('/graphql')
    .send({ query: MOVE, variables: { from: 'tr', to: 'de', situation: '   ' } })

  expect(response.body.data).toBeNull()
  expect(response.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
  expect(response.body.errors[0].message).toMatch(/situation/)

  // And a situation left out entirely is still just unanswered, which is asked for, not refused.
  const absent = await request(app.getHttpServer())
    .post('/graphql')
    .send({ query: MOVE, variables: { from: 'tr', to: 'de' } })
  expect(absent.body.errors, JSON.stringify(absent.body.errors)).toBeUndefined()
})

const entryFor = async (slug: string, variables: Record<string, unknown>): Promise<Entry> => {
  const found = (await moveFromTurkey(variables)).find((entry) => entry.obligationSlug === slug)
  expect(found, `no entry for ${slug}`).toBeDefined()
  return found!
}

const shares = (entry: Entry) => Object.fromEntries((entry.to?.facts ?? []).map((fact) => [fact.key, Number(fact.numericValue)]))

type CriterionInput = { dimension: 'nationality' | 'nationalityGroup' | 'situation' | 'residenceRegion' | 'workRegion'; value: string }

/** A version starting next month, so it is asked about after next month. */
const version = async (country: string, slug: string, criteria: CriterionInput[], facts: { key: string; textValue?: string; numericValue?: number }[]) =>
  prisma.ruleVersion.create({
    data: {
      countryCode: country,
      obligationId: (await prisma.obligation.findUniqueOrThrow({ where: { slug } })).id,
      validFrom: NEXT_MONTH,
      ...source,
      criteria: { create: criteria },
      facts: { create: facts },
    },
  })

const WORKER = { nationality: 'ir', situation: 'worker' }

test('a Saxony resident who has not said where they work is asked, not told the national split', async () => {
  const care = await entryFor('pay-care-insurance', { ...WORKER, residenceRegions: ['DE-SN'] })

  expect(care).toMatchObject({ verdict: 'needsDetail', needs: ['workRegion'], reason: null, to: null })
})

test('once they say where they work, they get the Saxon split or the national one', async () => {
  const saxony = await entryFor('pay-care-insurance', { ...WORKER, residenceRegions: ['DE-SN'], workRegions: ['DE-SN'] })
  expect(saxony.needs).toEqual([])
  expect(shares(saxony)).toEqual({ employeeShare: 2.3, employerShare: 1.3 })

  const brandenburg = await entryFor('pay-care-insurance', { ...WORKER, residenceRegions: ['DE-SN'], workRegions: ['DE-BB'] })
  expect(brandenburg.needs).toEqual([])
  expect(shares(brandenburg)).toEqual({ employeeShare: 1.8, employerShare: 1.8 })
})

test('an obligation no missing detail could change resolves exactly as before', async () => {
  const address = await entryFor('register-your-address', { nationality: 'ir' })

  expect(address.verdict).toBe('changed')
  expect(address.needs).toEqual([])
  expect(address.differences).toEqual([
    { key: 'deadline', known: true },
    { key: 'requiredDocument', known: true },
  ])
})

test('a reader with no nationality is asked for it where a rule for a group of nationalities could apply', async () => {
  // Germany's only residence permit rule here is for EU nationals, so it is
  // open, and the obligation answers with the question rather than vanishing.
  const permit = await entryFor('get-a-residence-permit', { situation: 'worker' })

  expect(permit).toMatchObject({ verdict: 'needsDetail', needs: ['nationality'], to: null })
  expect(permit.from).not.toBeNull()
})

test('an open version repeating the only winner asks nothing, and one that says something else asks for its detail', async () => {
  const at = AFTER_NEXT_MONTH
  // Germany's national rule says health insurance is required.
  await version('de', 'hold-health-insurance', [{ dimension: 'workRegion', value: 'DE-HH' }], [{ key: 'required', textValue: 'yes' }])
  expect(await entryFor('hold-health-insurance', { ...WORKER, at })).toMatchObject({ verdict: 'newInDestination', needs: [] })

  await version('de', 'hold-health-insurance', [{ dimension: 'residenceRegion', value: 'DE-BE' }], [{ key: 'required', textValue: 'no' }])
  expect(await entryFor('hold-health-insurance', { ...WORKER, at })).toMatchObject({ verdict: 'needsDetail', needs: ['residenceRegion'], to: null })
})

test('a tie no answer could settle asks nothing, and one an answer could settle says what to ask', async () => {
  const at = AFTER_NEXT_MONTH
  const student = { nationality: 'fr', situation: 'student', at }
  await prisma.region.create({ data: { code: 'TR-06', countryCode: 'tr', name: 'Ankara' } })

  await version('tr', 'open-a-blocked-account', [{ dimension: 'nationality', value: 'fr' }], [{ key: 'balance', numericValue: 1 }])
  await version('tr', 'open-a-blocked-account', [{ dimension: 'situation', value: 'student' }], [{ key: 'balance', numericValue: 2 }])
  // Covers the first tied version only: answered, it would still tie with the second.
  await version(
    'tr',
    'open-a-blocked-account',
    [
      { dimension: 'nationality', value: 'fr' },
      { dimension: 'workRegion', value: 'TR-06' },
    ],
    [{ key: 'balance', numericValue: 3 }],
  )

  const tied = await entryFor('open-a-blocked-account', student)
  expect(tied.verdict).toBe('needsReview')
  expect(tied.needs).toEqual([])

  // Covers both: answered, it would settle the tie.
  await version(
    'tr',
    'open-a-blocked-account',
    [
      { dimension: 'nationality', value: 'fr' },
      { dimension: 'situation', value: 'student' },
      { dimension: 'residenceRegion', value: 'TR-06' },
    ],
    [{ key: 'balance', numericValue: 4 }],
  )

  const settleable = await entryFor('open-a-blocked-account', student)
  expect(settleable.verdict).toBe('needsReview')
  expect(settleable.needs).toEqual(['residenceRegion'])
})

test('one side tied and the other needing a detail is still for a person to decide, and says what could be asked', async () => {
  // Builds on the tie above, on Turkey's side. Germany's student rule gains a
  // Hamburg version that says something else, so Germany's side needs to know
  // where a student works.
  await version(
    'de',
    'open-a-blocked-account',
    [
      { dimension: 'situation', value: 'student' },
      { dimension: 'workRegion', value: 'DE-HH' },
    ],
    [{ key: 'balance', numericValue: 5 }],
  )

  const both = await entryFor('open-a-blocked-account', { nationality: 'fr', situation: 'student', at: AFTER_NEXT_MONTH })

  expect(both.verdict).toBe('needsReview')
  expect(both.reason).toContain('none is more specific')
  expect(both.needs).toEqual(['residenceRegion', 'workRegion'])
  expect(both.to).toBeNull()
})

// SB-440: a reader has one nationality, so a version naming two groups that share nobody can be
// satisfied by no one, and asking for the nationality cannot change what it says. SB-181 refused
// that shape for every other detail and deliberately exempted nationalityGroup, because two groups
// CAN both match a real reader. They can when they overlap. The research holds a pair that does not:
// eu, and the nationalities §41 AufenthV lets enter visa free, which share nobody by design, since
// that provision exists for people who are not EU citizens. Whether two groups overlap is a fact
// about membership rows rather than a property of the criterion row, which is why no CHECK could
// decide it and this is judged where the answer is built.
test('a version naming two groups that share nobody asks the reader nothing, and one naming two that overlap still asks', async () => {
  const at = AFTER_NEXT_MONTH
  const SLUG = 'get-a-tax-number'
  const CODES = ['t440-a', 't440-b', 't440-ac']

  // This obligation has a Turkish seed rule and no German one, and no other test in this file uses
  // it, so the three versions below are every German version it has.
  await prisma.nationalityGroup.createMany({
    data: [
      { code: 't440-a', name: 'Holds aa only' },
      { code: 't440-b', name: 'Holds bb only' },
      { code: 't440-ac', name: 'Holds aa and cc' },
    ],
  })

  // Dated from next month, so the history trigger still counts them as not yet in effect and this
  // test can remove them again, the way history.e2e.spec.ts removes a membership that is joining.
  await prisma.nationalityGroupMember.createMany({
    data: [
      { groupCode: 't440-a', nationality: 'aa', validFrom: NEXT_MONTH },
      { groupCode: 't440-b', nationality: 'bb', validFrom: NEXT_MONTH },
      { groupCode: 't440-ac', nationality: 'aa', validFrom: NEXT_MONTH },
      { groupCode: 't440-ac', nationality: 'cc', validFrom: NEXT_MONTH },
    ],
  })

  // What the reader is told when nothing narrower applies. Without it the impossible version would be
  // the obligation's only one, and refusing it would take the obligation out of the reply altogether,
  // so the test would be reading an absence rather than an answer.
  const plain = await version('de', SLUG, [], [{ key: 'required', textValue: 'yes' }])

  // Says something DIFFERENT from that on purpose: matters() drops an open version that only repeats
  // the winner, and then needs would be empty whether or not this card's check works.
  const nobody = await version(
    'de',
    SLUG,
    [
      { dimension: 'nationalityGroup', value: 't440-a' },
      { dimension: 'nationalityGroup', value: 't440-b' },
    ],
    [{ key: 'required', textValue: 'no' }],
  )

  const unasked = await entryFor(SLUG, { situation: 'worker', at })
  expect(unasked.needs, 'no nationality is in both groups, so no answer could change what this version says').not.toContain('nationality')

  await prisma.ruleVersion.delete({ where: { id: nobody.id } })

  const someone = await version(
    'de',
    SLUG,
    [
      { dimension: 'nationalityGroup', value: 't440-a' },
      { dimension: 'nationalityGroup', value: 't440-ac' },
    ],
    [{ key: 'required', textValue: 'no' }],
  )

  const asked = await entryFor(SLUG, { situation: 'worker', at })
  expect(asked.needs, 'aa is in both groups, so the answer does turn on the nationality and is still worth asking').toContain('nationality')

  await prisma.ruleVersion.delete({ where: { id: someone.id } })
  await prisma.ruleVersion.delete({ where: { id: plain.id } })
  await prisma.nationalityGroupMember.deleteMany({ where: { groupCode: { in: CODES } } })
  await prisma.nationalityGroup.deleteMany({ where: { code: { in: CODES } } })
})

// SB-442: SB-440 caught a version naming two groups that share nobody, but its check answered early
// on a single set without looking inside it, so a version scoped to ONE group that has emptied was
// still reported open and the reader still asked. That case needs no editor error to arrive, which
// is what makes it worth its own test: a membership ending is enough, and the seed already holds gb
// in eu only until 2020-02-01.
test('a version scoped to one group whose members have all left asks the reader nothing, and one whose group still has someone asks', async () => {
  const at = AFTER_NEXT_MONTH
  const SLUG = 'get-a-tax-number'
  const CODES = ['t442-gone', 't442-here']

  await prisma.nationalityGroup.createMany({
    data: [
      { code: 't442-gone', name: 'Everyone has left by then' },
      { code: 't442-here', name: 'Still holds someone' },
    ],
  })

  // The first membership ends a full day BEFORE the date asked about, which is what this card's exit
  // says, rather than ending exactly on it. The group still exists and simply holds nobody then, so
  // this proves the emptied case and not an absent one. Both are dated ahead of today, so the history
  // trigger counts them as not yet in effect and this test can delete them again.
  await prisma.nationalityGroupMember.createMany({
    data: [
      { groupCode: 't442-gone', nationality: 'ga', validFrom: day(29), validTo: day(30) },
      { groupCode: 't442-here', nationality: 'ha', validFrom: day(29) },
    ],
  })

  // The answer when nothing narrower applies, so the obligation never drops out of the reply, and
  // saying something different from it so matters() cannot discard the open version for the wrong
  // reason. Both are the same care SB-440's test takes.
  const plain = await version('de', SLUG, [], [{ key: 'required', textValue: 'yes' }])

  const emptied = await version('de', SLUG, [{ dimension: 'nationalityGroup', value: 't442-gone' }], [{ key: 'required', textValue: 'no' }])
  const unasked = await entryFor(SLUG, { situation: 'worker', at })
  expect(unasked.needs, 'that group holds nobody by then, so no nationality could bring this version in').not.toContain('nationality')
  await prisma.ruleVersion.delete({ where: { id: emptied.id } })

  const peopled = await version('de', SLUG, [{ dimension: 'nationalityGroup', value: 't442-here' }], [{ key: 'required', textValue: 'no' }])
  const asked = await entryFor(SLUG, { situation: 'worker', at })
  expect(asked.needs, 'ha is in that group, so the answer does turn on the nationality and is worth asking').toContain('nationality')
  await prisma.ruleVersion.delete({ where: { id: peopled.id } })

  await prisma.ruleVersion.delete({ where: { id: plain.id } })
  await prisma.nationalityGroupMember.deleteMany({ where: { groupCode: { in: CODES } } })
  await prisma.nationalityGroup.deleteMany({ where: { code: { in: CODES } } })
})
