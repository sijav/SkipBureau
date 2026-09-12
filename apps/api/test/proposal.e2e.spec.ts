import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { AppModule } from '../src/app.module.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { seed } from '../prisma/seed.js'
import { startPglite } from '../scripts/pglite-server.mjs'

/**
 * A visitor's suggestion is stored for an editor and never edits the guide.
 *
 * Every case reads the rows back. The mutation answers `received: true` from
 * its own return statement, so an answer proves what the resolver believes,
 * and only the table proves what happened.
 */

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5499

const GUIDE = { country: 'tr', guide: 'sim-card', locale: 'en-US' }

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
  await seed(prisma)
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

// Each test starts from an empty table, so a count is a statement about that
// test rather than about the order the file happened to run in.
beforeEach(async () => {
  await prisma.proposal.deleteMany()
})

const graphql = (query: string, variables: Record<string, unknown> = {}) => request(app.getHttpServer()).post('/graphql').send({ query, variables })

const SUGGEST = `mutation S($input: SuggestUpdateInput!) { suggestUpdate(input: $input) { received problem } }`

const suggest = async (input: Record<string, unknown>) => {
  const response = await graphql(SUGGEST, { input: { ...GUIDE, ...input } })
  expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
  return response.body.data.suggestUpdate as { received: boolean; problem: string | null }
}

test('a suggestion with nothing but the change is stored, pending, against the guide it was written on', async () => {
  // No email, because there are no accounts and the form asks for none.
  expect(await suggest({ change: 'The Turkcell counter at the airport closed in June.' })).toEqual({ received: true, problem: null })

  const rows = await prisma.proposal.findMany({ include: { guide: true } })
  expect(rows).toHaveLength(1)
  const [stored] = rows
  expect(stored?.change).toBe('The Turkcell counter at the airport closed in June.')
  expect(stored?.guide.slug).toBe('sim-card')
  expect(stored?.guide.countryCode).toBe('tr')
  expect(stored?.locale).toBe('en-US')
  expect(stored?.status).toBe('pending')
  expect(stored?.email).toBeNull()
  expect(stored?.source).toBeNull()
})

test('a source and an address are kept as given', async () => {
  await suggest({ change: 'The fee is 200 lira now.', source: 'https://www.btk.gov.tr/', email: 'reader@example.com' })

  const [stored] = await prisma.proposal.findMany()
  expect(stored?.source).toBe('https://www.btk.gov.tr/')
  expect(stored?.email).toBe('reader@example.com')
})

test('the guide a suggestion is written on does not change', async () => {
  // The assertion this card is actually about. A resolver that edited the
  // guide would still answer `received: true`, so the guide is read whole,
  // before and after, and compared.
  //
  // Its own guide, which nothing else in this file writes to, and the seeded
  // title named outright. Written against the guide the tests above suggest
  // on, this proved nothing: those had already clobbered it, so `before` was
  // read after the damage and the comparison held. A guide nobody else
  // touches makes `before` pristine; the title says so rather than assuming
  // it. Planted against a resolver that renames the guide it stores a
  // suggestion for, this fails, which is how it is known to check anything.
  const own = { ...GUIDE, guide: 'register-your-address' }
  const read = async () => {
    const response = await graphql(
      `query G($country: String!, $slug: String!) {
        guide(country: $country, slug: $slug) {
          slug title description intro quickAnswer verifiedAt locale showSuggestUpdate cost time deadlines costNote
          sections { kind position title body note callout calloutBody steps { position title body note label } }
          options { title body bestFor caveat }
          sources { url name publisher official note verifiedAt }
          related { slug title description }
        }
      }`,
      { country: own.country, slug: own.guide },
    )
    expect(response.body.errors, JSON.stringify(response.body.errors)).toBeUndefined()
    return response.body.data.guide
  }

  const before = await read()
  expect(before.title, 'the guide was already edited before this test read it').toBe('Register your address')
  expect(before.sections.length, 'the guide this reads is empty, so it could not show a change').toBeGreaterThan(0)

  await suggest({ ...own, change: 'Every word of this guide is wrong and should say something else.' })

  const after = await read()
  expect(after.title).toBe('Register your address')
  expect(after).toEqual(before)
})

test('each refusal names the field to fix, and stores nothing', async () => {
  const tooLong = (length: number) => 'x'.repeat(length)

  // Every one attempted, not reasoned about, and the table read after all of them.
  expect(await suggest({ change: '   ' })).toEqual({ received: false, problem: 'change' })
  expect(await suggest({ change: tooLong(5001) })).toEqual({ received: false, problem: 'change' })
  expect(await suggest({ change: 'A real correction.', source: tooLong(2001) })).toEqual({ received: false, problem: 'source' })
  expect(await suggest({ change: 'A real correction.', email: 'not an address' })).toEqual({ received: false, problem: 'email' })
  expect(await suggest({ change: 'A real correction.', guide: 'no-such-guide' })).toEqual({ received: false, problem: 'guide' })
  expect(await suggest({ change: 'A real correction.', country: 'zz' })).toEqual({ received: false, problem: 'guide' })

  expect(await prisma.proposal.count(), 'a refused suggestion was stored anyway').toBe(0)

  // And the bounds are bounds rather than a refusal of everything: the same
  // fields one character shorter are accepted.
  expect(await suggest({ change: tooLong(5000), source: tooLong(2000), email: 'reader@example.com' })).toEqual({ received: true, problem: null })
  expect(await prisma.proposal.count()).toBe(1)
})

test('two readers correcting the same guide are two rows', async () => {
  // Nothing about a proposal is unique. A schema that collapsed these would
  // throw away the second reader's correction without telling either of them.
  await suggest({ change: 'The office moved to the second floor.' })
  await suggest({ change: 'The office moved to the second floor.' })

  expect(await prisma.proposal.count()).toBe(2)
})
