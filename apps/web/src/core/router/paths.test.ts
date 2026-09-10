import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { validated } from 'src/core/country'
import { locales, type Locale } from 'src/core/i18n'
import {
  canonicalPath,
  countryFromSegment,
  countrySegment,
  localeFromSegment,
  localeSegment,
  paths,
  readerFromSegment,
  readerSegment,
  samePageFrom,
  samePageIn,
  type Journey,
} from './paths'

const tr = validated('tr')
const inEnglish: Journey = { locale: 'en-US', origin: null, country: tr }
const fromIran: Journey = { locale: 'fa-IR', origin: 'ir', country: tr }

test('a URL carries the short public form of a language, not the lingui tag', () => {
  assert.equal(localeSegment('en-US'), 'en')
  assert.equal(localeSegment('fa-IR'), 'fa')
})

test('every locale has a URL form and no two share one', () => {
  // Exhaustive by construction: a locale added without a path fails to
  // typecheck, and one that reuses another's path fails here.
  const forms = (Object.keys(locales) as Locale[]).map(localeSegment)
  assert.equal(new Set(forms).size, forms.length, `two locales share a URL form: ${forms.join(', ')}`)
  for (const form of forms) assert.ok(form.length > 0)
})

test('a locale round trips through its URL segment', () => {
  for (const locale of Object.keys(locales) as Locale[]) {
    assert.equal(localeFromSegment(localeSegment(locale)), locale)
  }
  assert.equal(localeFromSegment('de'), null)
  assert.equal(localeFromSegment(''), null)
  assert.equal(localeFromSegment('..'), null)
})

test('the first segment is the language, and where the reader comes from once they say', () => {
  // The owner's reading of /en-TR/DE: in English, from Turkey, moving to Germany.
  assert.deepEqual(readerFromSegment('en'), { locale: 'en-US', origin: null })
  assert.deepEqual(readerFromSegment('en-TR'), { locale: 'en-US', origin: 'tr' })
  assert.deepEqual(readerFromSegment('fa-IR'), { locale: 'fa-IR', origin: 'ir' })
  // What was the lingui tag is now simply English, from the United States.
  assert.deepEqual(readerFromSegment('en-US'), { locale: 'en-US', origin: 'us' })
  assert.deepEqual(readerFromSegment('EN-tr'), { locale: 'en-US', origin: 'tr' }, 'any casing reads, and is canonicalised elsewhere')

  assert.equal(readerFromSegment('de'), null, 'a language we do not have')
  assert.equal(readerFromSegment('en-ZZ'), null, 'a code that is not a country')
  assert.equal(readerFromSegment('en-UK'), null, 'a retired alias, GB is the code')
  assert.equal(readerFromSegment('en-TR-DE'), null)
  assert.equal(readerFromSegment(''), null)
})

test('a reader is written back the way the owner writes one', () => {
  assert.equal(readerSegment({ locale: 'en-US', origin: null }), 'en')
  assert.equal(readerSegment({ locale: 'en-US', origin: 'tr' }), 'en-TR')
  assert.equal(readerSegment({ locale: 'fa-IR', origin: 'ir' }), 'fa-IR')
})

test('a country segment is checked for SHAPE here, and for existence by the API', () => {
  // Two letters is all a URL can tell you; whether that country exists is a
  // question only the database answers, and `CountryRoute` asks it.
  assert.equal(countryFromSegment('TR'), 'tr', 'lowercase inside, as the database keeps codes')
  assert.equal(countryFromSegment('tr'), 'tr')
  assert.equal(countryFromSegment('DE'), 'de', 'a country we have not seen before is still shaped like one')
  assert.equal(countryFromSegment(''), null)
  assert.equal(countryFromSegment('turkey'), null)
  assert.equal(countryFromSegment('t1'), null)
  assert.equal(countrySegment('tr'), 'TR')
})

