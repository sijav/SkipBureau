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
const API_PORT = 4500
// SB-397: this project's own dev port, not Vite's default 5173. A KarNama Vite
// server had held 5173 for two days, and every `dev` test asserted against that
// app until a page snapshot showed its login screen. vite.config.ts pins the
// same number with `strictPort`, so the two cannot drift.
const DEV_PORT = 5191

// The deployed site, when the pages suite is pointed at it: the proof a local
// mimic cannot give, since only the real thing shows how Pages is configured.
// PAGES_URL=https://sijav.github.io/SkipBureau/ npx playwright test --project pages
const LIVE = process.env.PAGES_URL

/**
 * SB-397: never adopt a server this run did not start.
 *
 * Playwright decides to reuse from an HTTP readiness probe alone: it follows
 * redirects and accepts a final status from 200 to 403, and it identifies
 * neither the process nor the application. So any other project's app
 * answering on one of these ports qualifies, and its pages are what the suite
 * then tests. Starting our own every time costs about a minute of rebuild,
 * which CI already paid because this was `!process.env.CI`, and it turns a
 * clash into Playwright's own error before a single test runs.
 */
const reuseExistingServer = false

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
      // The built-site suites, which need the subpath and the real 404.
      testIgnore: /(pages|phone)\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${DEV_PORT}` },
    },
    {
      name: 'pages',
      testMatch: /(pages|phone)\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: LIVE ?? `http://localhost:${PAGES_PORT}${BASE}` },
    },
  ],
  // Against the live site there is nothing to start.
  webServer: LIVE ? [] : [
    {
      // A real API, so a test can insert a row and browse it. Storybook and
      // MSW prove the component; only this can prove the data.
      command: 'npm run build -w @skipbureau/api && node e2e/api-server.mjs',
      url: `http://localhost:${API_PORT}/graphql?query=%7Bhealth%7D`,
      reuseExistingServer,
      timeout: 240_000,
      env: { E2E_API_PORT: String(API_PORT), E2E_WEB_PORT: String(DEV_PORT) },
    },
    {
      command: 'npm run dev',
      env: { VITE_GRAPHQL_URL: `http://localhost:${API_PORT}/graphql` },
      url: `http://localhost:${DEV_PORT}`,
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      // Built with the subpath and prerendered as the Pages job does, then
      // served without any SPA fallback.
      command: `npm run build && npm run prerender && node e2e/pages-server.mjs`,
      url: `http://localhost:${PAGES_PORT}${BASE}`,
      reuseExistingServer,
      // The prerender waits for the API above when it is still starting.
      timeout: 360_000,
      // The API url too: the country guard asks the API before a page
      // renders, so a build that does not know where the API is renders Not
      // Found for every country, and the prerender reads its pages there.
      env: {
        SKIPBUREAU_BASE: BASE,
        SKIPBUREAU_ORIGIN: `http://localhost:${PAGES_PORT}`,
        PAGES_PORT: String(PAGES_PORT),
        VITE_GRAPHQL_URL: `http://localhost:${API_PORT}/graphql`,
      },
    },
  ],
})
