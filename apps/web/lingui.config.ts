import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-po'
// SB-414: relative, not the `src/...` alias. Lingui 6.6 loads this config through Jiti,
// which does not resolve the alias Vite and tsc use. locales.ts imports nothing itself,
// so there is nothing further for Jiti to follow.
import { locales as registry } from './src/core/i18n/locales'

/**
 * English is the source language, so the message id IS the English text and a
 * missing translation falls back to something readable rather than to a key.
 * Every other locale is a translation of it, not a parallel set of strings.
 *
 * SB-417: stories, mocks and tests are excluded. They are not reachable by a
 * reader, and including them put a third of the catalog beyond the app's own
 * strings, which is a cost paid again for every locale added.
 */
export default defineConfig({
  sourceLocale: 'en',
  // SB-414: derived from the locale registry rather than repeated here, so adding a
  // locale is one place rather than two that can disagree. Keyed on `catalog` and
  // de-duplicated, not on the locale tag, so a future de-AT shares `de` instead of
  // demanding a catalog of its own.
  locales: [...new Set(Object.values(registry).map((locale) => locale.catalog))],
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['<rootDir>/src'],
      exclude: ['**/*.stories.tsx', '**/*.test.ts', '**/*.test.tsx', '**/mocks/**'],
    },
  ],
  format: formatter({ lineNumbers: true }),
})
