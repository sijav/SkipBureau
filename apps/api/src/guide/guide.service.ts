import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { generalVersionAt } from '../rules/selection.js'
import type { AskView, CategoryHubView, CategoryView, GuideView, HubSourceView, QuestionView, SearchView, TaskHubView, TaskView } from './guide.model.js'
import { CategoryKind, ObligationResolution, SectionKind } from './guide.model.js'
import { best, match, WEIGHT, wordsOf, type Field } from './search.js'

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

type Texted<T> = { texts: T[] }

/** Another guide as a link: its slug, title and one line. */
const linkOf = (guide: { slug: string } & Texted<{ locale: string; title: string; description: string | null }>, locale: string) => {
  const { text } = pick(guide.texts, locale)
  return text ? { slug: guide.slug, title: text.title, description: text.description } : null
}

/** Where a guide sits, for its breadcrumb and its meta line. */
const placeOf = (
  category:
    | ({ slug: string; task: { slug: string; categories: { id: string }[] } & Texted<{ locale: string; title: string }> } & Texted<{ locale: string; title: string }>)
    | null,
  locale: string,
) => {
  if (!category) return null
  const area = pick(category.texts, locale).text
  const goal = pick(category.task.texts, locale).text
  if (!area || !goal) return null
  return {
    categorySlug: category.slug,
    categoryTitle: area.title,
    goalSlug: category.task.slug,
    goalTitle: goal.title,
    goalAreas: category.task.categories.length,
  }
}

