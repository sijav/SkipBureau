import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { validated } from 'src/core/country'
import { locales, type Locale } from 'src/core/i18n'
import {
  canonicalPath,
  countryFromSegment,
  countrySegment,
  destinationFromSegment,
  destinationSegment,
  localeFromSegment,
  localeSegment,
  paths,
  readerFromSegment,
  readerSegment,
  samePageAs,
  samePageAt,
  samePageCleared,
  samePageFrom,
  samePageIn,
  samePageInRole,
  samePageWhere,
  situationFromSearch,
  statusFromSearch,
  type Journey,
} from './paths'

const tr = validated('tr')
const de = validated('de')
const inEnglish: Journey = { locale: 'en-US', origin: null, country: tr, place: null, status: null, situation: null }
const fromIran: Journey = { locale: 'fa-IR', origin: 'ir', country: tr, place: null, status: null, situation: null }
const inHamburg: Journey = { locale: 'en-US', origin: 'ir', country: de, place: 'DE-HH', status: 'de.visa-free', situation: null }

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

test('changing where you are keeps a page that exists in every country, and the reader', () => {
  assert.equal(samePageAt({ pathname: '/en/TR' }, 'de'), '/en/DE')
  assert.equal(samePageAt({ pathname: '/fa-IR/TR' }, 'de'), '/fa-IR/DE')
  assert.equal(samePageAt({ pathname: '/en/TR/guides' }, 'de'), '/en/DE/guides')
  assert.equal(samePageAt({ pathname: '/en-IR/TR/search', search: '?q=residence' }, 'de'), '/en-IR/DE/search?q=residence')
})

test('changing where you are sends a page that belongs to one country to the new home', () => {
  // A task hub for a goal the other country has no areas for is Not Found:
  // `taskHub` answers null, and Germany has getting-settled but not
  // start-a-business. So none of these is kept, not even a goal that exists.
  for (const pathname of [
    '/en/TR/tasks/start-a-business',
    '/en/TR/tasks/getting-settled',
    '/en/TR/tasks/start-a-business/register-your-company',
    '/en/TR/setup/start-a-business',
    '/en/TR/guides/sim-card',
    '/en/TR/guides/sim-card/suggest',
  ]) {
    assert.equal(samePageAt({ pathname, search: '?x=1', hash: '#official-sources' }, 'de'), '/en/DE', pathname)
  }
})

test('changing where you are reads a trailing slash as the same page', () => {
  assert.equal(samePageAt({ pathname: '/en/TR/' }, 'de'), '/en/DE')
  assert.equal(samePageAt({ pathname: '/en/TR/guides/' }, 'de'), '/en/DE/guides')
  assert.equal(samePageAt({ pathname: '/en/TR/search/', search: '?q=sim' }, 'de'), '/en/DE/search?q=sim')
})

test('changing where you are leaves an address that is not a country page alone', () => {
  assert.equal(samePageAt({ pathname: '/' }, 'de'), '/')
  assert.equal(samePageAt({ pathname: '/not-a-locale/TR' }, 'de'), '/not-a-locale/TR')
})

test('a place stands where the country was, read in any casing and written the way the API codes it', () => {
  // The owner's shape, 2026-09-15: /en-IR/TR-35/guides/register-your-address (SB-256).
  assert.deepEqual(destinationFromSegment('TR'), { country: 'tr', place: null })
  assert.deepEqual(destinationFromSegment('TR-35'), { country: 'tr', place: 'TR-35' })
  assert.deepEqual(destinationFromSegment('de-hh'), { country: 'de', place: 'DE-HH' })
  assert.deepEqual(destinationFromSegment('de-By.MUENCHEN'), { country: 'de', place: 'DE-BY.muenchen' })
  assert.equal(countryFromSegment('DE-BY.muenchen'), 'de', 'a place is inside its country')

  for (const segment of ['', 'DE-', 'DE-HHHH', 'D1-HH', 'DE-HH.', 'DE.HH', 'DEU', 'DE-HH.mü']) {
    assert.equal(destinationFromSegment(segment), null, segment)
  }

  assert.equal(destinationSegment({ country: 'tr', place: null }), 'TR')
  assert.equal(destinationSegment({ country: 'de', place: 'DE-BY.muenchen' }), 'DE-BY.muenchen')
})

