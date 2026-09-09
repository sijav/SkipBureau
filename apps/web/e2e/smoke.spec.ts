import { expect, test } from '@playwright/test'

test('the app boots and renders its name', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SkipBureau' })).toBeVisible()
})
