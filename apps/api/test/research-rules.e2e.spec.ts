import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import request from 'supertest'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { AppModule } from '../src/app.module.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { loadInto, loadResearchRules, type LoadReport } from '../src/rules/research/load.js'
import type { ResearchMembership, ResearchReading, ResearchRules, ResearchStatus, ResearchVersion } from '../src/rules/research/rows.js'
import { RESEARCHED } from '../src/rules/research/countries.js'
import { GERMANY } from '../src/rules/research/germany.js'
import { TURKEY } from '../src/rules/research/turkey.js'
import { seed } from '../prisma/seed.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-190: researched rules reach the database only from src/rules/research,
// every version and fact resting on verified definitions of its agreed document,
// and a load is serialised under one lock. SB-202: after a load every row a file
// owns says exactly what that file says, and loading the earlier file puts it
// back. SB-194: the residence statuses a file names are written first, in its
// order. SB-209: an answer carries its rule's notes.
// SB-192: a nationality group the file declares keeps the memberships it says.
// SB-210: every region a file names is read back from the two pages that code
// and name it, and a reader can say they live in any of them. SB-191: the
// address duty reaches each status it was verified for, and Bursa's procedure
// reaches only a reader who lives in Bursa. SB-223: Germany's Länder, read the same way
// from a list that prints each on a line. SB-224: Germany's Anmeldung, federally and in
// three Länder, compared with Turkey's address duty. SB-228: a place below the first level
// read from its own page.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5468
const COUNTRIES: readonly ResearchRules[] = RESEARCHED

/** A load that wrote nothing (SB-202). */
const NOTHING_CHANGED: LoadReport = {
  statusesAdded: 0,
  statusesChanged: 0,
  statusesRemoved: 0,
  regionsAdded: 0,
  regionsChanged: 0,
  regionsRemoved: 0,
  groupsAdded: 0,
  groupsChanged: 0,
  groupsRemoved: 0,
  membershipsAdded: 0,
  membershipsRemoved: 0,
  obligationsAdded: 0,
  versionsAdded: 0,
  versionsChanged: 0,
  versionsRemoved: 0,
}

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

  // A country no research covers and no production reader can choose, so a move from it
  // reads one country's answer alone (SB-224).
  await prisma.country.create({ data: { code: 'xx', name: 'No researched country' } })
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

const graphql = (query: string, variables: Record<string, unknown> = {}) =>
  request(app.getHttpServer()).post('/graphql').send({ query, variables })

type Definition = { url: string | null; status: string; read: string; evidence: readonly string[] }

const isMeta = (value: unknown): value is { status: string; read: string; evidence?: unknown } =>
  typeof value === 'object' && value !== null && 'status' in value && typeof value.status === 'string' && 'read' in value && typeof value.read === 'string'

const passagesOf = (evidence: unknown): string[] =>
  Array.isArray(evidence) ? evidence.filter((passage): passage is string => typeof passage === 'string') : []

/** Every footnote definition of one agreed document, by its label. */
const definitionsOf = (research: string, document: string): Map<string, Definition> => {
  const text = readFileSync(join(API, 'prisma/research/agreed', research, `${document}.md`), 'utf8')
  const definitions = new Map<string, Definition>()
  for (const line of text.split(/\r?\n/)) {
    const found = /^\[\^([^\]]+)\]: (?:<([^>]+)>|calculated) \| (\{.*\})$/.exec(line)
    const meta: unknown = found?.[3] ? JSON.parse(found[3]) : undefined
    if (found?.[1] && isMeta(meta)) {
      definitions.set(found[1], { url: found[2] ?? null, status: meta.status, read: meta.read, evidence: passagesOf(meta.evidence) })
    }
  }
  return definitions
}

test('every researched version and fact rests on verified definitions of its own agreed document, on the page and the day the file names', () => {
  let checked = 0
  for (const rules of COUNTRIES) {
    for (const version of rules.versions) {
      const uses = [
        { what: `${rules.country} ${version.obligation}`, document: version.document, source: version.source, labels: version.labels },
        ...version.facts.map((fact) => ({
          what: `${rules.country} ${version.obligation}.${fact.key}`,
          document: fact.document ?? version.document,
          source: fact.source,
          labels: fact.labels,
        })),
      ]
      for (const use of uses) {
        const definitions = definitionsOf(rules.research, use.document)
        const page = rules.sources[use.source]
        expect(page, `${use.what} names ${use.source}, which is not a source`).toBeDefined()
        expect(use.labels.length, `${use.what} names no definition`).toBeGreaterThan(0)
        for (const label of use.labels) {
          const definition = definitions.get(label)
          expect(definition, `${use.what}: ${label} is not a definition in ${use.document}.md`).toBeDefined()
          expect(definition?.status, `${use.what}: ${label} is ${definition?.status}, not verified`).toBe('verified')
          expect(definition?.url, `${use.what}: ${label} is on another page`).toBe(page?.url)
          expect(definition?.read, `${use.what}: ${label} was read on another day`).toBe(page?.read)
          checked += 1
        }
      }
    }
  }
  expect(checked).toBeGreaterThan(0)
})

// A page can write a letter and its mark apart, so a passage and a name are
// composed before they are compared, and nothing else is folded: not case, so İ
// and I stay apart, and not a circumflex (SB-210).
const composed = (text: string) => text.normalize('NFC')

