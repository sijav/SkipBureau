import type { CodegenConfig } from '@graphql-codegen/cli'

/**
 * One contract, generated from the server's own SDL.
 *
 * The schema path points at the API workspace rather than a copy, and
 * `lint:tsc` re-emits it first. Reading a committed copy would mean a field
 * renamed on the server changes nothing here, which is the whole failure this
 * exists to prevent.
 */
const config: CodegenConfig = {
  schema: '../api/schema.gql',
  // Operations live in `.ts` as `graphql(...)` calls. The client preset keys
  // its typed-document map on statically discoverable operations, and one it
  // cannot find degrades to `unknown` rather than failing, which would be a
  // contract that quietly stopped holding.
  documents: ['src/**/*.{ts,tsx}', '!src/core/graphql/generated/**'],
  ignoreNoDocuments: false,
  generates: {
    './src/core/graphql/generated/': {
      preset: 'client',
      config: {
        // A clean checkout must typecheck without running codegen, so the
        // output is committed and has to be readable as source.
        documentMode: 'string',
        // The app compiles with verbatimModuleSyntax, so generated code has to
        // say 'import type' where it means a type. Without this the generated
        // files fail the very typecheck they exist to make meaningful.
        useTypeImports: true,
      },
    },
  },
}

export default config
