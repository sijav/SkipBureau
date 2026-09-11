import { expect, test } from '@playwright/test'

/**
 * A guide's address opened cold, on the built site served the way GitHub
 * Pages serves it: the repository subpath, no rewrite rule, and a real 404 for
 * a path with no file. Run against the live site with PAGES_URL set, which is
 * the only run that proves the deployment rather than a copy of it.
 */

const GUIDE = 'Get a SIM Card or eSIM'
const TITLE = `${GUIDE} in Turkey · SkipBureau`

test('a guide opens cold, left to right', async ({ page }) => {
  const response = await page.goto('en/TR/guides/sim-card', { waitUntil: 'load' })

  // A file of its own (SB-076): 200 from disk, not 404.html, and not by way of a redirect.
  expect(response?.status()).toBe(200)
  expect(response?.request().redirectedFrom()).toBeNull()
  // What a crawler reads before any script runs (SB-085).
  const source = (await response?.text()) ?? ''
  expect(source).toContain(`>${TITLE}</title>`)
  expect(source).toMatch(/<meta name="description" content="[^"]+"/)
  expect(source).toMatch(/<link rel="canonical" href="[^"]*\/en\/TR\/guides\/sim-card"/)
  // What the guide is, to a machine (SB-087): each block parses, the Article is
  // dated by the verification, and a guide with steps is also a HowTo.
  const blocks = [...source.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1] ?? ''))
  expect(blocks.map((block) => block['@type'])).toEqual(['Article', 'BreadcrumbList', 'HowTo'])
  expect(blocks[0].dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
  await expect(page).toHaveURL(/\/en\/TR\/guides\/sim-card$/)
  // The locale tag, en-US: the language is what matters, not the region.
  await expect(page.locator('html')).toHaveAttribute('lang', /^en(-|$)/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')

  // Once the page is up, its head is React's: one title, one canonical, and
  // nothing the file wrote left behind.
  await expect(page).toHaveTitle(TITLE)
  await expect(page.locator('head [data-prerendered]')).toHaveCount(0)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(3)
})

test('a guide opens cold, right to left', async ({ page }) => {
  const response = await page.goto('fa/TR/guides/sim-card', { waitUntil: 'load' })

  expect(response?.status()).toBe(200)
  const source = (await response?.text()) ?? ''
  expect(source).toContain('dir="rtl"')
  expect(source).toMatch(/<link rel="canonical" href="[^"]*\/fa\/TR\/guides\/sim-card"/)

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveURL(/\/fa\/TR\/guides\/sim-card$/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('an address shared before the markers were spelled out still arrives', async ({ page }) => {
  await page.goto('en/tr/g/sim-card', { waitUntil: 'load' })

  await expect(page).toHaveURL(/\/en\/TR\/guides\/sim-card$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
})
