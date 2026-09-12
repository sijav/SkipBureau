import { expect, test, type Page } from '@playwright/test'

/**
 * SB-072. The built site at a phone and a tablet, in both directions: nothing
 * runs off the side, no text is cut off inside its own box, and nothing meant
 * to be tapped is smaller than a finger.
 *
 * By direction rather than by language, the owner's rule of 2026-09-10: it is
 * the direction that changes a layout, and Persian is the catalog that happens
 * to be right-to-left.
 */

const TAP = 44

const sizes = [
  { name: 'a phone', width: 390, height: 844 },
  { name: 'a tablet', width: 768, height: 1024 },
] as const

const readings = [
  { name: 'left to right', at: 'en' },
  { name: 'right to left', at: 'fa' },
] as const

// Home, a hub, an area, a guide, and the suggest dialog over one.
//
// The suggest address has no file of its own and answers 404 on purpose: it is
// a form, reached from a guide, and not something a search engine should hold.
// The app boots from 404.html and draws it, which is why it is loaded here like
// any other and why this spec does not check its status.
const pages = (at: string) => [
  `${at}/TR`,
  `${at}/TR/tasks/getting-settled`,
  `${at}/TR/tasks/getting-settled/first-week`,
  `${at}/TR/guides/sim-card`,
  `${at}/TR/guides/sim-card/suggest`,
  // What a question found, and a destination nobody has written yet. Neither
  // has a file either, for the same reason as the suggest address.
  `${at}/TR/search?q=sim`,
  `${at}/TR/guides`,
]

/** What the page says about itself, measured where it is drawn rather than inferred from CSS. */
const measure = (page: Page, tap: number) =>
  page.evaluate((size) => {
    const width = window.document.documentElement.clientWidth
    const name = (node: Element) =>
      `${node.tagName.toLowerCase()}${node.getAttribute('aria-label') ? `[${node.getAttribute('aria-label')}]` : ''} ${(node.textContent ?? '').trim().slice(0, 30)}`.trim()
    const drawn = (node: Element) => {
      const style = window.getComputedStyle(node)
      return style.display !== 'none' && style.visibility !== 'hidden' && !node.closest('[aria-hidden="true"]')
    }

    const wide: string[] = []
    const clipped: string[] = []
    for (const node of window.document.body.querySelectorAll('*')) {
      if (!drawn(node)) continue
      const box = node.getBoundingClientRect()
      if (box.width === 0 && box.height === 0) continue
      if (box.right > width + 1 || box.left < -1) wide.push(`${name(node)} at ${Math.round(box.left)}..${Math.round(box.right)}`)
      const style = window.getComputedStyle(node)
      const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll'
      if (!scrolls && node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1) clipped.push(`${name(node)} needs ${node.scrollWidth} in ${node.clientWidth}`)
    }

    const small: string[] = []
    for (const node of window.document.body.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="link"]')) {
      if (!drawn(node) || node.hasAttribute('disabled')) continue
      // A tap on an input inside a padded wrapper lands on the wrapper, so the
      // wrapper is the target. A link inside a sentence is excluded by WCAG
      // itself, and padding one would break the line it sits in.
      const target = node.closest('.MuiInputBase-root, label') ?? node
      const box = target.getBoundingClientRect()
      if (box.width === 0 && box.height === 0) continue
      if (node.tagName === 'A' && node.closest('p, li')) continue
      if (box.width < size || box.height < size) small.push(`${name(node)} is ${Math.round(box.width)}x${Math.round(box.height)}`)
    }

    return { sideways: window.document.documentElement.scrollWidth - width, wide, clipped, small: [...new Set(small)] }
  }, tap)

for (const size of sizes) {
  for (const reading of readings) {
    test.describe(`on ${size.name}, ${reading.name}`, () => {
      test.use({ viewport: { width: size.width, height: size.height } })

      test(`every page fits, and everything on it can be tapped`, async ({ page }) => {
        for (const address of pages(reading.at)) {
          await page.goto(address, { waitUntil: 'load' })
          // Any heading, not the first-level one: a dialog marks everything
          // behind it aria-hidden, so on the suggest address the page's own h1
          // is out of the accessibility tree and the dialog's h2 is the first
          // heading there is. Generous, because that address has no file of its
          // own: it arrives as 404.html and is drawn once the app has booted.
          await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 })

          const found = await measure(page, TAP)
          expect(found.sideways, `${address} scrolls sideways`).toBeLessThanOrEqual(1)
          expect(found.wide, `${address} draws something off the side`).toEqual([])
          expect(found.clipped, `${address} cuts off its own text`).toEqual([])
          expect(found.small, `${address} has something too small to tap`).toEqual([])
        }
      })
    })
  }
}
