import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },

  // Explicit, not inherited. The Vite builder may copy `public/` on its own,
  // but that is not a contract to depend on, and what lives there is
  // mockServiceWorker.js: without it every story dies in `beforeEach` when MSW
  // cannot register, and the page still returns 200. I removed this earlier
  // today after proving it was a no-op for the DEV server, which was true and
  // is a different question from what `storybook build` copies.
  staticDirs: ['../public'],

  // Storybook 10 takes Vite config here; there is no --base flag. Default '/'
  // so `storybook dev` is untouched, and the deployed copy is served from a
  // subpath beside the app.
  viteFinal: (config) => ({ ...config, base: process.env.STORYBOOK_BASE ?? '/' }),
}

export default config
