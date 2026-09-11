import { expect, test } from '@playwright/test'

/**
 * A guide's address opened cold, on the built site served the way GitHub
 * Pages serves it: the repository subpath, no rewrite rule, and a real 404 for
 * a path with no file. Run against the live site with PAGES_URL set, which is
 * the only run that proves the deployment rather than a copy of it.
 */

const GUIDE = 'Get a SIM Card or eSIM'
const TITLE = `${GUIDE} in Turkey · Skipbureau`

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
  // What a link preview shows (SB-089): no preview bot runs a script.
  expect(source).toContain(`<meta property="og:title" content="${GUIDE} in Turkey"`)
  expect(source).toContain('<meta property="og:locale" content="en_US"')
  expect(source).toContain('<meta property="og:locale:alternate" content="fa_IR"')
  expect(source).toMatch(/<meta property="og:image" content="[^"]*\/og\.png"/)
  expect(source).toContain('<meta name="twitter:card" content="summary_large_image"')

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
  expect(source).toContain('<meta property="og:locale" content="fa_IR"')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveURL(/\/fa\/TR\/guides\/sim-card$/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('the file carries the page itself, and the page asks for none of it again', async ({ page, request }) => {
  // SB-155: the body, not only the head, is in what the server sends.
  const source = await (await request.get('en/TR/guides/sim-card')).text()
  const body = source.slice(source.indexOf('<div id="root"'))
  // The title inside its <bdi>, which marks the language the content is in.
  expect(body).toMatch(new RegExp(`<h1[^>]*>(?:<[^>]+>)*${GUIDE}<`))
  expect(body).toMatch(/Last verified: \w+ \d{4}/)

  // Loaded with scripts on, it renders from what the file carries, and in
  // light React adopts the file's elements rather than drawing new ones
  // (SB-160): the heading tagged before the app's script runs is the one on
  // screen after it.
  await page.addInitScript(() => {
    window.document.addEventListener('readystatechange', () => {
      const heading = window.document.querySelector('h1')
      if (window.document.readyState === 'interactive' && heading) heading.dataset['fromFile'] = 'yes'
    })
  })
  const asked: string[] = []
  const errors: string[] = []
  page.on('request', (sent) => {
    if (sent.url().includes('graphql') && sent.method() === 'POST') asked.push(sent.postData() ?? '')
  })
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('en/TR/guides/sim-card', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('data-from-file', 'yes')
  expect(asked).toEqual([])
  expect(errors).toEqual([])
})

test('the file asks for its screen and catalog alongside the app, not after it', async ({ request }) => {
  // SB-159: each screen is a chunk of its own, and the guide's, with its
  // catalog, is preloaded by the file rather than asked for once the app runs.
  const source = await (await request.get('en/TR/guides/sim-card')).text()
  const preloads = [...source.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)"/g)].map((match) => match[1] ?? '')

  expect(preloads.some((href) => /\/assets\/guide-[\w-]+\.js$/.test(href))).toBe(true)
  expect(preloads.some((href) => /\/assets\/en-[\w-]+\.js$/.test(href))).toBe(true)
  for (const href of preloads) expect((await request.get(href)).status(), href).toBe(200)
})

test('without scripts, the snapshot shows in light and waits for its own palette in dark', async ({ browser, baseURL }) => {
  // The snapshot is light: a reader who prefers dark gets a dark, empty canvas
  // until the page is rendered in dark, never a flash of the light one.
  for (const colorScheme of ['light', 'dark'] as const) {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme, baseURL: baseURL ?? '' })
    const page = await context.newPage()
    await page.goto('fa/TR/guides/sim-card')
    const heading = page.getByRole('heading', { level: 1 })
    await (colorScheme === 'light' ? expect(heading).toBeVisible() : expect(heading).toBeHidden())
    await context.close()
  }
})

test('the home and a hub say what they are to a machine too', async ({ request }) => {
  // SB-158: the home names the site and its publisher; an area hub its trail.
  const blocksOf = async (address: string) => {
    const source = await (await request.get(address)).text()
    return [...source.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1] ?? ''))
  }

  const home = await blocksOf('en/TR')
  expect(home.map((block) => block['@type'])).toEqual(['WebSite', 'Organization'])
  expect(home[1].logo).toMatch(/\/icon-512\.png$/)

  const [trail] = await blocksOf('en/TR/tasks/start-a-business/register-your-company')
  expect(trail['@type']).toBe('BreadcrumbList')
  expect(trail.itemListElement.map((item: { position: number }) => item.position)).toEqual([1, 2, 3])
})

test('the sitemap lists the guide, dated, with its other language', async ({ request }) => {
  // SB-088: written by the build from the same pages, never by hand.
  const response = await request.get('sitemap.xml')
  expect(response.status()).toBe(200)
  const xml = await response.text()

  expect(xml).toMatch(/<loc>[^<]*\/en\/TR\/guides\/sim-card<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
  expect(xml).toMatch(/hreflang="fa" href="[^"]*\/fa\/TR\/guides\/sim-card"/)
})

test('a page carries the mark, and every icon it links is there', async ({ request }) => {
  // SB-157: what a tab, a search result and a home screen show.
  const source = await (await request.get('en/TR/guides/sim-card')).text()
  const links = [...source.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)" href="([^"]+)"/g)].map((match) => match[1] ?? '')

  expect(links).toHaveLength(4)
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200)
  expect(source).toContain('name="theme-color"')
  expect(source).toContain('media="(prefers-color-scheme: dark)"')
})

test('an address shared before the markers were spelled out still arrives', async ({ page }) => {
  await page.goto('en/tr/g/sim-card', { waitUntil: 'load' })

  await expect(page).toHaveURL(/\/en\/TR\/guides\/sim-card$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
})
