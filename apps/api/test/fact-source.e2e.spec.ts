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

// SB-188: a fact names the page it was read on, where that is not its
// version's own. Every refusal is attempted against the database itself, and
// the rows are read back afterwards.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5466

let app: INestApplication
let prisma: PrismaService
let stopDatabase: () => Promise<void>

const NEXT_MONTH = new Date(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
const IN_FORCE = new Date('2020-01-01')

type Page = { sourceUrl: string; sourceName: string; verifiedAt: Date }

// Four different pages, so a fact given the wrong one cannot pass by accident.
const VERSION_PAGE: Page = { sourceUrl: 'https://version.example.gov/rule', sourceName: 'The rule page', verifiedAt: new Date('2026-09-10') }
const REGULATION: Page = { sourceUrl: 'https://regulation.example.gov/article-23', sourceName: 'The regulation, Article 23', verifiedAt: new Date('2026-09-14') }
const BURSA_VERSION_PAGE: Page = { sourceUrl: 'https://bursa.example.gov/rule', sourceName: 'The Bursa rule page', verifiedAt: new Date('2026-09-11') }
const BURSA_NOTICE: Page = { sourceUrl: 'https://bursa.example.gov/notice', sourceName: 'The Bursa notice', verifiedAt: new Date('2026-09-13') }

/** A page as the API names it. */
const cited = (page: Page) => ({ sourceUrl: page.sourceUrl, sourceName: page.sourceName, verifiedAt: page.verifiedAt.toISOString().slice(0, 10) })

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
  await prisma.region.create({ data: { code: 'TR-16', countryCode: 'tr', name: 'Bursa' } })
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

const graphql = (query: string, variables: Record<string, unknown> = {}) =>
  request(app.getHttpServer()).post('/graphql').send({ query, variables })

type SourcedFact = { key: string; ruleVersionId: string; sourceUrl: string; sourceName: string; verifiedAt: string }

const MOVE = `
  query Move($from: String!, $to: String!, $toResidenceRegions: [String!]) {
    move(from: $from, to: $to, toResidenceRegions: $toResidenceRegions) {
      obligationSlug
      to { ruleVersionId facts { key ruleVersionId sourceUrl sourceName verifiedAt } }
    }
  }
`

/** Turkey's answer for one obligation, to a reader arriving from Germany, fact by fact. */
const answerFor = async (slug: string, variables: Record<string, unknown> = {}) => {
  const response = await graphql(MOVE, { from: 'de', to: 'tr', ...variables })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  const entries: { obligationSlug: string; to: { ruleVersionId: string; facts: SourcedFact[] } | null }[] = response.body.data.move
  const to = entries.find((entry) => entry.obligationSlug === slug)?.to
  expect(to, `no answer for ${slug}`).toBeTruthy()
  return { ruleVersionId: to!.ruleVersionId, facts: Object.fromEntries(to!.facts.map((fact) => [fact.key, fact])) }
}

test("a fact read on its own page names it, and one read on its version's page names the version's, through move and a guide", async () => {
  const obligation = await prisma.obligation.create({ data: { slug: 'fact-source-national', kind: 'registration' } })
  await prisma.ruleVersion.create({
    data: {
      countryCode: 'tr',
      obligationId: obligation.id,
      validFrom: IN_FORCE,
      ...VERSION_PAGE,
      facts: {
        create: [
          { key: 'deadline', operator: 'within', numericValue: 20, unit: 'working days', ...REGULATION },
          { key: 'fine', numericValue: 814, currency: 'TRY' },
        ],
      },
    },
  })

  const { facts } = await answerFor('fact-source-national')
  expect(facts['deadline']).toMatchObject(cited(REGULATION))
  expect(facts['fine']).toMatchObject(cited(VERSION_PAGE))

  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'tr', slug: 'register-your-address' } } })
  await prisma.guideObligation.create({ data: { guideId: guide.id, obligationId: obligation.id, position: 9 } })

  const response = await graphql(
    `query G { guide(country: "tr", slug: "register-your-address") { obligations { slug facts { key sourceUrl sourceName verifiedAt } } } }`,
  )
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  const linked: { slug: string; facts: Omit<SourcedFact, 'ruleVersionId'>[] }[] = response.body.data.guide.obligations
  const shown = linked.find((entry) => entry.slug === 'fact-source-national')?.facts ?? []
  expect(Object.fromEntries(shown.map(({ key, ...page }) => [key, page]))).toEqual({ deadline: cited(REGULATION), fine: cited(VERSION_PAGE) })
})