test('every region a file names is one row of the page that codes it, beside its name as that page spells it, and one of the official names, and neither page has a region the file leaves out', () => {
  let checked = 0
  for (const rules of COUNTRIES) {
    if (rules.regions.length === 0) continue
    const from = rules.regionsFrom
    if (!from) throw new Error(`${rules.country} names regions and not the agreed document they are read from`)
    const definitions = definitionsOf(rules.research, from.document)
    // The pages that code and name a country's first-level places list none below them (SB-228).
    const firstLevel = rules.regions.filter((region) => region.parent === null)

    const readBack = (reading: ResearchReading): string[] => {
      const definition = definitions.get(reading.label)
      const page = rules.sources[reading.source]
      expect(page, `${reading.source} is not a source`).toBeDefined()
      expect(definition, `${reading.label} is not a definition in ${from.document}.md`).toBeDefined()
      expect(definition?.status, `${reading.label} is ${definition?.status}, not verified`).toBe('verified')
      expect(definition?.url, `${reading.label} is on another page`).toBe(page?.url)
      expect(definition?.read, `${reading.label} was read on another day`).toBe(page?.read)
      return (definition?.evidence ?? []).map(composed)
    }
    // A row is a passage holding a word in the country's code prefix, and it holds
    // exactly one, its code. ISO prints an asterisk beside a code whose source its
    // code source line names, and the asterisk is not part of the code.
    const prefix = `${rules.country.toUpperCase()}-`
    const codesIn = (passage: string) => passage.split(' ').filter((word) => word.startsWith(prefix)).map((word) => word.replace(/\*+$/, ''))
    const rows = readBack(from.codes).filter((passage) => codesIn(passage).length > 0)
    // A page that prints more than the name on each line says how to read the name from it.
    const pattern = from.names.row === undefined ? null : new RegExp(from.names.row)
    const names = readBack(from.names).flatMap((passage) => {
      if (!pattern) return [passage]
      const found = pattern.exec(passage)?.[1]
      return found === undefined ? [] : [found]
    })

    const fileCodes = new Set(firstLevel.map((region) => region.code))
    expect(fileCodes.size, 'a code is given twice').toBe(firstLevel.length)
    expect(new Set(firstLevel.map((region) => composed(region.name))).size, 'a name is given twice').toBe(firstLevel.length)
    for (const row of rows) expect(codesIn(row), `${from.codes.label}'s row ${row} holds one code`).toHaveLength(1)
    expect(rows, `${from.codes.label} codes as many regions as the file names`).toHaveLength(firstLevel.length)
    expect(new Set(rows.flatMap((row) => codesIn(row))), `${from.codes.label} codes exactly the regions the file names`).toEqual(fileCodes)
    expect(names, `${from.names.label} names as many regions as the file names`).toHaveLength(firstLevel.length)

    for (const region of firstLevel) {
      const own = rows.filter((row) => codesIn(row)[0] === region.code)
      expect(own, `${region.code} is one row of ${from.codes.label}`).toHaveLength(1)
      if (region.isoName !== undefined) {
        expect(composed(region.isoName), `${region.code} records ISO's spelling where it is the same`).not.toBe(composed(region.name))
      }
      const spelled = composed(region.isoName ?? region.name)
      expect(` ${own[0] ?? ''} `.includes(` ${spelled} `), `${region.code}'s row is ${own[0]}, which does not say ${spelled}`).toBe(true)
      expect(names.filter((name) => name === composed(region.name)), `${region.name} is one name of ${from.names.label}`).toHaveLength(1)
      checked += 1
    }
  }
  expect(checked).toBeGreaterThan(0)
})

test("every place below the first level a file names is read from its own page, its title its name, its Land its parent's name and its key its official code, each label and value one whole passage, with its parent earlier in the file", () => {
  let checked = 0
  for (const rules of COUNTRIES) {
    rules.regions.forEach((place, index) => {
      if (place.parent === null) return
      const reading = place.from
      if (!reading) throw new Error(`${place.code} is below the first level and names no page it is read from`)

      const definition = definitionsOf(rules.research, reading.document).get(reading.label)
      const page = rules.sources[reading.source]
      expect(page, `${place.code}: ${reading.source} is not a source`).toBeDefined()
      expect(definition?.status, `${place.code}: ${reading.label} is ${definition?.status}, not verified`).toBe('verified')
      expect(definition?.url, `${place.code}: ${reading.label} is on another page`).toBe(page?.url)
      expect(definition?.read, `${place.code}: ${reading.label} was read on another day`).toBe(page?.read)
      const passages = (definition?.evidence ?? []).map(composed)

      const parentAt = rules.regions.findIndex((region) => region.code === place.parent)
      expect(parentAt, `${place.code}'s parent ${place.parent} is an earlier place of the file`).toBeGreaterThanOrEqual(0)
      expect(parentAt, `${place.code}'s parent ${place.parent} is an earlier place of the file`).toBeLessThan(index)
      const parentName = rules.regions[parentAt]?.name ?? ''

      // The directory's entry title, read whole through the file's pattern, and each field as its
      // label followed by its value, which the page prints on adjacent lines.
      expect(reading.row, `${place.code}'s title pattern is anchored at both ends`).toMatch(/^\^.*\$$/)
      const pattern = new RegExp(reading.row ?? '$^')
      const titled = passages.flatMap((passage) => {
        const found = pattern.exec(passage)?.[1]
        return found === undefined ? [] : [found]
      })
      expect(titled, `${place.code}'s page titles it once, as ${place.name}`).toEqual([composed(place.name)])
      expect(passages.filter((passage) => passage === composed(`Bundesland ${parentName}`)), `${place.code}'s page puts it in ${parentName}`).toHaveLength(1)
      expect(passages.filter((passage) => passage === `Amtl. Gemeindeschlüssel ${place.officialCode ?? ''}`), `${place.code}'s page keys it ${place.officialCode}`).toHaveLength(1)
      checked += 1
    })
  }
  expect(checked).toBeGreaterThan(0)
})

const MOVE = `
  query Move($residenceStatuses: [String!], $nationality: String, $situation: String, $locale: String, $toResidenceRegions: [String!]) {
    move(from: "xx", to: "tr", residenceStatuses: $residenceStatuses, nationality: $nationality, situation: $situation, locale: $locale, toResidenceRegions: $toResidenceRegions) {
      obligationSlug
      verdict
      needs
      to {
        facts { key operator numericValue textValue unit currency sourceUrl sourceName verifiedAt }
        notes { ruleVersionId text locale translationMissing }
      }
    }
  }
`

type Shown = {
  key: string
  operator: string
  numericValue: string | null
  textValue: string | null
  unit: string | null
  currency: string | null
  sourceUrl: string
  sourceName: string
  verifiedAt: string
}

type Note = { ruleVersionId: string; text: string; locale: string; translationMissing: boolean }

type Entry = { obligationSlug: string; verdict: string; needs: string[]; to: { facts: Shown[]; notes: Note[] } | null }

/** What a reader has said about themselves, where they will live, and the language they asked in. */
type Asked = { residenceStatuses?: string[]; nationality?: string; situation?: string; locale?: string; toResidenceRegions?: string[] }

/** Turkey's answer for one obligation to a reader arriving from a country no research covers, or undefined where no rule of it applies to them. */
const entryFor = async (slug: string, asked: Asked = {}): Promise<Entry | undefined> => {
  const response = await graphql(MOVE, asked)
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  const entries: Entry[] = response.body.data.move
  return entries.find((entry) => entry.obligationSlug === slug)
}

