import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { defaultLocale, isLocale, locales, nearestLocale } from './locales'

/**
 * Bare user-visible strings are caught by eslint, not from here.
 *
 * This file used to scan `.tsx` sources with a regular expression looking for
 * text between `>` and `<`. It could not tell a closing tag from a generic, so
 * two consecutive `useState<Locale | null>` lines read as an element with the
 * code between them as its contents. `lingui/no-unlocalized-strings` in
 * eslint.config.mjs does the same job against a real syntax tree.
 */

test('every locale declares a direction and a catalog', () => {
  for (const [tag, locale] of Object.entries(locales)) {
    assert.ok(locale.dir === 'ltr' || locale.dir === 'rtl', `${tag} has no direction`)
    assert.ok(locale.catalog.length > 0, `${tag} has no catalog`)
    assert.ok(locale.label.length > 0, `${tag} has no label`)
  }
})

test('a locale labels itself in its own language', () => {
  // A person looking for Persian is looking for the word Persian is written
  // with, not for the word English uses for it.
  assert.equal(locales['fa-IR'].label, 'فارسی')
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

test('the first language a reader lists wins over a later one we also have', () => {
  assert.equal(nearestLocale(['fa-IR', 'en-US']), 'fa-IR')
  assert.equal(nearestLocale(['en-US', 'fa-IR']), 'en-US')
})

test('isLocale refuses a tag we do not ship', () => {
  assert.equal(isLocale('fa-IR'), true)
  assert.equal(isLocale('de-DE'), false)
  assert.equal(isLocale(''), false)
})
