import { expect, test } from 'vitest'
import { sharingTags, type MetaTag } from './sharing'

const read = (tags: MetaTag[], key: string): string[] =>
  tags.filter((tag) => ('property' in tag ? tag.property : tag.name) === key).map((tag) => tag.content)

const guide = {
  title: 'Get a SIM card in Turkey',
  description: 'Compare operators and what they ask for.',
  url: 'https://example.test/fa/TR/guides/sim-card',
  locale: 'fa-IR' as const,
  available: ['en-US' as const, 'fa-IR' as const],
  image: 'https://example.test/og.png',
}

test('a guide is an article in its own language, with its other language and its verified date', () => {
  const tags = sharingTags({ ...guide, kind: 'article', modified: '2026-09-08' })

  expect(read(tags, 'og:type')).toEqual(['article'])
  expect(read(tags, 'og:title')).toEqual(['Get a SIM card in Turkey'])
  expect(read(tags, 'og:url')).toEqual([guide.url])
  // Open Graph writes a locale with an underscore.
  expect(read(tags, 'og:locale')).toEqual(['fa_IR'])
  expect(read(tags, 'og:locale:alternate')).toEqual(['en_US'])
  expect(read(tags, 'article:modified_time')).toEqual(['2026-09-08'])
  expect(read(tags, 'og:image')).toEqual([guide.image])
  expect(read(tags, 'twitter:card')).toEqual(['summary_large_image'])
})

test('a page that is not an article carries no modified time, and no description it does not have', () => {
  const tags = sharingTags({ ...guide, description: null, kind: 'website', modified: '2026-09-08' })

  expect(read(tags, 'og:type')).toEqual(['website'])
  expect(read(tags, 'article:modified_time')).toEqual([])
  expect(read(tags, 'og:description')).toEqual([])
})
