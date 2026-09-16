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
import { COUNTRIES, seedContent } from '../src/sample-content.js'
import { TURKEY_SAMPLE } from '../prisma/sample-turkey.js'
import { linkObligationGroups } from '../src/guide/guide-fill.js'
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

  // SB-307: a guide can hold more than one section of a kind, so this names the one the fixture writes.
  const howTos = guide.sections.filter((s: { kind: string }) => s.kind === 'howToDoIt')
  expect(howTos, 'the fixture writes one how-to section').toHaveLength(1)
  const howTo = howTos[0]
  expect(howTo.steps.map((s: { position: number }) => s.position)).toEqual([0, 1, 2])
  expect(howTo.steps[0].title).toContain('tax number')
})

test('one section per position in a guide, refused by the database, and a kind may repeat (SB-307)', async () => {
  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'tr', slug: 'register-your-address' } } })
  const standing = await prisma.guideSection.findFirstOrThrow({ where: { guideId: guide.id }, orderBy: { position: 'asc' } })

  await expect(
    prisma.guideSection.create({ data: { guideId: guide.id, kind: 'commonProblems', position: standing.position } }),
  ).rejects.toThrow()

  const second = await prisma.guideSection.create({ data: { guideId: guide.id, kind: standing.kind, position: 99 } })
  await prisma.guideSection.delete({ where: { id: second.id } })
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
    `query G { guide(country: "tr", slug: "register-your-address") { obligations { resolution facts { key operator numericValue textValue } } } }`,
  )

  const obligation = response.body.data.guide.obligations[0]
  const facts = Object.fromEntries(
    obligation.facts.map((f: { key: string; operator: string; numericValue: string | null; textValue: string | null }) => [
      f.key,
      f.numericValue ?? f.textValue ?? f.operator,
    ]),
  )

  expect(obligation.resolution).toBe('general')
  // Turkey's own answer about the document is that it asks for none (SB-082).
  expect(facts).toEqual({ deadline: '20', requiredDocument: 'none' })
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

type Note = { ruleVersionId: string; text: string; locale: string; translationMissing: boolean }

test("a guide's obligation carries its rule's note in the language asked for", async () => {
  const notesIn = async (locale: string): Promise<Note[]> => {
    const response = await graphql(
      `query G { guide(country: "tr", slug: "register-your-address", locale: "${locale}") { obligations { notes { ruleVersionId text locale translationMissing } } } }`,
    )
    expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
    return response.body.data.guide.obligations[0].notes
  }

  const [english] = await notesIn('en-US')
  expect(english).toBeDefined()
  const texts = english ? await prisma.ruleText.findMany({ where: { ruleVersionId: english.ruleVersionId } }) : []
  const inEnglish = texts.find((text) => text.locale === 'en-US')
  const inPersian = texts.find((text) => text.locale === 'fa-IR')
  expect(inEnglish && inPersian, 'the seeded rule has a note in both languages').toBeTruthy()

  expect(english).toEqual({ ruleVersionId: inEnglish?.ruleVersionId, text: inEnglish?.notes, locale: 'en-US', translationMissing: false })
  expect(await notesIn('fa-IR')).toEqual([{ ruleVersionId: inPersian?.ruleVersionId, text: inPersian?.notes, locale: 'fa-IR', translationMissing: false }])
})

const FOR_READER = `
  query ForReader($country: String!, $slug: String!, $reader: ReaderInput) {
    guide(country: $country, slug: $slug, reader: $reader) {
      obligations {
        slug
        resolution
        facts { key numericValue }
        notes { text }
        reader { answer needs reason ruleVersionId facts { key numericValue currency } notes { text } }
      }
    }
  }
`

type ForReader = {
  slug: string
  resolution: string
  facts: { key: string; numericValue: string | null }[]
  notes: { text: string }[]
  reader: {
    answer: string
    needs: string[]
    reason: string | null
    ruleVersionId: string | null
    facts: { key: string; numericValue: string | null; currency: string | null }[]
    notes: { text: string }[]
  } | null
}

/** A guide's obligations asked for a reader, for a reader who said nothing with `{}`, or for nobody with the reader left out (SB-255). */
const obligationsFor = async (country: string, slug: string, reader?: Record<string, unknown> | null): Promise<ForReader[]> => {
  const response = await graphql(FOR_READER, { country, slug, ...(reader === undefined ? {} : { reader }) })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  return response.body.data.guide.obligations
}

const byKey = <T extends { key: string }>(facts: readonly T[]) => [...facts].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

test('a guide asked for a reader answers each linked obligation for that reader alone, and asked for nobody is the same for everyone', async () => {
  // The student-only obligation an earlier test links to the anmeldung guide.
  const scopedFor = async (reader?: Record<string, unknown> | null) =>
    (await obligationsFor('de', 'anmeldung', reader)).find((obligation) => obligation.slug === 'student-only-thing')

  expect(await scopedFor({})).toMatchObject({
    resolution: 'contextRequired',
    facts: [],
    notes: [],
    reader: { answer: 'needsDetail', needs: ['situation'], reason: null, ruleVersionId: null, facts: [], notes: [] },
  })

  const student = await scopedFor({ situation: 'student' })
  expect(student).toMatchObject({ resolution: 'contextRequired', facts: [], notes: [], reader: { answer: 'answered', needs: [] } })
  expect(student?.reader?.facts).toEqual([{ key: 'fee', numericValue: '50', currency: 'EUR' }])

  expect(await scopedFor({ situation: 'worker' })).toMatchObject({ facts: [], reader: { answer: 'noRule', needs: [], facts: [] } })

  // Left out and null are both nobody in particular: the version for everyone, and no reader.
  for (const reader of [undefined, null]) {
    const general = (await obligationsFor('de', 'anmeldung', reader)).find((obligation) => obligation.slug === 'register-your-address')
    expect(general?.reader, String(reader)).toBeNull()
    expect(byKey(general?.facts ?? []), String(reader)).toEqual([
      { key: 'deadline', numericValue: '14' },
      { key: 'requiredDocument', numericValue: null },
    ])
  }
})

