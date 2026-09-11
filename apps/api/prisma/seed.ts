import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { seedContent } from '../src/sample-content.js'

/**
 * Illustrative, not verified.
 *
 * Every source below is a real government page and every `verifiedAt` is the
 * date this file was written, by someone who is not an editor and did not
 * check the page that day. It exists so the diff has something non-trivial to
 * work on. Nothing here should reach a reader until an editor has been through
 * it, which is what the moderation queue is for.
 */

const VERIFIED = new Date('2026-09-10')
const FOREVER_AGO = new Date('2020-01-01')

const client = () =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable',
    }),
  })

type FactInput = {
  key: string
  operator?: 'equals' | 'atMost' | 'atLeast' | 'within'
  numericValue?: number
  textValue?: string
  unit?: string
  currency?: string
}

type RuleInput = {
  country: string
  obligation: string
  validFrom?: Date
  validTo?: Date
  sourceUrl: string
  sourceName: string
  criteria?: { dimension: 'nationality' | 'nationalityGroup' | 'situation'; value: string }[]
  facts: FactInput[]
  notes: { en: string; fa: string }
}

const OBLIGATIONS: { slug: string; kind: 'registration' | 'permit' | 'insurance' | 'tax' | 'document'; en: string; fa: string }[] = [
  { slug: 'register-your-address', kind: 'registration', en: 'Register your address', fa: 'ثبت نشانی محل سکونت' },
  { slug: 'get-a-residence-permit', kind: 'permit', en: 'Get a residence permit', fa: 'دریافت اجازه اقامت' },
  { slug: 'hold-health-insurance', kind: 'insurance', en: 'Hold health insurance', fa: 'داشتن بیمه درمانی' },
  { slug: 'get-a-tax-number', kind: 'tax', en: 'Get a tax number', fa: 'دریافت شماره مالیاتی' },
  { slug: 'open-a-blocked-account', kind: 'document', en: 'Open a blocked account', fa: 'افتتاح حساب مسدود' },
]

const RULES: RuleInput[] = [
  {
    country: 'tr',
    obligation: 'register-your-address',
    sourceUrl: 'https://www.nvi.gov.tr/',
    sourceName: 'Nufus ve Vatandaslik Isleri Genel Mudurlugu',
    facts: [{ key: 'deadline', operator: 'within', numericValue: 20, unit: 'days' }],
    notes: {
      en: 'Address registration is made at the district population directorate after you have a place to live.',
      fa: 'ثبت نشانی پس از پیدا کردن محل سکونت، در اداره نفوس منطقه انجام می‌شود.',
    },
  },
  {
    country: 'de',
    obligation: 'register-your-address',
    sourceUrl: 'https://www.berlin.de/einwohnermeldeamt/',
    sourceName: 'Berlin Einwohnermeldeamt',
    facts: [
      { key: 'deadline', operator: 'within', numericValue: 14, unit: 'days' },
      { key: 'requiredDocument', operator: 'equals', textValue: 'Wohnungsgeberbestaetigung' },
    ],
    notes: {
      en: 'The Anmeldung is made at a Buergeramt and needs a confirmation signed by whoever provides the flat.',
      fa: 'ثبت نشانی در اداره شهروندی انجام می‌شود و به تاییدیه امضا شده صاحب‌خانه نیاز دارد.',
    },
  },
  {
    country: 'tr',
    obligation: 'get-a-residence-permit',
    sourceUrl: 'https://e-ikamet.goc.gov.tr/',
    sourceName: 'Goc Idaresi Baskanligi',
    facts: [
      { key: 'applyBefore', operator: 'atLeast', numericValue: 60, unit: 'days' },
      { key: 'fee', operator: 'equals', numericValue: 80, currency: 'USD' },
    ],
    notes: {
      en: 'Applied for online, then in person at an appointment.',
      fa: 'درخواست به صورت آنلاین ثبت و سپس در وقت حضوری پیگیری می‌شود.',
    },
  },
  {
    country: 'de',
    obligation: 'get-a-residence-permit',
    criteria: [{ dimension: 'nationalityGroup', value: 'eu' }],
    sourceUrl: 'https://www.bamf.de/',
    sourceName: 'Bundesamt fuer Migration und Fluechtlinge',
    facts: [{ key: 'required', operator: 'equals', textValue: 'no' }],
    notes: {
      en: 'Freedom of movement applies, so no residence permit is needed.',
      fa: 'به دلیل آزادی تردد، اجازه اقامت لازم نیست.',
    },
  },
  {
    country: 'de',
    obligation: 'hold-health-insurance',
    sourceUrl: 'https://www.bundesgesundheitsministerium.de/',
    sourceName: 'Bundesministerium fuer Gesundheit',
    facts: [{ key: 'required', operator: 'equals', textValue: 'yes' }],
    notes: {
      en: 'Health insurance is compulsory for everyone resident in Germany.',
      fa: 'بیمه درمانی برای همه ساکنان آلمان اجباری است.',
    },
  },
  {
    country: 'tr',
    obligation: 'hold-health-insurance',
    criteria: [{ dimension: 'situation', value: 'student' }],
    sourceUrl: 'https://www.sgk.gov.tr/',
    sourceName: 'Sosyal Guvenlik Kurumu',
    facts: [{ key: 'required', operator: 'equals', textValue: 'yes' }],
    notes: {
      en: 'A student may join the general health insurance scheme within three months of first registration.',
      fa: 'دانشجو می‌تواند ظرف سه ماه از نخستین ثبت‌نام به بیمه همگانی بپیوندد.',
    },
  },
  {
    country: 'tr',
    obligation: 'get-a-tax-number',
    sourceUrl: 'https://ivd.gib.gov.tr/',
    sourceName: 'Gelir Idaresi Baskanligi',
    facts: [{ key: 'fee', operator: 'equals', numericValue: 0, currency: 'TRY' }],
    notes: {
      en: 'A tax number is free and is needed before almost anything else, including a bank account.',
      fa: 'شماره مالیاتی رایگان است و پیش از تقریبا هر کار دیگری، از جمله افتتاح حساب بانکی، لازم است.',
    },
  },
  {
    country: 'de',
    obligation: 'open-a-blocked-account',
    criteria: [{ dimension: 'situation', value: 'student' }],
    sourceUrl: 'https://www.auswaertiges-amt.de/',
    sourceName: 'Auswaertiges Amt',
    facts: [{ key: 'balance', operator: 'atLeast', numericValue: 11904, currency: 'EUR' }],
    notes: {
      en: 'A blocked account showing a year of living costs is required for a student visa.',
      fa: 'برای ویزای دانشجویی، حساب مسدود با هزینه زندگی یک سال لازم است.',
    },
  },
]

