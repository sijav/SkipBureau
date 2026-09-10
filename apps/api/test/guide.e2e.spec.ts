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

/**
 * Country is a dimension, and this is what says so.
 *
 * Two countries, one task shared between them. A test that only checked two
 * rows existed would pass a schema that duplicated the global task per
 * country, which is the exact mistake the model is shaped to avoid.
 */

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5497

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

test('each country returns only its own guides, in both directions', async () => {
  const query = `query G($c: String!) { guides(country: $c) { slug countryCode } }`

  const turkish = await graphql(query, { c: 'tr' })
  const german = await graphql(query, { c: 'de' })

  expect(turkish.body.errors, JSON.stringify(turkish.body.errors)).toBeUndefined()

  const trSlugs = turkish.body.data.guides.map((g: { slug: string }) => g.slug)
  const deSlugs = german.body.data.guides.map((g: { slug: string }) => g.slug)

  expect(trSlugs).toContain('register-your-address')
  expect(trSlugs).not.toContain('anmeldung')
  expect(deSlugs).toContain('anmeldung')
  expect(deSlugs).not.toContain('register-your-address')

  // Not merely "two exist": every row a country returns is its own.
  for (const guide of [...turkish.body.data.guides]) expect(guide.countryCode).toBe('tr')
  for (const guide of [...german.body.data.guides]) expect(guide.countryCode).toBe('de')
})

test('a task is shared between countries, not duplicated per country', async () => {
  // The trap this model exists to avoid. "Getting settled" is the same
  // intention in Turkey and Germany; only what it involves differs.
  const response = await graphql(`{ tasks { slug title } }`)
  const slugs = response.body.data.tasks.map((t: { slug: string }) => t.slug)

  expect(slugs).toContain('getting-settled')
  expect(new Set(slugs).size).toBe(slugs.length)

  const rows = await prisma.task.findMany({ where: { slug: 'getting-settled' } })
  expect(rows, 'the shared task was duplicated per country').toHaveLength(1)

  // And both countries reach it.
  const trCategories = await graphql(`query C($c: String!) { categories(country: $c) { slug taskSlug } }`, { c: 'tr' })
  const deCategories = await graphql(`query C($c: String!) { categories(country: $c) { slug taskSlug } }`, { c: 'de' })

  expect(trCategories.body.data.categories.map((c: { taskSlug: string }) => c.taskSlug)).toContain('getting-settled')
  expect(deCategories.body.data.categories.map((c: { taskSlug: string }) => c.taskSlug)).toContain('getting-settled')
})

test('adding a third country needs rows only, no code', async () => {
  // The exit condition, done the way a person would do it: insert, then browse.
  await prisma.country.create({ data: { code: 'pt', name: 'Portugal' } })
  const task = await prisma.task.findUniqueOrThrow({ where: { slug: 'getting-settled' } })
  const category = await prisma.category.create({
    data: { countryCode: 'pt', taskId: task.id, slug: 'first-week', position: 0 },
  })
  await prisma.categoryText.create({ data: { categoryId: category.id, locale: 'en-US', title: 'Your first week' } })
  const guide = await prisma.guide.create({
    data: { countryCode: 'pt', categoryId: category.id, slug: 'nif', verifiedAt: new Date('2026-09-10') },
  })
  await prisma.guideText.create({ data: { guideId: guide.id, locale: 'en-US', title: 'Get a NIF' } })

  const response = await graphql(`query G($c: String!) { guides(country: $c) { slug title } }`, { c: 'pt' })

  expect(response.body.errors).toBeUndefined()
  expect(response.body.data.guides).toEqual([{ slug: 'nif', title: 'Get a NIF' }])
})

test('a guide renders in Persian where it exists', async () => {
  const response = await graphql(
    `query G { guide(country: "tr", slug: "register-your-address", locale: "fa-IR") { title locale translationMissing } }`,
  )

  expect(response.body.data.guide.locale).toBe('fa-IR')
  expect(response.body.data.guide.translationMissing).toBe(false)
  expect(response.body.data.guide.title).toBe('ثبت نشانی محل سکونت')
})

