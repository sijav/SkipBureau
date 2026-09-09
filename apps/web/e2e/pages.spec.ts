import { expect, test } from '@playwright/test'

/**
 * The built site, served the way GitHub Pages serves it: no rewrite rule, the
 * repository subpath in the URL, and a real 404 for a path with no file.
 */

test('a deep link opens cold, from a 404.html that carries the app', async ({ page }) => {
  const response = await page.goto('en/tr/g/get-a-sim-card', { waitUntil: 'load' })

  // This is the compromise, asserted rather than hidden: the page renders, and
  // the status is still 404. See DESIGN.md on what that costs.
  expect(response?.status()).toBe(404)

  await expect(page.getByTestId('resolved-country')).toHaveText('tr')
})