/** The facts some versions of one country's file hold together, as the move query shows them, in key order. */
const factsIn = (rules: ResearchRules, ...versions: readonly (ResearchVersion | undefined)[]) =>
  versions
    .flatMap((version) => version?.facts ?? [])
    .map((fact) => {
      const page = rules.sources[fact.source]
      return {
        key: fact.key,
        operator: fact.operator,
        numericValue: fact.numericValue === undefined ? null : String(fact.numericValue),
        textValue: fact.textValue ?? null,
        unit: fact.unit ?? null,
        currency: fact.currency ?? null,
        sourceUrl: page?.url,
        sourceName: page?.name,
        verifiedAt: page?.read,
      }
    })
    .sort((a, b) => (a.key < b.key ? -1 : 1))

/** The facts Turkey's file holds for one obligation, as the move query shows them, in key order. */
const factsOf = (slug: string) => factsIn(TURKEY, TURKEY.versions.find((version) => version.obligation === slug))

// The regions the seed had written before the first load, by code, with the names it
// gave them, which a load leaves as they are (SB-223).
let seededRegions = new Map<string, string>()

test("after a load, Turkey's limited company formation answers with every fact the file holds, each on its own page", async () => {
  seededRegions = new Map((await prisma.region.findMany({ select: { code: true, name: true } })).map((region) => [region.code, region.name]))
  const across = (count: (rules: ResearchRules) => number) => COUNTRIES.reduce((sum, rules) => sum + count(rules), 0)

  const started = Date.now()
  const report = await loadResearchRules(prisma, COUNTRIES)
  console.log(`a full load of researched rules took ${Date.now() - started} ms`)
  expect(report).toEqual({
    ...NOTHING_CHANGED,
    statusesAdded: across((rules) => rules.statuses.length),
    regionsAdded: across((rules) => rules.regions.filter((region) => !seededRegions.has(region.code)).length),
    // The Länder the seed wrote first are claimed, and named as the file names them (SB-202).
    regionsChanged: across((rules) => rules.regions.filter((region) => seededRegions.has(region.code)).length),
    groupsAdded: across((rules) => rules.nationalityGroups.length),
    membershipsAdded: across((rules) => rules.nationalityGroups.reduce((sum, group) => sum + group.members.length, 0)),
    // An obligation two countries share is added once.
    obligationsAdded: new Set(COUNTRIES.flatMap((rules) => rules.obligations.map((obligation) => obligation.slug))).size,
    versionsAdded: across((rules) => rules.versions.length),
  })

  const formation = await entryFor('form-a-limited-company')
  expect(formation?.verdict).toBe('newInDestination')
  const expected = factsOf('form-a-limited-company')
  expect(expected).toHaveLength(4)
  expect(formation?.to?.facts).toEqual(expected)
})

const LIVES = `
  query Lives($toResidenceRegions: [String!]) {
    move(from: "de", to: "tr", toResidenceRegions: $toResidenceRegions, residenceStatuses: ["tr.residence-permit"]) {
      obligationSlug
    }
  }
`

test("after a load, every province in Turkey's file is stored by its code with its name and nothing above it, and a residence permit holder can say they will live in any one of them", async () => {
  const byCode = (a: { code: string }, b: { code: string }) => (a.code < b.code ? -1 : 1)
  const stored = await prisma.region.findMany({ where: { countryCode: 'tr' }, select: { code: true, parentCode: true, name: true } })
  const written = TURKEY.regions.map((region) => ({ code: region.code, parentCode: region.parent, name: region.name }))
  expect(stored.sort(byCode)).toEqual(written.sort(byCode))
  expect(stored).toHaveLength(81)

  for (const region of TURKEY.regions) {
    const response = await graphql(LIVES, { toResidenceRegions: [region.code] })
    expect(response.body.errors, `${region.code}: ${JSON.stringify(response.body.errors)}`).toBeUndefined()
    expect(response.body.data.move, region.code).not.toHaveLength(0)
  }

  // The same query refuses a code that is no province, so the loop above does not
  // pass because nothing is ever refused.
  const nowhere = await graphql(LIVES, { toResidenceRegions: ['TR-82'] })
  expect(JSON.stringify(nowhere.body.errors)).toMatch(/Not a region: TR-82\./)
})

const IN_GERMANY = `
  query InGermany($toResidenceRegions: [String!], $toWorkRegions: [String!]) {
    move(from: "tr", to: "de", toResidenceRegions: $toResidenceRegions, toWorkRegions: $toWorkRegions) {
      obligationSlug
    }
  }
`

test("after a load, every Land in Germany's file is a region with nothing above it, owned by Germany's file and named as Destatis names it, the eight the seed wrote first included, and a reader can say they will live or work in any one of them", async () => {
  const byCode = (a: { code: string }, b: { code: string }) => (a.code < b.code ? -1 : 1)
  const stored = await prisma.region.findMany({
    where: { countryCode: 'de' },
    select: { code: true, parentCode: true, name: true, officialCode: true, research: true },
  })
  const expected = GERMANY.regions.map((region) => ({
    code: region.code,
    parentCode: region.parent,
    name: region.name,
    officialCode: region.officialCode ?? null,
    research: 'germany',
  }))
  expect(stored.sort(byCode)).toEqual(expected.sort(byCode))
  expect(stored.filter((region) => region.parentCode === null)).toHaveLength(16)
  expect(stored.filter((region) => region.parentCode !== null).map((region) => region.code).sort()).toEqual([
    'DE-BW.freiburg',
    'DE-BY.muenchen',
    'DE-HE.wiesbaden',
    'DE-NW.duesseldorf',
    'DE-NW.koeln',
  ])
  expect(GERMANY.regions.filter((region) => seededRegions.has(region.code)), 'the Länder the seed wrote first').toHaveLength(8)

  for (const region of GERMANY.regions) {
    for (const where of [{ toResidenceRegions: [region.code] }, { toWorkRegions: [region.code] }]) {
      const response = await graphql(IN_GERMANY, where)
      expect(response.body.errors, `${JSON.stringify(where)}: ${JSON.stringify(response.body.errors)}`).toBeUndefined()
    }
  }

  const nowhere = await graphql(IN_GERMANY, { toWorkRegions: ['DE-XX'] })
  expect(JSON.stringify(nowhere.body.errors)).toMatch(/Not a region: DE-XX\./)
})