test("a fact a Bursa answer inherits names the national version's page, not Bursa's", async () => {
  const obligation = await prisma.obligation.create({ data: { slug: 'fact-source-place', kind: 'registration' } })
  const national = await prisma.ruleVersion.create({
    data: {
      countryCode: 'tr',
      obligationId: obligation.id,
      validFrom: IN_FORCE,
      ...VERSION_PAGE,
      facts: {
        create: [
          { key: 'deadline', operator: 'within', numericValue: 20, unit: 'working days' },
          { key: 'office', textValue: 'Population directorate' },
        ],
      },
    },
  })
  const bursa = await prisma.ruleVersion.create({
    data: {
      countryCode: 'tr',
      obligationId: obligation.id,
      validFrom: IN_FORCE,
      ...BURSA_VERSION_PAGE,
      criteria: { create: [{ dimension: 'residenceRegion', value: 'TR-16' }] },
      facts: { create: [{ key: 'office', textValue: 'By appointment', ...BURSA_NOTICE }] },
    },
  })

  const answer = await answerFor('fact-source-place', { toResidenceRegions: ['TR-16'] })
  expect(answer.ruleVersionId).toBe(bursa.id)
  expect(answer.facts['office']).toEqual({ key: 'office', ruleVersionId: bursa.id, ...cited(BURSA_NOTICE) })
  expect(answer.facts['deadline']).toEqual({ key: 'deadline', ruleVersionId: national.id, ...cited(VERSION_PAGE) })
})

test("a started version's fact keeps the page it names", async () => {
  const obligation = await prisma.obligation.create({ data: { slug: 'fact-source-history', kind: 'registration' } })
  const version = await prisma.ruleVersion.create({
    data: {
      countryCode: 'tr',
      obligationId: obligation.id,
      validFrom: IN_FORCE,
      ...VERSION_PAGE,
      facts: { create: [{ key: 'deadline', operator: 'within', numericValue: 20, unit: 'working days', ...REGULATION }] },
    },
    include: { facts: true },
  })
  const deadline = version.facts[0]!

  await expect(prisma.ruleFact.update({ where: { id: deadline.id }, data: { sourceUrl: 'https://elsewhere.example.gov' } })).rejects.toThrow(/history/)
  await expect(prisma.ruleFact.update({ where: { id: deadline.id }, data: { sourceUrl: null, sourceName: null, verifiedAt: null } })).rejects.toThrow(
    /history/,
  )
  expect(await prisma.ruleFact.findUniqueOrThrow({ where: { id: deadline.id } })).toMatchObject({
    sourceUrl: REGULATION.sourceUrl,
    sourceName: REGULATION.sourceName,
    verifiedAt: REGULATION.verifiedAt,
  })
})

test('a fact is given the whole of a page or none of it', async () => {
  const obligation = await prisma.obligation.create({ data: { slug: 'fact-source-whole', kind: 'fee' } })
  const counts = () => Promise.all([prisma.ruleVersion.count(), prisma.ruleFact.count()])
  const before = await counts()

  // Written with its version, a fact with a URL and nothing else refuses the whole write.
  await expect(
    prisma.ruleVersion.create({
      data: {
        countryCode: 'tr',
        obligationId: obligation.id,
        validFrom: NEXT_MONTH,
        ...VERSION_PAGE,
        facts: { create: [{ key: 'fee', numericValue: 1, currency: 'TRY', sourceUrl: REGULATION.sourceUrl }] },
      },
    }),
  ).rejects.toThrow(/RuleFact_source_is_whole/)
  expect(await counts()).toEqual(before)

  // A draft's fact may still change, so this refusal is the constraint's, not history's.
  const draft = await prisma.ruleVersion.create({
    data: { countryCode: 'tr', obligationId: obligation.id, validFrom: NEXT_MONTH, ...VERSION_PAGE, facts: { create: [{ key: 'fee', numericValue: 1, currency: 'TRY' }] } },
    include: { facts: true },
  })
  const fee = draft.facts[0]!

  await expect(prisma.ruleFact.update({ where: { id: fee.id }, data: { sourceName: REGULATION.sourceName } })).rejects.toThrow(/RuleFact_source_is_whole/)
  expect(await prisma.ruleFact.findUniqueOrThrow({ where: { id: fee.id } })).toMatchObject({ sourceUrl: null, sourceName: null, verifiedAt: null })

  await prisma.ruleFact.update({ where: { id: fee.id }, data: { ...REGULATION } })
  expect(await prisma.ruleFact.findUniqueOrThrow({ where: { id: fee.id } })).toMatchObject({ sourceUrl: REGULATION.sourceUrl, sourceName: REGULATION.sourceName })
})