export const seed = async (prisma = client()): Promise<void> => {
  await prisma.country.createMany({
    data: [
      { code: 'tr', name: 'Turkey' },
      { code: 'de', name: 'Germany' },
    ],
    skipDuplicates: true,
  })

  await prisma.nationalityGroup.createMany({ data: [{ code: 'eu', name: 'European Union' }], skipDuplicates: true })

  // Dated, because which countries were in a group in 2019 is not which are
  // today, and a historical question must not be answered with today's groups.
  await prisma.nationalityGroupMember.createMany({
    data: [
      { groupCode: 'eu', nationality: 'de', validFrom: FOREVER_AGO },
      { groupCode: 'eu', nationality: 'fr', validFrom: FOREVER_AGO },
      { groupCode: 'eu', nationality: 'gb', validFrom: new Date('2000-01-01'), validTo: new Date('2020-02-01') },
    ],
    skipDuplicates: true,
  })

  for (const obligation of OBLIGATIONS) {
    const row = await prisma.obligation.upsert({
      where: { slug: obligation.slug },
      update: {},
      create: { slug: obligation.slug, kind: obligation.kind },
    })

    for (const [locale, title] of [
      ['en-US', obligation.en],
      ['fa-IR', obligation.fa],
    ] as const) {
      await prisma.obligationText.upsert({
        where: { obligationId_locale: { obligationId: row.id, locale } },
        update: { title },
        create: { obligationId: row.id, locale, title },
      })
    }
  }

  for (const rule of RULES) {
    const obligation = await prisma.obligation.findUniqueOrThrow({ where: { slug: rule.obligation } })

    // Versions are append-only and a trigger refuses an overlapping one, so a
    // second run would stop here. Each country and obligation is seeded once;
    // after that the versions are an editor's to add, never the seed's.
    const seeded = await prisma.ruleVersion.findFirst({ where: { countryCode: rule.country, obligationId: obligation.id }, select: { id: true } })
    if (seeded) continue

    await prisma.ruleVersion.create({
      data: {
        countryCode: rule.country,
        obligationId: obligation.id,
        validFrom: rule.validFrom ?? FOREVER_AGO,
        validTo: rule.validTo ?? null,
        sourceUrl: rule.sourceUrl,
        sourceName: rule.sourceName,
        verifiedAt: VERIFIED,
        criteria: { create: rule.criteria ?? [] },
        facts: {
          create: rule.facts.map((fact) => ({
            key: fact.key,
            operator: fact.operator ?? 'equals',
            numericValue: fact.numericValue ?? null,
            textValue: fact.textValue ?? null,
            unit: fact.unit ?? null,
            currency: fact.currency ?? null,
          })),
        },
        texts: {
          create: [
            { locale: 'en-US', notes: rule.notes.en },
            { locale: 'fa-IR', notes: rule.notes.fa },
          ],
        },
      },
    })
  }

  await seedContent(prisma)
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  const prisma = client()
  await seed(prisma)
  await prisma.$disconnect()
  console.log('seeded')
}
