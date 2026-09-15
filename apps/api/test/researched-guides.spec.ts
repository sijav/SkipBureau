import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { RESEARCHED_GUIDES } from '../src/guide/researched-guides.js'

// SB-258: a guide written from the agreed research says only what the agreed document says, whole sentences in its
// order, and nothing the template would give emphasis the document does not.

const AGREED = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'research', 'agreed')
const DOCUMENTS: Readonly<Record<string, string>> = { tr: 'turkey/short-term-residence-permit.md', de: 'germany/residence-permit.md' }

/** A document as a reader of a guide meets it: footnote markers, bold and list markers out, composed, whitespace folded. */
const plain = (text: string): string =>
  text
    .replace(/^- /gm, '')
    .replace(/\[\^[a-z0-9-]+\]/g, '')
    .replaceAll('**', '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()

const folded = (text: string): string => text.normalize('NFC').replace(/\s+/g, ' ').trim()

const documentOf = (country: string): string => {
  const name = DOCUMENTS[country]
  if (!name) throw new Error(`No agreed document for ${country}`)
  return readFileSync(join(AGREED, name), 'utf8')
}

test("every text of each researched guide is its agreed document's, and its title is the document's own heading", () => {
  expect(RESEARCHED_GUIDES.map((guide) => guide.country).sort()).toEqual(['de', 'tr'])
  for (const guide of RESEARCHED_GUIDES) {
    const source = documentOf(guide.country)
    const document = plain(source)
    expect(source.split('\n')[0], guide.country).toBe(`# ${guide.guide.en.title}`)

    const [first, ...rest] = guide.detail.sections
    if (!first) throw new Error(`${guide.country}'s guide has no section`)
    // The page opens with the description, so the first section's body starts after it.
    expect(document, `${guide.country}: ${first.title?.en}`).toContain(
      folded(`${first.title?.en} ${guide.guide.en.description} ${first.body?.en}`),
    )
    for (const section of rest)
      expect(document, `${guide.country}: ${section.title?.en}`).toContain(folded(`${section.title?.en} ${section.body?.en}`))
  }
})

test('no researched guide gives a sentence emphasis its document does not: no quick answer, cost strip, steps, note or callout', () => {
  for (const guide of RESEARCHED_GUIDES) {
    const { detail } = guide
    expect(
      [detail.intro, detail.quickAnswer, detail.cost, detail.time, detail.deadlines, detail.costNote, detail.options],
      guide.country,
    ).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, undefined])
    for (const section of detail.sections) {
      const label = `${guide.country}: ${section.title?.en}`
      expect([section.steps, section.note, section.callout, section.calloutBody, section.calloutSource, section.link], label).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ])
      expect(section.kind, label).not.toBe('yourOptions')
      expect(section.title?.en.endsWith('.'), `${label}: a bold lead keeps its full stop`).toBe(true)
    }
  }
})