// How many of each kind Ask's panel shows, and the results page.
const IN_PANEL = 3
const ON_PAGE = 20

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
            guides: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], include: { texts: true, sources: { orderBy: { position: 'asc' } } } },
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

  /**
   * One area of a goal in one country, Figma 133:523. Null where the area does
   * not exist there, or belongs to another goal than the address says.
   */
  async categoryHub(countryCode: string, goal: string, slug: string, locale: string): Promise<CategoryHubView | null> {
    const row = await this.prisma.category.findUnique({
      where: { countryCode_slug: { countryCode, slug } },
      include: {
        texts: true,
        task: { include: { texts: true, categories: { where: { countryCode }, select: { id: true } } } },
        guides: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], include: { texts: true } },
        startGuide: { include: { texts: true } },
        checklist: { orderBy: { position: 'asc' }, include: { texts: true } },
        related: {
          orderBy: { position: 'asc' },
          include: { task: { include: { texts: true, categories: { where: { countryCode }, select: { id: true } } } } },
        },
      },
    })
    if (!row || row.task.slug !== goal) return null

    const { text, missing } = pick(row.texts, locale)
    const { text: goalText } = pick(row.task.texts, locale)
    if (!text || !goalText) return null

    const guides = row.guides.flatMap((guide) => {
      const { text: reading } = pick(guide.texts, locale)
      return reading ? [{ slug: guide.slug, title: reading.title, description: reading.description, readingMinutes: guide.readingMinutes }] : []
    })
    const reviewed = row.guides.reduce<Date | null>((newest, guide) => (!newest || guide.verifiedAt > newest ? guide.verifiedAt : newest), null)
    const startText = row.startGuide ? pick(row.startGuide.texts, locale).text : null

    return {
      slug: row.slug,
      title: text.title,
      description: text.description,
      askPrompt: text.askPrompt,
      locale: text.locale,
      translationMissing: missing,
      goalSlug: row.task.slug,
      goalTitle: goalText.title,
      goalAreas: row.task.categories.length,
      lastReviewed: reviewed ? date(reviewed) : null,
      start: row.startGuide && startText ? { guideSlug: row.startGuide.slug, title: startText.title, reason: text.startReason } : null,
      guides,
      checklist: row.checklist.flatMap((item) => {
        const { text: line } = pick(item.texts, locale)
        return line ? [line.label] : []
      }),
      related: row.related.flatMap(({ task }) => {
        const { text: other } = pick(task.texts, locale)
        return other ? [{ slug: task.slug, title: other.title, subtitle: other.subtitle, open: task.categories.length > 0 }] : []
      }),
    }
  }

  /**
   * Ask, Figma 46:659: what matches the words of a question, grouped by what
   * each thing is. With no words, what is popular. Matched in memory while the
   * content is small; real search is SB-051.
   */
  /**
   * What a question finds in one country, SB-149: goals by their titles, guides
   * by everything written in them, quick answers by question and answer. The
   * matching is `search.ts`; this gathers what it matches against.
   */
  private async find(countryCode: string, locale: string, text: string, limit: number): Promise<SearchView> {
    const [tasks, categories, guides, questions] = await Promise.all([
      this.tasks(locale),
      this.prisma.category.findMany({ where: { countryCode }, select: { task: { select: { slug: true } } } }),
      this.prisma.guide.findMany({
        where: { countryCode },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        include: {
          texts: true,
          options: { include: { texts: true } },
          sections: { include: { texts: true, steps: { include: { texts: true } } } },
        },
      }),
      this.questions(countryCode, locale),
    ])
    const open = new Set(categories.map((category) => category.task.slug))
    const withOpen = tasks.map((task) => ({ slug: task.slug, title: task.title, subtitle: task.subtitle, open: open.has(task.slug) }))

    const words = wordsOf(text)
    if (words.length === 0) return { tasks: [], guides: [], answers: [] }

    const readable = guides.flatMap((guide) => {
      const { text: reading } = pick(guide.texts, locale)
      if (!reading) return []
      const body = (value: string | null | undefined): Field => ({ text: value, weight: WEIGHT.body, snippet: true })
      const fields: Field[] = [
        { text: reading.title, weight: WEIGHT.title },
        { text: reading.description, weight: WEIGHT.summary, snippet: true },
        { text: reading.intro, weight: WEIGHT.summary, snippet: true },
        { text: reading.quickAnswer, weight: WEIGHT.summary, snippet: true },
        ...guide.sections.flatMap((section) => {
          const { text: part } = pick(section.texts, locale)
          return [
            body(part?.title),
            body(part?.body),
            body(part?.note),
            body(part?.callout),
            body(part?.calloutBody),
            ...section.steps.flatMap((step) => {
              const { text: line } = pick(step.texts, locale)
              return [body(line?.title), body(line?.body), body(line?.note), body(line?.label)]
            }),
          ]
        }),
        ...guide.options.flatMap((option) => {
          const { text: choice } = pick(option.texts, locale)
          return [body(choice?.title), body(choice?.body), body(choice?.bestFor), body(choice?.caveat)]
        }),
      ]
      return [
        {
          fields,
          // Matched by its title alone, a guide is shown with its own summary.
          summary: reading.description ?? reading.intro,
          view: {
            slug: guide.slug,
            title: reading.title,
            verifiedAt: date(guide.verifiedAt),
            written: guide.sections.length > 0 || guide.options.length > 0 || Boolean(reading.quickAnswer),
          },
        },
      ]
    })

    return {
      // A goal with nothing in this country has no page to go to.
      tasks: best(
        withOpen.filter((task) => task.open),
        (task) => match(words, [{ text: task.title, weight: WEIGHT.title }, { text: task.subtitle, weight: WEIGHT.summary }]),
        limit,
      ).map(({ item }) => item),
      guides: best(readable, (guide) => match(words, guide.fields), limit).map(({ item, match: found }) => ({ ...item.view, snippet: found.snippet ?? item.summary })),
      answers: best(
        questions,
        (entry) => match(words, [{ text: entry.question, weight: WEIGHT.title }, { text: entry.answer, weight: WEIGHT.summary }]),
        limit,
      ).map(({ item }) => item),
    }
  }

  /** Everything a question found, for the results page. */
  async search(countryCode: string, locale: string, text: string): Promise<SearchView> {
    return this.find(countryCode, locale, text, ON_PAGE)
  }

  /** The panel under an Ask field: a few of each kind, and what is popular while nothing is typed. */
  async ask(countryCode: string, locale: string, text: string): Promise<AskView> {
    if (wordsOf(text).length === 0) {
      const [tasks, categories, questions] = await Promise.all([
        this.tasks(locale),
        this.prisma.category.findMany({ where: { countryCode }, select: { task: { select: { slug: true } } } }),
        this.questions(countryCode, locale),
      ])
      const open = new Set(categories.map((category) => category.task.slug))
      const first = tasks.find((task) => open.has(task.slug))
      return {
        tasks: first ? [{ slug: first.slug, title: first.title, subtitle: first.subtitle, open: true }] : [],
        guides: [],
        answers: questions.slice(0, 1),
      }
    }
    const found = await this.find(countryCode, locale, text, IN_PANEL)
    return { ...found, guides: found.guides.map(({ slug, title, verifiedAt }) => ({ slug, title, verifiedAt })) }
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
        sections: {
          orderBy: { position: 'asc' },
          include: { texts: true, linkGuide: { include: { texts: true } }, steps: { orderBy: { position: 'asc' }, include: { texts: true } } },
        },
        category: { include: { texts: true, task: { include: { texts: true, categories: { where: { countryCode }, select: { id: true } } } } } },
        relatedTo: { orderBy: { position: 'asc' }, include: { toGuide: { include: { texts: true } } } },
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
      locales: row.texts.map((entry) => entry.locale).sort(),
      title: text.title,
      description: text.description,
      intro: text.intro,
      quickAnswer: text.quickAnswer,
      cost: text.cost,
      time: text.time,
      deadlines: text.deadlines,
      costNote: text.costNote,
      place: placeOf(row.category, locale),
      sections: row.sections.flatMap((section) => {
        const picked = pick(section.texts, locale)
        return [
          {
            kind: SectionKind[section.kind],
            position: section.position,
            title: picked.text?.title ?? null,
            body: picked.text?.body ?? null,
            note: picked.text?.note ?? null,
            callout: picked.text?.callout ?? null,
            calloutBody: picked.text?.calloutBody ?? null,
            calloutSource: picked.text?.calloutSource ?? null,
            link: section.linkGuide ? linkOf(section.linkGuide, locale) : null,
            steps: section.steps.flatMap((step) => {
              const stepText = pick(step.texts, locale).text
              if (!stepText) return []
              return [{ position: step.position, title: stepText.title, body: stepText.body, note: stepText.note, label: stepText.label }]
            }),
          },
        ]
      }),
      options: row.options.flatMap((option) => {
        const optionText = pick(option.texts, locale).text
        return optionText ? [{ title: optionText.title, body: optionText.body, bestFor: optionText.bestFor, caveat: optionText.caveat }] : []
      }),
      related: row.relatedTo.flatMap(({ toGuide }) => {
        const link = linkOf(toGuide, locale)
        return link ? [link] : []
      }),
      sources: row.sources.map((source) => ({
        url: source.url,
        name: source.name,
        verifiedAt: date(source.verifiedAt),
        publisher: source.publisher,
        official: source.official,
        note: source.note,
      })),
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
