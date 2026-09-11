import { expect, test } from 'vitest'
import { guideStructuredData, jsonLd, type GuideForData } from './guide'

const guide: GuideForData = {
  title: 'Get a SIM card',
  description: 'Compare operators and what they ask for.',
  locale: 'en-US',
  verifiedAt: '2026-09-08',
  cost: 'Free to 500 lira',
  sections: [
    { kind: 'whatYouNeed', steps: [{ title: 'Passport' }] },
    { kind: 'howToDoIt', steps: [{ title: 'Choose an operator', body: 'Any of the three national ones.' }, { title: 'Register the SIM' }] },
  ],
  sources: [{ url: 'https://www.btk.gov.tr/', name: 'BTK', publisher: 'Information and Communication Technologies Authority' }],
}

const context = {
  url: 'https://example.test/en/TR/guides/sim-card',
  site: 'https://example.test/',
  trail: [
    { name: 'Getting Settled', url: 'https://example.test/en/TR/tasks/getting-settled' },
    { name: 'Get a SIM card', url: 'https://example.test/en/TR/guides/sim-card' },
  ],
}

test('a guide with steps is an Article dated by its verification, a trail, and a HowTo', () => {
  const [article, trail, howTo, ...rest] = guideStructuredData(guide, context)

  expect(rest).toEqual([])
  expect(article).toMatchObject({ '@type': 'Article', headline: 'Get a SIM card', dateModified: '2026-09-08', mainEntityOfPage: context.url })
  expect(article).toMatchObject({ citation: [{ '@type': 'CreativeWork', url: 'https://www.btk.gov.tr/' }] })
  expect(trail).toMatchObject({
    '@type': 'BreadcrumbList',
    itemListElement: [
      { position: 1, name: 'Getting Settled', item: context.trail[0]?.url },
      { position: 2, name: 'Get a SIM card', item: context.url },
    ],
  })
  // A step without its own text says its name, since a HowToStep needs text.
  expect(howTo).toMatchObject({
    '@type': 'HowTo',
    estimatedCost: 'Free to 500 lira',
    supply: [{ '@type': 'HowToSupply', name: 'Passport' }],
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Choose an operator', text: 'Any of the three national ones.' },
      { '@type': 'HowToStep', position: 2, name: 'Register the SIM', text: 'Register the SIM' },
    ],
  })
})

test('a guide with no steps carries no HowTo', () => {
  const data = guideStructuredData({ ...guide, sections: [{ kind: 'whatYouNeed', steps: [{ title: 'Passport' }] }] }, context)
  expect(data.map((datum) => datum['@type'])).toEqual(['Article', 'BreadcrumbList'])
})

test('no text in a guide can close the script tag it is written into', () => {
  const [article] = guideStructuredData({ ...guide, title: 'A </script><script>alert(1)</script> title' }, context)
  expect(article && jsonLd(article)).not.toContain('<')
})
