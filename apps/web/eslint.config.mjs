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
      // Written by graphql-codegen. It carries its own eslint-disable, which
      // this config then reported as unused.
      'src/core/graphql/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...storybook.configs['flat/recommended'],
  {
    // Config files and test harness scripts run under Node, and sit outside
    // the app's tsconfig project graph, so no type information here.
    files: ['*.ts', '*.mjs', 'e2e/**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
  },
  {
    // Storybook's own config is outside the project graph too.
    files: ['.storybook/**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      // Type information lets `lingui/no-unlocalized-strings` skip a string
      // assigned to a union type: an MUI prop, one of our own. Without it the
      // ignore list grows by a literal per prop union, and every entry is a
      // hole the rule can no longer see through.
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
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
    files: ['src/**/*.tsx'],
    ignores: ['**/*.stories.tsx'],
    plugins: { lingui },
    rules: {
      'lingui/no-unlocalized-strings': [
        'error',
        {
          // The rule reports every string literal, not only JSX text, which is
          // the right default: an aria-label or a toast message is read by a
          // person too. `useTsTypes` then removes the largest class of false
          // positives on its own, so what is listed below is the machinery
          // that has no type to read.
          useTsTypes: true,
          ignore: [
            // A single lowercase token: an identifier, a storage key, a default
            // for a prop union the checker cannot see through. Taken from the
            // reference project, which uses the same pattern. The hole is a
            // genuine one word lowercase label, which this design does not
            // have: every visible string in the Figma file is a capitalised
            // phrase or a sentence.
            '^[a-z0-9_.:/#-]+$',
            '^\\.{1,2}/', // relative module paths
            // The product name. It is the same word in both languages, and
            // putting it in the catalogue invites someone to translate it.
            '^SkipBureau$',
          ],
          // Text that goes to a developer, never to a reader.
          ignoreFunctions: ['console.*', 'Error', 'document.getElementById'],
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
