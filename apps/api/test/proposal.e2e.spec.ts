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
import { LIMITS, SubmissionLimit } from '../src/proposal/submissionLimit.js'
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
let limit: SubmissionLimit
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
  limit = app.get(SubmissionLimit)
  await seed(prisma)
}, 180_000)

afterAll(async () => {
  await app?.close()
  await stopDatabase?.()
})

// Each test starts from an empty table and a limiter that remembers nothing,
// so a count is a statement about that test rather than about the order the
// file happened to run in.
beforeEach(async () => {
  await prisma.proposal.deleteMany()
  limit.forget()
})

const graphql = (query: string, variables: Record<string, unknown> = {}, from?: string) => {
  const call = request(app.getHttpServer()).post('/graphql')
  // Where a test says who is asking, it says it the way the edge does: the
  // last entry of the forwarded header is what the limiter keys on (SB-050).
  return (from ? call.set('X-Forwarded-For', from) : call).send({ query, variables })
}

const SUGGEST = `mutation S($input: SuggestUpdateInput!) { suggestUpdate(input: $input) { received problem } }`

// One address per caller. Without one, every test in this file would be the
// same client and the second submission of each would be refused by the pause
// between submissions, which is the limiter working rather than a broken test.
const suggest = async (input: Record<string, unknown>, from = `203.0.113.${Math.floor(Math.random() * 250) + 1}`) => {
  const response = await graphql(SUGGEST, { input: { ...GUIDE, ...input } }, from)
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
  // Two readers, so two addresses: the same one twice is what the limiter is
  // for, and that is the test below.
  await suggest({ change: 'The office moved to the second floor.' }, '198.51.100.1')
  await suggest({ change: 'The office moved to the second floor.' }, '198.51.100.2')

  expect(await prisma.proposal.count()).toBe(2)
})

test('a hundred submissions in a minute are refused, and a person straight afterwards is not', async () => {
  // The card's exit condition, both halves. A limiter that stops the flood and
  // then stops the next reader has turned spam into an outage.
  const flood = []
  for (let index = 0; index < 100; index += 1) flood.push(await suggest({ change: `flood ${index}` }, '203.0.113.200'))

  expect(flood.filter((answer) => answer.received)).toHaveLength(1)
  expect(new Set(flood.slice(1).map((answer) => answer.problem))).toEqual(new Set(['tooMany']))
  expect(await prisma.proposal.count(), 'the flood reached the table').toBe(1)

  expect(await suggest({ change: 'The queue number is now taken at the door.' }, '203.0.113.201')).toEqual({ received: true, problem: null })
  expect(await prisma.proposal.count()).toBe(2)
})

test('one guide cannot be buried, and the guide beside it is untouched', async () => {
  // Counted from the table rather than from memory, so it holds across a
  // restart and across instances. This is what an attacker with many
  // addresses runs into, and it protects the queue a person has to read.
  for (let index = 0; index < LIMITS.perGuide; index += 1) {
    expect(await suggest({ change: `correction ${index}` }, `192.0.2.${index + 1}`).then((answer) => answer.received)).toBe(true)
  }

  expect(await suggest({ change: 'one too many' }, '192.0.2.200')).toEqual({ received: false, problem: 'tooMany' })
  expect(await prisma.proposal.count({ where: { guide: { slug: 'sim-card' } } })).toBe(LIMITS.perGuide)

  // A different guide is a different queue.
  expect(await suggest({ change: 'A real correction.', guide: 'register-your-address' }, '192.0.2.201')).toEqual({ received: true, problem: null })
})

test('a hidden field nobody sees, filled in, is taken for a machine', async () => {
  // It stops a form-filling bot in a real browser and nothing else: anything
  // posting to this API directly omits the field. The limits above are what
  // stop that, and this should never be described as more.
  expect(await suggest({ change: 'A real correction.', website: 'http://spam.example' })).toEqual({ received: false, problem: 'bot' })
  expect(await prisma.proposal.count()).toBe(0)
})

test('a body too large is refused before anything reads it', async () => {
  // "At the edge rather than stored": the resolver's own bound on `change`
  // would refuse this too, but only after parsing a megabyte of JSON. This
  // says what the HTTP layer does rather than trusting that it does anything.
  const response = await request(app.getHttpServer())
    .post('/graphql')
    .send({ query: SUGGEST, variables: { input: { ...GUIDE, change: 'x'.repeat(1_000_000) } } })

  expect(response.status).toBe(413)
  expect(await prisma.proposal.count()).toBe(0)
})

