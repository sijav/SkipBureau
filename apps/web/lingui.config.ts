import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-po'

/**
 * English is the source language, so the message id IS the English text and a
 * missing Persian translation falls back to something readable rather than to
 * a key. Persian is a translation of it, not a parallel set of strings.
 */
export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'fa'],
  catalogs: [{ path: '<rootDir>/src/locales/{locale}', include: ['<rootDir>/src'] }],
  format: formatter({ lineNumbers: false }),
})
