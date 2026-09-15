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

test("a country's situations are the ones its researched rules name, sorted, and not the seed's own", async () => {
  const prisma = app.get(PrismaService)
  const seeded = await prisma.eligibilityCriterion.count({ where: { dimension: 'situation', value: 'student', ruleVersion: { research: null } } })
  expect(seeded, "the seed's rules name student, which no research does").toBeGreaterThan(0)

  const response = await request(app.getHttpServer())
    .post('/graphql')
    .send({ query: '{ tr: situations(country: "tr") de: situations(country: "de") pt: situations(country: "pt") }' })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  expect(response.body.data).toEqual({ tr: ['company-founder', 'worker'], de: ['company-founder'], pt: [] })
})
