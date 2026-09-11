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

// The deployed site, when the pages suite is pointed at it: the proof a local
// mimic cannot give, since only the real thing shows how Pages is configured.
// PAGES_URL=https://sijav.github.io/SkipBureau/ npx playwright test --project pages
const LIVE = process.env.PAGES_URL

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
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: { E2E_API_PORT: String(API_PORT), E2E_WEB_PORT: '5173' },
    },
    {
      command: 'npm run dev',
      env: { VITE_GRAPHQL_URL: `http://localhost:${API_PORT}/graphql` },
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
      // The API url too: the country guard asks the API before a page
      // renders, so a build that does not know where the API is renders Not
      // Found for every country.
      env: {
        SKIPBUREAU_BASE: BASE,
        PAGES_PORT: String(PAGES_PORT),
        VITE_GRAPHQL_URL: `http://localhost:${API_PORT}/graphql`,
      },
    },
  ],
})
