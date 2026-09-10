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
import { startPglite } from '../scripts/pglite-server.mjs'

/**
 * The whole chain, over HTTP, against Postgres.
 *
 * Not a mocked resolver: the migration that builds this database is the same
 * SQL a deployment receives, applied by the same `prisma migrate deploy`. A
 * test with a stubbed Prisma proves the resolver calls a function, which is
 * not what the exit condition asks for.
 */

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5461

let app: INestApplication
let stopDatabase: () => Promise<void>

beforeAll(async () => {
  const database = await startPglite(PORT)
  stopDatabase = database.stop
  process.env.DATABASE_URL = database.url

  // Asynchronously, and this is not a style choice. PGlite's socket server
  // runs in THIS process, so a synchronous child process blocks the event loop
  // and the server never accepts the migration's connection. The symptom is
  // `Can't reach database server`, pointing at a server that is running fine.
  await promisify(execFile)(process.execPath, [createRequire(import.meta.url).resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: API,
    env: { ...process.env, DATABASE_URL: database.url },
    encoding: 'utf8',
  })

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = moduleRef.createNestApplication()
  await app.init()
}, 120_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

const graphql = (query: string, variables: Record<string, unknown> = {}) =>
  request(app.getHttpServer()).post('/graphql').send({ query, variables })

test('the API answers', async () => {
  const response = await graphql('{ health }')

  expect(response.status).toBe(200)
  expect(response.body.data.health).toBe(true)
})

test('a country written to Postgres comes back through GraphQL', async () => {
  // Written with Prisma, read over HTTP, so both halves of the wiring are in
  // the assertion rather than only one.
  const { PrismaService } = await import('../src/prisma/prisma.service.js')
  const prisma = new PrismaService()
  await prisma.country.create({ data: { code: 'tr', name: 'Turkey' } })
  await prisma.$disconnect()

  const response = await graphql('query One($code: String!) { country(code: $code) { code name } }', { code: 'tr' })

  expect(response.status).toBe(200)
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  expect(response.body.data.country).toEqual({ code: 'tr', name: 'Turkey' })
})

test('a country we do not cover is null, not an error', async () => {
  // The resolver is nullable on purpose: not covering a country is an ordinary
  // answer, and the web app turns it into Not Found rather than into a crash.
  const response = await graphql('query One($code: String!) { country(code: $code) { code } }', { code: 'zz' })

  expect(response.body.errors).toBeUndefined()
  expect(response.body.data.country).toBeNull()
})

test('the schema is emitted for the web app to generate from', async () => {
  const { readFileSync } = await import('node:fs')
  const sdl = readFileSync(join(API, 'schema.gql'), 'utf8')

  expect(sdl).toContain('type Country')
  expect(sdl).toContain('country(code: String!, locale: String = "en-US"): Country')
})
