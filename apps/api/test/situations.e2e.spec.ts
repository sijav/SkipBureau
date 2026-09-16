import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import request from 'supertest'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { seed } from '../prisma/seed.js'
import { AppModule } from '../src/app.module.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { RESEARCHED } from '../src/rules/research/countries.js'
import { loadResearchRules } from '../src/rules/research/load.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-286: the situations a reader can give as their Role are the ones a country's researched rules name, never one that
// only a rule research did not write names, such as the seed's student.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5505

let app: INestApplication
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
  const prisma = app.get(PrismaService)
  await seed(prisma)
  await loadResearchRules(prisma, RESEARCHED)
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

// SB-382: derived from RESEARCHED rather than written out. A situation appears the moment a researched version names
// one, which is what the resolver is for and what its own description says, so a written-out set goes red exactly when
// the product works: SB-212 gave Turkey existing-company-owner and this spec failed for doing its job. Derived, it
// still travels a different road from the answer it checks, as situationLabels.test.ts and factLabels.test.ts do. The
// expectation is computed from the source files; the answer comes back through the loader's rows and the resolver's
// filters, so a criterion the loader drops, files under the wrong country, or writes with a null research still fails
// here. What it gives up is catching a situation the research itself adds by mistake, and situationLabels.test.ts
// holds that line by failing any situation with no name for a reader.
const situationsOf = (country: string): string[] =>
  [
    ...new Set(
      RESEARCHED.filter((rules) => rules.country === country)
        .flatMap((rules) => rules.versions)
        .flatMap((version) => version.criteria)
        .filter((criterion) => criterion.dimension === 'situation')
        .map((criterion) => criterion.value),
    ),
  ].sort()

test("a country's situations are the ones its researched rules name, sorted, and not the seed's own", async () => {
  const prisma = app.get(PrismaService)
  const seeded = await prisma.eligibilityCriterion.count({ where: { dimension: 'situation', value: 'student', ruleVersion: { research: null } } })
  expect(seeded, "the seed's rules name student, which no research does").toBeGreaterThan(0)

  const response = await request(app.getHttpServer())
    .post('/graphql')
    .send({ query: '{ tr: situations(country: "tr") de: situations(country: "de") pt: situations(country: "pt") }' })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  // Sorted arrays, not sets: the resolver promises an order and this test's name repeats it. JavaScript orders by
  // UTF-16 code unit and Postgres by its collation, and the two can part around punctuation. Today's values differ at
  // their first letter, so they cannot; if a future pair ever does, this goes red and the order gets decided rather
  // than assumed.
  expect(situationsOf('tr').length, 'the research names no situation for Turkey at all').toBeGreaterThan(0)
  expect(response.body.data).toEqual({ tr: situationsOf('tr'), de: situationsOf('de'), pt: situationsOf('pt') })
})
