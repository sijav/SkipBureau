import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'
import type { GuideDetailSeed } from './sample-types.js'
import { fillGuideDetail, linkObligationGroups } from './guide/guide-fill.js'
import { ADDRESS_GUIDE } from './guide/obligation-groups.js'
import { RESEARCHED_GUIDES } from './guide/researched-guides.js'
import { TASKS } from './tasks.js'

/**
 * Sample content, illustrative and not verified, mostly the design's own
 * sample copy. The design prints its own caveat on Home: figures, timings and
 * requirements are sample content for review, not verified legal information.
 *
 * The owner's order of 2026-09-10 is to build the screens and publish them so
 * they can be seen, and the database behind the deployment is a test one. So
 * the entrypoint runs this on every start. Before a real launch it comes out of
 * the entrypoint, which is one line; see PHASE-NEXT.md.
 *
 * FILL-ONLY: it creates what is missing and never overwrites a row that
 * exists, so an editor's change survives a restart, and it can run on every
 * start at all. The one thing it removes is a guide's link to the less
 * preferred of the address duties it names, so the guide links the researched
 * one once a research load has written it (SB-255, linkObligationGroups).
 *
 * It also retires what it no longer fills (SB-282). The owner answered on
 * 2026-09-15 that every Turkish sample guide, area and common question is
 * deleted from the deployed database and never refilled, and any visitor's
 * suggestion on those guides with them. Turkey's sample is a test fixture
 * now, prisma/sample-turkey.ts.
 *
 * It keeps the thing that is easy to get wrong: **one task shared between two
 * countries**, with country-specific categories, guides and sources hanging
 * off it. `{country}` in a task's text is the country's name, filled in by the
 * reader's app in the reader's language, because the task itself is global.
 */

const VERIFIED = new Date('2026-09-10')

export type Kind = 'decision' | 'ifItApplies' | 'ongoing' | 'alternativeRoute'

type GuideText = { title: string; description?: string; quickAnswer?: string; cost?: string; time?: string }

type GuideSeed = {
  slug: string
  category: string
  /** The duties this guide explains, each a group of alternatives, most preferred first (linkObligationGroups). */
  obligations?: readonly (readonly string[])[]
  verifiedAt?: Date
  position?: number
  readingMinutes?: number
  en: GuideText
  fa?: GuideText
  sections: {
    kind: 'whatYouNeed' | 'howToDoIt' | 'whereToDoIt' | 'importantToKnow'
    en: string
    fa?: string
    steps?: { en: string; fa?: string }[]
  }[]
  options?: { en: string; fa?: string }[]
  sources: { url: string; name: string; publisher?: string }[]
}

export type Both = { en: string; fa: string }

type CategorySeed = {
  slug: string
  task: string
  position: number
  kind?: Kind | null
  en: string
  fa: string
  enDesc?: string
  faDesc?: string
  /** A title this sample content used to give it, replaced where it is still exactly that. */
  was?: Both
  /** The category hub's recommended guide, by slug, and why to start there. */
  start?: string
  startReason?: Both
  askPrompt?: Both
  checklist?: Both[]
  /** Goals it points on to, by slug. */
  related?: string[]
}

// The old sample title of the one Getting Settled category each country has.
export const WAS_FIRST_WEEK = { en: 'Your first week', fa: 'هفته اول شما' }

const CATEGORY_TEXT_FILLS = ['startReason', 'askPrompt'] as const

const HUB_FIELDS = ['heading', 'intro', 'areasIntro', 'dependsNote', 'otherRoutesIntro'] as const
type HubCopy = Record<(typeof HUB_FIELDS)[number], string>

type QuestionText = { question: string; answer: string }

type QuestionSeed = { slug: string; guide?: string; en: QuestionText; fa?: QuestionText }

export type CountrySeed = {
  code: string
  categories: CategorySeed[]
  guides: GuideSeed[]
  /** Guides' bodies, filled in over their rows. */
  details?: GuideDetailSeed[]
  questions?: QuestionSeed[]
}

