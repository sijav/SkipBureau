import { readdirSync, readFileSync, statSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { appTheme } from './theme'
import { dark, light, radius } from './tokens'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// tokens.ts is the one place a colour may be written down. Everything else
// reaches it through the theme.
//
// Tests are exempt because they are not component files, and this one has to
// quote a bad colour in order to describe the bug it guards against.
const ALLOWED = ['core/theme/tokens.ts']
const isTest = (path: string) => /\.test\.tsx?$/.test(path)

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry) ? [full] : []
  })

test('no file but tokens.ts contains a colour literal', () => {
  const offenders: string[] = []

  for (const file of sourceFiles(SRC)) {
    const where = relative(SRC, file).split('\\').join('/')
    if (ALLOWED.includes(where) || isTest(where)) continue

    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g)) {
      const line = source.slice(0, match.index).split('\n').length
      offenders.push(`${where}:${line} ${match[0]}`)
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `A colour belongs in tokens.ts and nowhere else, so that changing one is a single edit and dark mode is not a retrofit:\n  ${offenders.join('\n  ')}`,
  )
})

test('every token is a plain six digit colour', () => {
  // A typo that adds two digits is a valid CSS colour with an alpha channel, so
  // it renders as almost nothing rather than failing. That happened here:
  // accentSubtle was written #16302708 and the dark surface quietly vanished.
  for (const [mode, tokens] of [
    ['light', light],
    ['dark', dark],
  ] as const) {
    for (const [name, value] of Object.entries(tokens)) {
      assert.match(value, /^#[0-9A-Fa-f]{6}$/, `${mode}.${name} is ${value}, which is not a six digit colour`)
    }
  }
})

test('light and dark define exactly the same token names', () => {
  // A token present in one mode and missing in the other is a component that
  // renders in light and breaks in dark, found by a person rather than a test.
  assert.deepEqual(Object.keys(dark).sort(), Object.keys(light).sort())
})

test('the theme exposes every token, not just the ones MUI has a slot for', () => {
  const theme = appTheme('light', 'ltr')
  assert.deepEqual(Object.keys(theme.tokens).sort(), Object.keys(light).sort())
  assert.equal(theme.tokens.accentText, light.accentText)
})

test('a token that carries meaning keeps it across modes', () => {
  // The design reserves amber for a date or condition at stake and red for
  // stopped, refused or at risk. Dark mode lightens them; it must not reassign
  // them, or the colour stops meaning anything.
  const lightTheme = appTheme('light', 'ltr')
  const darkTheme = appTheme('dark', 'ltr')

  assert.equal(lightTheme.palette.warning.main, light.warning)
  assert.equal(darkTheme.palette.warning.main, dark.warning)
  assert.equal(lightTheme.palette.error.main, light.danger)
  assert.equal(darkTheme.palette.error.main, dark.danger)
})

test('ink sits on the accent, in both modes, because white does not pass on mint', () => {
  assert.equal(appTheme('light', 'ltr').palette.primary.contrastText, light.textOnAccent)
  assert.equal(appTheme('dark', 'ltr').palette.primary.contrastText, dark.textOnAccent)
})

test('there is no pill radius, because the design refuses one', () => {
  const values = Object.values(radius)
  assert.equal(Math.max(...values), 8)
  assert.equal(values.some((value) => value > 8), false)
})

test('spacing is an 8px step, so sx p:2 is 16', () => {
  const theme = appTheme('light', 'ltr')
  assert.equal(theme.spacing(2), '16px')
  assert.equal(theme.spacing(0.5), '4px')
})

test('carries the mode and direction it was given', () => {
  assert.equal(appTheme('dark', 'rtl').palette.mode, 'dark')
  assert.equal(appTheme('dark', 'rtl').direction, 'rtl')
  assert.equal(appTheme('light', 'ltr').direction, 'ltr')
})