test("asked for a reader who has not said where they work, a guide gives care insurance's question alone, not the national split beside it", async () => {
  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'de', slug: 'anmeldung' } } })
  const care = await prisma.obligation.findUniqueOrThrow({ where: { slug: 'pay-care-insurance' } })
  await prisma.guideObligation.create({ data: { guideId: guide.id, obligationId: care.id, position: 8 } })
  const careFor = async (reader?: Record<string, unknown>) =>
    (await obligationsFor('de', 'anmeldung', reader)).find((obligation) => obligation.slug === 'pay-care-insurance')

  expect(await careFor({})).toMatchObject({
    resolution: 'general',
    facts: [],
    notes: [],
    reader: { answer: 'needsDetail', needs: ['workRegion'], facts: [], notes: [] },
  })

  const inSaxony = await careFor({ workRegions: ['DE-SN'] })
  expect(inSaxony).toMatchObject({ facts: [], notes: [], reader: { answer: 'answered' } })
  expect(byKey(inSaxony?.reader?.facts ?? [])).toEqual([
    { key: 'employeeShare', numericValue: '2.3', currency: null },
    { key: 'employerShare', numericValue: '1.3', currency: null },
  ])

  const everyone = await careFor()
  expect(everyone?.reader).toBeNull()
  expect(byKey(everyone?.facts ?? [])).toEqual([
    { key: 'employeeShare', numericValue: '1.8' },
    { key: 'employerShare', numericValue: '1.8' },
  ])
})

test('a reader naming a place that does not exist is refused, on a guide that links rules and on one that links none', async () => {
  for (const [country, slug] of [
    ['de', 'anmeldung'],
    ['tr', 'sim-card'],
  ] as const) {
    const response = await graphql(FOR_READER, { country, slug, reader: { residenceRegions: ['XX-99'] } })
    expect(response.body.errors?.[0]?.extensions?.code, `${country} ${slug}`).toBe('BAD_USER_INPUT')
  }
  const known = await graphql(FOR_READER, { country: 'tr', slug: 'sim-card', reader: { residenceRegions: ['DE-BE'] } })
  expect(known.body.errors, JSON.stringify(known.body.errors)).toBeUndefined()
})

test('each address guide links one address duty, and sample content run again keeps a link it does not name', async () => {
  const duties = (obligations: readonly ForReader[]) =>
    obligations.map((obligation) => obligation.slug).filter((slug) => slug === 'report-your-address' || slug === 'register-your-address')
  expect(duties(await obligationsFor('tr', 'register-your-address'))).toEqual(['register-your-address'])
  expect(duties(await obligationsFor('de', 'anmeldung'))).toEqual(['register-your-address'])

  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'de', slug: 'anmeldung' } } })
  const insurance = await prisma.obligation.findUniqueOrThrow({ where: { slug: 'hold-health-insurance' } })
  await prisma.guideObligation.create({ data: { guideId: guide.id, obligationId: insurance.id, position: 9 } })
  await seedContent(prisma, [TURKEY_SAMPLE, ...COUNTRIES])

  const after = await obligationsFor('de', 'anmeldung')
  expect(after.map((obligation) => obligation.slug)).toContain('hold-health-insurance')
  expect(duties(after)).toEqual(['register-your-address'])
})

/** A guide's links, by the obligation's slug, in position order. */
const linksOf = async (guideId: string) =>
  (await prisma.guideObligation.findMany({ where: { guideId }, include: { obligation: true }, orderBy: { position: 'asc' } })).map(
    (link) => ({
      slug: link.obligation.slug,
      position: link.position,
    }),
  )

test("a guide's obligation groups each link their first obligation the database has at the group's index, and a preferred one named later takes its group's place", async () => {
  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'tr', slug: 'sim-card' } } })
  expect(await linksOf(guide.id)).toEqual([])

  await linkObligationGroups(prisma, guide.id, [['no-such-duty', 'get-a-tax-number'], ['hold-health-insurance']])
  expect(await linksOf(guide.id)).toEqual([
    { slug: 'get-a-tax-number', position: 0 },
    { slug: 'hold-health-insurance', position: 1 },
  ])

  await linkObligationGroups(prisma, guide.id, [['get-a-residence-permit', 'get-a-tax-number'], ['hold-health-insurance']])
  expect(await linksOf(guide.id)).toEqual([
    { slug: 'get-a-residence-permit', position: 0 },
    { slug: 'hold-health-insurance', position: 1 },
  ])

  await prisma.guideObligation.deleteMany({ where: { guideId: guide.id } })
})

test("a slug named in two of a guide's groups is refused, and so is a link the groups do not name sitting where a group links, writing nothing", async () => {
  const guide = await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: 'tr', slug: 'sim-card' } } })
  await expect(linkObligationGroups(prisma, guide.id, [['get-a-tax-number'], ['get-a-tax-number']])).rejects.toThrow(/more than one/)

  const blocked = await prisma.obligation.findUniqueOrThrow({ where: { slug: 'open-a-blocked-account' } })
  await prisma.guideObligation.create({ data: { guideId: guide.id, obligationId: blocked.id, position: 0 } })
  await expect(linkObligationGroups(prisma, guide.id, [['get-a-tax-number']])).rejects.toThrow(/do not name/)
  expect(await linksOf(guide.id)).toEqual([{ slug: 'open-a-blocked-account', position: 0 }])

  await prisma.guideObligation.deleteMany({ where: { guideId: guide.id } })
})
