import type { PrismaClient } from '../generated/prisma/client.js'
import type { GuideDetailSeed, Localised } from '../sample-types.js'

// What fills a guide and links its obligations, for sample content and for the guides written from the agreed
// research alike (SB-258).

const LOCALES = [
  ['en-US', 'en'],
  ['fa-IR', 'fa'],
] as const

/** A localised field in one language, or undefined where it has none. */
const inLocale = (value: Localised | undefined, language: 'en' | 'fa'): string | undefined => value?.[language]

/** The fields of `wanted` that `existing` has empty, and nothing else. Fill-only, a column at a time. */
const emptyOf = <K extends string>(
  existing: Partial<Record<K, string | null>> | null,
  wanted: Partial<Record<K, string | undefined>>,
): Partial<Record<K, string>> => {
  const fill: Partial<Record<K, string>> = {}
  for (const key in wanted) {
    const value = wanted[key]
    if (value !== undefined && (existing === null || existing[key] === null || existing[key] === undefined)) fill[key] = value
  }
  return fill
}

/**
 * The body of a guide that exists, filled in where it is missing: its texts'
 * empty columns, sections by kind, steps by position, options by position,
 * sources by address, related guides by pair. Never a value that is there.
 */
export const fillGuideDetail = async (prisma: PrismaClient, countryCode: string, seed: GuideDetailSeed): Promise<void> => {
  const guide = await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode, slug: seed.slug } }, include: { sources: true } })
  if (!guide) return

  // Only while the guide is still the bare row this sample content made.
  if (seed.showDisclaimer && !guide.showDisclaimer && guide.sources.length <= 1) {
    await prisma.guide.update({ where: { id: guide.id }, data: { showDisclaimer: true } })
  }

  for (const [locale, language] of LOCALES) {
    const where = { guideId_locale: { guideId: guide.id, locale } }
    const existing = await prisma.guideText.findUnique({ where })
    if (!existing) continue
    const fill = emptyOf(existing, {
      intro: inLocale(seed.intro, language),
      quickAnswer: inLocale(seed.quickAnswer, language),
      cost: inLocale(seed.cost, language),
      time: inLocale(seed.time, language),
      deadlines: inLocale(seed.deadlines, language),
      costNote: inLocale(seed.costNote, language),
    })
    if (Object.keys(fill).length > 0) await prisma.guideText.update({ where, data: fill })
  }

  for (const [position, section] of seed.sections.entries()) {
    const row = await prisma.guideSection.upsert({
      where: { guideId_kind: { guideId: guide.id, kind: section.kind } },
      update: {},
      create: { guideId: guide.id, kind: section.kind, position },
    })

    if (section.link && row.linkGuideId === null) {
      const target = await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode, slug: section.link } } })
      if (target) await prisma.guideSection.update({ where: { id: row.id }, data: { linkGuideId: target.id } })
    }

    for (const [locale, language] of LOCALES) {
      const wanted = {
        title: inLocale(section.title, language),
        body: inLocale(section.body, language),
        note: inLocale(section.note, language),
        callout: inLocale(section.callout, language),
        calloutBody: inLocale(section.calloutBody, language),
        calloutSource: inLocale(section.calloutSource, language),
      }
      if (Object.values(wanted).every((value) => value === undefined)) continue
      const where = { sectionId_locale: { sectionId: row.id, locale } }
      const existing = await prisma.guideSectionText.findUnique({ where })
      const fill = emptyOf(existing, wanted)
      if (!existing) await prisma.guideSectionText.create({ data: { sectionId: row.id, locale, ...fill } })
      else if (Object.keys(fill).length > 0) await prisma.guideSectionText.update({ where, data: fill })
    }

    for (const [stepPosition, step] of (section.steps ?? []).entries()) {
      const stepRow = await prisma.guideStep.upsert({
        where: { sectionId_position: { sectionId: row.id, position: stepPosition } },
        update: {},
        create: { sectionId: row.id, position: stepPosition },
      })
      for (const [locale, language] of LOCALES) {
        const title = inLocale(step.title, language)
        if (!title) continue
        const where = { stepId_locale: { stepId: stepRow.id, locale } }
        const existing = await prisma.guideStepText.findUnique({ where })
        const fill = emptyOf(existing, {
          body: inLocale(step.body, language),
          note: inLocale(step.note, language),
          label: inLocale(step.label, language),
        })
        if (!existing) await prisma.guideStepText.create({ data: { stepId: stepRow.id, locale, title, ...fill } })
        else if (Object.keys(fill).length > 0) await prisma.guideStepText.update({ where, data: fill })
      }
    }
  }

  for (const [position, option] of (seed.options ?? []).entries()) {
    const found = await prisma.guideOption.findFirst({ where: { guideId: guide.id, position } })
    const row = found ?? (await prisma.guideOption.create({ data: { guideId: guide.id, position } }))
    for (const [locale, language] of LOCALES) {
      const title = inLocale(option.title, language)
      if (!title) continue
      const where = { optionId_locale: { optionId: row.id, locale } }
      const existing = await prisma.guideOptionText.findUnique({ where })
      const fill = emptyOf(existing, {
        body: inLocale(option.body, language),
        bestFor: inLocale(option.bestFor, language),
        caveat: inLocale(option.caveat, language),
      })
      if (!existing) await prisma.guideOptionText.create({ data: { optionId: row.id, locale, title, ...fill } })
      else if (Object.keys(fill).length > 0) await prisma.guideOptionText.update({ where, data: fill })
    }
  }

  const known = new Set(guide.sources.map((source) => source.url))
  for (const [index, source] of seed.sources.entries()) {
    if (known.has(source.url)) continue
    await prisma.guideSource.create({
      data: {
        guideId: guide.id,
        url: source.url,
        name: source.name,
        publisher: source.publisher ?? null,
        official: source.official ?? true,
        note: source.note ?? null,
        verifiedAt: guide.verifiedAt,
        position: guide.sources.length + index,
      },
    })
  }

  for (const [position, slug] of (seed.related ?? []).entries()) {
    const target = await prisma.guide.findUnique({ where: { countryCode_slug: { countryCode, slug } } })
    if (!target) continue
    await prisma.relatedGuide.upsert({
      where: { fromGuideId_toGuideId: { fromGuideId: guide.id, toGuideId: target.id } },
      update: {},
      create: { fromGuideId: guide.id, toGuideId: target.id, position },
    })
  }
}

