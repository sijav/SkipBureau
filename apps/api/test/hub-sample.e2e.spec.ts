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
import { loadResearchedGuides } from '../src/guide/researched-guides.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { startPglite } from '../scripts/pglite-server.mjs'

// SB-302: a hub says whether what it shows was written by sample content, so a page of researched guides stops telling
// a reader its content is design material. Only two writers make these rows, and the researched loader's are listed.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5506

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
  // The sample fixture first, then the researched guides over it, as production loads them.
  await seed(prisma)
  await loadResearchedGuides(prisma)
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

const graphql = (query: string) => request(app.getHttpServer()).post('/graphql').send({ query })

const answer = async (query: string): Promise<Record<string, unknown>> => {
  const response = await graphql(query)
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  return response.body.data
}

test('an area of researched guides is not sample, one the research does not name is, and a goal holding both is', async () => {
  const areas = await answer(`{
    researched: categoryHub(country: "tr", goal: "getting-settled", slug: "register-your-address") { slug sample }
    sample: categoryHub(country: "tr", goal: "getting-settled", slug: "first-week") { slug sample }
    goal: taskHub(country: "tr", slug: "getting-settled") { slug sample areas { slug } }
  }`)

  expect(areas['researched']).toEqual({ slug: 'register-your-address', sample: false })
  expect(areas['sample']).toEqual({ slug: 'first-week', sample: true })
  const goal = areas['goal'] as { slug: string; sample: boolean; areas: { slug: string }[] }
  const slugs = goal.areas.map((area) => area.slug)
  expect(slugs, 'the sample area the goal holds').toContain('first-week')
  // SB-304: this test's name ends 'and a goal holding both is', and only the sample half was ever asserted. Without
  // this line the goal could hold nothing but sample areas and the test would still pass under that name.
  expect(slugs, 'the researched area the goal holds, which is what makes it a goal holding both').toContain('register-your-address')
  expect(goal.sample, 'a goal holding one sample area says so').toBe(true)
})

test("a country's common questions are sample content wherever it has any, since nothing else writes them", async () => {
  const both = await answer('{ tr: sampleQuestions(country: "tr") de: sampleQuestions(country: "de") }')
  expect(both).toEqual({ tr: true, de: false })
})
