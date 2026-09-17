import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { RESEARCHED_GUIDES } from '../src/guide/researched-guides.js'

// SB-258: a guide written from the agreed research says only what the agreed document says, whole sentences in its
// order, and nothing the template would give emphasis the document does not.

const AGREED = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'research', 'agreed')
// Each guide's document, by country and guide (SB-281): a country can have more than one.
const DOCUMENTS: Readonly<Record<string, string>> = {
  'tr/short-term-residence-permit': 'turkey/short-term-residence-permit.md',
  'de/residence-permit': 'germany/residence-permit.md',
  'tr/register-your-address': 'turkey/address-registration.md',
  'tr/tax-number': 'turkey/tax-number.md',
  'tr/health-insurance': 'turkey/health-insurance.md',
  'tr/work-permit': 'turkey/work-permit.md',
  'tr/company-formation': 'turkey/company-formation.md',
  'de/anmeldung': 'germany/anmeldung.md',
  'de/business-registration': 'germany/business-registration.md',
  'de/health-insurance': 'germany/health-insurance.md',
}

/**
 * A lead a guide deliberately does not carry, by document, with why. Germany's residence permit document compares two
 * cities in a table, which a guide's sections cannot draw yet (SB-290), so that lead and its table are left out whole
 * rather than shown as prose that reads as a paragraph.
 */
const OMITTED: Readonly<Record<string, readonly string[]>> = {
  'de/residence-permit': ['Cities do the same thing differently.'],
}

const keyOf = (guide: (typeof RESEARCHED_GUIDES)[number]): string => `${guide.country}/${guide.guide.slug}`

/**
 * A document as a reader of a guide meets it: footnote markers and every Markdown marker out, composed, whitespace
 * folded. SB-283: italic and code markers go too, so a guide can never show one literally. Paired markers only, before
 * the whitespace fold, so a stray unpaired marker stays visible to the comparison and a pair cannot form across a
 * paragraph. `[^*]` already matches a newline, which is what lets a span wrapped over two lines be taken out.
 */
const plain = (text: string): string =>
  text
    .replace(/^- /gm, '')
    .replace(/\[\^[a-z0-9-]+\]/g, '')
    .replaceAll('**', '')
    .replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '$1')
    .replace(/(?<!`)`(?!`)([^`]+?)`(?!`)/g, '$1')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()

const folded = (text: string): string => text.normalize('NFC').replace(/\s+/g, ' ').trim()

const documentOf = (key: string): string => {
  const name = DOCUMENTS[key]
  if (!name) throw new Error(`No agreed document for ${key}`)
  return readFileSync(join(AGREED, name), 'utf8')
}

test("every text of each researched guide is its agreed document's, and its title is the document's own heading", () => {
  expect(RESEARCHED_GUIDES.map(keyOf).sort()).toEqual(Object.keys(DOCUMENTS).sort())
  for (const guide of RESEARCHED_GUIDES) {
    const key = keyOf(guide)
    const source = documentOf(key)
    const document = plain(source)
    expect(source.split('\n')[0], key).toBe(`# ${guide.guide.en.title}`)

    const [first, ...rest] = guide.detail.sections
    if (!first) throw new Error(`${key} has no section`)
    // The page opens with the description, so the first section's body starts after it.
    expect(document, `${key}: ${first.title?.en}`).toContain(folded(`${first.title?.en} ${guide.guide.en.description} ${first.body?.en}`))
    for (const section of rest)
      expect(document, `${key}: ${section.title?.en}`).toContain(folded(`${section.title?.en} ${section.body?.en}`))
  }
})

/**
 * The pages of the footnotes the guide's own sentences carry, each once, in the order the document defines them. A
 * sentence counts where the guide shows it; one in a part the guide leaves out, such as Germany's table of cities,
 * cites nothing for it.
 */
/**
 * The definitions a guide's own shown sentences cite, by label (SB-308). A label cited only by a lead the guide does
 * not carry, such as the two city table OMITTED records, is not cited BY THE GUIDE, and must not date it.
 */
const labelsCited = (source: string, shown: string): Set<string> => {
  const used = new Set<string>()
  for (const paragraph of source.split(/\r?\n\s*\r?\n/)) {
    if (paragraph.startsWith('[^')) continue
    for (const sentence of paragraph.split(/(?<=[.?!])\s+/)) {
      const labels = [...sentence.matchAll(/\[\^([a-z0-9-]+)\]/g)].map((found) => found[1] ?? '')
      if (labels.length > 0 && shown.includes(plain(sentence))) for (const label of labels) used.add(label)
    }
  }
  return used
}

/** Every footnote definition by label, with the day the document records it was read (SB-308). */
const readsOf = (source: string): Map<string, { url: string | null; read: string }> => {
  const definitions = new Map<string, { url: string | null; read: string }>()
  for (const line of source.split(/\r?\n/)) {
    const found = /^\[\^([^\]]+)\]: (?:<([^>]+)>|calculated) \| (\{.*\})$/.exec(line)
    if (!found?.[1] || !found[3]) continue
    const meta: unknown = JSON.parse(found[3])
    if (typeof meta === 'object' && meta !== null && 'read' in meta && typeof meta.read === 'string') {
      definitions.set(found[1], { url: found[2] ?? null, read: meta.read })
    }
  }
  return definitions
}

