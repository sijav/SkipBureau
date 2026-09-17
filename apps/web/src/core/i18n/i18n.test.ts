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
  // SB-414: German used to stand for "a language we do not ship" here. It is shipped
  // now, so the example has to be a language we genuinely do not have, or the assertion
  // stops testing the fallback and starts testing nothing.
  assert.equal(nearestLocale(['ja-JP']), defaultLocale)
  assert.equal(nearestLocale([]), defaultLocale)
})

test('the first language a reader lists wins over a later one we also have', () => {
  assert.equal(nearestLocale(['fa-IR', 'en-US']), 'fa-IR')
  assert.equal(nearestLocale(['en-US', 'fa-IR']), 'en-US')
})

test('isLocale refuses a tag we do not ship', () => {
  assert.equal(isLocale('fa-IR'), true)
  // SB-414: German is shipped now, so the tag this refuses has to be one we do not have.
  assert.equal(isLocale('ja-JP'), false)
  assert.equal(isLocale(''), false)
})

test('Turkish is a locale the app ships, and a Turkish browser reaches it', () => {
  // SB-414: the owner asked that every country the product covers brings its own
  // languages, and Turkey is the first country. These are new assertions rather than
  // corrections: the existing German ones still hold, because German is not added yet.
  assert.equal(isLocale('tr-TR'), true)
  assert.equal(locales['tr-TR'].dir, 'ltr')
  // A locale names itself in its own language, as Persian does.
  assert.equal(locales['tr-TR'].label, 'Türkçe')
  assert.equal(nearestLocale(['tr-TR']), 'tr-TR')
  // A regional Turkish we do not ship still gets Turkish, not English, the same way
  // fa-AF reaches Persian.
  assert.equal(nearestLocale(['tr-CY', 'en-GB']), 'tr-TR')
})

test('German is a locale the app ships, and a German browser reaches it', () => {
  // SB-414: Germany is the second country the product covers.
  assert.equal(isLocale('de-DE'), true)
  assert.equal(locales['de-DE'].dir, 'ltr')
  assert.equal(locales['de-DE'].label, 'Deutsch')
  assert.equal(nearestLocale(['de-DE']), 'de-DE')
  // Austrian German reaches German, as fa-AF reaches Persian and tr-CY reaches Turkish.
  assert.equal(nearestLocale(['de-AT', 'en-GB']), 'de-DE')
})

test('a German date keeps the dots German writes', () => {
  // SB-414: "24. Aug. 2026" is how German writes this date. The design draws the English
  // "24 Aug 2026", and the owner chose on 2026-09-17 to follow each language instead, so
  // this pins the departure rather than leaving it to drift. Measured from ICU.
  assert.equal(formatDay('2026-08-24', 'de-DE'), '24. Aug. 2026')
})

test('a Turkish date is written the way Turkish writes one', () => {
  // SB-414: the owner chose on 2026-09-17 that each language writes a date the way that
  // language writes it, rather than forcing the design's English shape onto every
  // locale. Turkish abbreviates August as "Ağu"; English borrows en-GB's order and
  // en-US's month name, which the test below pins. Measured from ICU, not guessed.
  assert.equal(formatDay('2026-08-24', 'tr-TR'), '24 Ağu 2026')
  assert.equal(formatMonth('2026-08-24', 'tr-TR'), 'Ağu 2026')
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
