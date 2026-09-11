import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { seed } from '../prisma/seed.js'
import { startPglite } from '../scripts/pglite-server.mjs'
import type { PrismaService } from '../src/prisma/prisma.service.js'

// SB-081: a rule's history is append only throughout. Each refusal is
// attempted against the database itself and the row read back unchanged.

const API = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5462

let prisma: PrismaService
let stopDatabase: () => Promise<void>

const day = (offset = 0) => new Date(new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10))
const TODAY = day()
const NEXT_MONTH = day(30)
const source = { sourceUrl: 'https://example.gov', sourceName: 'test', verifiedAt: new Date('2026-09-10') }

beforeAll(async () => {
  const database = await startPglite(PORT)
  stopDatabase = database.stop
  process.env.DATABASE_URL = database.url
  await promisify(execFile)(process.execPath, [createRequire(import.meta.url).resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: API,
    env: { ...process.env, DATABASE_URL: database.url },
    encoding: 'utf8',
  })
  // After DATABASE_URL, which the service reads when it is built.
  const { PrismaService } = await import('../src/prisma/prisma.service.js')
  prisma = new PrismaService()
  await prisma.$connect()
  await seed(prisma)
}, 120_000)

afterAll(async () => {
  await prisma.$disconnect()
  await stopDatabase()
})

const obligationId = async (slug = 'open-a-blocked-account') => (await prisma.obligation.findUniqueOrThrow({ where: { slug } })).id

test('a closed version records with its parts, and none of them can then be changed, removed or added', async () => {
  const closed = await prisma.ruleVersion.create({
    data: {
      countryCode: 'de',
      obligationId: await obligationId(),
      validFrom: new Date('2018-01-01'),
      validTo: new Date('2019-01-01'),
      ...source,
      criteria: { create: [{ dimension: 'situation', value: 'sb081-closed' }] },
      texts: { create: [{ locale: 'en-US', notes: 'as it was' }] },
      facts: { create: [{ key: 'fee', numericValue: 10, currency: 'EUR' }] },
    },
    include: { criteria: true, facts: true },
  })
  const criterion = closed.criteria[0]!
  const fact = closed.facts[0]!

  await expect(prisma.eligibilityCriterion.update({ where: { id: criterion.id }, data: { value: 'someone-else' } })).rejects.toThrow(/history/)
  await expect(prisma.eligibilityCriterion.delete({ where: { id: criterion.id } })).rejects.toThrow(/history/)
  await expect(prisma.eligibilityCriterion.create({ data: { ruleVersionId: closed.id, dimension: 'nationality', value: 'ir' } })).rejects.toThrow(/history/)
  await expect(
    prisma.ruleText.update({ where: { ruleVersionId_locale: { ruleVersionId: closed.id, locale: 'en-US' } }, data: { notes: 'rewritten' } }),
  ).rejects.toThrow(/history/)
  await expect(prisma.ruleText.delete({ where: { ruleVersionId_locale: { ruleVersionId: closed.id, locale: 'en-US' } } })).rejects.toThrow(/history/)
  await expect(prisma.ruleText.create({ data: { ruleVersionId: closed.id, locale: 'fa-IR', notes: 'added later' } })).rejects.toThrow(/history/)
  await expect(prisma.ruleFact.create({ data: { ruleVersionId: closed.id, key: 'deadline', numericValue: 14, unit: 'days' } })).rejects.toThrow(/history/)

  // Moved off it, to a draft that would take it: SB-102's case.
  const draft = await prisma.ruleVersion.create({
    data: { countryCode: 'de', obligationId: await obligationId(), validFrom: NEXT_MONTH, ...source, criteria: { create: [{ dimension: 'situation', value: 'sb081-draft' }] } },
  })
  await expect(prisma.ruleFact.update({ where: { id: fact.id }, data: { ruleVersionId: draft.id } })).rejects.toThrow(/history/)
  // And to a version in force: the one it leaves is read, not only the one it joins.
  const inForce = await prisma.ruleVersion.create({
    data: { countryCode: 'de', obligationId: await obligationId(), validFrom: new Date('2020-01-01'), ...source, criteria: { create: [{ dimension: 'situation', value: 'sb081-in-force' }] } },
  })
  await expect(prisma.ruleFact.update({ where: { id: fact.id }, data: { ruleVersionId: inForce.id } })).rejects.toThrow(/history/)

  const after = await prisma.ruleVersion.findUniqueOrThrow({ where: { id: closed.id }, include: { criteria: true, texts: true, facts: true } })
  expect(after.criteria.map(({ dimension, value }) => [dimension, value])).toEqual([['situation', 'sb081-closed']])
  expect(after.texts.map(({ locale, notes }) => [locale, notes])).toEqual([['en-US', 'as it was']])
  expect(after.facts.map(({ key, ruleVersionId }) => [key, ruleVersionId])).toEqual([['fee', closed.id]])
})