/**
 * A guide's obligations, named as groups: each group is alternatives for one duty, most preferred first. One reconciliation
 * of every group, in one transaction (SB-255, SB-258): a slug named in two groups is refused; each group's first obligation
 * the database has is linked at the group's index; the guide's links to every named obligation no group chose are deleted;
 * a link to an obligation no group names is left alone, unless it sits at the index of a group that links one, which is
 * refused, since the schema lets two links share a position and their order would tie.
 */
export const linkObligationGroups = async (
  prisma: PrismaClient,
  guideId: string,
  groups: readonly (readonly string[])[] | undefined,
): Promise<void> => {
  if (!groups || groups.length === 0) return
  const named = groups.flat()
  const repeated = [...new Set(named.filter((slug, index) => named.indexOf(slug) !== index))]
  if (repeated.length > 0) throw new Error(`A guide names ${repeated.join(', ')} in more than one of its obligation groups.`)

  const rows = await prisma.obligation.findMany({ where: { slug: { in: named } }, select: { id: true, slug: true } })
  const idOf = new Map(rows.map((row) => [row.slug, row.id]))
  const chosen = groups.map((group) => group.map((slug) => idOf.get(slug)).find((id) => id !== undefined))
  const namedIds = new Set(rows.map((row) => row.id))
  const kept = new Set(chosen.filter((id) => id !== undefined))

  await prisma.$transaction(async (tx) => {
    const links = await tx.guideObligation.findMany({ where: { guideId } })
    const clash = links.find((link) => !namedIds.has(link.obligationId) && chosen[link.position] !== undefined)
    if (clash)
      throw new Error(
        `Guide ${guideId} links an obligation its groups do not name at position ${clash.position}, where one of its groups links.`,
      )

    const stale = links.filter((link) => namedIds.has(link.obligationId) && !kept.has(link.obligationId)).map((link) => link.obligationId)
    if (stale.length > 0) await tx.guideObligation.deleteMany({ where: { guideId, obligationId: { in: stale } } })

    for (const [position, obligationId] of chosen.entries()) {
      if (obligationId === undefined) continue
      const link = links.find((candidate) => candidate.obligationId === obligationId)
      if (!link) await tx.guideObligation.create({ data: { guideId, obligationId, position } })
      else if (link.position !== position)
        await tx.guideObligation.update({ where: { guideId_obligationId: { guideId, obligationId } }, data: { position } })
    }
  })
}
