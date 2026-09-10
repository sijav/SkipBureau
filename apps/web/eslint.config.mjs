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
   * Import shape and browser globals, from the reference project.
   *
   * Two of these look like taste and are not. A global reached through
   * `window` is mockable and greppable: `systemMode.test.ts` stubs
   * `window.matchMedia` in a node environment where no `window` exists, which a
   * bare `matchMedia` would have made impossible without jsdom. And one import
   * path per thing means a component cannot arrive twice in a bundle, and
   * moving a file inside a module is not a change to everyone using it.
   *
   * The third rule the card asked for, cross-module imports targeting a folder
   * barrel, is NOT enforced here and the plan beside this file says why: nested
   * barrels like `src/core/graphql/mocks` are the same shape as reaching into a
   * module's internals, and no path pattern separates them. It stays a
   * convention that review catches.
   */
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // `paths` matches a module string EXACTLY. `patterns` uses gitignore
      // style matching, where `@mui/material` also matches
      // `@mui/material/Box` and `.` matches `./tokens`. The first version of
      // this rule used patterns for both and reported 118 errors on correct
      // code, which is how a rule teaches people to switch it off.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '.',
              message: "Never import from '.'. Name the file, or the barrel of the module you actually want.",
            },
          ],
          patterns: [
            {
              // The owner's rule, and he reaffirmed it on 2026-09-10 after I
              // showed him MUI 9's guide saying the opposite: "if it is not
              // apply to our stack then get back to my rule which made much
              // more sense".
              //
              // MUI recommends path imports because a barrel costs development
              // startup and rebuild time. That warning is aimed at bundlers
              // that walk the barrel's whole graph every rebuild. Vite
              // pre-bundles dependencies with esbuild into one cached chunk,
              // which is the same mitigation Next ships as
              // optimizePackageImports, so the cost is likely absorbed here.
              // NOT MEASURED on this repository, and it should be if cold
              // start ever hurts.
              group: ['@mui/material/*', '@mui/icons-material/*'],
              message:
                "MUI comes from the top level barrel: import { Button } from '@mui/material'. Everything is there in 9.4, including createTheme, ThemeProvider and useTheme.",
            },
            {
              group: ['../*', '..'],
              message:
                "No relative parent imports. Use an absolute src/... path, at the module's barrel where there is one.",
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['document', 'localStorage', 'sessionStorage', 'navigator', 'fetch', 'crypto'].map((name) => ({
          name,
          message: `Reach it through window, as window.${name}, so it stays mockable and greppable.`,
        })),
      ],
      // `no-restricted-globals` catches the bare name and nothing else.
      // `globalThis.document` and `self.document` walk straight past it, and
      // the checkGlobalObject option that would catch them also rejects
      // `window.document`, which is the form this project wants.
      'no-restricted-properties': [
        'error',
        ...['globalThis', 'self'].flatMap((object) =>
          ['document', 'localStorage', 'sessionStorage', 'navigator', 'fetch', 'crypto'].map((property) => ({
            object,
            property,
            message: `Use window.${property} rather than ${object}.${property}.`,
          })),
        ),
      ],
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
          ignoreFunctions: ['console.*', 'Error', 'window.document.getElementById'],
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