test('a guide with no Persian says so rather than rendering blank', async () => {
  // The German guide is deliberately English only. A Persian reader gets the
  // English, and a flag saying that is what happened. What the page then tells
  // them is SB-049; making it impossible to know would have been the defect.
  const response = await graphql(
    `query G { guide(country: "de", slug: "anmeldung", locale: "fa-IR") { title locale translationMissing } }`,
  )

  expect(response.body.data.guide.translationMissing).toBe(true)
  expect(response.body.data.guide.locale).toBe('en-US')
  expect(response.body.data.guide.title).toBe('Register your address')
})

test('a deliberately empty field is not the same as a missing translation', async () => {
  // The reason no reader-facing field lives on the Guide table.
  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'de', slug: 'anmeldung' } } })
  await prisma.guideText.create({ data: { guideId: guide.id, locale: 'fa-IR', title: 'ثبت نشانی', quickAnswer: null } })

  const response = await graphql(
    `query G { guide(country: "de", slug: "anmeldung", locale: "fa-IR") { title quickAnswer translationMissing } }`,
  )

  expect(response.body.data.guide.translationMissing).toBe(false)
  expect(response.body.data.guide.quickAnswer).toBeNull()
})

test('a guide renders its linked obligation facts rather than restating them', async () => {
  // The prose explains the rule; the deadline comes from the rule. Otherwise
  // an editor retypes 20 days into a sentence and it goes stale on its own.
  const response = await graphql(
    `query G { guide(country: "tr", slug: "register-your-address") { obligations { slug facts { key numericValue unit } } } }`,
  )

  const obligation = response.body.data.guide.obligations[0]
  expect(obligation.slug).toBe('register-your-address')

  const deadline = obligation.facts.find((f: { key: string }) => f.key === 'deadline')
  expect(deadline.numericValue).toBe('20')
  expect(deadline.unit).toBe('days')
})

test('sections and steps come back in the order the design draws them', async () => {
  const response = await graphql(
    `query G { guide(country: "tr", slug: "register-your-address") { verifiedAt sections { kind position steps { position title } } } }`,
  )

  const guide = response.body.data.guide
  expect(guide.verifiedAt).toBe('2026-09-10')

  const positions = guide.sections.map((s: { position: number }) => s.position)
  expect(positions).toEqual([...positions].sort((a, b) => a - b))

  const howTo = guide.sections.find((s: { kind: string }) => s.kind === 'howToDoIt')
  expect(howTo.steps.map((s: { position: number }) => s.position)).toEqual([0, 1, 2])
  expect(howTo.steps[0].title).toContain('tax number')
})

test('one section of each kind per guide, refused by the database', async () => {
  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'tr', slug: 'register-your-address' } } })

  await expect(
    prisma.guideSection.create({ data: { guideId: guide.id, kind: 'howToDoIt', position: 9 } }),
  ).rejects.toThrow()
})

test('a guide we do not have is null, not an error', async () => {
  const response = await graphql(`query G { guide(country: "tr", slug: "nope") { slug } }`)

  expect(response.body.errors).toBeUndefined()
  expect(response.body.data.guide).toBeNull()
})

test('a German guide shows German facts, never the Turkish ones', async () => {
  // Both countries have an open version of register-your-address. Without a
  // country filter the include returns whichever the database ordered first.
  const response = await graphql(
    `query G { guide(country: "de", slug: "anmeldung") { obligations { slug resolution facts { key numericValue unit textValue } } } }`,
  )

  const obligation = response.body.data.guide.obligations[0]
  const facts = Object.fromEntries(
    obligation.facts.map((f: { key: string; numericValue: string | null; textValue: string | null }) => [
      f.key,
      f.numericValue ?? f.textValue,
    ]),
  )

  // The whole fact set, not only the one that differs, because a leak that
  // brought the right deadline and the wrong document would pass a narrower
  // assertion.
  expect(obligation.resolution).toBe('general')
  expect(facts).toEqual({ deadline: '14', requiredDocument: 'Wohnungsgeberbestaetigung' })
})

