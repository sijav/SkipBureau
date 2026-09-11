import { expect, test } from '@playwright/test'

/**
 * A guide's address opened cold, on the built site served the way GitHub
 * Pages serves it: the repository subpath, no rewrite rule, and a real 404 for
 * a path with no file. Run against the live site with PAGES_URL set, which is
 * the only run that proves the deployment rather than a copy of it.
 */

const GUIDE = 'Get a SIM Card or eSIM'

test('a guide opens cold, left to right', async ({ page }) => {
  const response = await page.goto('en/TR/guides/sim-card', { waitUntil: 'load' })

  // The compromise, asserted rather than hidden: Pages answers with 404.html
  // and a 404 status, and the app inside it renders the page. When SB-075
  // lands this becomes 200, and this line is the one to change.
  expect(response?.status()).toBe(404)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
  await expect(page).toHaveURL(/\/en\/TR\/guides\/sim-card$/)
  // The locale tag, en-US: the language is what matters, not the region.
  await expect(page.locator('html')).toHaveAttribute('lang', /^en(-|$)/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})

test('a guide opens cold, right to left', async ({ page }) => {
  await page.goto('fa/TR/guides/sim-card', { waitUntil: 'load' })

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveURL(/\/fa\/TR\/guides\/sim-card$/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('an address shared before the markers were spelled out still arrives', async ({ page }) => {
  await page.goto('en/tr/g/sim-card', { waitUntil: 'load' })

  await expect(page).toHaveURL(/\/en\/TR\/guides\/sim-card$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
})