test('an address with a place arrives at the one address its page has, as the API spells the place', () => {
  assert.equal(canonicalPath('/en/de-hh/guides/anmeldung'), '/en/DE-HH/guides/anmeldung')
  assert.equal(canonicalPath('/en-ir/DE-BY.MUENCHEN'), '/en-IR/DE-BY.muenchen')
  assert.equal(canonicalPath('/en/DE-HH/g/anmeldung'), '/en/DE-HH/guides/anmeldung')
  // Already canonical: unchanged, which is what stops a redirect loop.
  assert.equal(canonicalPath('/en-IR/DE-BY.muenchen/guides/anmeldung'), '/en-IR/DE-BY.muenchen/guides/anmeldung')
  assert.equal(canonicalPath('/en/DE-/guides/anmeldung'), null)
})

test('every path keeps the place and the status the reader has said', () => {
  assert.equal(paths.home(inHamburg), '/en-IR/DE-HH?status=de.visa-free')
  assert.equal(paths.guide(inHamburg, 'anmeldung'), '/en-IR/DE-HH/guides/anmeldung?status=de.visa-free')
  assert.equal(paths.categoryHub(inHamburg, 'getting-settled', 'first-week'), '/en-IR/DE-HH/tasks/getting-settled/first-week?status=de.visa-free')
  assert.equal(paths.search(inHamburg, 'bank account & IBAN'), '/en-IR/DE-HH/search?q=bank%20account%20%26%20IBAN&status=de.visa-free')
  assert.equal(paths.guide({ ...inHamburg, status: null }, 'anmeldung'), '/en-IR/DE-HH/guides/anmeldung')
  assert.equal(statusFromSearch('?q=sim&status=tr.residence-permit'), 'tr.residence-permit')
  assert.equal(statusFromSearch('?q=sim'), null)
  assert.equal(statusFromSearch('?status='), null)
})

test('saying where you live, or taking it back, keeps the reader, the page, the status and the fragment', () => {
  assert.equal(
    samePageWhere({ pathname: '/en-IR/DE/guides/anmeldung', search: '?status=de.visa-free', hash: '#sources' }, 'DE-HH'),
    '/en-IR/DE-HH/guides/anmeldung?status=de.visa-free#sources',
  )
  assert.equal(samePageWhere({ pathname: '/en-IR/DE-HH/guides/anmeldung' }, 'DE-BY.muenchen'), '/en-IR/DE-BY.muenchen/guides/anmeldung')
  assert.equal(samePageWhere({ pathname: '/en-IR/DE-HH/guides/anmeldung' }, null), '/en-IR/DE/guides/anmeldung')
  assert.equal(samePageWhere({ pathname: '/' }, 'DE-HH'), '/')
})

test('saying what you hold, or taking it back, changes only the status in the query', () => {
  assert.equal(samePageAs({ pathname: '/en/TR/search', search: '?q=bank%20account' }, 'tr.residence-permit'), '/en/TR/search?q=bank%20account&status=tr.residence-permit')
  assert.equal(samePageAs({ pathname: '/en/TR/guides/sim-card', search: '?status=tr.short-stay', hash: '#sources' }, 'tr.residence-permit'), '/en/TR/guides/sim-card?status=tr.residence-permit#sources')
  assert.equal(samePageAs({ pathname: '/en/TR/search', search: '?status=tr.short-stay&q=sim' }, null), '/en/TR/search?q=sim')
  assert.equal(samePageAs({ pathname: '/en/TR/guides/sim-card', search: '?status=tr.short-stay' }, null), '/en/TR/guides/sim-card')
  assert.equal(samePageAs({ pathname: '/' }, 'tr.residence-permit'), '/')
})

