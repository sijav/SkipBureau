import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import lingui from 'eslint-plugin-lingui'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from 'eslint-plugin-storybook'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'storybook-static',
      'coverage',
      'playwright-report',
      'test-results',
      // Written by `lingui compile`. They already carry their own
      // eslint-disable, which this config then reported as unused.
      'src/locales/*.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...storybook.configs['flat/recommended'],
  {
    // Test harness scripts run under Node, not in a browser.
    files: ['e2e/**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  /**
   * Text a reader sees must go through lingui.
   *
   * This replaces a regular expression in i18n.test.ts that tried to find bare
   * JSX text by looking between `>` and `<`. It could not tell a closing tag
   * from a generic, so `useState<Locale | null>(null)` on one line and
   * `useState<Locale>` on the next read as an element containing the code
   * between them. A rule that reports correct code teaches people to switch it
   * off, and this plugin was already installed and reads a real syntax tree.
   */
  {
    files: ['**/*.tsx'],
    ignores: ['**/*.stories.tsx', '.storybook/**'],
    plugins: { lingui },
    rules: {
      'lingui/no-unlocalized-strings': [
        'error',
        {
          // The rule reports every string literal, not only JSX text, which is
          // the right default: an aria-label or a toast message is read by a
          // person too. Each exemption below is a specific kind of string that
          // nobody reads, and is listed rather than described by shape, so a
          // genuine one-word label cannot slip through a broad pattern.
          ignore: [
            '^skipbureau\\.', // our own storage keys
            '^\\.{1,2}/', // relative module paths
            '^(ltr|rtl|light|dark)$', // direction and mode unions
            // The product name. It is the same word in both languages, and
            // putting it in the catalogue invites someone to translate it.
            '^SkipBureau$',
          ],
          // Text that goes to a developer, never to a reader.
          ignoreFunctions: ['console.*', 'Error', 'document.getElementById'],
          // Attribute names that are machinery: an `sx` object, a test id, a
          // variant name. `useTsTypes` is off because it needs typed linting,
          // which this config does not run.
          ignoreNames: [
            { regex: { pattern: '^(data-|aria-controls|id|key|role|variant|component|color)' } },
            // A route pattern is an address, not something anyone reads.
            'path',
            'route',
            'to',
            // Style objects. Their values are CSS, and the design forbids a
            // colour literal in them anyway, which tokens.test.ts checks.
            'sx',
            'style',
          ],
        },
      ],
      'lingui/no-trans-inside-trans': 'error',
      'lingui/no-single-tag-to-translate': 'error',
    },
  },
  prettier,
)
