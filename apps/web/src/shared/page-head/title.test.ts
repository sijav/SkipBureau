import { setupI18n } from '@lingui/core'
import { expect, test } from 'vitest'
import { pageName } from './title'

// No catalog: this asserts the DECISION, never a translation. The owner, 2026-09-10: "unless you want to test lingui
// it make zero sense to test Farsi". So every case below is about which branch runs, and the one that checks the
// suffix asks only that the country reached the name, not what words carried it.
const i18n = setupI18n({ locale: 'en-US', messages: { 'en-US': {} } })

const GUIDE = 'Getting a short-term residence permit in Turkey'

test('a title written in another language than the page is left exactly as it is', () => {
  // SB-291: a guide with no Persian text is shown on the Persian page in English. Adding the page language's words to
  // it names the country twice, in two languages, in every search result and link preview.
  expect(pageName(i18n, { title: GUIDE, place: 'ترکیه', shown: 'en-US', locale: 'fa-IR' })).toBe(GUIDE)
})

test('a title that names no country still keeps its own words when the page is read in another language', () => {
  const written = 'Register your address'
  expect(pageName(i18n, { title: written, place: 'ترکیه', shown: 'en-US', locale: 'fa-IR' })).toBe(written)
})

test('a title in the page’s own language is named with its country, as it always was', () => {
  const named = pageName(i18n, { title: 'Register your address', place: 'Turkey', shown: 'en-US', locale: 'en-US' })

  expect(named).not.toBe('Register your address')
  expect(named).toContain('Turkey')
})

test('a title that already names its country is not told again', () => {
  expect(pageName(i18n, { title: GUIDE, place: 'Turkey', shown: 'en-US', locale: 'en-US' })).toBe(GUIDE)
})

test('a page that says nothing about its language keeps the behaviour it had', () => {
  const named = pageName(i18n, { title: 'Register your address', place: 'Turkey', shown: undefined, locale: 'en-US' })

  expect(named).toContain('Turkey')
})
