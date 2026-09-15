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
}

const keyOf = (guide: (typeof RESEARCHED_GUIDES)[number]): string => `${guide.country}/${guide.guide.slug}`

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