test("joining Turkey's general health insurance answers a residence permit holder, or a holder of a kind of one, with its five facts on their pages, asks a reader who has not said what they hold, and is never told to a visitor on a visa exemption", async () => {
  await prisma.residenceStatus.createMany({
    data: [{ code: 'tr.residence-permit.student', countryCode: 'tr', parentCode: 'tr.residence-permit', name: 'Student residence permit' }],
  })
  const expected = factsOf('join-general-health-insurance')
  expect(expected).toHaveLength(5)

  for (const held of ['tr.residence-permit', 'tr.residence-permit.student']) {
    const insurance = await entryFor('join-general-health-insurance', { residenceStatuses: [held] })
    expect(insurance?.verdict, held).toBe('newInDestination')
    expect(insurance?.to?.facts, held).toEqual(expected)
  }

  expect(await entryFor('join-general-health-insurance')).toMatchObject({ verdict: 'needsDetail', needs: ['residenceStatus'], to: null })
  expect(await entryFor('join-general-health-insurance', { residenceStatuses: ['tr.short-stay.visa-exemption'] })).toBeUndefined()
})

test("joining general health insurance carries its rule's notes in English, and asked in Persian says they are only in English", async () => {
  const notes = TURKEY.versions.find((version) => version.obligation === 'join-general-health-insurance')?.notes.en
  expect(notes?.split('. ')[0]).toContain("not insured under a foreign country's law")

  const { id: version } = await prisma.ruleVersion.findFirstOrThrow({
    where: { countryCode: 'tr', obligation: { slug: 'join-general-health-insurance' } },
    select: { id: true },
  })
  const english = await entryFor('join-general-health-insurance', { residenceStatuses: ['tr.residence-permit'] })
  expect(english?.to?.notes).toEqual([{ ruleVersionId: version, text: notes, locale: 'en-US', translationMissing: false }])

  const persian = await entryFor('join-general-health-insurance', { residenceStatuses: ['tr.residence-permit'], locale: 'fa-IR' })
  expect(persian?.to?.notes).toEqual([{ ruleVersionId: version, text: notes, locale: 'en-US', translationMissing: true }])
})

// Each duty that follows registration, and the condition its notes must open
// with, since a founder is not bound by every one of them (SB-196).
const COMPANY_DUTIES: readonly [slug: string, opening: string][] = [
  ['request-electronic-tax-notifications', 'For a corporate taxpayer, which a limited company is'],
  ['get-a-tax-certificate', 'For a corporate taxpayer, which a limited company is'],
  ['register-an-employee-for-social-insurance', 'Once the company employs someone under a service contract'],
  ['get-a-workplace-licence', 'Where the premises and what is done there need an opening and operating licence'],
  ['keep-company-books-electronically', 'For a company registered from 1 January 2026'],
]

// Each moment of the work permit, and the condition its notes must open with,
// since every figure binds only under one (SB-193).
const WORKER_DUTIES: readonly [slug: string, opening: string][] = [
  ['get-a-work-permit', 'Where your employer applies for your work permit, as it normally does'],
  ['report-employment-starting-and-ending', 'For the employer, or a foreigner holding an indefinite or independent work permit'],
  ['apply-for-a-residence-permit-after-a-work-permit', 'Once your work permit has been cancelled or has ended'],
  ['keep-working-while-an-extension-is-assessed', 'Only while a timely application to extend your work permit is assessed, for the same work at the same workplace'],
]

/**
 * Each duty of a situation is told to a reader in it, with its facts on their
 * pages and its notes as served, opening with its condition; a reader who has
 * not said is asked for their situation; a student is told none of them.
 */
const toldInSituation = async (duties: readonly [slug: string, opening: string][], situation: string) => {
  for (const [slug, opening] of duties) {
    const version = TURKEY.versions.find((candidate) => candidate.obligation === slug)
    expect(version, `${slug} is in Turkey's file`).toBeDefined()

    const reader = await entryFor(slug, { situation })
    expect(reader?.verdict, slug).toBe('newInDestination')
    expect(reader?.to?.facts, slug).toEqual(factsOf(slug))
    expect(reader?.to?.notes, slug).toEqual([{ ruleVersionId: expect.any(String), text: version?.notes.en, locale: 'en-US', translationMissing: false }])
    expect(reader?.to?.notes[0]?.text.startsWith(opening), `${slug}'s notes open with its condition`).toBe(true)

    expect(await entryFor(slug), slug).toMatchObject({ verdict: 'needsDetail', needs: ['situation'], to: null })
    expect(await entryFor(slug, { situation: 'student' }), slug).toBeUndefined()
  }
}

test("a reader starting a company is told each duty that follows registration, its facts on their pages and its condition first in its notes, a reader who has not said is asked, and a student is not told them", () =>
  toldInSituation(COMPANY_DUTIES, 'company-founder'))

test("a reader who works in Turkey is told each moment of the work permit, its figures on their pages and its condition first in its notes, a reader who has not said is asked, and a student is not told them", async () => {
  expect(factsOf('get-a-work-permit')).toHaveLength(16)
  await toldInSituation(WORKER_DUTIES, 'worker')
})

test('a reader on a visa or a visa exemption is told how to get a short-term residence permit, its figures on their pages and its condition first in its notes, a residence permit holder is not told it, and a reader who has not said is asked', async () => {
  const slug = 'get-a-short-term-residence-permit'
  const version = TURKEY.versions.find((candidate) => candidate.obligation === slug)
  const expected = factsOf(slug)
  expect(expected).toHaveLength(17)

  for (const held of ['tr.short-stay.visa-exemption', 'tr.short-stay.visa']) {
    const permit = await entryFor(slug, { residenceStatuses: [held] })
    expect(permit?.verdict, held).toBe('newInDestination')
    expect(permit?.to?.facts, held).toEqual(expected)
    expect(permit?.to?.notes.map((note) => note.text), held).toEqual([version?.notes.en])
    expect(permit?.to?.notes[0]?.text.startsWith('Only while your visa or visa-exempt stay is still valid'), held).toBe(true)
  }

  expect(await entryFor(slug, { residenceStatuses: ['tr.residence-permit'] })).toBeUndefined()
  expect(await entryFor(slug)).toMatchObject({ verdict: 'needsDetail', needs: ['residenceStatus'], to: null })
})

