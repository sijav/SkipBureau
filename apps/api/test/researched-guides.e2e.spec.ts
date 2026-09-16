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
import { loadResearchedGuides, RESEARCHED_GUIDES, type ResearchedGuide } from '../src/guide/researched-guides.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { RESEARCHED } from '../src/rules/research/countries.js'
import { loadResearchRules } from '../src/rules/research/load.js'
import { TURKEY } from '../src/rules/research/turkey.js'
import { seedContent } from '../src/sample-content.js'
import { TURKEY_SAMPLE } from '../prisma/sample-turkey.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-258: the guides written from the agreed research, on a database as a start without sample content leaves it:
// migrated, Turkey and Germany as bootstrap writes them, the research loaded, and no seed. The last test then runs
// sample content first, as a deployed database had it, and takes its address guide over (SB-281).

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
  const byArea = (a: { slug: string }, b: { slug: string }) => a.slug.localeCompare(b.slug)
  expect([...areas.body.data.categories].sort(byArea)).toEqual(
    RESEARCHED_GUIDES.filter((researched) => researched.country === 'tr')
      .map((researched) => ({ slug: researched.area.slug, taskSlug: researched.task }))
      .sort(byArea),
  )

  const before = await rows()
  await loadResearchedGuides(prisma)
  expect(await rows()).toEqual(before)
})