test('every path names the reader, the country, and the page in words', () => {
  assert.equal(paths.home(inEnglish), '/en/TR')
  assert.equal(paths.home(fromIran), '/fa-IR/TR')
  assert.equal(paths.taskHub(fromIran, 'start-a-business'), '/fa-IR/TR/tasks/start-a-business')
  assert.equal(paths.categoryHub(inEnglish, 'getting-settled', 'residence'), '/en/TR/tasks/getting-settled/residence')
  assert.equal(paths.setup(inEnglish, 'start-a-business'), '/en/TR/setup/start-a-business')
  assert.equal(paths.guides(inEnglish), '/en/TR/guides')
  assert.equal(paths.guide(inEnglish, 'sim-card'), '/en/TR/guides/sim-card')
  assert.equal(paths.suggest(inEnglish, 'sim-card'), '/en/TR/guides/sim-card/suggest')
  assert.equal(paths.search(inEnglish, 'bank account & IBAN'), '/en/TR/search?q=bank%20account%20%26%20IBAN')
})

test('an address someone already has arrives at the one address its page now has', () => {
  assert.equal(canonicalPath('/en/tr/t/start-a-business'), '/en/TR/tasks/start-a-business')
  assert.equal(canonicalPath('/en/tr/g/sim-card/suggest'), '/en/TR/guides/sim-card/suggest')
  assert.equal(canonicalPath('/fa-ir/tr'), '/fa-IR/TR')
  assert.equal(canonicalPath('/EN/TR/guides/sim-card'), '/en/TR/guides/sim-card')
  // Already canonical: unchanged, which is what stops a redirect loop.
  assert.equal(canonicalPath('/en-IR/TR/tasks/getting-settled/first-week'), '/en-IR/TR/tasks/getting-settled/first-week')
  // Not ours to canonicalise; Not Found answers it.
  assert.equal(canonicalPath('/'), null)
  assert.equal(canonicalPath('/xx/tr'), null)
  assert.equal(canonicalPath('/en/turkey'), null)
})

test('switching language keeps the reader on the page, from where they said they are from', () => {
  assert.equal(samePageIn({ pathname: '/en/TR/guides/sim-card' }, 'fa-IR'), '/fa/TR/guides/sim-card')
  assert.equal(samePageIn({ pathname: '/en-IR/TR/tasks/start-a-business' }, 'fa-IR'), '/fa-IR/TR/tasks/start-a-business')
  assert.equal(samePageIn({ pathname: '/fa-IR/TR' }, 'en-US'), '/en-IR/TR')
})

test('switching language keeps the place in the page, and the query', () => {
  // Someone reading the sources section of a guide and switching language has
  // to land on that section. Dropping the hash sends them to the top of a page
  // in a language they can now read but a place they have lost.
  assert.equal(
    samePageIn({ pathname: '/en/TR/guides/sim-card', hash: '#official-sources' }, 'fa-IR'),
    '/fa/TR/guides/sim-card#official-sources',
  )
  assert.equal(samePageIn({ pathname: '/en/TR/search', search: '?q=sim' }, 'fa-IR'), '/fa/TR/search?q=sim')
})

test('saying where you come from, or taking it back, keeps the page and the language', () => {
  assert.equal(samePageFrom({ pathname: '/en/TR/guides/sim-card' }, 'ir'), '/en-IR/TR/guides/sim-card')
  assert.equal(samePageFrom({ pathname: '/fa-IR/TR/tasks/start-a-business', search: '?x=1' }, 'af'), '/fa-AF/TR/tasks/start-a-business?x=1')
  assert.equal(samePageFrom({ pathname: '/en-IR/TR' }, null), '/en/TR')
})

test('a page with no reader in its address is left alone', () => {
  // The root, before the redirect has run. Rewriting the first segment there
  // turns `/` into `/fa`, which is a different page, silently.
  assert.equal(samePageIn({ pathname: '/' }, 'fa-IR'), '/')
  assert.equal(samePageIn({ pathname: '/not-a-locale/TR' }, 'fa-IR'), '/not-a-locale/TR')
  assert.equal(samePageFrom({ pathname: '/' }, 'ir'), '/')
})
