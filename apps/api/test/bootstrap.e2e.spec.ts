import { PrismaPg } from '@prisma/adapter-pg'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { bootstrap } from '../src/bootstrap.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { TASKS } from '../src/tasks.js'

// SB-199: the sample content no longer runs on a deployed database, so the bootstrap is the only thing that writes
// the twelve goals there. This runs the function the entrypoint's script runs, against an empty database, rather than
// the writer underneath it: a test of that writer would pass while the production path was broken.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5507

let prisma: PrismaClient
let stopDatabase: () => Promise<void>

beforeAll(async () => {
  const { startPglite } = await import('../scripts/pglite-server.mjs')
  const database = await startPglite(PORT)
  stopDatabase = database.stop
  await promisify(execFile)(process.execPath, [createRequire(import.meta.url).resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: API,
    env: { ...process.env, DATABASE_URL: database.url },
    encoding: 'utf8',
  })
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.url }) })
}, 180_000)

afterAll(async () => {
  await prisma?.$disconnect()
  await stopDatabase?.()
})

test('the bootstrap writes the countries, their names and the twelve goals into an empty database', async () => {
  expect(await prisma.task.count(), 'the database starts empty').toBe(0)

  await bootstrap(prisma)

  expect((await prisma.country.findMany({ select: { code: true } })).map((row) => row.code).sort()).toEqual(['de', 'tr'])
  // SB-414: a name for every country in every locale the product ships, asserted as the
  // cross product rather than as a total. `toBe(4)` was a count from when there were two
  // locales, and a count is the weakest form of this check: eight rows would satisfy it
  // even if half of them named the wrong locale, or if one country had four names and
  // the other none. Naming the locales also makes adding one a deliberate act, because
  // this fails until someone decides what the country is called in it.
  const names = await prisma.countryText.findMany({ select: { countryCode: true, locale: true } })
  const shipped = [...new Set(names.map((name) => name.locale))].sort()
  expect(shipped).toEqual(['de-DE', 'en-US', 'fa-IR', 'tr-TR'])
  expect(names.map((name) => `${name.countryCode} ${name.locale}`).sort()).toEqual(
    ['de', 'tr'].flatMap((code) => shipped.map((locale) => `${code} ${locale}`)).sort(),
  )

  const goals = await prisma.task.findMany({ select: { slug: true }, orderBy: { position: 'asc' } })
  expect(goals.map((goal) => goal.slug)).toEqual(TASKS.map((task) => task.slug))

  // Both languages, for every goal, which is what a hub and Home read.
  const texts = await prisma.taskText.findMany({ select: { locale: true } })
  expect(texts.length).toBe(TASKS.length * 2)
  expect([...new Set(texts.map((text) => text.locale))].sort()).toEqual(['en-US', 'fa-IR'])
})

test('a second start adds nothing and overwrites nothing an editor has written', async () => {
  const goal = TASKS[0]?.slug ?? ''
  await prisma.taskText.updateMany({ where: { locale: 'en-US', task: { slug: goal } }, data: { title: 'An editor said this' } })

  await bootstrap(prisma)

  expect(await prisma.country.count()).toBe(2)
  expect(await prisma.task.count()).toBe(TASKS.length)
  const edited = await prisma.taskText.findFirst({ where: { locale: 'en-US', task: { slug: goal } }, select: { title: true } })
  expect(edited?.title, 'fill-only: a start does not undo an edit').toBe('An editor said this')
})
