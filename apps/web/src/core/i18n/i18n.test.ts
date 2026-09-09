import { strict as assert } from 'node:assert'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { defaultLocale, isLocale, locales, nearestLocale } from './locales'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return entry === 'locales' ? [] : files(full)
    return /\.tsx$/.test(entry) ? [full] : []
  })

/**
 * Text a person reads, sitting bare in JSX.
 *
 * Only `.tsx` is scanned, and only text between tags: an attribute, an import
 * or a comment is not something a reader sees. Anything shorter than two words
 * is skipped, because single tokens in JSX are overwhelmingly punctuation,
 * numbers, or interpolations rather than prose.
 */
const bareText = (source: string): string[] => {
  const scannable = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    // Text inside <Trans> is the translated case, which is the thing being
    // asked for. Without this the rule reports every correct usage as a defect.
    .replace(/<Trans[^>]*>[\s\S]*?<\/Trans>/g, '<Trans />')

  const found: string[] = []

  for (const match of scannable.matchAll(/>([^<>{}]+)</g)) {
    const text = (match[1] ?? '').replace(/\s+/g, ' ').trim()
    if (!text) continue
    if (!/[A-Za-z\u0600-\u06FF]/.test(text)) continue
    if (text.split(' ').length < 2) continue
    found.push(text)
  }

  return found
}

test('no user-visible string sits outside lingui', () => {
  const offenders: string[] = []

  for (const file of files(SRC)) {
    const where = relative(SRC, file).split('\\').join('/')
    if (/\.stories\.tsx$/.test(where)) continue

    const source = readFileSync(file, 'utf8')
    for (const text of bareText(source)) {
      offenders.push(`${where}: "${text.slice(0, 60)}"`)
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Wrap these in <Trans> or t\`\`. A bare literal is a defect in BOTH languages: untranslatable in Persian, and invisible to the extractor in English:\n  ${offenders.join('\n  ')}`,
  )
})

test('the scan actually recognises a bare string', () => {
  // A guard nobody has watched fail is a guard nobody has checked. This is the
  // shape the rule is about, and it must be seen.
  assert.deepEqual(bareText('<Typography>Start this process now</Typography>'), ['Start this process now'])
})

test('and does not flag things a reader never sees', () => {
  assert.deepEqual(bareText('<Box sx={{ p: 4 }}>{children}</Box>'), [])
  assert.deepEqual(bareText('<Box>·</Box>'), [])
})

test('text inside Trans is the correct case, not a defect', () => {
  // The first version of this rule reported every properly translated string,
  // which would have taught the next person that the rule was noise.
  assert.deepEqual(bareText('<Trans>Start this process now</Trans>'), [])
  assert.deepEqual(bareText('<Typography><Trans>Required documents</Trans></Typography>'), [])
})

test('every locale declares a direction and a catalog', () => {
  for (const [tag, locale] of Object.entries(locales)) {
    assert.ok(locale.dir === 'ltr' || locale.dir === 'rtl', `${tag} has no direction`)
    assert.ok(locale.catalog.length > 0, `${tag} has no catalog`)
    assert.ok(locale.label.length > 0, `${tag} has no label`)
  }
})

test('Persian is right to left and English is not', () => {
  assert.equal(locales['fa-IR'].dir, 'rtl')
  assert.equal(locales['en-US'].dir, 'ltr')
})

test('a browser language maps to a locale we actually have', () => {
  assert.equal(nearestLocale(['fa-IR']), 'fa-IR')
  // A regional Persian we do not ship still gets Persian, not English.
  assert.equal(nearestLocale(['fa-AF', 'en-GB']), 'fa-IR')
  assert.equal(nearestLocale(['en-GB']), 'en-US')
  assert.equal(nearestLocale(['de-DE']), defaultLocale)
  assert.equal(nearestLocale([]), defaultLocale)
})

test('isLocale refuses a tag we do not ship', () => {
  assert.equal(isLocale('fa-IR'), true)
  assert.equal(isLocale('de-DE'), false)
})
