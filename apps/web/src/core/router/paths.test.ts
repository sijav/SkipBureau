import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { validated } from '../country/countries'
import { locales, type Locale } from '../i18n/locales'
import { aliasedLocale, countryFromSegment, localeFromSegment, localeSegment, paths, samePageIn } from './paths'

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
})

test('a segment that is not a language we ship is refused, not coerced', () => {
  assert.equal(localeFromSegment('de'), null)
  assert.equal(localeFromSegment(''), null)
  assert.equal(localeFromSegment('..'), null)
})

test('the lingui tag is accepted only as an alias to redirect from', () => {
  // One canonical URL per page. `/en-US/tr/...` still works for a link someone
  // already shared, by redirecting to `/en/tr/...` rather than rendering a
  // second address for the same guide.
  assert.equal(aliasedLocale('en-US'), 'en-US')
  assert.equal(localeFromSegment('en-US'), null)
  assert.equal(aliasedLocale('en'), null)
})

test('a country segment is checked for SHAPE here, and for existence by the API', () => {
  // This deliberately stopped being a membership test. It used to consult a
  // hardcoded table of one country, which is why adding a country to the
  // database did not make its URL work. Two letters is all a URL can tell you;
  // whether that country exists is a question only the database answers, and
  // `CountryRoute` asks it.
  assert.equal(countryFromSegment('tr'), 'tr')
  assert.equal(countryFromSegment('de'), 'de', 'a country we have not seen before is still shaped like one')

  assert.equal(countryFromSegment(''), null)
  assert.equal(countryFromSegment('turkey'), null)
  assert.equal(countryFromSegment('TR'), null, 'the URL form is lowercase')
  assert.equal(countryFromSegment('t1'), null)
})

test('every path carries the language and the country it was read in', () => {
  assert.equal(paths.home('fa-IR', validated('tr')), '/fa/tr')
  assert.equal(paths.taskHub('fa-IR', validated('tr'), 'start-a-business'), '/fa/tr/t/start-a-business')
  assert.equal(paths.categoryHub('en-US', validated('tr'), 'getting-settled', 'residence'), '/en/tr/t/getting-settled/residence')
  assert.equal(paths.guide('en-US', validated('tr'), 'get-a-sim-card'), '/en/tr/g/get-a-sim-card')
  assert.equal(paths.suggest('en-US', validated('tr'), 'get-a-sim-card'), '/en/tr/g/get-a-sim-card/suggest')
})

test('switching language keeps the reader on the page they were reading', () => {
  assert.equal(samePageIn({ pathname: '/en/tr/g/get-a-sim-card' }, 'fa-IR'), '/fa/tr/g/get-a-sim-card')
  assert.equal(samePageIn({ pathname: '/fa/tr/t/start-a-business' }, 'en-US'), '/en/tr/t/start-a-business')
  assert.equal(samePageIn({ pathname: '/en/tr' }, 'fa-IR'), '/fa/tr')
})

test('switching language keeps the place in the page, and the query', () => {
  // Someone reading the sources section of a guide and switching language has
  // to land on that section. Dropping the hash sends them to the top of a page
  // in a language they can now read but a place they have lost.
  assert.equal(
    samePageIn({ pathname: '/en/tr/g/get-a-sim-card', hash: '#official-sources' }, 'fa-IR'),
    '/fa/tr/g/get-a-sim-card#official-sources',
  )
  assert.equal(samePageIn({ pathname: '/en/tr', search: '?q=sim' }, 'fa-IR'), '/fa/tr?q=sim')
})

test('an aliased URL switches language and canonicalises at the same time', () => {
  assert.equal(samePageIn({ pathname: '/en-US/tr/g/get-a-sim-card' }, 'fa-IR'), '/fa/tr/g/get-a-sim-card')
})

test('switching language on a page with no language in it changes nothing', () => {
  // The root, before the redirect has run. Rewriting the first segment there
  // turns `/` into `/fa`, which is a different page, silently.
  assert.equal(samePageIn({ pathname: '/' }, 'fa-IR'), '/')
  assert.equal(samePageIn({ pathname: '/not-a-locale/tr' }, 'fa-IR'), '/not-a-locale/tr')
})
