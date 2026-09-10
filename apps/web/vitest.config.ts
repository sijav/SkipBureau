import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react-swc'
import { playwright } from '@vitest/browser-playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config'

const here = dirname(fileURLToPath(import.meta.url))
const alias = { src: join(here, 'src') }

const lingui = () => react({ plugins: [['@lingui/swc-plugin', {}]] })

// The four the design has to hold in. `direction` carries the LOCALE, because
// that is what the toolbar global is called and what preview.tsx reads.
const COMBINATIONS = [
  { mode: 'light', direction: 'en-US' },
  { mode: 'light', direction: 'fa-IR' },
  { mode: 'dark', direction: 'en-US' },
  { mode: 'dark', direction: 'fa-IR' },
] as const

export default defineConfig({
  resolve: { alias },
  test: {
    // Coverage is reported across BOTH projects, so a component covered only by
    // its story still counts. Barrels, stories and entry points are wiring:
    // counting them flatters the number without proving anything.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/index.ts', 'src/**/*.stories.tsx', 'src/**/*.test.ts', 'src/**/*.d.ts', 'src/main.tsx'],
    },
    projects: [
      {
        resolve: { alias },
        plugins: [lingui()],
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      // EVERY story, in all FOUR combinations the design has to hold in.
      //
      // There used to be one storybook project, and preview.tsx said so
      // plainly: the toolbars are "a review aid, not a test matrix. Vitest
      // runs each story once, with the default globals below, so nothing here
      // automatically checks the other three." Meanwhile SB-035 carried an
      // exit condition promising light, dark, ltr and rtl. One of those was a
      // lie and it was not the comment.
      //
      // initialGlobals sets the toolbar values for the whole project, so the
      // same story file is run four times and the a11y addon, set to error,
      // checks contrast in each.
      //
      // There is deliberately NO setupFiles here. There was one, calling
      // setProjectAnnotations([preview]) by hand, and since Storybook 10.3 a
      // hand-written call makes addon-vitest skip provisioning the ADDON
      // annotations. The a11y addon's check lives in those, so axe never ran:
      // a button with no accessible name, planted on purpose, passed. Left to
      // itself the plugin provisions the preview and every addon's annotations.
      //
      // The return type is declared because an object returned from a callback
      // is not contextually typed: without it `browser: 'chromium'` widens to
      // string and `tsc -b` rejects the config, which a plain `tsc --noEmit`
      // never sees because this file sits in the node project.
      ...COMBINATIONS.map(({ mode, direction }): TestProjectInlineConfiguration => ({
        resolve: { alias },
        plugins: [lingui(), storybookTest({ configDir: join(here, '.storybook'), initialGlobals: { mode, direction } })],
        test: {
          name: `storybook:${mode}-${direction}`,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      })),
    ],
  },
})
