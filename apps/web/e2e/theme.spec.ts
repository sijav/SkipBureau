import { expect, test } from '@playwright/test'
import { dark, light } from '../src/core/theme/tokens'

/**
 * The exit condition for SB-092, against the running app.
 *
 * The second half of the first test is the half with teeth. An implementation
 * that reads `prefers-color-scheme` once at startup passes the initial
 * assertion and fails the switch, because the switch happens with no reload:
 * the same React tree, the same client, the same document. That is what proves
 * a live subscription rather than a lucky first read.
 *
 * Imported from `tokens` rather than the theme barrel deliberately. The barrel
 * pulls in `AppTheme`, and with it React, emotion and MUI, into a plain node
 * process that only needs two hex strings.
 */

const rgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16)

  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`
}

test('the page follows the operating system, and keeps following it when it changes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/en/tr')

  await expect(page.locator('body')).toHaveCSS('background-color', rgb(dark.background))

  // The browser's own scrollbars and form controls follow this, not our CSS.
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')

  // No reload. A one-shot read of the preference dies here.
  await page.emulateMedia({ colorScheme: 'light' })

  await expect(page.locator('body'), 'the theme did not follow a live preference change').toHaveCSS(
    'background-color',
    rgb(light.background),
  )
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
})

test('dark reaches Persian too, where the layout is mirrored', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/fa/tr')

  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('body')).toHaveCSS('background-color', rgb(dark.background))
})
