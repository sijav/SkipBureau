import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react-swc'
import { playwright } from '@vitest/browser-playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = dirname(fileURLToPath(import.meta.url))
const alias = { src: join(here, 'src') }

const lingui = () => react({ plugins: [['@lingui/swc-plugin', {}]] })

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
      {
        // Every story runs as a test in a real browser. A component whose story
        // renders is a component that has been seen, which a jsdom assertion
        // does not give you.
        resolve: { alias },
        plugins: [lingui(), storybookTest({ configDir: join(here, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: [join(here, '.storybook', 'vitest.setup.ts')],
        },
      },
    ],
  },
})