test("a later start serves what the file now says: a section's new title and body, a source and a group taken out, and a link the file does not name replaced, with no row of the old left", async () => {
  const turkish = RESEARCHED_GUIDES.find(
    (researched) => researched.country === 'tr' && researched.guide.slug === 'short-term-residence-permit',
  )
  const german = RESEARCHED_GUIDES.find((researched) => researched.country === 'de')
  const [first, ...rest] = turkish?.detail.sections ?? []
  if (!turkish || !german || !first) throw new Error("RESEARCHED_GUIDES no longer has Turkey's residence permit guide and a German guide")
  const changed: ResearchedGuide = {
    ...turkish,
    detail: {
      ...turkish.detail,
      sections: [{ ...first, title: { en: 'A title changed since.' }, body: { en: 'A body changed since.' } }, ...rest],
      sources: turkish.detail.sources.slice(0, -1),
    },
    obligations: turkish.obligations.slice(0, 1),
  }

  try {
    await loadResearchedGuides(prisma)
    await loadResearchedGuides(
      prisma,
      RESEARCHED_GUIDES.map((researched) => (researched === turkish ? changed : researched)),
    )

    const served = await guideFor('tr', turkish.guide.slug)
    expect(served.sections).toEqual(
      changed.detail.sections.map((section) => ({ kind: section.kind, title: section.title?.en ?? null, body: section.body?.en ?? null })),
    )
    expect(served.sources).toEqual(changed.detail.sources.map(({ url, name }) => ({ url, name })))
    expect(served.obligations.map((obligation) => obligation.slug)).toEqual(changed.obligations.map((group) => group[0]))

    const { id: guideId } = await prisma.guide.findUniqueOrThrow({
      where: { countryCode_slug: { countryCode: 'tr', slug: turkish.guide.slug } },
    })
    expect({
      sections: await prisma.guideSection.count({ where: { guideId } }),
      sectionTexts: await prisma.guideSectionText.count({ where: { section: { guideId } } }),
      sources: await prisma.guideSource.count({ where: { guideId } }),
      links: await prisma.guideObligation.count({ where: { guideId } }),
    }).toEqual({
      sections: changed.detail.sections.length,
      sectionTexts: changed.detail.sections.length,
      sources: changed.detail.sources.length,
      links: changed.obligations.length,
    })

    // A link to a duty the German file does not name, written by hand where its group links.
    const { id: germanId } = await prisma.guide.findUniqueOrThrow({
      where: { countryCode_slug: { countryCode: 'de', slug: german.guide.slug } },
    })
    const stranger = await prisma.obligation.findFirstOrThrow({ where: { slug: { notIn: german.obligations.flat() } } })
    await prisma.guideObligation.create({ data: { guideId: germanId, obligationId: stranger.id, position: 0 } })
    await expect(loadResearchedGuides(prisma)).resolves.toEqual(
      RESEARCHED_GUIDES.map((researched) => `${researched.country}/${researched.guide.slug}`),
    )
    expect((await guideFor('de', german.guide.slug)).obligations.map((obligation) => obligation.slug)).toEqual(
      german.obligations.map((group) => group[0]),
    )
    expect(await prisma.guideObligation.count({ where: { guideId: germanId } })).toBe(german.obligations.length)
  } finally {
    // The file again, so the tests after this one read its rows whatever failed above.
    await loadResearchedGuides(prisma)
  }
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

test('a start after sample content takes the sample address guide over in its own row: the same id, the researched area, English only, and nothing of the sample left', async () => {
  // SB-281: a deployed database had the sample address guide before the research wrote one under its slug.
  const address = RESEARCHED_GUIDES.find((researched) => researched.country === 'tr' && researched.guide.slug === 'register-your-address')
  if (!address) throw new Error('RESEARCHED_GUIDES has no Turkish address guide')
  const where = { countryCode_slug: { countryCode: 'tr', slug: address.guide.slug } }

  await prisma.guide.deleteMany({ where: { countryCode: 'tr', slug: address.guide.slug } })
  await seedContent(prisma, [TURKEY_SAMPLE])
  const sample = await prisma.guide.findUniqueOrThrow({ where, include: { texts: true, sections: { include: { steps: true } } } })
  expect(sample.texts.map((text) => text.locale).sort(), 'the sample guide as sample content writes it').toEqual(['en-US', 'fa-IR'])
  expect(sample.sections.flatMap((section) => section.steps).length, 'the sample guide as sample content writes it').toBeGreaterThan(0)

  await loadResearchedGuides(prisma)

  const taken = await prisma.guide.findUniqueOrThrow({
    where,
    include: { category: true, texts: true, options: true, relatedTo: true, sections: { include: { steps: true } } },
  })
  expect(taken.id, 'the same row').toBe(sample.id)
  expect(taken.category?.slug).toBe(address.area.slug)
  expect(taken.texts.map(({ locale, quickAnswer, cost, time }) => ({ locale, quickAnswer, cost, time }))).toEqual([
    { locale: 'en-US', quickAnswer: null, cost: null, time: null },
  ])
  expect(taken.sections.flatMap((section) => section.steps)).toEqual([])
  expect(taken.options).toEqual([])
  expect(taken.relatedTo).toEqual([])

  const served = await guideFor('tr', address.guide.slug)
  expect(served.title).toBe(address.guide.en.title)
  expect(served.sections).toEqual(
    address.detail.sections.map((section) => ({ kind: section.kind, title: section.title?.en ?? null, body: section.body?.en ?? null })),
  )
  expect(served.sources).toEqual(address.detail.sources.map(({ url, name }) => ({ url, name })))
})

// SB-307: a guide's sections are ordered rows, so a document that says something twice keeps both of its headings.

/** One researched guide rewritten with the sections given, so a load can be watched against a file of our own making. */
const withSections = (sections: ResearchedGuide['detail']['sections']): ResearchedGuide => {
  const first = RESEARCHED_GUIDES[0]
  if (!first) throw new Error('RESEARCHED_GUIDES is empty')
  return { ...first, detail: { ...first.detail, sections } }
}

test("a guide keeps a section for every lead its file has, two of one kind included, in the file's order", async () => {
  const twice = withSections([
    { kind: 'importantToKnow', title: { en: 'The first thing to know.' }, body: { en: 'One.' } },
    { kind: 'importantToKnow', title: { en: 'The second thing to know.' }, body: { en: 'Two.' } },
  ])

  try {
    await loadResearchedGuides(prisma, [twice])
    const served = await guideFor(twice.country, twice.guide.slug)
    expect(served.sections).toEqual([
      { kind: 'importantToKnow', title: 'The first thing to know.', body: 'One.' },
      { kind: 'importantToKnow', title: 'The second thing to know.', body: 'Two.' },
    ])

    const before = await rows()
    await loadResearchedGuides(prisma, [twice])
    expect(await rows(), 'a second load of the same file changes nothing').toEqual(before)
  } finally {
    await loadResearchedGuides(prisma)
  }
})

test('a file that reorders its sections is followed, and a language it does not write is left behind by neither', async () => {
  const sections: ResearchedGuide['detail']['sections'] = [
    { kind: 'beforeYouStart', title: { en: 'What to do first.' }, body: { en: 'First.' } },
    { kind: 'commonProblems', title: { en: 'What goes wrong.' }, body: { en: 'Second.' } },
  ]
  const one = withSections(sections)
  const other = withSections([...sections].reverse())

  try {
    await loadResearchedGuides(prisma, [one])
    const guideId = (await prisma.guide.findUniqueOrThrow({ where: { countryCode_slug: { countryCode: one.country, slug: one.guide.slug } } })).id
    const section = await prisma.guideSection.findFirstOrThrow({ where: { guideId }, orderBy: { position: 'asc' } })
    // A language the file does not write, as an older load or another writer could have left.
    await prisma.guideSectionText.create({ data: { sectionId: section.id, locale: 'de-DE', title: 'Was zuerst zu tun ist.', body: 'Erstens.' } })

    await loadResearchedGuides(prisma, [other])
    const served = await guideFor(other.country, other.guide.slug)
    expect(served.sections).toEqual([
      { kind: 'commonProblems', title: 'What goes wrong.', body: 'Second.' },
      { kind: 'beforeYouStart', title: 'What to do first.', body: 'First.' },
    ])
    expect(await prisma.guideSectionText.count({ where: { section: { guideId }, locale: { not: 'en-US' } } }), 'a language the file does not write is gone').toBe(0)
  } finally {
    await loadResearchedGuides(prisma)
  }
})
