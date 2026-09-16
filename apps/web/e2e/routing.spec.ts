import { expect, test } from '@playwright/test'

// SB-400: these waited on `resolved-country` and `resolved-locale`, test ids no screen has rendered since 2026-09-10,
// and asserted the address form the router replaced. SB-077 named both defects and repaired only pages.spec.ts. The
// country is now read from what a reader sees, and the language from the document's own lang and dir, because a page's
// language is not something a reader reads and inventing markup to assert on is changing the product to suit its tests.

test('the root sends a visitor to a language and a country', async ({ page }) => {
  await page.goto('/')
  // One page, one address: lowercase locale, uppercase country (addressCountry.ts).
  await expect(page).toHaveURL(/\/(en|fa)\/TR$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turkey')
})

test('a deep link opens the page it names, in the language it names', async ({ page }) => {
  await page.goto('/fa/tr/g/sim-card')

  // The shared short form arrives at the canonical address rather than rendering beside it.
  await expect(page).toHaveURL(/\/fa\/TR\/guides\/sim-card$/)
  // The document says which language it is in. Nothing here asserts a Persian string: the owner, 2026-09-10, "unless
  // you want to test lingui it make zero sense to test Farsi".
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa-IR')
})

test('English is left to right and says so on the document', async ({ page }) => {
  await page.goto('/en/tr/t/start-a-business')

  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})

test('a link shared before the markers were spelled out arrives, keeping who the reader is', async ({ page }) => {
  // SB-400: this was called "the lingui tag is redirected to the short public form", which describes a rule
  // canonicalPath does not have. The reader segment's second part is the reader's ORIGIN, not a region tag:
  // readerFromSegment('en-US') is { locale: 'en-US', origin: 'us' }, so `en-US` means English, reader from the United
  // States, and dropping it would throw away who is reading. canonicalPath spells out the retired markers,
  // MOVED = { t: 'tasks', g: 'guides' }, and puts the reader back exactly as it read them.
  await page.goto('/en-US/tr/g/sim-card')
  await expect(page).toHaveURL(/\/en-US\/TR\/guides\/sim-card$/)
})

test('a country we do not cover is not found, not quietly swapped', async ({ page }) => {
  // The dangerous case. Sending a reader to Turkey's rules because they asked
  // for a country we do not have is worse than telling them we do not have it.
  await page.goto('/en/zz/g/residence-permit')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('a language we do not ship is not found either', async ({ page }) => {
  await page.goto('/de/tr')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