test('a reader of a nationality the fee page exempts is told there is no permit charge, a reader of another is not told the charge, and a reader who has not said is asked', async () => {
  const slug = 'pay-the-residence-permit-charge'
  const version = TURKEY.versions.find((candidate) => candidate.obligation === slug)

  const danish = await entryFor(slug, { nationality: 'dk' })
  expect(danish?.verdict).toBe('newInDestination')
  expect(danish?.to?.facts).toEqual(factsOf(slug))
  expect(danish?.to?.facts.map((fact) => [fact.key, fact.operator])).toEqual([['charge', 'none']])
  expect(danish?.to?.notes.map((note) => note.text)).toEqual([version?.notes.en])

  expect(await entryFor(slug, { nationality: 'ir' })).toBeUndefined()
  expect(await entryFor(slug)).toMatchObject({ verdict: 'needsDetail', needs: ['nationality'], to: null })
})

// Each status the address duty was verified for, the provision its 20 working
// days rest on, and how its notes open (SB-191).
const ADDRESS_DUTIES: readonly [status: string, label: string, opening: string][] = [
  ['tr.residence-permit', 'yukk-reg-23-2-twenty-working-days', 'For a residence permit holder.'],
  ['tr.international-protection', 'yukk-reg-110-3-twenty-working-days', 'For an international protection applicant or status holder.'],
  ['tr.temporary-protection', 'gk-reg-33-2-d-twenty-working-days', 'For a temporary protection beneficiary.'],
]

test("each status the address duty was verified for is told its 20 working days on its own provision's page and the fines, in Bursa also Bursa's appointment and UETS account, is asked where it lives until it says, and a visitor on a visa exemption is not told the duty", async () => {
  const slug = 'report-your-address'
  const versionFor = (status: string, place: string | null) =>
    TURKEY.versions.find((version) => {
      const valueOf = (dimension: string) => version.criteria.find((criterion) => criterion.dimension === dimension)?.value ?? null
      return version.obligation === slug && valueOf('residenceStatus') === status && valueOf('residenceRegion') === place
    })

  for (const [status, label, opening] of ADDRESS_DUTIES) {
    const national = versionFor(status, null)
    const bursa = versionFor(status, 'TR-16')
    expect(national?.facts.find((fact) => fact.key === 'reportAddressChangeWithin')?.labels, status).toEqual([label])
    expect(national?.notes.en.startsWith(opening), `${status}'s notes open with who they bind`).toBe(true)
    expect(bursa?.notes.en.startsWith("Where you register your address at Bursa's provincial migration directorate"), status).toBe(true)
    expect(factsIn(TURKEY, national, bursa), status).toHaveLength(5)

    const inBursa = await entryFor(slug, { residenceStatuses: [status], toResidenceRegions: ['TR-16'] })
    expect(inBursa?.verdict, status).toBe('newInDestination')
    expect(inBursa?.to?.facts, status).toEqual(factsIn(TURKEY, national, bursa))
    expect(inBursa?.to?.notes.map((note) => note.text), status).toEqual([national?.notes.en, bursa?.notes.en])

    const inIstanbul = await entryFor(slug, { residenceStatuses: [status], toResidenceRegions: ['TR-34'] })
    expect(inIstanbul?.verdict, status).toBe('newInDestination')
    expect(inIstanbul?.to?.facts, status).toEqual(factsIn(TURKEY, national))
    expect(inIstanbul?.to?.notes.map((note) => note.text), status).toEqual([national?.notes.en])

    expect(await entryFor(slug, { residenceStatuses: [status] }), status).toMatchObject({
      verdict: 'needsDetail',
      needs: ['residenceRegion'],
      to: null,
    })
  }

  for (const place of ['TR-16', 'TR-34', null]) {
    const visitor = await entryFor(slug, { residenceStatuses: ['tr.short-stay.visa-exemption'], ...(place === null ? {} : { toResidenceRegions: [place] }) })
    expect(visitor, `a visitor in ${place ?? 'no place they have named'}`).toBeUndefined()
  }
  expect((await entryFor(slug, { toResidenceRegions: ['TR-34'] }))?.needs).toContain('residenceStatus')
})

const GERMAN_ANSWER = `
  query GermanAnswer($toResidenceRegions: [String!]) {
    move(from: "xx", to: "de", toResidenceRegions: $toResidenceRegions) {
      obligationSlug
      verdict
      needs
      to {
        facts { key operator numericValue textValue unit currency sourceUrl sourceName verifiedAt }
        notes { ruleVersionId text locale translationMissing }
      }
    }
  }
`

/** Germany's answer for one obligation to a reader who will live where they say, or undefined where no rule of it applies. */
const germanEntryFor = async (slug: string, toResidenceRegions?: string[]): Promise<Entry | undefined> => {
  const response = await graphql(GERMAN_ANSWER, toResidenceRegions ? { toResidenceRegions } : {})
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  const entries: Entry[] = response.body.data.move
  return entries.find((entry) => entry.obligationSlug === slug)
}

// Each Land the Anmeldung's fee was found for, and how its notes open (SB-224).
const ANMELDUNG_FEES: readonly [place: string, opening: string][] = [
  ['DE-HH', 'In Hamburg'],
  ['DE-BE', 'In Berlin'],
  ['DE-SN', 'In Saxony'],
]

test("a reader moving to Germany is told the Anmeldung's two weeks and fine ceiling from the federal law, in Hamburg also its fee, in Berlin and Saxony that it is free, elsewhere no fee, and a reader who has not said where is asked", async () => {
  const slug = 'report-your-address'
  const versionIn = (place: string | null) =>
    GERMANY.versions.find(
      (version) => version.obligation === slug && (version.criteria.find((criterion) => criterion.dimension === 'residenceRegion')?.value ?? null) === place,
    )
  const federal = versionIn(null)
  expect(federal?.facts.map((fact) => fact.key)).toEqual(['reportAddressChangeWithin', 'lateAddressNotificationFine'])
  expect(federal?.notes.en.startsWith('For anyone who moves into a dwelling in Germany')).toBe(true)

  for (const [place, opening] of ANMELDUNG_FEES) {
    const local = versionIn(place)
    expect(local?.facts.map((fact) => fact.key), place).toEqual(['registrationFee'])
    expect(local?.notes.en.startsWith(opening), place).toBe(true)

    const answer = await germanEntryFor(slug, [place])
    expect(answer?.verdict, place).toBe('newInDestination')
    expect(answer?.to?.facts, place).toEqual(factsIn(GERMANY, federal, local))
    expect(answer?.to?.notes.map((note) => note.text), place).toEqual([federal?.notes.en, local?.notes.en])
  }

  // What the exit names, held to the pages themselves rather than to the file.
  const feeIn = async (place: string) => (await germanEntryFor(slug, [place]))?.to?.facts.find((fact) => fact.key === 'registrationFee')
  expect(await feeIn('DE-HH')).toMatchObject({ operator: 'equals', numericValue: '16', currency: 'EUR', sourceUrl: 'https://www.hamburg.de/service/info/111142065/n0/' })
  expect(await feeIn('DE-BE')).toMatchObject({ operator: 'none', sourceUrl: 'https://service.berlin.de/dienstleistung/120686/' })

  expect((await germanEntryFor(slug, ['DE-BY']))?.to?.facts).toEqual(factsIn(GERMANY, federal))
  expect(await germanEntryFor(slug)).toMatchObject({ verdict: 'needsDetail', needs: ['residenceRegion'], to: null })
})

