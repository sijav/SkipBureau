import { expect, test } from 'vitest'
import type { Page } from './prerender'
import { robots, sitemap } from './sitemap'

const ORIGIN = 'https://example.test'

const page = (address: string, overrides: Partial<Page> = {}): Page => ({
  address,
  locale: 'en-US',
  title: 'A page',
  description: null,
  links: { canonical: address, canonicalLocale: 'en-US', available: ['en-US'], alternates: [] },
  structuredData: [],
  lastModified: null,
  sharing: [],
  body: null,
  screen: null,
  ...overrides,
})

const guide = page('/en/TR/guides/sim-card', {
  lastModified: '2026-09-08',
  links: {
    canonical: '/en/TR/guides/sim-card',
    canonicalLocale: 'en-US',
    available: ['en-US', 'fa-IR'],
    alternates: [
      { hreflang: 'en', path: '/en/TR/guides/sim-card' },
      { hreflang: 'fa', path: '/fa/TR/guides/sim-card' },
      { hreflang: 'x-default', path: '/en/TR/guides/sim-card' },
    ],
  },
})

test('a guide is listed once, with its date and every alternate', () => {
  const xml = sitemap([guide, guide], ORIGIN)

  expect(xml.match(/<url>/g)).toHaveLength(1)
  expect(xml).toContain('<loc>https://example.test/en/TR/guides/sim-card</loc>')
  expect(xml).toContain('<lastmod>2026-09-08</lastmod>')
  expect(xml).toContain('<xhtml:link rel="alternate" hreflang="fa" href="https://example.test/fa/TR/guides/sim-card"/>')
  expect(xml).toContain('hreflang="x-default"')
})

test('a page whose canonical is another address is left to that address', () => {
  // A goal that opens its only area: its canonical is the area's hub.
  const goal = page('/en/TR/tasks/getting-settled', {
    links: { canonical: '/en/TR/tasks/getting-settled/first-week', canonicalLocale: 'en-US', available: ['en-US'], alternates: [] },
  })
  expect(sitemap([goal], ORIGIN)).not.toContain('getting-settled</loc>')
})

test('a page without a date of its own carries no lastmod', () => {
  expect(sitemap([page('/en/TR')], ORIGIN)).not.toContain('<lastmod>')
})

test('what goes into the XML is escaped', () => {
  expect(sitemap([page('/en/TR/guides/a&b')], ORIGIN)).toContain('/en/TR/guides/a&amp;b</loc>')
})

test('robots.txt allows everything and names the sitemap', () => {
  expect(robots(ORIGIN)).toBe('User-agent: *\nAllow: /\n\nSitemap: https://example.test/sitemap.xml\n')
})
