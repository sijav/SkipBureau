import { PrismaPg } from '@prisma/adapter-pg'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { GERMANY_SAMPLE } from '../prisma/sample-germany.js'
import { TURKEY_SAMPLE } from '../prisma/sample-turkey.js'
import { seed } from '../prisma/seed.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { loadResearchedGuides, RESEARCHED_GUIDES } from '../src/guide/researched-guides.js'
import { RESEARCHED } from '../src/rules/research/countries.js'
import { loadResearchRules } from '../src/rules/research/load.js'
import { GERMANY_SAMPLE_SLUGS, retireSample, seedContent, TURKEY_SAMPLE_SLUGS } from '../src/sample-content.js'
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

const rowsOf = async (countryCode: string) => ({
  guides: (await prisma.guide.findMany({ where: { countryCode }, select: { slug: true } })).map((row) => row.slug).sort(),
  areas: (await prisma.category.findMany({ where: { countryCode }, select: { slug: true } })).map((row) => row.slug).sort(),
  questions: (await prisma.question.findMany({ where: { countryCode }, select: { slug: true } })).map((row) => row.slug).sort(),
})

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

// SB-301: Germany's sample is one area and one guide, and the guide's row belongs to the researched loader since
// SB-299, so its list names the area and no guide at all.

test("Germany's list is its fixture's areas, and no guide, because the researched loader owns the one it has", () => {
  const owned = new Set(RESEARCHED_GUIDES.filter((guide) => guide.country === 'de').flatMap((guide) => [guide.guide.slug, guide.area.slug]))
  expect([...GERMANY_SAMPLE_SLUGS.areas].sort()).toEqual(GERMANY_SAMPLE.categories.map((area) => area.slug).sort())
  expect([...GERMANY_SAMPLE_SLUGS.guides]).toEqual(GERMANY_SAMPLE.guides.map((guide) => guide.slug).filter((slug) => !owned.has(slug)))
  expect(GERMANY_SAMPLE.guides.map((guide) => guide.slug)).toEqual(['anmeldung'])
  expect([...GERMANY_SAMPLE_SLUGS.questions]).toEqual([])
})

test("a list naming Germany's Anmeldung guide is refused, and nothing is deleted", async () => {
  const before = await rowsOf('de')
  await expect(retireSample(prisma, 'de', { ...GERMANY_SAMPLE_SLUGS, guides: ['anmeldung'] })).rejects.toThrow(/anmeldung/)
  expect(await rowsOf('de')).toEqual(before)
})

test("the retirement deletes Germany's sample area, keeps every researched row, and deletes nothing a second time", async () => {
  const researched = RESEARCHED_GUIDES.filter((guide) => guide.country === 'de')

  expect(await retireSample(prisma, 'de', GERMANY_SAMPLE_SLUGS)).toEqual({ questions: 0, guides: 0, areas: GERMANY_SAMPLE_SLUGS.areas.length })

  expect(await rowsOf('de')).toEqual({
    guides: researched.map((guide) => guide.guide.slug).sort(),
    areas: researched.map((guide) => guide.area.slug).sort(),
    questions: [],
  })
  expect(await retireSample(prisma, 'de', GERMANY_SAMPLE_SLUGS)).toEqual({ questions: 0, guides: 0, areas: 0 })
})

test('on the order a deployed database goes through, the Anmeldung row survives the retirement and the loader takes it back', async () => {
  // The plan check asked for this one: the entry retires before load-researched-guides.js runs, so the legacy state is
  // a sample guide sitting in first-week when its area is deleted. Guide.categoryId is SetNull, so it is uncategorised
  // for that moment, not gone, and the loader puts it back where it belongs.
  await seedContent(prisma, [GERMANY_SAMPLE])
  const area = await prisma.category.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'de', slug: 'first-week' } } })
  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'de', slug: 'anmeldung' } } })
  await prisma.guide.update({ where: { id: guide.id }, data: { categoryId: area.id } })
  await prisma.guideText.update({
    where: { guideId_locale: { guideId: guide.id, locale: 'en-US' } },
    data: { quickAnswer: 'Book a Buergeramt appointment.', cost: 'Free' },
  })

  expect(await retireSample(prisma, 'de', GERMANY_SAMPLE_SLUGS)).toEqual({ questions: 0, guides: 0, areas: 1 })
  const between = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'de', slug: 'anmeldung' } } })
  expect(between.id, 'the same row, with no area for the moment').toBe(guide.id)
  expect(between.categoryId).toBeNull()

  await loadResearchedGuides(prisma)
  const after = await prisma.guide.findUniqueOrThrow({
    where: { countryCode_slug: { countryCode: 'de', slug: 'anmeldung' } },
    include: { category: { select: { slug: true } }, texts: { where: { locale: 'en-US' } } },
  })
  expect(after.id).toBe(guide.id)
  expect(after.category?.slug).toBe('anmeldung')
  expect([after.texts[0]?.quickAnswer, after.texts[0]?.cost]).toEqual([null, null])
  expect(await prisma.category.count({ where: { countryCode: 'de', slug: 'first-week' } })).toBe(0)
})
