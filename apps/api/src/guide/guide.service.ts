import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { generalVersionAt } from '../rules/selection.js'
import type { CategoryView, GuideView, HubSourceView, QuestionView, TaskHubView, TaskView } from './guide.model.js'
import { CategoryKind, ObligationResolution, SectionKind } from './guide.model.js'

const FALLBACK = 'en-US'

/** A row picked in the asked-for language, or the fallback, or nothing. */
const pick = <T extends { locale: string }>(texts: readonly T[], locale: string): { text: T | null; missing: boolean } => {
  const wanted = texts.find((text) => text.locale === locale)
  if (wanted) return { text: wanted, missing: false }

  // An ABSENT row means not translated. A present row with null columns means
  // deliberately empty. Keeping those apart is why no reader-facing field
  // lives on the parent table.
  const fallback = texts.find((text) => text.locale === FALLBACK) ?? texts[0] ?? null
  return { text: fallback, missing: true }
}

const date = (value: Date): string => value.toISOString().slice(0, 10)

@Injectable()
export class GuideService {
  constructor(private readonly prisma: PrismaService) {}

  /** The twelve goals. Global: no country narrows them. */
  async tasks(locale: string): Promise<TaskView[]> {
    const rows = await this.prisma.task.findMany({ orderBy: { position: 'asc' }, include: { texts: true } })

    return rows.flatMap((row) => {
      const { text } = pick(row.texts, locale)
      if (!text) return []
      return [{ slug: row.slug, position: row.position, title: text.title, subtitle: text.subtitle }]
    })
  }

  /**
   * What one goal involves in one country, Figma 81:523. Null where the
   * country has no area under the goal: that goal is Coming soon there, and
   * there is no hub to show.
   */
  async taskHub(countryCode: string, slug: string, locale: string): Promise<TaskHubView | null> {
    const task = await this.prisma.task.findUnique({
      where: { slug },
      include: {
        texts: true,
        categories: {
          where: { countryCode },
          orderBy: { position: 'asc' },
          include: {
            texts: true,
            guides: { orderBy: { createdAt: 'asc' }, include: { texts: true, sources: { orderBy: { position: 'asc' } } } },
          },
        },
      },
    })
    if (!task || task.categories.length === 0) return null

    const { text, missing } = pick(task.texts, locale)
    if (!text) return null

    const areas = task.categories.flatMap((category) => {
      const { text: area } = pick(category.texts, locale)
      if (!area) return []
      const kind = category.kind ? CategoryKind[category.kind] : null
      return [{ slug: category.slug, position: category.position, kind, title: area.title, description: area.description }]
    })

    const guides = task.categories.flatMap((category) =>
      category.guides.flatMap((guide) => {
        const { text: reading } = pick(guide.texts, locale)
        return reading ? [{ slug: guide.slug, title: reading.title, verifiedAt: date(guide.verifiedAt) }] : []
      }),
    )

    // One card per institution, with the most recent check of it.
    const sources = new Map<string, HubSourceView>()
    for (const source of task.categories.flatMap((category) => category.guides.flatMap((guide) => guide.sources))) {
      const verifiedAt = date(source.verifiedAt)
      const seen = sources.get(source.url)
      if (!seen || verifiedAt > seen.verifiedAt) {
        sources.set(source.url, { url: source.url, name: source.name, publisher: source.publisher, verifiedAt })
      }
    }

    return {
      slug: task.slug,
      title: text.title,
      heading: text.heading,
      intro: text.intro,
      areasIntro: text.areasIntro,
      dependsNote: text.dependsNote,
      otherRoutesIntro: text.otherRoutesIntro,
      locale: text.locale,
      translationMissing: missing,
      areas,
      guides,
      sources: [...sources.values()],
    }
  }

  async questions(countryCode: string, locale: string): Promise<QuestionView[]> {
    const rows = await this.prisma.question.findMany({
      where: { countryCode },
      orderBy: { position: 'asc' },
      include: { texts: true, guide: { select: { slug: true } } },
    })

    return rows.flatMap((row) => {
      const { text, missing } = pick(row.texts, locale)
      if (!text) return []
      return [
        {
          slug: row.slug,
          position: row.position,
          question: text.question,
          answer: text.answer,
          guideSlug: row.guide?.slug ?? null,
          locale: text.locale,
          translationMissing: missing,
        },
      ]
    })
  }