/** A guide as a reader meets it: the text the sources test already composes, so both tests ask the same question. */
const shownOf = (guide: (typeof RESEARCHED_GUIDES)[number]): string => {
  const [first, ...rest] = guide.detail.sections
  return folded(
    [first?.title?.en, guide.guide.en.description, first?.body?.en, ...rest.flatMap((section) => [section.title?.en, section.body?.en])].join(' '),
  )
}

const pagesCited = (source: string, shown: string): string[] => {
  const used = labelsCited(source, shown)
  const pages: string[] = []
  for (const line of source.split(/\r?\n/)) {
    const found = /^\[\^([^\]]+)\]: <([^>]+)> \|/.exec(line)
    if (found?.[1] && found[2] && used.has(found[1]) && !pages.includes(found[2])) pages.push(found[2])
  }
  return pages
}

test("each researched guide's sources are the pages its sentences cite, each once, in the order its document defines them", () => {
  // SB-206: a page whose sentence has left the guide cannot stay among its sources. Pages only: a source's name is its
  // locator's words, and SB-288 has one that differs.
  for (const guide of RESEARCHED_GUIDES) {
    const key = keyOf(guide)
    const shown = shownOf(guide)
    expect(
      guide.detail.sources.map((source) => source.url),
      key,
    ).toEqual(pagesCited(documentOf(key), shown))
  }
})

test('no researched guide gives a sentence emphasis its document does not: no quick answer, cost strip, steps, note or callout', () => {
  for (const guide of RESEARCHED_GUIDES) {
    const { detail } = guide
    expect(
      [detail.intro, detail.quickAnswer, detail.cost, detail.time, detail.deadlines, detail.costNote, detail.options],
      keyOf(guide),
    ).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, undefined])
    for (const section of detail.sections) {
      const label = `${keyOf(guide)}: ${section.title?.en}`
      expect([section.steps, section.note, section.callout, section.calloutBody, section.calloutSource, section.link], label).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ])
      expect(section.kind, label).not.toBe('yourOptions')
      // SB-279: a lead can ask, as company formation's first does.
      expect(/[.?]$/.test(section.title?.en ?? ''), `${label}: a bold lead keeps its closing mark, a full stop or a question mark`).toBe(
        true,
      )
    }
  }
})

test("every bold lead of a document is a section title of its guide, in the document's order", () => {
  // SB-299 and SB-307: a guide keeps a section for every lead, so a heading that is lost, merged into a body or moved
  // fails here. The containment check above cannot see any of that.
  for (const guide of RESEARCHED_GUIDES) {
    const key = keyOf(guide)
    const told = documentOf(key).split('## What a reader is told')[1]?.split('\n## ')[0] ?? ''
    const leads = [...told.matchAll(/(?:^|\n\s*\n)\*\*([^*]+[.?])\*\*/g)]
      .map((found) => plain(found[1] ?? ''))
      .filter((lead) => !(OMITTED[key] ?? []).includes(lead))

    expect(leads.length, `${key}: its document has no bold lead`).toBeGreaterThan(0)
    expect(
      guide.detail.sections.map((section) => section.title?.en ?? ''),
      key,
    ).toEqual(leads)
  }
})

test("every researched guide's date is the oldest day a page its own sentences cite was read", () => {
  // SB-308: the date said the newest check, so a page dated its oldest claims by its most recent one. Oldest, because
  // "last verified" is a promise about the whole page, and the whole page is only as current as its stalest sentence.
  for (const guide of RESEARCHED_GUIDES) {
    const key = keyOf(guide)
    const source = documentOf(key)
    const definitions = readsOf(source)
    const reads = [...labelsCited(source, shownOf(guide))]
      .flatMap((label) => {
        const definition = definitions.get(label)
        return definition ? [definition.read] : []
      })
      .sort()
    expect(reads.length, `${key} shows no sentence citing a dated definition`).toBeGreaterThan(0)
    expect(guide.guide.verifiedAt, key).toBe(reads[0])
  }
})

test('every source card shows the day its own page was last read, not the day the guide carries', () => {
  // SB-308: latest for a card, oldest for the guide, and they pull apart on purpose. One URL can stand behind two
  // cited definitions read on different days, as germany/health-insurance.md does, so a card takes the later.
  for (const guide of RESEARCHED_GUIDES) {
    const key = keyOf(guide)
    const source = documentOf(key)
    const definitions = readsOf(source)
    const used = labelsCited(source, shownOf(guide))
    for (const card of guide.detail.sources) {
      const reads = [...used]
        .flatMap((label) => {
          const definition = definitions.get(label)
          return definition && definition.url === card.url ? [definition.read] : []
        })
        .sort()
      expect(reads.length, `${key} shows ${card.url}, which no sentence it carries cites`).toBeGreaterThan(0)
      expect(card.read ?? guide.guide.verifiedAt, `${key} ${card.url}`).toBe(reads[reads.length - 1])
    }
  }
})
