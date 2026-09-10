import type { CodegenConfig } from '@graphql-codegen/cli'

/**
 * One contract, generated from the server's own SDL.
 *
 * The schema path points at the API workspace rather than a copy, and
 * `lint:tsc` re-emits it first. Reading a committed copy would mean a field
 * renamed on the server changes nothing here, which is the whole failure this
 * exists to prevent.
 *
 * Both paths can be overridden by the environment, and the defaults are the
 * real ones, so every ordinary invocation is unchanged. `contract.test.ts`
 * points them at a throwaway copy of the API source: it has to rename a field
 * and watch this fail, and it must do that without writing a single tracked
 * file, because no cleanup written in JavaScript survives the process being
 * killed.
 */
const schema = process.env['SKIPBUREAU_SCHEMA'] ?? '../api/schema.gql'
const generated = process.env['SKIPBUREAU_GENERATED'] ?? './src/core/graphql/generated/'

const config: CodegenConfig = {
  schema,
  // Operations live in `.ts` as `graphql(...)` calls. The client preset keys
  // its typed-document map on statically discoverable operations, and one it
  // cannot find degrades to `unknown` rather than failing, which would be a
  // contract that quietly stopped holding.
  documents: ['src/**/*.{ts,tsx}', '!src/core/graphql/generated/**'],
  ignoreNoDocuments: false,
  generates: {
    [generated]: {
      preset: 'client',
      config: {
        // NOT documentMode: 'string'. That emits TypedDocumentString, a String
        // subclass, and urql's DocumentInput does not accept one. The default
        // emits a TypedDocumentNode, which urql takes directly and which is the
        // whole point of generating them.
        // The app compiles with verbatimModuleSyntax, so generated code has to
        // say 'import type' where it means a type. Without this the generated
        // files fail the very typecheck they exist to make meaningful.
        useTypeImports: true,
      },
    },
  },
}

export default config