const COMPARED = `
  query Compared($fromResidenceRegions: [String!], $toResidenceRegions: [String!], $residenceStatuses: [String!]) {
    move(from: "de", to: "tr", fromResidenceRegions: $fromResidenceRegions, toResidenceRegions: $toResidenceRegions, residenceStatuses: $residenceStatuses) {
      obligationSlug
      verdict
      differences { key }
    }
  }
`

test('a residence permit holder moving from Hamburg to Bursa is shown the address duty compared, with the deadline among what changes', async () => {
  const response = await graphql(COMPARED, { fromResidenceRegions: ['DE-HH'], toResidenceRegions: ['TR-16'], residenceStatuses: ['tr.residence-permit'] })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  const entries: { obligationSlug: string; verdict: string; differences: { key: string }[] }[] = response.body.data.move
  const address = entries.find((entry) => entry.obligationSlug === 'report-your-address')
  expect(address?.verdict).toBe('changed')
  expect(address?.differences.map((difference) => difference.key)).toContain('reportAddressChangeWithin')
})

const counts = () =>
  Promise.all([
    prisma.residenceStatus.count(),
    prisma.residenceStatusText.count(),
    prisma.region.count(),
    prisma.nationalityGroup.count(),
    prisma.nationalityGroupMember.count(),
    prisma.obligation.count(),
    prisma.obligationText.count(),
    prisma.ruleVersion.count(),
    prisma.ruleFact.count(),
    prisma.eligibilityCriterion.count(),
    prisma.ruleText.count(),
  ])

const byJson = (a: unknown, b: unknown) => JSON.stringify(a).localeCompare(JSON.stringify(b))
const dayOf = (value: Date | null) => (value === null ? null : value.toISOString().slice(0, 10))

/** Every row one research file owns, as the database holds it, without ids or creation times (SB-202). */
const ownedBy = async (research: string) => {
  const versions = await prisma.ruleVersion.findMany({ where: { research }, include: { obligation: { select: { slug: true } }, criteria: true, facts: true, texts: true } })
  const regions = await prisma.region.findMany({ where: { research }, select: { code: true, parentCode: true, name: true, officialCode: true } })
  const statuses = await prisma.residenceStatus.findMany({ where: { research }, include: { texts: true } })
  const groups = await prisma.nationalityGroup.findMany({ where: { research }, include: { members: true } })
  return {
    versions: versions
      .map((version) => ({
        obligation: version.obligation.slug,
        validFrom: dayOf(version.validFrom),
        validTo: dayOf(version.validTo),
        page: [version.sourceUrl, version.sourceName, dayOf(version.verifiedAt)],
        criteria: version.criteria.map((criterion) => `${criterion.dimension}:${criterion.value}`).sort(),
        facts: version.facts
          .map((fact) => [fact.key, fact.operator, fact.numericValue?.toString() ?? null, fact.textValue, fact.unit, fact.currency, fact.sourceUrl, fact.sourceName, dayOf(fact.verifiedAt)])
          .sort(byJson),
        notes: version.texts.filter((text) => text.locale === 'en-US').map((text) => text.notes),
      }))
      .sort(byJson),
    regions: regions.sort(byJson),
    statuses: statuses
      .map((status) => ({ code: status.code, parentCode: status.parentCode, name: status.name, texts: status.texts.map((text) => [text.locale, text.name]).sort(byJson) }))
      .sort(byJson),
    groups: groups
      .map((group) => ({ code: group.code, name: group.name, members: group.members.map((member) => [member.nationality, dayOf(member.validFrom), dayOf(member.validTo)]).sort(byJson) }))
      .sort(byJson),
  }
}

/** The same rows as a research file says them. */
const asFileSays = (rules: ResearchRules) => {
  const page = (key: string) => {
    const source = rules.sources[key]
    if (!source) throw new Error(`${rules.research} has no source ${key}`)
    return [source.url, source.name, source.read]
  }
  return {
    versions: rules.versions
      .map((version) => ({
        obligation: version.obligation,
        validFrom: version.validFrom,
        validTo: version.validTo ?? null,
        page: page(version.source),
        criteria: version.criteria.map((criterion) => `${criterion.dimension}:${criterion.value}`).sort(),
        facts: version.facts
          .map((fact) => [
            fact.key,
            fact.operator,
            fact.numericValue === undefined ? null : String(fact.numericValue),
            fact.textValue ?? null,
            fact.unit ?? null,
            fact.currency ?? null,
            ...page(fact.source),
          ])
          .sort(byJson),
        notes: [version.notes.en],
      }))
      .sort(byJson),
    regions: rules.regions.map((region) => ({ code: region.code, parentCode: region.parent, name: region.name, officialCode: region.officialCode ?? null })).sort(byJson),
    statuses: rules.statuses
      .map((status) => ({
        code: status.code,
        parentCode: status.parent,
        name: status.names.en,
        texts: [
          ['en-US', status.names.en],
          ['fa-IR', status.names.fa],
        ].sort(byJson),
      }))
      .sort(byJson),
    groups: rules.nationalityGroups
      .map((group) => ({ code: group.code, name: group.name, members: group.members.map((member) => [member.nationality, member.from, member.until ?? null]).sort(byJson) }))
      .sort(byJson),
  }
}

