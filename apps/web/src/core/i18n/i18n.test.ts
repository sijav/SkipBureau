import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { defaultLocale, formatDay, formatMonth, isLocale, locales, nearestLocale } from './locales'

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

test('an English date is written day first, with the month named as the design names it', () => {
  // The order is en-GB's, "24 Aug 2026". The NAME is en-US's, because current
  // ICU abbreviates September as "Sept" in en-GB and the design writes "Sep"
  // (SB-151). The long form is "September" in both, and Persian keeps its own
  // calendar, month and digits.
  assert.equal(formatDay('2026-08-24', 'en-US'), '24 Aug 2026')
  assert.equal(formatDay('2026-09-07', 'en-US'), '07 Sep 2026')
  assert.equal(formatMonth('2026-09-20', 'en-US'), 'Sep 2026')
  assert.equal(formatMonth('2026-09-20', 'en-US', 'long'), 'September 2026')
  assert.equal(formatDay('2026-09-20', 'fa-IR'), new Intl.DateTimeFormat('fa-IR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date('2026-09-20')))
})
