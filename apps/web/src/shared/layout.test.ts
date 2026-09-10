import { strict as assert } from 'node:assert'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { layout } from 'src/core/theme'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * A tripwire, not the guard.
 *
 * The real proof that the app reflows is `e2e/responsive.spec.ts`, which
 * measures every element at every breakpoint edge. This only catches the one
 * mistake that is easy to make and invisible in review: writing a width
 * straight out of the Figma frame into a component, which is how a page ends
 * up needing a horizontal scrollbar on a phone.
 */

const WIDTHS = new Set<number>([
  ...Object.entries(layout)
    .filter(([name]) => name.toLowerCase().includes('width'))
    .map(([, value]) => value),
  // The component widths the design draws, which are not layout tokens.
  1440, 840, 560, 520, 420, 400, 380, 360, 344, 320, 302,
])

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return entry === 'locales' ? [] : sources(full)
    return /\.tsx?$/.test(entry) && !/\.(test|stories)\.tsx?$/.test(entry) ? [full] : []
  })

test('no component sets a fixed width taken from the design', () => {
  const offenders: string[] = []

  for (const file of sources(SRC)) {
    const where = relative(SRC, file).split('\\').join('/')
    // tokens.ts is where the numbers are declared, which is the point of it.
    if (where === 'core/theme/tokens.ts') continue

    const source = readFileSync(file, 'utf8')

    for (const match of source.matchAll(/(?<!max|min|Max|Min)(?:^|[^A-Za-z])width:\s*(\d+)/g)) {
      const value = Number(match[1])
      if (WIDTHS.has(value)) offenders.push(`${where}: width: ${value}`)
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `A design width is a CAP, not a size. Use maxWidth, a gap or a column count:\n  ${offenders.join('\n  ')}`,
  )
})

test('the tripwire recognises the mistake it exists for', () => {
  // A guard nobody has watched fail is a guard nobody has checked.
  const planted = 'const styles = { width: 360, padding: 16 }'
  const found = [...planted.matchAll(/(?<!max|min|Max|Min)(?:^|[^A-Za-z])width:\s*(\d+)/g)].map((m) => Number(m[1]))
  assert.deepEqual(found.filter((value) => WIDTHS.has(value)), [360])
})

test('and leaves a cap alone, which is the correct form', () => {
  const correct = 'sx={{ maxWidth: 360, minWidth: 0 }}'
  const found = [...correct.matchAll(/(?<!max|min|Max|Min)(?:^|[^A-Za-z])width:\s*(\d+)/g)].map((m) => Number(m[1]))
  assert.deepEqual(found, [])
})

test('every layout width is a number the design actually states', () => {
  // Guards against a width being invented here and then treated as
  // transcribed. Each of these is read off a frame in DESIGN.md.
  assert.deepEqual(
    Object.entries(layout)
      .filter(([name]) => name.toLowerCase().includes('width'))
      .map(([, value]) => value)
      .sort((a, b) => b - a),
    [1280, 1080, 860, 720, 640],
  )
})