// Germany's sample until SB-198. Turkey's was retired by the owner's answer of 2026-09-15 (SB-282) and is a test
// fixture now, prisma/sample-turkey.ts.
export const COUNTRIES: CountrySeed[] = [
  {
    code: 'de',
    categories: [
      {
        slug: 'first-week',
        task: 'getting-settled',
        position: 0,
        en: 'Getting Settled',
        fa: 'استقرار اولیه',
        enDesc: 'Essential services to help you start everyday life in Germany.',
        faDesc: 'خدمات ضروری برای شروع زندگی روزمره در آلمان.',
        was: WAS_FIRST_WEEK,
      },
    ],
    guides: [
      {
        slug: 'anmeldung',
        category: 'first-week',
        obligations: ADDRESS_GUIDE,
        en: {
          title: 'Register your address',
          description: 'The Anmeldung, which almost everything else in Germany depends on.',
          quickAnswer:
            'Book a Buergeramt appointment and bring the confirmation your landlord signs. Without this you cannot open a bank account or get a tax id.',
          cost: 'Free',
          time: 'One appointment, but the wait for it can be weeks',
        },
        // Deliberately English only. A Persian reader must be told this exists
        // in English rather than shown a blank page, which is SB-049.
        sections: [
          {
            kind: 'whatYouNeed',
            en: 'Your passport, and a Wohnungsgeberbestaetigung signed by whoever provides the flat.',
          },
          {
            kind: 'importantToKnow',
            en: 'Appointments are scarce. Book before you have moved if you can.',
          },
        ],
        options: [{ en: 'Book online at any Buergeramt in the city, not only your own district.' }],
        sources: [{ url: 'https://www.berlin.de/einwohnermeldeamt/', name: 'Berlin Einwohnermeldeamt' }],
      },
    ],
  },
]