test('a second load, and the seed run beside it, change nothing', async () => {
  const before = await counts()
  expect(await loadResearchRules(prisma, COUNTRIES)).toEqual(NOTHING_CHANGED)
  await seed(prisma)
  expect(await counts()).toEqual(before)
})

test("a group the file declares keeps exactly the file's memberships, a member dropped, a member ended or an identical second membership, and the file loaded again puts each back", async () => {
  const [exempt] = TURKEY.nationalityGroups
  if (!exempt) throw new Error("Turkey's file declares no nationality group")
  const withMembers = (members: readonly ResearchMembership[]): ResearchRules => ({
    ...TURKEY,
    nationalityGroups: TURKEY.nationalityGroups.map((group) => (group.code === exempt.code ? { ...group, members } : group)),
  })
  const denmark = () => prisma.nationalityGroupMember.findMany({ where: { groupCode: exempt.code, nationality: 'dk' }, select: { validTo: true } })
  const before = await ownedBy('turkey')

  const dropped = withMembers(exempt.members.filter((member) => member.nationality !== 'dk'))
  expect(await loadResearchRules(prisma, [dropped])).toEqual({ ...NOTHING_CHANGED, membershipsRemoved: 1 })
  expect(await denmark()).toEqual([])

  const ended = withMembers(exempt.members.map((member) => (member.nationality === 'dk' ? { ...member, until: '2027-01-01' } : member)))
  expect(await loadResearchRules(prisma, [ended])).toEqual({ ...NOTHING_CHANGED, membershipsAdded: 1 })
  expect(await denmark()).toEqual([{ validTo: new Date('2027-01-01') }])

  expect(await loadResearchRules(prisma, [TURKEY])).toEqual({ ...NOTHING_CHANGED, membershipsAdded: 1, membershipsRemoved: 1 })
  await prisma.nationalityGroupMember.create({ data: { groupCode: exempt.code, nationality: 'dk', validFrom: new Date('2026-09-14') } })
  expect(await loadResearchRules(prisma, [TURKEY])).toEqual({ ...NOTHING_CHANGED, membershipsRemoved: 1 })
  expect(await ownedBy('turkey')).toEqual(before)
})

test('a version the file changes is written again as the file says, and the file loaded again puts it back', async () => {
  const changed: ResearchRules = {
    ...TURKEY,
    versions: TURKEY.versions.map((version) => ({
      ...version,
      facts: version.facts.map((fact) => (fact.key === 'minimumCapital' ? { ...fact, numericValue: 60000 } : fact)),
    })),
  }
  const capital = async () =>
    (await prisma.ruleFact.findMany({ where: { key: 'minimumCapital', ruleVersion: { research: 'turkey' } }, select: { numericValue: true } })).map((fact) =>
      fact.numericValue?.toString(),
    )
  const before = await ownedBy('turkey')

  expect(await loadResearchRules(prisma, [changed])).toEqual({ ...NOTHING_CHANGED, versionsChanged: 1 })
  expect(await capital()).toEqual(['60000'])

  expect(await loadResearchRules(prisma, [TURKEY])).toEqual({ ...NOTHING_CHANGED, versionsChanged: 1 })
  expect(await capital()).toEqual(['50000'])
  expect(await ownedBy('turkey')).toEqual(before)
})

/** A status of a test's own file, named by its code. */
const status = (code: string, parent: string | null): ResearchStatus => ({ code, parent, names: { en: code, fa: code } })

test('a status the file puts inside another is moved there, the versions naming it written again, and the file loaded again puts it back', async () => {
  const permit = TURKEY.statuses.find((listed) => listed.code === 'tr.residence-permit')
  if (!permit) throw new Error("Turkey's file has no tr.residence-permit")
  const naming = TURKEY.versions.filter((version) => version.criteria.some((criterion) => criterion.dimension === 'residenceStatus' && criterion.value === permit.code)).length
  const inside: ResearchRules = {
    ...TURKEY,
    statuses: [status('tr.permits', null), ...TURKEY.statuses.map((listed) => (listed === permit ? { ...permit, parent: 'tr.permits' } : listed))],
  }
  const before = await ownedBy('turkey')

  expect(await loadResearchRules(prisma, [inside])).toEqual({ ...NOTHING_CHANGED, statusesAdded: 1, statusesChanged: 1, versionsChanged: naming })
  expect((await prisma.residenceStatus.findUniqueOrThrow({ where: { code: permit.code } })).parentCode).toBe('tr.permits')

  expect(await loadResearchRules(prisma, [TURKEY])).toEqual({ ...NOTHING_CHANGED, statusesChanged: 1, statusesRemoved: 1, versionsChanged: naming })
  expect(await ownedBy('turkey')).toEqual(before)
})

test("a province the file puts inside another place is moved there, the versions naming it written again, a name an editor changed is set back to the file's, and the file loaded again puts both back", async () => {
  const bursa = TURKEY.regions.find((region) => region.code === 'TR-16')
  if (!bursa) throw new Error("Turkey's file has no TR-16")
  const naming = TURKEY.versions.filter((version) => version.criteria.some((criterion) => criterion.value === bursa.code)).length
  const inside: ResearchRules = { ...TURKEY, regions: TURKEY.regions.map((region) => (region === bursa ? { ...region, parent: 'TR-41' } : region)) }
  const before = await ownedBy('turkey')

  expect(await loadResearchRules(prisma, [inside])).toEqual({ ...NOTHING_CHANGED, regionsChanged: 1, versionsChanged: naming })
  expect((await prisma.region.findUniqueOrThrow({ where: { code: bursa.code } })).parentCode).toBe('TR-41')

  await prisma.region.update({ where: { code: bursa.code }, data: { name: 'Bursa, as an editor wrote it' } })
  expect(await loadResearchRules(prisma, [TURKEY])).toEqual({ ...NOTHING_CHANGED, regionsChanged: 1, versionsChanged: naming })
  expect(await ownedBy('turkey')).toEqual(before)
})

test('a kind listed before the status it is a kind of stops the load, and nothing is written', async () => {
  const misordered: ResearchRules = { ...TURKEY, statuses: [status('tr.protection.applicant', 'tr.protection'), status('tr.protection', null), ...TURKEY.statuses] }
  const before = await counts()

  // Refused by the parent's foreign key or the status tree's own check, whichever fires first.
  await expect(loadResearchRules(prisma, [misordered])).rejects.toThrow()
  expect(await counts()).toEqual(before)
})

