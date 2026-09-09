import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { appTheme } from './theme'

test('carries the direction it was given, because MUI reads it', () => {
  assert.equal(appTheme('light', 'rtl').direction, 'rtl')
  assert.equal(appTheme('light', 'ltr').direction, 'ltr')
})

test('carries the mode it was given', () => {
  assert.equal(appTheme('dark', 'ltr').palette.mode, 'dark')
  assert.equal(appTheme('light', 'ltr').palette.mode, 'light')
})