export const seedContent = async (prisma: PrismaClient, countries: readonly CountrySeed[] = COUNTRIES): Promise<void> => {
  for (const task of TASKS) {
    const row = await prisma.task.upsert({
      where: { slug: task.slug },
      update: {},
      create: { slug: task.slug, position: task.position },
    })

    for (const [locale, title, subtitle, hub] of [
      ['en-US', task.en, task.enSub, 'hub' in task ? task.hub.en : null],
      ['fa-IR', task.fa, task.faSub, 'hub' in task ? task.hub.fa : null],
    ] as const) {
      const where = { taskId_locale: { taskId: row.id, locale } }
      const existing = await prisma.taskText.findUnique({ where })
      if (!existing) {
        await prisma.taskText.create({ data: { taskId: row.id, locale, title, subtitle, ...hub } })
        continue
      }

      // The hub's copy came after the goals did, so a row that exists may
      // still have it empty. Fill-only means empty columns too, never a
      // column an editor has written.
      const missing: Partial<HubCopy> = {}
      for (const field of HUB_FIELDS) if (hub && existing[field] === null) missing[field] = hub[field]
      if (Object.keys(missing).length > 0) await prisma.taskText.update({ where, data: missing })
    }
  }

  for (const country of countries) {
    for (const category of country.categories) {
      const task = await prisma.task.findUniqueOrThrow({ where: { slug: category.task } })
      const row = await prisma.category.upsert({
        where: { countryCode_slug: { countryCode: country.code, slug: category.slug } },
        update: {},
        create: {
          countryCode: country.code,
          taskId: task.id,
          slug: category.slug,
          position: category.position,
          kind: category.kind ?? null,
        },
      })
      // Kinds came after the categories did; fill one that is still empty.
      if (row.kind === null && category.kind) await prisma.category.update({ where: { id: row.id }, data: { kind: category.kind } })

      for (const [locale, title, description, was, extra] of [
        [
          'en-US',
          category.en,
          category.enDesc ?? null,
          category.was?.en,
          { startReason: category.startReason?.en, askPrompt: category.askPrompt?.en },
        ],
        [
          'fa-IR',
          category.fa,
          category.faDesc ?? null,
          category.was?.fa,
          { startReason: category.startReason?.fa, askPrompt: category.askPrompt?.fa },
        ],
      ] as const) {
        const where = { categoryId_locale: { categoryId: row.id, locale } }
        const existing = await prisma.categoryText.findUnique({ where })
        if (!existing) {
          await prisma.categoryText.create({
            data: {
              categoryId: row.id,
              locale,
              title,
              description,
              startReason: extra.startReason ?? null,
              askPrompt: extra.askPrompt ?? null,
            },
          })
          continue
        }

        // Fill-only: a column still empty, and a title still exactly what this
        // sample content used to give it. Never anything an editor wrote.
        const data: { title?: string; description?: string; startReason?: string; askPrompt?: string } = {}
        if (was !== undefined && existing.title === was) data.title = title
        if (existing.description === null && description !== null) data.description = description
        for (const field of CATEGORY_TEXT_FILLS) {
          const value = extra[field]
          if (existing[field] === null && value) data[field] = value
        }
        if (Object.keys(data).length > 0) await prisma.categoryText.update({ where, data })
      }
    }

    for (const guide of country.guides) {
      const category = await prisma.category.findUniqueOrThrow({
        where: { countryCode_slug: { countryCode: country.code, slug: guide.category } },
      })

      // A guide that exists is left alone whole: its options and sources have
      // no natural key, so filling them in again would duplicate them.
      const existing = await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode: country.code, slug: guide.slug } } })
      if (existing) {
        // Its links are kept to what the guide names even so, or a guide made
        // before a research load would never link the researched duty.
        await linkObligationGroups(prisma, existing.id, guide.obligations)
        continue
      }

      const row = await prisma.guide.create({
        data: {
          countryCode: country.code,
          categoryId: category.id,
          slug: guide.slug,
          verifiedAt: guide.verifiedAt ?? VERIFIED,
          position: guide.position ?? 0,
          readingMinutes: guide.readingMinutes ?? null,
        },
      })

      const texts: [string, GuideSeed['en']][] = [['en-US', guide.en]]
      if (guide.fa) texts.push(['fa-IR', guide.fa])

      for (const [locale, text] of texts) {
        await prisma.guideText.upsert({
          where: { guideId_locale: { guideId: row.id, locale } },
          update: {},
          create: {
            guideId: row.id,
            locale,
            title: text.title,
            description: text.description ?? null,
            quickAnswer: text.quickAnswer ?? null,
            cost: text.cost ?? null,
            time: text.time ?? null,
          },
        })
      }

      for (const [position, section] of guide.sections.entries()) {
        // SB-307: the position is the row's identity, and this writer fills rather than rewrites. A row holding
        // another kind at this position keeps it, since one section's words under another's presentation is worse
        // than a gap.
        const standing = await prisma.guideSection.findUnique({ where: { guideId_position: { guideId: row.id, position } } })
        if (standing && standing.kind !== section.kind) continue
        const sectionRow = standing ?? (await prisma.guideSection.create({ data: { guideId: row.id, kind: section.kind, position } }))

        const bodies: [string, string][] = [['en-US', section.en]]
        if (section.fa) bodies.push(['fa-IR', section.fa])

        for (const [locale, body] of bodies) {
          await prisma.guideSectionText.upsert({
            where: { sectionId_locale: { sectionId: sectionRow.id, locale } },
            update: {},
            create: { sectionId: sectionRow.id, locale, body },
          })
        }

        for (const [stepPosition, step] of (section.steps ?? []).entries()) {
          const stepRow = await prisma.guideStep.upsert({
            where: { sectionId_position: { sectionId: sectionRow.id, position: stepPosition } },
            update: {},
            create: { sectionId: sectionRow.id, position: stepPosition },
          })

          const titles: [string, string][] = [['en-US', step.en]]
          if (step.fa) titles.push(['fa-IR', step.fa])

          for (const [locale, title] of titles) {
            await prisma.guideStepText.upsert({
              where: { stepId_locale: { stepId: stepRow.id, locale } },
              update: {},
              create: { stepId: stepRow.id, locale, title },
            })
          }
        }
      }

      for (const [position, option] of (guide.options ?? []).entries()) {
        const optionRow = await prisma.guideOption.create({ data: { guideId: row.id, position } })
        await prisma.guideOptionText.create({ data: { optionId: optionRow.id, locale: 'en-US', title: option.en } })
      }

      for (const [position, source] of guide.sources.entries()) {
        await prisma.guideSource.create({
          data: {
            guideId: row.id,
            url: source.url,
            name: source.name,
            publisher: source.publisher ?? null,
            verifiedAt: guide.verifiedAt ?? VERIFIED,
            position,
          },
        })
      }

      await linkObligationGroups(prisma, row.id, guide.obligations)
    }

    // After the guides: a category's recommended one, its checklist and the
    // goals it points on to. Each only where there is none yet.
    for (const category of country.categories) {
      const row = await prisma.category.findUniqueOrThrow({
        where: { countryCode_slug: { countryCode: country.code, slug: category.slug } },
        include: { checklist: true, related: true },
      })

      if (category.start && row.startGuideId === null) {
        const start = await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode: country.code, slug: category.start } } })
        if (start) await prisma.category.update({ where: { id: row.id }, data: { startGuideId: start.id } })
      }

      if (category.checklist && row.checklist.length === 0) {
        for (const [position, line] of category.checklist.entries()) {
          await prisma.checklistItem.create({
            data: {
              categoryId: row.id,
              position,
              texts: {
                create: [
                  { locale: 'en-US', label: line.en },
                  { locale: 'fa-IR', label: line.fa },
                ],
              },
            },
          })
        }
      }

      if (category.related && row.related.length === 0) {
        for (const [position, slug] of category.related.entries()) {
          const task = await prisma.task.findUnique({ where: { slug } })
          if (task) await prisma.relatedTask.create({ data: { categoryId: row.id, taskId: task.id, position } })
        }
      }
    }

    // The fully written guides, over the bare rows the hubs listed.
    for (const detail of country.details ?? []) await fillGuideDetail(prisma, country.code, detail)

    // After the guides, so a question can point at one.
    for (const [position, question] of (country.questions ?? []).entries()) {
      const guide = question.guide
        ? await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode: country.code, slug: question.guide } } })
        : null
      const row = await prisma.question.upsert({
        where: { countryCode_slug: { countryCode: country.code, slug: question.slug } },
        update: {},
        create: { countryCode: country.code, slug: question.slug, position, guideId: guide?.id ?? null },
      })

      const texts: [string, QuestionText][] = [['en-US', question.en]]
      if (question.fa) texts.push(['fa-IR', question.fa])

      for (const [locale, text] of texts) {
        await prisma.questionText.upsert({
          where: { questionId_locale: { questionId: row.id, locale } },
          update: {},
          create: { questionId: row.id, locale, question: text.question, answer: text.answer },
        })
      }
    }
  }
}

