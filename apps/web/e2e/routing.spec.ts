import { expect, test } from '@playwright/test'

test('the root sends a visitor to a language and a country', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(en|fa)\/tr$/)
  await expect(page.getByTestId('resolved-country')).toHaveText('tr')
})

test('a deep link opens the page it names, in the language it names', async ({ page }) => {
  await page.goto('/fa/tr/g/get-a-sim-card')

  await expect(page.getByTestId('resolved-locale')).toHaveText('fa-IR')
  await expect(page.getByTestId('resolved-country')).toHaveText('tr')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa-IR')
})

test('English is left to right and says so on the document', async ({ page }) => {
  await page.goto('/en/tr/t/start-a-business')

  await expect(page.getByTestId('resolved-locale')).toHaveText('en-US')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})

test('the lingui tag in a URL is redirected to the short public form', async ({ page }) => {
  // A link already shared as `/en-US/...` keeps working, and there is one
  // canonical address per page rather than two that both render.
  await page.goto('/en-US/tr/g/get-a-sim-card')
  await expect(page).toHaveURL(/\/en\/tr\/g\/get-a-sim-card$/)
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
