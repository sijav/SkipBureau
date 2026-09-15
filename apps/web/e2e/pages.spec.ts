import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * A guide's address opened cold, on the built site served the way GitHub
 * Pages serves it: the repository subpath, no rewrite rule, and a real 404 for
 * a path with no file. Run against the live site with PAGES_URL set, which is
 * the only run that proves the deployment rather than a copy of it.
 */

// Turkey's short-term residence permit guide, written from the agreed research: a page the e2e build and the live site
// both have (SB-282). What only a guide with steps or Persian text can show stays on the SIM card guide, which the e2e
// seed alone fills, in a test skipped against the live site.
const GUIDE = 'Getting a short-term residence permit in Turkey'
const TITLE = `${GUIDE} · Skipbureau`
const ADDRESS = 'TR/guides/short-term-residence-permit'
const LIVE = Boolean(process.env.PAGES_URL)

test('a guide opens cold, left to right', async ({ page }) => {
  const response = await page.goto(`en/${ADDRESS}`, { waitUntil: 'load' })

  // A file of its own (SB-076): 200 from disk, not 404.html, and not by way of a redirect.
  expect(response?.status()).toBe(200)
  expect(response?.request().redirectedFrom()).toBeNull()
  // What a crawler reads before any script runs (SB-085).
  const source = (await response?.text()) ?? ''
  expect(source).toContain(`>${TITLE}</title>`)
  expect(source).toMatch(/<meta name="description" content="[^"]+"/)
  expect(source).toMatch(/<link rel="canonical" href="[^"]*\/en\/TR\/guides\/short-term-residence-permit"/)
  // What the guide is, to a machine (SB-087): each block parses, and the Article
  // is dated by the verification. A guide with no steps is no HowTo.
  const blocks = [...source.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1] ?? ''))
  expect(blocks.map((block) => block['@type'])).toEqual(['Article', 'BreadcrumbList'])
  expect(blocks[0].dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  // What a link preview shows (SB-089): no preview bot runs a script.
  expect(source).toContain(`<meta property="og:title" content="${GUIDE}"`)
  expect(source).toContain('<meta property="og:locale" content="en_US"')
  expect(source).toMatch(/<meta property="og:image" content="[^"]*\/og\.png"/)
  expect(source).toContain('<meta name="twitter:card" content="summary_large_image"')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
  await expect(page).toHaveURL(/\/en\/TR\/guides\/short-term-residence-permit$/)
  // The locale tag, en-US: the language is what matters, not the region.
  await expect(page.locator('html')).toHaveAttribute('lang', /^en(-|$)/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')

  // Once the page is up, its head is React's: one title, one canonical, and
  // nothing the file wrote left behind.
  await expect(page).toHaveTitle(TITLE)
  await expect(page.locator('head [data-prerendered]')).toHaveCount(0)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2)
})

