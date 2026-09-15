import { PrismaPg } from '@prisma/adapter-pg'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { RESEARCHED } from '../src/rules/research/countries.js'
import { GERMANY } from '../src/rules/research/germany.js'
import { loadResearchRules } from '../src/rules/research/load.js'
import { TURKEY } from '../src/rules/research/turkey.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-223: the deployed database never runs the seed, so there every region a research
// file names is written with the file's own name. This database gets the migrations and
// the two countries, as bootstrap gives them, and nothing else before the load.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5467

let prisma: PrismaClient
let stopDatabase: () => Promise<void>

beforeAll(async () => {
  const database = await startPglite(PORT)
  stopDatabase = database.stop

  await promisify(execFile)(
    process.execPath,
    [createRequire(import.meta.url).resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    { cwd: API, env: { ...process.env, DATABASE_URL: database.url }, encoding: 'utf8' },
  )

  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.url }) })
  await prisma.country.createMany({
    data: [
      { code: 'tr', name: 'Turkey' },
      { code: 'de', name: 'Germany' },
    ],
  })
}, 180_000)

afterAll(async () => {
  await prisma?.$disconnect()
  await stopDatabase?.()
})

const byCode = (a: { code: string }, b: { code: string }) => (a.code < b.code ? -1 : 1)

test("on a database the seed never touched, every researched country's regions are exactly its file's, names included, and a second load adds none", async () => {
  // The list the loader and the specs share, held to the files themselves, so a
  // country left out of it cannot pass by being left out of this test too.
  expect(RESEARCHED).toEqual([TURKEY, GERMANY])

  const report = await loadResearchRules(prisma, RESEARCHED)
  expect(report.regionsAdded).toBe(TURKEY.regions.length + GERMANY.regions.length)

  for (const rules of [TURKEY, GERMANY]) {
    const stored = await prisma.region.findMany({ where: { countryCode: rules.country }, select: { code: true, parentCode: true, name: true } })
    const written = rules.regions.map((region) => ({ code: region.code, parentCode: region.parent, name: region.name }))
    expect(stored.sort(byCode), rules.country).toEqual(written.sort(byCode))
  }
  expect([TURKEY.regions.length, GERMANY.regions.length]).toEqual([81, 16])

  expect((await loadResearchRules(prisma, RESEARCHED)).regionsAdded).toBe(0)
})
