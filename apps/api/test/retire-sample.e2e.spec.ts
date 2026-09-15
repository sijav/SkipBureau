import { PrismaPg } from '@prisma/adapter-pg'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { TURKEY_SAMPLE } from '../prisma/sample-turkey.js'
import { seed } from '../prisma/seed.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { loadResearchedGuides, RESEARCHED_GUIDES } from '../src/guide/researched-guides.js'
import { RESEARCHED } from '../src/rules/research/countries.js'
import { loadResearchRules } from '../src/rules/research/load.js'
import { retireSample, TURKEY_SAMPLE_SLUGS } from '../src/sample-content.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-282: on a database as a deployed one was before it, Turkey's sample filled, the research and the researched guides
// loaded, and a visitor's suggestion on a sample guide and on a researched one, the retirement deletes Turkey's sample
// rows and the suggestion on them, and nothing the research wrote.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5503

let prisma: PrismaClient
let stopDatabase: () => Promise<void>

beforeAll(async () => {
  const database = await startPglite(PORT)
  stopDatabase = database.stop
  await promisify(execFile)(process.execPath, [createRequire(import.meta.url).resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: API,
    env: { ...process.env, DATABASE_URL: database.url },
    encoding: 'utf8',
  })
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.url }) })
  await seed(prisma)
  await loadResearchRules(prisma, RESEARCHED)
  await loadResearchedGuides(prisma)
}, 180_000)

afterAll(async () => {
  await prisma?.$disconnect()
  await stopDatabase?.()
})

const guideId = async (countryCode: string, slug: string) =>
  (await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode, slug } }, select: { id: true } })).id

const turkish = async () => ({
  guides: (await prisma.guide.findMany({ where: { countryCode: 'tr' }, select: { slug: true } })).map((row) => row.slug).sort(),
  areas: (await prisma.category.findMany({ where: { countryCode: 'tr' }, select: { slug: true } })).map((row) => row.slug).sort(),
  questions: (await prisma.question.findMany({ where: { countryCode: 'tr' }, select: { slug: true } })).map((row) => row.slug).sort(),
})

test("the lists are Turkey's fixture, less the guide the researched loader owns", () => {
  const owned = new Set(RESEARCHED_GUIDES.filter((guide) => guide.country === 'tr').flatMap((guide) => [guide.guide.slug, guide.area.slug]))
  expect([...TURKEY_SAMPLE_SLUGS.guides].sort()).toEqual(
    TURKEY_SAMPLE.guides
      .map((guide) => guide.slug)
      .filter((slug) => !owned.has(slug))
      .sort(),
  )
  expect([...TURKEY_SAMPLE_SLUGS.areas].sort()).toEqual(TURKEY_SAMPLE.categories.map((area) => area.slug).sort())
  expect([...TURKEY_SAMPLE_SLUGS.questions].sort()).toEqual((TURKEY_SAMPLE.questions ?? []).map((question) => question.slug).sort())
})

test('a list naming a guide the researched loader writes is refused, and nothing is deleted', async () => {
  const before = await turkish()
  await expect(
    retireSample(prisma, 'tr', { ...TURKEY_SAMPLE_SLUGS, guides: [...TURKEY_SAMPLE_SLUGS.guides, 'register-your-address'] }),
  ).rejects.toThrow(/register-your-address/)
  expect(await turkish()).toEqual(before)
})

test("the retirement deletes Turkey's sample areas, guides and questions and the suggestion on a sample guide, keeps every researched row and Germany's sample, and deletes nothing a second time", async () => {
  await prisma.proposal.create({
    data: { guideId: await guideId('tr', 'sim-card'), locale: 'en-US', change: 'A correction to the sample.' },
  })
  await prisma.proposal.create({
    data: { guideId: await guideId('tr', 'short-term-residence-permit'), locale: 'en-US', change: 'A correction to the research.' },
  })
  const researched = RESEARCHED_GUIDES.filter((guide) => guide.country === 'tr')

  expect(await retireSample(prisma, 'tr', TURKEY_SAMPLE_SLUGS)).toEqual({
    questions: TURKEY_SAMPLE_SLUGS.questions.length,
    guides: TURKEY_SAMPLE_SLUGS.guides.length,
    areas: TURKEY_SAMPLE_SLUGS.areas.length,
  })

  expect(await turkish()).toEqual({
    guides: researched.map((guide) => guide.guide.slug).sort(),
    areas: researched.map((guide) => guide.area.slug).sort(),
    questions: [],
  })
  expect(await prisma.proposal.findMany({ select: { change: true } })).toEqual([{ change: 'A correction to the research.' }])
  expect(await prisma.guide.count({ where: { countryCode: 'de', slug: 'anmeldung' } })).toBe(1)

  expect(await retireSample(prisma, 'tr', TURKEY_SAMPLE_SLUGS)).toEqual({ questions: 0, guides: 0, areas: 0 })
})
