import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// The web app's lingui rule has no place here: this app sends data, not
// interface text. Everything else it enforces, no escape hatches and zero
// warnings, applies the same.
export default tseslint.config(
  { ignores: ['dist', 'src/generated', 'prisma/migrations', '.contract'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: { ecmaVersion: 2023, globals: globals.node },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // The scaffold has none of these and should keep none.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { ecmaVersion: 2023, globals: globals.node },
  },
  prettier,
)