test('a guide opens cold, right to left', async ({ page }) => {
  const response = await page.goto(`fa/${ADDRESS}`, { waitUntil: 'load' })

  expect(response?.status()).toBe(200)
  const source = (await response?.text()) ?? ''
  expect(source).toContain('dir="rtl"')
  // Written in English only, so its canonical and its preview are the English page's (SB-049).
  expect(source).toMatch(/<link rel="canonical" href="[^"]*\/en\/TR\/guides\/short-term-residence-permit"/)
  expect(source).toContain('<meta property="og:locale" content="en_US"')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveURL(/\/fa\/TR\/guides\/short-term-residence-permit$/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('the file carries the page itself, and the page asks for none of it again', async ({ page, request }) => {
  // SB-155: the body, not only the head, is in what the server sends.
  const source = await (await request.get(`en/${ADDRESS}`)).text()
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
  await page.goto(`en/${ADDRESS}`, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('data-from-file', 'yes')
  // Nothing the file carries is asked for again. The reader's own answers to the guide's rules are, since no file can
  // hold an answer for a reader it has never met (SB-257).
  expect(asked.filter((body) => !body.includes('GuideAnswers'))).toEqual([])
  expect(errors).toEqual([])
})

test('the file draws the shell as the page renders it: the country known, one Ask', async ({ request }) => {
  // SB-161: the shell reads the country and who owns Ask from the address, so
  // the prerender has both. The header links to the country, not the site root,
  // and the home, whose own field is on screen, has no second one in its header.
  const guide = await (await request.get(`en/${ADDRESS}`)).text()
  const header = guide.slice(guide.indexOf('<header'), guide.indexOf('</header>'))
  const links = [...header.matchAll(/<a [^>]*href="([^"]+)"/g)].map((match) => match[1] ?? '')
  expect(links.length).toBeGreaterThan(0)
  for (const href of links) expect(href).toMatch(/\/en\/TR(\/|$)/)

  const home = await (await request.get('en/TR')).text()
  expect(home.match(/role="combobox"/g)).toHaveLength(1)
})

test('the file asks for its screen and catalog alongside the app, not after it', async ({ request }) => {
  // SB-159: each screen is a chunk of its own, and the guide's, with its
  // catalog, is preloaded by the file rather than asked for once the app runs.
  const source = await (await request.get(`en/${ADDRESS}`)).text()
  const preloads = [...source.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)"/g)].map((match) => match[1] ?? '')

  expect(preloads.some((href) => /\/assets\/guide-[\w-]+\.js$/.test(href))).toBe(true)
  expect(preloads.some((href) => /\/assets\/en-[\w-]+\.js$/.test(href))).toBe(true)
  for (const href of preloads) expect((await request.get(href)).status(), href).toBe(200)
})

test('without scripts, the file is the page in either scheme, in its own palette', async ({ browser, baseURL }) => {
  // SB-108: the file's styles name the palette's variables, and CSS picks the
  // reader's scheme, so a reader who prefers dark sees the page at first paint,
  // dark, with no script run.
  const grounds = { light: 'rgb(248, 250, 248)', dark: 'rgb(18, 23, 20)' }
  for (const colorScheme of ['light', 'dark'] as const) {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme, baseURL: baseURL ?? '' })
    const page = await context.newPage()
    await page.goto(`fa/${ADDRESS}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('body')).toHaveCSS('background-color', grounds[colorScheme])
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

  // An area's trail runs from Home to the area; how many goals and areas sit between depends on the country's content.
  const [trail] = await blocksOf('en/TR/tasks/start-a-business/company-formation')
  expect(trail['@type']).toBe('BreadcrumbList')
  const positions = trail.itemListElement.map((item: { position: number }) => item.position)
  expect(positions.length).toBeGreaterThanOrEqual(2)
  expect(positions).toEqual(positions.map((_: number, index: number) => index + 1))
  expect(trail.itemListElement[0].name).toBe('Home')
})

test('the sitemap lists the guide, dated', async ({ request }) => {
  // SB-088: written by the build from the same pages, never by hand.
  const response = await request.get('sitemap.xml')
  expect(response.status()).toBe(200)
  const xml = await response.text()

  expect(xml).toMatch(/<loc>[^<]*\/en\/TR\/guides\/short-term-residence-permit<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
})

test('a guide written with steps and in Persian says so to a machine, and the sitemap names its other language', async ({ request }) => {
  // The SIM card guide, which only the e2e seed fills since SB-282 retired Turkey's sample from the live site: the one
  // Turkish guide with steps and Persian text, so the only one that can show a HowTo block and a Persian alternate.
  test.skip(LIVE, "the SIM card guide is a fixture of the e2e seed, retired from the live site")
  const source = await (await request.get('en/TR/guides/sim-card')).text()
  const blocks = [...source.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1] ?? ''))
  expect(blocks.map((block) => block['@type'])).toEqual(['Article', 'BreadcrumbList', 'HowTo'])
  expect(source).toContain('<meta property="og:locale:alternate" content="fa_IR"')

  const xml = await (await request.get('sitemap.xml')).text()
  expect(xml).toMatch(/<loc>[^<]*\/en\/TR\/guides\/sim-card<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
  expect(xml).toMatch(/hreflang="fa" href="[^"]*\/fa\/TR\/guides\/sim-card"/)
})

test('a page carries the mark, and every icon it links is there', async ({ request }) => {
  // SB-157: what a tab, a search result and a home screen show.
  const source = await (await request.get(`en/${ADDRESS}`)).text()
  const links = [...source.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)" href="([^"]+)"/g)].map((match) => match[1] ?? '')

  expect(links).toHaveLength(4)
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200)
  expect(source).toContain('name="theme-color"')
  expect(source).toContain('media="(prefers-color-scheme: dark)"')
})

test('an address shared before the markers were spelled out still arrives', async ({ page }) => {
  await page.goto('en/tr/g/short-term-residence-permit', { waitUntil: 'load' })

  await expect(page).toHaveURL(/\/en\/TR\/guides\/short-term-residence-permit$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
})

test('an address for a guide that does not exist reads as absent, never as a blank page', async ({ page }) => {
  // SB-046: no file is written for a guide the country does not have, so GitHub
  // Pages answers 404.html with a 404, which is what it should say to a
  // crawler. For a person the app then boots, asks, is answered nothing, and
  // says so. With the screens suspending on their data, the risk this covers is
  // that it stops at the fallback and the reader is left looking at nothing.
  const response = await page.goto('en/TR/guides/no-such-guide-at-all', { waitUntil: 'load' })

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/does not exist/)
  await expect(page.locator('header')).toBeVisible()
})

// SB-256: where in the country the reader lives, and what they hold there, in the address.

const HERE = dirname(fileURLToPath(import.meta.url))
const STATUS = 'tr.residence-permit'
// A page's links are built from the reader's status once it applies: the header's wordmark links home with it.
const HOME_WITH_STATUS = `a[href$="/en/TR?status=${STATUS}"]`

/**
 * The residence status these tests name. The live site has it from the
 * research. The e2e seed writes none, so it is written through the database
 * the API reads, as countries.spec.ts changes rows: skipping a duplicate,
 * because this file's tests run in parallel, and never removed, because one
 * test removing it would pull it from under another. e2e/api-server.mjs makes
 * that database fresh for each run.
 */
const ensureStatus = async (): Promise<void> => {
  if (LIVE) return
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { PrismaClient } = await import('../../api/src/generated/prisma/client.js')
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: readFileSync(join(HERE, '.database-url'), 'utf8').trim() }) })
  try {
    await prisma.residenceStatus.createMany({ data: [{ code: STATUS, countryCode: 'tr', name: 'Residence permit' }], skipDuplicates: true })
  } finally {
    await prisma.$disconnect()
  }
}

test('an address naming a place opens from 404.html, names the place, and gives the plain page as its canonical', async ({ page }) => {
  // No file is written for an address with a place, so Pages answers 404.html
  // with a 404, as it does for an address with a nationality.
  const response = await page.goto('en-IR/DE-HH/guides/anmeldung', { waitUntil: 'load' })

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(/does not exist/)
  // Complete, Figma 44:532: the nationality and the place.
  await expect(page.getByRole('button', { name: /From Iran\s*· Hamburg/ })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/DE\/guides\/anmeldung$/)
})

test('a place the country does not have is Not Found', async ({ page }) => {
  await page.goto('en/DE-ZZ/guides/anmeldung', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/does not exist/)
})

test("a residence status in a prerendered page's address is in its links once the page is up, with no hydration mismatch logged", async ({ page }) => {
  const mismatches: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat|Minified React error #(418|423|425)/i.test(message.text())) mismatches.push(message.text())
  })

  await ensureStatus()
  const response = await page.goto(`en/${ADDRESS}?status=${STATUS}`, { waitUntil: 'load' })

  // The file answers, as it does for the page without a status.
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
  await expect(page.locator(HOME_WITH_STATUS).first()).toBeAttached()
  expect(mismatches).toEqual([])
})

test('a residence status the country does not hold is Not Found', async ({ page }) => {
  await page.goto(`en/${ADDRESS}?status=tr.nothing`, { waitUntil: 'load' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/does not exist/)
})

test('a guide linking a rule carries the rule for everyone, asks where the reader lives, and answers for Hamburg on the same page', async ({ page, request }) => {
  // SB-257: the rule for everyone is in the file, for a crawler as for a reader.
  const source = await (await request.get('en/DE/guides/anmeldung')).text()
  expect(source).toContain('The rules that apply')
  expect(source).toContain('within 2 weeks')

  const documents: string[] = []
  const mismatches: string[] = []
  page.on('request', (sent) => {
    if (sent.resourceType() === 'document') documents.push(sent.url())
  })
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat|Minified React error #(418|423|425)/i.test(message.text())) mismatches.push(message.text())
  })
  await page.goto('en/DE/guides/anmeldung', { waitUntil: 'load' })

  const rules = page.locator('section').filter({ has: page.getByRole('heading', { level: 2, name: 'The rules that apply' }) })
  await expect(rules.getByText('within 2 weeks')).toBeVisible()
  await expect(rules.getByText('at most €1,000')).toBeVisible()
  await expect(rules.getByRole('link', { name: /§ 17 Anmeldung/ })).toHaveAttribute('href', 'https://www.gesetze-im-internet.de/bmg/__17.html')
  await expect(rules.getByText('Where you live can change this')).toBeVisible()

  await rules.getByRole('button', { name: 'Tell us' }).click()
  await page.getByText('City in Germany', { exact: true }).locator('..').getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('option', { name: 'Hamburg', exact: true }).click()

  await expect(page).toHaveURL(/\/en\/DE-HH\/guides\/anmeldung$/)
  await expect(rules.getByText('Registration fee')).toBeVisible()
  await expect(rules.getByText('€16', { exact: true })).toBeVisible()
  await expect(rules.getByText('within 2 weeks')).toBeVisible()
  // Answered in the page: the one document is the one first opened.
  expect(documents).toHaveLength(1)
  expect(mismatches).toEqual([])
})

test('choosing a nationality in the panel answers a guide already on screen, and a city completes the control', async ({ page }) => {
  // SB-154: Turkey's residence permit charge has no version for everyone, and
  // Czechia is one of the nine nationalities the research names as exempt.
  const documents: string[] = []
  page.on('request', (sent) => {
    if (sent.resourceType() === 'document') documents.push(sent.url())
  })
  await page.goto('en/TR/guides/short-term-residence-permit', { waitUntil: 'load' })

  const charge = page.getByRole('region', { name: 'Pay the residence permit charge' })
  await expect(charge.getByText('Your nationality decides the answer')).toBeVisible()

  await charge.getByRole('button', { name: 'Tell us' }).click()
  const panel = page.getByRole('dialog')
  await panel.getByText('Nationality', { exact: true }).locator('..').getByRole('button', { name: 'Add', exact: true }).click()
  await panel.getByRole('combobox', { name: 'Nationality' }).fill('Czech')
  await page.getByRole('option', { name: 'Czechia' }).click()

  await expect(page).toHaveURL(/\/en-CZ\/TR\/guides\/short-term-residence-permit$/)
  await expect(charge.getByText('For you', { exact: true })).toBeVisible()
  await expect(charge.getByText('Residence permit charge', { exact: true })).toBeVisible()
  await expect(charge.getByText('None', { exact: true })).toBeVisible()
  await expect(charge.getByText(/Only for a citizen of Czechia/)).toBeVisible()

  await page.keyboard.press('Escape')
  await page.locator('header button[aria-haspopup="dialog"]').first().click()
  await panel.getByText('City in Turkey', { exact: true }).locator('..').getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('option', { name: 'İzmir' }).click()

  await expect(page).toHaveURL(/\/en-CZ\/TR-35\/guides\/short-term-residence-permit$/)
  await expect(page.getByRole('button', { name: /From Czechia\s*· İzmir/ })).toBeVisible()
  // Answered in the page: the one document is the one first opened.
  expect(documents).toHaveLength(1)
})

test('a status reached from a page already up is in its links at once', async ({ page }) => {
  await ensureStatus()
  await page.goto(`en/${ADDRESS}`, { waitUntil: 'load' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
  await expect(page.locator(HOME_WITH_STATUS)).toHaveCount(0)

  // Within the same document, as following a link would be.
  await page.evaluate((status) => {
    window.history.pushState({}, '', `${window.location.pathname}?status=${status}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, STATUS)
  await expect(page.locator(HOME_WITH_STATUS).first()).toBeAttached()
})

// SB-286: the reader's role, a situation the country's researched rules name, in the address as the status is.

test("choosing a role in the panel puts it in the link, names it there, and asks the guide's rules for it", async ({ page }) => {
  // No guide links a rule that needs a role until SB-280, so this proves the role reaches the rules, not that an answer
  // changes for it.
  const roles: (string | null)[] = []
  page.on('request', (sent) => {
    const body = sent.url().includes('graphql') && sent.method() === 'POST' ? (sent.postData() ?? '') : ''
    if (body.includes('GuideAnswers')) roles.push(JSON.parse(body).variables?.reader?.situation ?? null)
  })
  await page.goto(`en/${ADDRESS}`, { waitUntil: 'load' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GUIDE)
  // Hydrated: the page has asked its rules for a reader who has said nothing, so the panel opens on the page a reader uses.
  await expect.poll(() => roles).toContain(null)

  const details = page.locator('header button[aria-haspopup="dialog"]').first()
  const role = page.getByRole('dialog').getByText('Role', { exact: true }).locator('..')
  await details.click()
  await role.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('option', { name: 'Worker', exact: true }).click()

  await expect(page).toHaveURL(/\/en\/TR\/guides\/short-term-residence-permit\?situation=worker$/)
  await expect.poll(() => roles).toContain('worker')
  await details.click()
  await expect(role.getByRole('button', { name: 'Worker', exact: true })).toBeVisible()
})

test("a role the country's researched rules do not name is Not Found", async ({ page }) => {
  await page.goto(`en/${ADDRESS}?situation=astronaut`, { waitUntil: 'load' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/does not exist/)
})

// SB-280: a guide whose rules apply by the reader's role asks for it, and answers a worker with the rule's figures.

test('the work permit guide asks for the role, and shows a worker the permit fees with the page they were read on', async ({ page }) => {
  await page.goto('en/TR/guides/work-permit', { waitUntil: 'load' })
  const permit = page.getByRole('region', { name: 'Get a work permit' })
  await expect(permit.getByText('Your role decides the answer')).toBeVisible()

  await permit.getByRole('button', { name: 'Tell us' }).click()
  await page.getByRole('dialog').getByText('Role', { exact: true }).locator('..').getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('option', { name: 'Worker', exact: true }).click()

  await expect(page).toHaveURL(/\/en\/TR\/guides\/work-permit\?situation=worker$/)
  await expect(permit.getByText('For you', { exact: true })).toBeVisible()
  await expect(permit.getByText('Fixed-term work permit fee, up to one year', { exact: true })).toBeVisible()
  // The label the residence permit's card shares.
  await expect(permit.getByText('Card fee', { exact: true })).toBeVisible()
  await expect(permit.getByText('₺964', { exact: true })).toBeVisible()
  await expect(permit.getByRole('link', { name: /Harç ve Değerli Kâğıt Bedelinin Ödenmesi/ }).first()).toBeVisible()
})
