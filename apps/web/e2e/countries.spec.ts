import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The exit condition, stated literally: insert a country row and nothing else,
 * and `/en/<code>` renders. Remove the row and it is Not Found again. No file
 * edited either way.
 *
 * The trap, which the plan check named: proving the removal after a reload, or
 * against MSW. Both prove a FRESH client sees the change, which is not the
 * question. The guard has to avoid stale in-memory data, so this keeps one
 * browser alive, navigates away and back, and never reloads.
 */

const HERE = dirname(fileURLToPath(import.meta.url))

/** The same database the API is serving, so a test can change rows under it. */
const database = () => readFileSync(join(HERE, '.database-url'), 'utf8').trim()

type Client = Awaited<ReturnType<typeof connect>>

const connect = async () => {
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { PrismaClient } = await import('../../api/src/generated/prisma/client.js')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: database() }) })
}

const withPrisma = async <T>(work: (prisma: Client) => Promise<T>): Promise<T> => {
  const prisma = await connect()

  try {
    return await work(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Navigate WITHOUT reloading the document.
 *
 * `page.goto` is a full page load, so it builds a fresh urql client and an
 * empty cache every time. A test that used it to "navigate away and back"
 * proved only that a new client sees the change, which is not the question:
 * the first version of this test passed with `cache-first`, which is precisely
 * the bug it exists to catch.
 */
const navigate = async (page: import('@playwright/test').Page, to: string): Promise<void> => {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, to)
}

test('a country added to the database becomes browsable, and removing it takes it away', async ({ page }) => {
  const code = 'pt'

  // Before: not a country we have, so Not Found.
  await page.goto(`/en/${code}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/does not exist/i)

  await withPrisma((prisma) => prisma.country.create({ data: { code, name: 'Portugal' } }))

  // A row, and nothing else. No rebuild, no file, no restart.
  await page.goto(`/en/${code}`)
  await expect(page.getByTestId('resolved-country')).toHaveText(code)
  await expect(page.getByTestId('country-name')).toHaveText('Portugal')

  await withPrisma((prisma) => prisma.country.deleteMany({ where: { code } }))

  // Away and back in the SAME document, so the SAME urql client and its cache
  // answer. A cached result here renders a country that no longer exists,
  // which is the guard being wrong in exactly the case it exists for.
  await navigate(page, '/en/tr')
  await expect(page.getByTestId('country-name')).toHaveText('Turkey')

  await navigate(page, `/en/${code}`)
  await expect(page.getByRole('heading', { level: 1 }), 'a deleted country was served from cache').toHaveText(
    /does not exist/i,
  )
})

test('a country that never existed is Not Found, in both languages', async ({ page }) => {
  await page.goto('/en/zz')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/does not exist/i)

  await page.goto('/fa/zz')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/وجود ندارد/)
})

test('a country we do have renders its name in the running app', async ({ page }) => {
  await page.goto('/en/tr')
  await expect(page.getByTestId('country-name')).toHaveText('Turkey')
})
