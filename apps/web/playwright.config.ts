import { defineConfig, devices } from '@playwright/test'

/**
 * Two suites against two servers.
 *
 * `dev` is the fast one and runs against Vite, whose SPA fallback answers
 * every path with the app. `pages` runs against the built site served the way
 * GitHub Pages serves it, under the repository subpath and with a real 404 for
 * an unknown path. A deep link only counts as proven on the second one.
 */

const BASE = '/SkipBureau/'
const PAGES_PORT = 5190

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: { trace: 'on-first-retry' },
  projects: [
    {
      name: 'dev',
      testIgnore: /pages\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
    },
    {
      name: 'pages',
      testMatch: /pages\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PAGES_PORT}${BASE}` },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Built with the subpath, then served without any SPA fallback.
      command: `npm run build && node e2e/pages-server.mjs`,
      url: `http://localhost:${PAGES_PORT}${BASE}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { SKIPBUREAU_BASE: BASE, PAGES_PORT: String(PAGES_PORT) },
    },
  ],
})