test("Turkey's file changed five ways at once is loaded as it says, the real file loaded again puts every row back, and a second load changes nothing", async () => {
  const national = TURKEY.versions.find(
    (version) => version.obligation === 'report-your-address' && version.criteria.length === 1 && version.criteria[0]?.value === 'tr.residence-permit',
  )
  const bursaProtection = TURKEY.versions.find(
    (version) =>
      version.obligation === 'report-your-address' &&
      version.criteria.some((criterion) => criterion.value === 'tr.international-protection') &&
      version.criteria.some((criterion) => criterion.value === 'TR-16'),
  )
  if (!national || !bursaProtection) throw new Error("Turkey's file has no national address duty for a permit holder, or none for protection in Bursa")

  const ENDS = '2026-10-01'
  const changed: ResearchRules = {
    ...TURKEY,
    versions: [
      ...TURKEY.versions.filter((version) => version !== bursaProtection).map((version) => (version === national ? { ...version, validTo: ENDS } : version)),
      { ...national, validFrom: ENDS, facts: national.facts.map((fact) => (fact.key === 'reportAddressChangeWithin' ? { ...fact, numericValue: 15 } : fact)) },
    ],
    nationalityGroups: TURKEY.nationalityGroups.map((group) => ({ ...group, members: group.members.filter((member) => member.nationality !== 'dk') })),
    regions: TURKEY.regions.filter((region) => region.code !== 'TR-81').map((region) => (region.code === 'TR-16' ? { ...region, name: 'Bursa, renamed' } : region)),
  }
  const before = await ownedBy('turkey')
  expect(before).toEqual(asFileSays(TURKEY))

  expect(await loadResearchRules(prisma, [changed])).toEqual({
    ...NOTHING_CHANGED,
    regionsChanged: 1,
    regionsRemoved: 1,
    membershipsRemoved: 1,
    versionsAdded: 1,
    versionsChanged: 1,
    versionsRemoved: 1,
  })
  expect(await ownedBy('turkey')).toEqual(asFileSays(changed))

  expect(await loadResearchRules(prisma, [TURKEY])).toEqual({
    ...NOTHING_CHANGED,
    regionsAdded: 1,
    regionsChanged: 1,
    membershipsAdded: 1,
    versionsAdded: 1,
    versionsChanged: 1,
    versionsRemoved: 1,
  })
  expect(await ownedBy('turkey')).toEqual(before)
  expect(await loadResearchRules(prisma, COUNTRIES)).toEqual(NOTHING_CHANGED)
})

test("a Land whose city a rule names is moved inside another Land, that rule written again, and Germany's real file puts both back", async () => {
  const hamburg = GERMANY.versions.find((version) => version.criteria.some((criterion) => criterion.value === 'DE-HH'))
  if (!hamburg) throw new Error("Germany's file has no version for Hamburg")
  const withKoeln: ResearchRules = { ...GERMANY, versions: [...GERMANY.versions, { ...hamburg, criteria: [{ dimension: 'residenceRegion', value: 'DE-NW.koeln' }] }] }
  const moved: ResearchRules = { ...withKoeln, regions: withKoeln.regions.map((region) => (region.code === 'DE-NW' ? { ...region, parent: 'DE-BY' } : region)) }
  const before = await ownedBy('germany')

  expect(await loadResearchRules(prisma, [withKoeln])).toEqual({ ...NOTHING_CHANGED, versionsAdded: 1 })
  // Only a load that reads the tree below a moved place takes Köln's version aside, so the move is not refused.
  expect(await loadResearchRules(prisma, [moved])).toEqual({ ...NOTHING_CHANGED, regionsChanged: 1, versionsChanged: 1 })
  expect((await prisma.region.findUniqueOrThrow({ where: { code: 'DE-NW' } })).parentCode).toBe('DE-BY')

  expect(await loadResearchRules(prisma, [GERMANY])).toEqual({ ...NOTHING_CHANGED, regionsChanged: 1, versionsRemoved: 1 })
  expect(await ownedBy('germany')).toEqual(before)
})

test("researchRows counts each file's own versions, places, statuses and groups, and a place written outside research is in none of them and stays after a load", async () => {
  await prisma.region.create({ data: { code: 'TR-34.sb202-outside', countryCode: 'tr', parentCode: 'TR-34', name: 'Written outside research' } })
  expect(await loadResearchRules(prisma, COUNTRIES)).toEqual(NOTHING_CHANGED)

  const response = await graphql('{ researchRows { research versions places statuses groups } }')
  expect(response.body.errors).toBeUndefined()
  expect(response.body.data.researchRows).toEqual(
    COUNTRIES.map((rules) => ({
      research: rules.research,
      versions: rules.versions.length,
      places: rules.regions.length,
      statuses: rules.statuses.length,
      groups: rules.nationalityGroups.length,
    })).sort((a, b) => a.research.localeCompare(b.research)),
  )
  expect((await prisma.region.findUniqueOrThrow({ where: { code: 'TR-34.sb202-outside' } })).research).toBeNull()
  await prisma.region.delete({ where: { code: 'TR-34.sb202-outside' } })
})

// The research lock's single integer key, reassembled from how pg_locks shows a
// one-key advisory lock, so it is told apart from Prisma migrate's own.
const RESEARCH_LOCKS = `
  SELECT mode, granted FROM pg_locks
  WHERE locktype = 'advisory' AND objsubid = 1
    AND ((classid::bigint << 32) | objid::bigint) = hashtext('skipbureau_research_rules')::bigint`

const RESEARCH_LOAD = `SELECT current_setting('skipbureau.research_load', true) AS value`

test('a load holds the research lock and the research setting in the transaction that runs it, and neither outlasts it', async () => {
  const held = await prisma.$transaction(async (tx) => {
    await loadInto(tx, [TURKEY])
    return {
      locks: await tx.$queryRawUnsafe<{ mode: string; granted: boolean }[]>(RESEARCH_LOCKS),
      setting: await tx.$queryRawUnsafe<{ value: string | null }[]>(RESEARCH_LOAD),
    }
  })
  expect(held).toEqual({ locks: [{ mode: 'ExclusiveLock', granted: true }], setting: [{ value: 'on' }] })
  expect(await prisma.$queryRawUnsafe<{ mode: string; granted: boolean }[]>(RESEARCH_LOCKS)).toEqual([])
  expect((await prisma.$queryRawUnsafe<{ value: string | null }[]>(RESEARCH_LOAD))[0]?.value).not.toBe('on')
})
