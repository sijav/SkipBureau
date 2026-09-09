import { expect, test, type Page } from '@playwright/test'

/**
 * There is no mobile design, so this is the only thing standing between the
 * desktop measurements and a phone. It runs at MUI's breakpoint edges, not
 * only at round device widths: a layout that breaks does it one pixel either
 * side of a threshold, and 390, 768 and 1440 all miss those.
 */
const WIDTHS = [360, 390, 599, 600, 768, 899, 900, 1199, 1200, 1440]

const ROUTES = ['/en/tr', '/fa/tr', '/en/tr/g/get-a-sim-card', '/fa/tr/t/start-a-business', '/en/nope']

/** Nothing may stick out past the viewport, in either direction. */
const overflowing = (page: Page) =>
  page.evaluate(() => {
    const width = document.documentElement.clientWidth
    const bad: string[] = []

    for (const element of document.querySelectorAll('body *')) {
      const box = element.getBoundingClientRect()
      if (box.width === 0 && box.height === 0) continue
      // One pixel of slack for subpixel rounding, which is real and harmless.
      if (box.left < -1 || box.right > width + 1) {
        const tag = element.tagName.toLowerCase()
        const testId = element.getAttribute('data-testid')
        bad.push(`${tag}${testId ? `[${testId}]` : ''} ${Math.round(box.left)}..${Math.round(box.right)} of ${width}`)
      }
    }

    return { bad, scrolls: document.documentElement.scrollWidth > width + 1 }
  })

for (const route of ROUTES) {
  test(`nothing overflows at any width on ${route}`, async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      const { bad, scrolls } = await overflowing(page)

      expect(bad, `at ${width}px on ${route}, these stick out past the viewport`).toEqual([])
      expect(scrolls, `at ${width}px on ${route}, the page scrolls sideways`).toBe(false)
    }
  })
}

test('the reading measure is a cap, and gives way on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/en/tr')
  const wide = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(wide?.width ?? 0).toBeLessThanOrEqual(720)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/en/tr')
  const narrow = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(narrow?.width ?? 0).toBeLessThan(390)
  expect(narrow?.width ?? 0).toBeGreaterThan(300)
})

test('Persian reads right to left at every width', async ({ page }) => {
  for (const width of [390, 900, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/fa/tr')

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    // The heading has to start at the right edge of its column, not the left.
    const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
    const viewport = page.viewportSize()
    expect(heading, `no heading at ${width}px`).not.toBeNull()
    expect(heading?.x ?? 0, `at ${width}px the Persian heading sits on the left`).toBeGreaterThan(
      (viewport?.width ?? 0) / 2 - (heading?.width ?? 0),
    )
  }
})
