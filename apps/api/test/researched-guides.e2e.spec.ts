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
import { loadResearchedGuides, RESEARCHED_GUIDES } from '../src/guide/researched-guides.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { RESEARCHED } from '../src/rules/research/countries.js'
import { loadResearchRules } from '../src/rules/research/load.js'
import { TURKEY } from '../src/rules/research/turkey.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-258: the guides written from the agreed research, on a database as a start without sample content leaves it:
// migrated, Turkey and Germany as bootstrap writes them, the research loaded, and no seed.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5501

let app: INestApplication
let prisma: PrismaService
let stopDatabase: () => Promise<void>

beforeAll(async () => {
  const database = await startPglite(PORT)
  stopDatabase = database.stop
  process.env.DATABASE_URL = database.url

  await promisify(execFile)(process.execPath, [createRequire(import.meta.url).resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: API,
    env: { ...process.env, DATABASE_URL: database.url },
    encoding: 'utf8',
  })

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = moduleRef.createNestApplication()
  await app.init()

  prisma = app.get(PrismaService)
  await prisma.country.createMany({
    data: [
      { code: 'tr', name: 'Turkey' },
      { code: 'de', name: 'Germany' },
    ],
    skipDuplicates: true,
  })
  await loadResearchRules(prisma, RESEARCHED)
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

const graphql = (query: string, variables: Record<string, unknown> = {}) =>
  request(app.getHttpServer()).post('/graphql').send({ query, variables })

const GUIDE = `
  query Guide($country: String!, $slug: String!, $reader: ReaderInput) {
    guide(country: $country, slug: $slug, reader: $reader) {
      title
      description
      verifiedAt
      sections { kind title body }
      sources { url name }
      obligations { slug reader { answer needs facts { key operator numericValue } } }
    }
  }
`

type Answer = { answer: string; needs: string[]; facts: { key: string; operator: string; numericValue: string | null }[] }

type Served = {
  title: string
  description: string | null
  verifiedAt: string
  sections: { kind: string; title: string | null; body: string | null }[]
  sources: { url: string; name: string }[]
  obligations: { slug: string; reader: Answer | null }[]
}

const guideFor = async (country: string, slug: string, reader?: Record<string, unknown>): Promise<Served> => {
  const response = await graphql(GUIDE, { country, slug, ...(reader ? { reader } : {}) })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  return response.body.data.guide
}

const rows = async () => ({
  tasks: await prisma.task.count(),
  taskTexts: await prisma.taskText.count(),
  areas: await prisma.category.count(),
  areaTexts: await prisma.categoryText.count(),
  guides: await prisma.guide.count(),
  guideTexts: await prisma.guideText.count(),
  sections: await prisma.guideSection.count(),
  sectionTexts: await prisma.guideSectionText.count(),
  sources: await prisma.guideSource.count(),
  links: await prisma.guideObligation.count(),
})

test("on a database no sample content has touched, the loader writes each researched guide's goal, area, text, sections, sources and links, and a second run changes nothing", async () => {
  expect(await prisma.task.count(), 'no sample content has run').toBe(0)
  expect(await loadResearchedGuides(prisma)).toEqual(
    RESEARCHED_GUIDES.map((researched) => `${researched.country}/${researched.guide.slug}`),
  )

  for (const researched of RESEARCHED_GUIDES) {
    const served = await guideFor(researched.country, researched.guide.slug)
    const label = `${researched.country}/${researched.guide.slug}`
    expect(served.title, label).toBe(researched.guide.en.title)
    expect(served.description, label).toBe(researched.guide.en.description)
    expect(served.verifiedAt, label).toBe(researched.guide.verifiedAt)
    expect(served.sections, label).toEqual(
      researched.detail.sections.map((section) => ({
        kind: section.kind,
        title: section.title?.en ?? null,
        body: section.body?.en ?? null,
      })),
    )
    expect(served.sources, label).toEqual(researched.detail.sources.map(({ url, name }) => ({ url, name })))
    // One link for each group, in the groups' order, every group's first duty present in the research.
    expect(
      served.obligations.map((obligation) => obligation.slug),
      label,
    ).toEqual(researched.obligations.map((group) => group[0]))
  }

  const areas = await graphql(
    `
      query Areas($country: String!) {
        categories(country: $country) {
          slug
          taskSlug
        }
      }
    `,
    { country: 'tr' },
  )
  expect(areas.body.data.categories).toEqual([{ slug: 'short-term-residence-permit', taskSlug: 'get-a-residence-permit' }])

  const before = await rows()
  await loadResearchedGuides(prisma)
  expect(await rows()).toEqual(before)
})

test("Turkey's residence permit guide answers the permit charge as none for a reader of Denmark, no rule for a reader of Iran, and asks a reader who has not said their nationality", async () => {
  const slug = 'pay-the-residence-permit-charge'
  const exempt = TURKEY.versions.find((version) => version.obligation === slug)
  if (!exempt) throw new Error("Turkey's file has no version of the permit charge")
  const chargeFor = async (reader: Record<string, unknown>) =>
    (await guideFor('tr', 'short-term-residence-permit', reader)).obligations.find((obligation) => obligation.slug === slug)?.reader

  expect(await chargeFor({ nationality: 'dk' })).toEqual({
    answer: 'answered',
    needs: [],
    facts: exempt.facts.map((fact) => ({
      key: fact.key,
      operator: fact.operator,
      numericValue: fact.numericValue === undefined ? null : String(fact.numericValue),
    })),
  })
  expect(await chargeFor({ nationality: 'ir' })).toMatchObject({ answer: 'noRule', needs: [], facts: [] })
  expect(await chargeFor({})).toMatchObject({ answer: 'needsDetail', needs: ['nationality'], facts: [] })
})

test("Germany's residence permit guide tells a visa-free reader of the United States the 90 days to apply inside Germany, and a visa-free reader of Brazil nothing of them", async () => {
  const permitFor = async (nationality: string) =>
    (await guideFor('de', 'residence-permit', { nationality, residenceStatuses: ['de.visa-free'] })).obligations.find(
      (obligation) => obligation.slug === 'get-a-residence-permit-as-a-skilled-worker-with-a-degree',
    )?.reader

  const american = await permitFor('us')
  expect(american?.answer).toBe('answered')
  expect(american?.facts.find((fact) => fact.key === 'applyInGermanyWithin')).toMatchObject({ operator: 'within', numericValue: '90' })

  const brazilian = await permitFor('br')
  expect(brazilian?.answer).toBe('answered')
  expect(brazilian?.facts.map((fact) => fact.key)).not.toContain('applyInGermanyWithin')
})
