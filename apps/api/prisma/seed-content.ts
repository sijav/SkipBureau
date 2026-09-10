import type { PrismaClient } from '../src/generated/prisma/client.js'

/**
 * Illustrative, not verified. Same caveat as the rules seed.
 *
 * It is shaped to test the thing that is easy to get wrong: **one task shared
 * between two countries**, with country-specific categories, guides and
 * sources hanging off it. A seed that gave each country its own task would
 * pass a test that only counts rows, and would have duplicated the exact thing
 * this model exists to keep global.
 */

const VERIFIED = new Date('2026-09-10')

const TASKS = [
  { slug: 'getting-settled', position: 0, en: 'Getting Settled', fa: 'استقرار اولیه', enSub: 'The first weeks after you arrive', faSub: 'هفته‌های نخست پس از رسیدن' },
  { slug: 'start-a-business', position: 1, en: 'Start a business', fa: 'راه‌اندازی کسب‌وکار', enSub: 'Registering and running a company', faSub: 'ثبت و اداره یک شرکت' },
]

type GuideSeed = {
  slug: string
  category: string
  obligation?: string
  en: { title: string; description: string; quickAnswer: string; cost?: string; time?: string }
  fa?: { title: string; description: string; quickAnswer: string; cost?: string; time?: string }
  sections: { kind: 'whatYouNeed' | 'howToDoIt' | 'whereToDoIt' | 'importantToKnow'; en: string; fa?: string; steps?: { en: string; fa?: string }[] }[]
  options?: { en: string; fa?: string }[]
  sources: { url: string; name: string }[]
}

type CountrySeed = {
  code: string
  categories: { slug: string; task: string; position: number; en: string; fa: string }[]
  guides: GuideSeed[]
}

const COUNTRIES: CountrySeed[] = [
  {
    code: 'tr',
    categories: [
      { slug: 'first-week', task: 'getting-settled', position: 0, en: 'Your first week', fa: 'هفته اول شما' },
      { slug: 'company-setup', task: 'start-a-business', position: 1, en: 'Setting up a company', fa: 'تاسیس شرکت' },
    ],
    guides: [
      {
        slug: 'register-your-address',
        category: 'first-week',
        obligation: 'register-your-address',
        en: {
          title: 'Register your address',
          description: 'What address registration in Turkey involves, and where it is done.',
          quickAnswer: 'Go to the district population directorate once you have somewhere to live. Take your passport and your rental contract.',
          cost: 'Free',
          time: 'One appointment, usually under an hour',
        },
        fa: {
          title: 'ثبت نشانی محل سکونت',
          description: 'ثبت نشانی در ترکیه شامل چیست و کجا انجام می‌شود.',
          quickAnswer: 'پس از پیدا کردن محل سکونت به اداره نفوس منطقه بروید. گذرنامه و قرارداد اجاره را همراه ببرید.',
          cost: 'رایگان',
          time: 'یک نوبت، معمولا کمتر از یک ساعت',
        },
        sections: [
          {
            kind: 'whatYouNeed',
            en: 'Your passport, your rental contract, and the tax number you got first.',
            fa: 'گذرنامه، قرارداد اجاره، و شماره مالیاتی که پیش‌تر گرفته‌اید.',
          },
          {
            kind: 'howToDoIt',
            en: 'Book an appointment, then attend in person.',
            fa: 'ابتدا نوبت بگیرید، سپس حضوری مراجعه کنید.',
            steps: [
              { en: 'Get a tax number first, because everything else asks for it.', fa: 'ابتدا شماره مالیاتی بگیرید، چون بقیه کارها آن را می‌خواهند.' },
              { en: 'Book an appointment online.', fa: 'به صورت آنلاین نوبت بگیرید.' },
              { en: 'Attend with your documents.', fa: 'با مدارک خود حاضر شوید.' },
            ],
          },
        ],
        sources: [{ url: 'https://www.nvi.gov.tr/', name: 'Nufus ve Vatandaslik Isleri Genel Mudurlugu' }],
      },
    ],
  },
  {
    code: 'de',
    categories: [
      { slug: 'first-week', task: 'getting-settled', position: 0, en: 'Your first week', fa: 'هفته اول شما' },
    ],
    guides: [
      {
        slug: 'anmeldung',
        category: 'first-week',
        obligation: 'register-your-address',
        en: {
          title: 'Register your address',
          description: 'The Anmeldung, which almost everything else in Germany depends on.',
          quickAnswer: 'Book a Buergeramt appointment and bring the confirmation your landlord signs. Without this you cannot open a bank account or get a tax id.',
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

export const seedContent = async (prisma: PrismaClient): Promise<void> => {
  for (const task of TASKS) {
    const row = await prisma.task.upsert({
      where: { slug: task.slug },
      update: {},
      create: { slug: task.slug, position: task.position },
    })

    for (const [locale, title, subtitle] of [
      ['en-US', task.en, task.enSub],
      ['fa-IR', task.fa, task.faSub],
    ] as const) {
      await prisma.taskText.upsert({
        where: { taskId_locale: { taskId: row.id, locale } },
        update: { title, subtitle },
        create: { taskId: row.id, locale, title, subtitle },
      })
    }
  }

  for (const country of COUNTRIES) {
    for (const category of country.categories) {
      const task = await prisma.task.findUniqueOrThrow({ where: { slug: category.task } })
      const row = await prisma.category.upsert({
        where: { countryCode_slug: { countryCode: country.code, slug: category.slug } },
        update: {},
        create: { countryCode: country.code, taskId: task.id, slug: category.slug, position: category.position },
      })

      for (const [locale, title] of [
        ['en-US', category.en],
        ['fa-IR', category.fa],
      ] as const) {
        await prisma.categoryText.upsert({
          where: { categoryId_locale: { categoryId: row.id, locale } },
          update: { title },
          create: { categoryId: row.id, locale, title },
        })
      }
    }

    for (const guide of country.guides) {
      const category = await prisma.category.findUniqueOrThrow({
        where: { countryCode_slug: { countryCode: country.code, slug: guide.category } },
      })

      const row = await prisma.guide.upsert({
        where: { countryCode_slug: { countryCode: country.code, slug: guide.slug } },
        update: {},
        create: { countryCode: country.code, categoryId: category.id, slug: guide.slug, verifiedAt: VERIFIED },
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
            description: text.description,
            quickAnswer: text.quickAnswer,
            cost: text.cost ?? null,
            time: text.time ?? null,
          },
        })
      }

      for (const [position, section] of guide.sections.entries()) {
        const sectionRow = await prisma.guideSection.upsert({
          where: { guideId_kind: { guideId: row.id, kind: section.kind } },
          update: {},
          create: { guideId: row.id, kind: section.kind, position },
        })

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
          data: { guideId: row.id, url: source.url, name: source.name, verifiedAt: VERIFIED, position },
        })
      }

      if (guide.obligation) {
        const obligation = await prisma.obligation.findUnique({ where: { slug: guide.obligation } })
        if (obligation) {
          await prisma.guideObligation.upsert({
            where: { guideId_obligationId: { guideId: row.id, obligationId: obligation.id } },
            update: {},
            create: { guideId: row.id, obligationId: obligation.id, position: 0 },
          })
        }
      }
    }
  }
}