test('a version in force is history too: it can be closed from today on, and nothing else', async () => {
  const open = await prisma.ruleVersion.create({
    data: {
      countryCode: 'tr',
      obligationId: await obligationId(),
      validFrom: new Date('2020-01-01'),
      ...source,
      criteria: { create: [{ dimension: 'situation', value: 'sb081-open' }] },
      facts: { create: [{ key: 'fee', numericValue: 20, currency: 'TRY' }] },
    },
  })

  await expect(prisma.ruleVersion.update({ where: { id: open.id }, data: { sourceName: 'rewritten' } })).rejects.toThrow(/in force since/)
  await expect(prisma.ruleVersion.update({ where: { id: open.id }, data: { verifiedAt: TODAY } })).rejects.toThrow(/in force since/)
  // Closed in the past, it would say it stopped when readers were told it held.
  await expect(prisma.ruleVersion.update({ where: { id: open.id }, data: { validTo: new Date('2024-01-01') } })).rejects.toThrow(/in force since/)
  await expect(prisma.ruleVersion.delete({ where: { id: open.id } })).rejects.toThrow(/in force since/)
  // Nor by deleting what it hangs from: the cascade reaches its trigger.
  await expect(prisma.obligation.delete({ where: { id: open.obligationId } })).rejects.toThrow(/history/)
  await expect(prisma.ruleFact.create({ data: { ruleVersionId: open.id, key: 'deadline', numericValue: 30, unit: 'days' } })).rejects.toThrow(/history/)

  const unchanged = await prisma.ruleVersion.findUniqueOrThrow({ where: { id: open.id }, include: { facts: true } })
  expect([unchanged.sourceName, unchanged.validTo, unchanged.verifiedAt, unchanged.facts.length]).toEqual(['test', null, source.verifiedAt, 1])

  // Closing it from today is how it is superseded, and that stays possible.
  await prisma.ruleVersion.update({ where: { id: open.id }, data: { validTo: TODAY } })
  expect((await prisma.ruleVersion.findUniqueOrThrow({ where: { id: open.id } })).validTo).toEqual(TODAY)
})

test('a draft can change, but not be moved to start in the past, and can be deleted with its parts', async () => {
  const draft = await prisma.ruleVersion.create({
    data: { countryCode: 'tr', obligationId: await obligationId('get-a-tax-number'), validFrom: NEXT_MONTH, ...source, criteria: { create: [{ dimension: 'situation', value: 'sb081-planned' }] } },
  })

  await prisma.ruleVersion.update({ where: { id: draft.id }, data: { sourceName: 'corrected before it starts' } })
  await prisma.ruleFact.create({ data: { ruleVersionId: draft.id, key: 'fee', numericValue: 5, currency: 'TRY' } })
  await expect(prisma.ruleVersion.update({ where: { id: draft.id }, data: { validFrom: new Date('2024-01-01') } })).rejects.toThrow(/start in the past/)
  expect((await prisma.ruleVersion.findUniqueOrThrow({ where: { id: draft.id } })).validFrom).toEqual(NEXT_MONTH)

  await prisma.ruleVersion.delete({ where: { id: draft.id } })
  expect(await prisma.ruleFact.count({ where: { ruleVersionId: draft.id } })).toBe(0)
})

test('criteria cannot give a draft the scope of a version already in force', async () => {
  const obligation = await obligationId('get-a-residence-permit')
  await prisma.ruleVersion.create({
    data: { countryCode: 'tr', obligationId: obligation, validFrom: new Date('2020-01-01'), ...source, criteria: { create: [{ dimension: 'situation', value: 'sb081-student' }] } },
  })
  const draft = await prisma.ruleVersion.create({
    data: { countryCode: 'tr', obligationId: obligation, validFrom: NEXT_MONTH, ...source, criteria: { create: [{ dimension: 'situation', value: 'sb081-worker' }] } },
    include: { criteria: true },
  })

  // The draft now reads as for the same people, over a period the other covers.
  await expect(prisma.eligibilityCriterion.update({ where: { id: draft.criteria[0]!.id }, data: { value: 'sb081-student' } })).rejects.toThrow(/overlapping period/)
  expect((await prisma.eligibilityCriterion.findUniqueOrThrow({ where: { id: draft.criteria[0]!.id } })).value).toBe('sb081-worker')
})

test('a group membership that has taken effect cannot be changed or removed, nor its group deleted', async () => {
  const [germany] = await prisma.nationalityGroupMember.findMany({ where: { groupCode: 'eu', nationality: 'de' } })
  const [britain] = await prisma.nationalityGroupMember.findMany({ where: { groupCode: 'eu', nationality: 'gb' } })

  await expect(prisma.nationalityGroupMember.update({ where: { id: germany!.id }, data: { validFrom: new Date('2010-01-01') } })).rejects.toThrow(/history/)
  await expect(prisma.nationalityGroupMember.update({ where: { id: britain!.id }, data: { validTo: new Date('2021-01-01') } })).rejects.toThrow(/history/)
  await expect(prisma.nationalityGroupMember.delete({ where: { id: britain!.id } })).rejects.toThrow(/history/)
  await expect(prisma.nationalityGroup.delete({ where: { code: 'eu' } })).rejects.toThrow(/history/)

  expect((await prisma.nationalityGroupMember.findUniqueOrThrow({ where: { id: germany!.id } })).validFrom).toEqual(germany!.validFrom)
  expect((await prisma.nationalityGroupMember.findUniqueOrThrow({ where: { id: britain!.id } })).validTo).toEqual(britain!.validTo)

  // A country leaving from today, and one joining next month, are both new facts.
  await prisma.nationalityGroupMember.update({ where: { id: germany!.id }, data: { validTo: TODAY } })
  const joining = await prisma.nationalityGroupMember.create({ data: { groupCode: 'eu', nationality: 'no', validFrom: NEXT_MONTH } })
  await prisma.nationalityGroupMember.delete({ where: { id: joining.id } })
})

test('the history tables cannot be truncated, directly or by cascade', async () => {
  await expect(prisma.$executeRawUnsafe('TRUNCATE "RuleText"')).rejects.toThrow(/TRUNCATE/)
  await expect(prisma.$executeRawUnsafe('TRUNCATE "Country" CASCADE')).rejects.toThrow(/TRUNCATE/)
  expect(await prisma.ruleVersion.count()).toBeGreaterThan(0)
})