export type SampleSlugs = { guides: readonly string[]; areas: readonly string[]; questions: readonly string[] }

/** Turkey's sample rows by slug: what prisma/sample-turkey.ts fills, less register-your-address, whose row the researched loader owns (SB-281). */
export const TURKEY_SAMPLE_SLUGS: SampleSlugs = {
  guides: [
    'sim-card',
    'register-your-phone',
    'home-internet',
    'utilities',
    'turkish-address',
    'essential-apps',
    'company-types',
    'how-company-registration-works',
    'business-addresses-explained',
    'working-in-your-own-company',
    'hiring-foreign-employees',
    'accounting-basics',
  ],
  areas: [
    'first-week',
    'choose-a-company-type',
    'register-your-company',
    'get-a-business-address',
    'get-your-tax-setup-ready',
    'open-a-business-bank-account',
    'work-in-your-own-company',
    'hire-employees',
    'set-up-accounting-and-invoicing',
    'startup-and-tech-visa-programmes',
  ],
  questions: ['company-without-residence', 'student-residence-documents', 'hire-an-iranian-employee', 'residence-by-buying-a-house'],
}

/**
 * A country's retired sample rows deleted by slug, in one transaction (SB-282): its questions, then its guides, whose
 * texts, sections, sources, links and visitors' suggestions go with them, then its areas, whose texts, checklist and
 * related goals go with them. It refuses a list naming a guide or area the researched loader writes, so it can never
 * delete what the research wrote, and a start after the first finds nothing to delete.
 */
export const retireSample = async (
  prisma: PrismaClient,
  countryCode: string,
  slugs: SampleSlugs,
): Promise<{ questions: number; guides: number; areas: number }> => {
  const researched = RESEARCHED_GUIDES.filter((guide) => guide.country === countryCode)
  const owned = new Set(researched.flatMap((guide) => [guide.guide.slug, guide.area.slug]))
  const clash = [...slugs.guides, ...slugs.areas].filter((slug) => owned.has(slug))
  if (clash.length > 0) {
    throw new Error(`${countryCode}'s retired sample names ${clash.join(', ')}, which the researched loader writes; nothing was deleted.`)
  }

  return prisma.$transaction(
    async (tx) => {
      const questions = await tx.question.deleteMany({ where: { countryCode, slug: { in: [...slugs.questions] } } })
      const guides = await tx.guide.deleteMany({ where: { countryCode, slug: { in: [...slugs.guides] } } })
      const areas = await tx.category.deleteMany({ where: { countryCode, slug: { in: [...slugs.areas] } } })
      return { questions: questions.count, guides: guides.count, areas: areas.count }
    },
    { timeout: 120_000 },
  )
}

const main = async (): Promise<void> => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  try {
    await seedContent(prisma)
    console.log('sample content: filled in whatever was missing')
    const retired = await retireSample(prisma, 'tr', TURKEY_SAMPLE_SLUGS)
    console.log(`sample content: retired Turkey's ${retired.questions} questions, ${retired.guides} guides and ${retired.areas} areas`)
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1]?.includes('sample-content')) void main()