test('and the Turkish guide shows the Turkish ones, never the German document', async () => {
  const response = await graphql(
    `query G { guide(country: "tr", slug: "register-your-address") { obligations { resolution facts { key numericValue textValue } } } }`,
  )

  const obligation = response.body.data.guide.obligations[0]
  const facts = Object.fromEntries(
    obligation.facts.map((f: { key: string; numericValue: string | null; textValue: string | null }) => [
      f.key,
      f.numericValue ?? f.textValue,
    ]),
  )

  expect(obligation.resolution).toBe('general')
  expect(facts).toEqual({ deadline: '20' })
})

test('a rule that starts next year is not what the guide shows today', async () => {
  // The fixture needs its own obligation: adding a future general version
  // beside the current one would overlap, and this repository's own trigger
  // refuses that. So the successor closes nothing because there is nothing to
  // close.
  const obligation = await prisma.obligation.create({ data: { slug: 'renew-your-permit', kind: 'permit' } })
  const guide = await prisma.guide.findUniqueOrThrow({
    where: { countryCode_slug: { countryCode: 'tr', slug: 'register-your-address' } },
  })
  await prisma.guideObligation.create({ data: { guideId: guide.id, obligationId: obligation.id, position: 1 } })

  await prisma.ruleVersion.create({
    data: {
      countryCode: 'tr',
      obligationId: obligation.id,
      validFrom: new Date('2099-01-01'),
      sourceUrl: 'https://example.gov',
      sourceName: 'test',
      verifiedAt: new Date('2026-09-10'),
      facts: { create: [{ key: 'fee', numericValue: 999, currency: 'TRY' }] },
    },
  })

  const response = await graphql(
    `query G { guide(country: "tr", slug: "register-your-address") { obligations { slug resolution facts { key } } } }`,
  )

  const future = response.body.data.guide.obligations.find(
    (o: { slug: string }) => o.slug === 'renew-your-permit',
  )

  expect(future.facts, 'a rule starting in 2099 was served as current').toEqual([])
  // And it says why it is empty, rather than looking like nothing is required.
  expect(future.resolution).toBe('contextRequired')
})

test('an obligation with only a scoped version asks for context rather than guessing', async () => {
  // One student-only rule is not a general answer just because it is the only
  // record. Showing it would tell a worker a student's rule, silently.
  const obligation = await prisma.obligation.create({ data: { slug: 'student-only-thing', kind: 'registration' } })
  const guide = await prisma.guide.findUniqueOrThrow({
    where: { countryCode_slug: { countryCode: 'de', slug: 'anmeldung' } },
  })
  await prisma.guideObligation.create({ data: { guideId: guide.id, obligationId: obligation.id, position: 2 } })

  await prisma.ruleVersion.create({
    data: {
      countryCode: 'de',
      obligationId: obligation.id,
      validFrom: new Date('2020-01-01'),
      sourceUrl: 'https://example.gov',
      sourceName: 'test',
      verifiedAt: new Date('2026-09-10'),
      criteria: { create: [{ dimension: 'situation', value: 'student' }] },
      facts: { create: [{ key: 'fee', numericValue: 50, currency: 'EUR' }] },
    },
  })

  const response = await graphql(
    `query G { guide(country: "de", slug: "anmeldung") { obligations { slug resolution facts { key } } } }`,
  )

  const scoped = response.body.data.guide.obligations.find((o: { slug: string }) => o.slug === 'student-only-thing')

  expect(scoped.resolution).toBe('contextRequired')
  expect(scoped.facts, "a student's rule was shown as everyone's").toEqual([])
})