  async categories(countryCode: string, locale: string): Promise<CategoryView[]> {
    const rows = await this.prisma.category.findMany({
      where: { countryCode },
      orderBy: { position: 'asc' },
      include: { texts: true, task: true },
    })

    return rows.flatMap((row) => {
      const { text } = pick(row.texts, locale)
      if (!text) return []
      return [
        {
          slug: row.slug,
          countryCode: row.countryCode,
          taskSlug: row.task.slug,
          position: row.position,
          title: text.title,
          description: text.description,
        },
      ]
    })
  }

  /**
   * One guide, in the language asked for where it exists.
   *
   * `translationMissing` is the honest half: a guide that exists in English and
   * not in Persian is shown in English and SAYS SO, rather than rendering a
   * blank page or pretending. What the reader is told about it is SB-049.
   */
  async guide(countryCode: string, slug: string, locale: string, at = new Date()): Promise<GuideView | null> {
    const row = await this.prisma.guide.findUnique({
      where: { countryCode_slug: { countryCode, slug } },
      include: {
        texts: true,
        sources: { orderBy: { position: 'asc' } },
        options: { orderBy: { position: 'asc' }, include: { texts: true } },
        sections: { orderBy: { position: 'asc' }, include: { texts: true, steps: { orderBy: { position: 'asc' }, include: { texts: true } } } },
        obligations: {
          orderBy: { position: 'asc' },
          include: {
            obligation: {
              include: {
                texts: true,
                // The version in force IN THIS COUNTRY, on this date, that
                // applies to everyone.
                //
                // Without the country it returned whichever open version the
                // database ordered first, so the German guide showed Turkey's
                // twenty day deadline. Without the date a rule starting next
                // year counted as current. Without `criteria: none` a rule
                // written for students would be shown to a worker.
                versions: { where: generalVersionAt(countryCode, at), include: { facts: true } },
              },
            },
          },
        },
      },
    })

    if (!row) return null

    const { text, missing } = pick(row.texts, locale)
    if (!text) return null

    return {
      slug: row.slug,
      countryCode: row.countryCode,
      verifiedAt: date(row.verifiedAt),
      showDisclaimer: row.showDisclaimer,
      showSuggestUpdate: row.showSuggestUpdate,
      locale: text.locale,
      translationMissing: missing,
      title: text.title,
      description: text.description,
      quickAnswer: text.quickAnswer,
      cost: text.cost,
      time: text.time,
      sections: row.sections.flatMap((section) => {
        const picked = pick(section.texts, locale)
        return [
          {
            kind: section.kind as SectionKind,
            position: section.position,
            title: picked.text?.title ?? null,
            body: picked.text?.body ?? null,
            steps: section.steps.flatMap((step) => {
              const stepText = pick(step.texts, locale).text
              if (!stepText) return []
              return [{ position: step.position, title: stepText.title, body: stepText.body }]
            }),
          },
        ]
      }),
      options: row.options.flatMap((option) => {
        const optionText = pick(option.texts, locale).text
        return optionText ? [optionText.title] : []
      }),
      sources: row.sources.map((source) => ({ url: source.url, name: source.name, verifiedAt: date(source.verifiedAt) })),
      // Rendered from the linked rule rather than retyped into the prose, which
      // is the only thing that stops the two drifting apart.
      obligations: row.obligations.map((link) => {
        const version = link.obligation.versions[0]

        return {
          slug: link.obligation.slug,
          title: pick(link.obligation.texts, locale).text?.title ?? null,
          // No general version is not the same as no requirement. Saying so
          // sends the reader to the context control; an empty fact list would
          // tell them this country asks nothing of them.
          resolution: version ? ObligationResolution.general : ObligationResolution.contextRequired,
          facts: (version?.facts ?? []).map((fact) => ({
            key: fact.key,
            operator: fact.operator,
            numericValue: fact.numericValue === null ? null : fact.numericValue.toString(),
            textValue: fact.textValue,
            unit: fact.unit,
            currency: fact.currency,
          })),
        }
      }),
    }
  }

  /** Every guide in one country. Country is a filter here, never a constant. */
  async guides(countryCode: string, locale: string): Promise<GuideView[]> {
    const rows = await this.prisma.guide.findMany({ where: { countryCode }, select: { slug: true } })
    const guides = await Promise.all(rows.map((row) => this.guide(countryCode, row.slug, locale)))
    return guides.filter((guide): guide is GuideView => guide !== null)
  }
}