test('changing country leaves the place and the status behind, and switching language keeps both', () => {
  assert.equal(samePageAt({ pathname: '/en-IR/DE-HH/search', search: '?q=bank&status=de.visa-free' }, 'tr'), '/en-IR/TR/search?q=bank')
  assert.equal(samePageAt({ pathname: '/en/DE-HH', search: '?status=de.visa-free' }, 'tr'), '/en/TR')
  assert.equal(samePageAt({ pathname: '/en/DE-HH/guides/anmeldung', search: '?status=de.visa-free' }, 'tr'), '/en/TR')
  assert.equal(samePageIn({ pathname: '/en-IR/DE-HH/guides/anmeldung', search: '?status=de.visa-free' }, 'fa-IR'), '/fa-IR/DE-HH/guides/anmeldung?status=de.visa-free')
  assert.equal(samePageFrom({ pathname: '/en/DE-HH/guides/anmeldung', search: '?status=de.visa-free' }, 'ir'), '/en-IR/DE-HH/guides/anmeldung?status=de.visa-free')
})

test('every path keeps the role the reader has said, after the status', () => {
  // SB-286: a situation the country's rules name, such as worker, in the query as the status is.
  assert.equal(paths.home({ ...inHamburg, situation: 'company-founder' }), '/en-IR/DE-HH?status=de.visa-free&situation=company-founder')
  assert.equal(paths.guide({ ...inEnglish, situation: 'worker' }, 'work-permit'), '/en/TR/guides/work-permit?situation=worker')
  assert.equal(paths.search({ ...inEnglish, situation: 'worker' }, 'permit'), '/en/TR/search?q=permit&situation=worker')
  assert.equal(situationFromSearch('?q=sim&status=tr.residence-permit&situation=worker'), 'worker')
  assert.equal(situationFromSearch('?status=tr.residence-permit'), null)
  assert.equal(situationFromSearch('?situation='), null)
})

test('saying your role, or taking it back, changes only the role in the query', () => {
  assert.equal(samePageInRole({ pathname: '/en/TR/guides/work-permit' }, 'worker'), '/en/TR/guides/work-permit?situation=worker')
  assert.equal(
    samePageInRole({ pathname: '/en/TR/search', search: '?q=bank&status=tr.residence-permit', hash: '#results' }, 'company-founder'),
    '/en/TR/search?q=bank&status=tr.residence-permit&situation=company-founder#results',
  )
  assert.equal(
    samePageInRole({ pathname: '/en/TR/guides/work-permit', search: '?situation=worker&status=tr.residence-permit' }, null),
    '/en/TR/guides/work-permit?status=tr.residence-permit',
  )
  assert.equal(
    samePageAs({ pathname: '/en/TR/guides/work-permit', search: '?situation=worker' }, 'tr.residence-permit'),
    '/en/TR/guides/work-permit?situation=worker&status=tr.residence-permit',
  )
  assert.equal(samePageInRole({ pathname: '/' }, 'worker'), '/')
})

test('changing country and clearing everything leave the role behind with the status, and switching language keeps it', () => {
  assert.equal(samePageAt({ pathname: '/en/TR/search', search: '?q=bank&situation=worker&status=tr.residence-permit' }, 'de'), '/en/DE/search?q=bank')
  assert.equal(samePageCleared({ pathname: '/en-IR/TR/guides/work-permit', search: '?situation=worker' }), '/en/TR/guides/work-permit')
  assert.equal(samePageIn({ pathname: '/en/TR/guides/work-permit', search: '?situation=worker' }, 'fa-IR'), '/fa/TR/guides/work-permit?situation=worker')
})

test('clearing everything takes back the nationality, the place and the status, and nothing else', () => {
  assert.equal(
    samePageCleared({ pathname: '/fa-IR/DE-HH/search', search: '?q=bank&status=de.visa-free', hash: '#results' }),
    '/fa/DE/search?q=bank#results',
  )
  assert.equal(samePageCleared({ pathname: '/en/TR' }), '/en/TR')
  assert.equal(samePageCleared({ pathname: '/' }), '/')
})
