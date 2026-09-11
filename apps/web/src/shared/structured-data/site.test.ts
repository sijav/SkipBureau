import { expect, test } from 'vitest'
import { breadcrumbList, SITE_NAME } from './guide'
import { homeStructuredData } from './site'

test('a home says what the site is called and who publishes it, with a logo', () => {
  const [site, publisher] = homeStructuredData({ site: 'https://example.test/', logo: 'https://example.test/icon-512.png', locale: 'fa-IR' })

  expect(site).toMatchObject({ '@type': 'WebSite', name: SITE_NAME, url: 'https://example.test/', inLanguage: 'fa-IR' })
  expect(publisher).toMatchObject({ '@type': 'Organization', name: SITE_NAME, logo: 'https://example.test/icon-512.png' })
})

test('the name is the one the wordmark writes', () => {
  expect(SITE_NAME).toBe('Skipbureau')
})

test('a trail is numbered from one, in order, each step at its address', () => {
  expect(
    breadcrumbList([
      { name: 'Home', url: 'https://example.test/en/TR' },
      { name: 'Start a business', url: 'https://example.test/en/TR/tasks/start-a-business' },
    ]),
  ).toEqual({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.test/en/TR' },
      { '@type': 'ListItem', position: 2, name: 'Start a business', item: 'https://example.test/en/TR/tasks/start-a-business' },
    ],
  })
})
