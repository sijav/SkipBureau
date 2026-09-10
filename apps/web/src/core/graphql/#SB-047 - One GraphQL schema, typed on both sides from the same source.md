# SB-047: one GraphQL schema, typed on both sides from the same source

Revised after the plan check, which found the link that made the whole thing
work. Not re-checking: every change is an adoption of what it prescribed.

**Exit condition.** Renaming a schema field without touching the web app fails
`npm run lint:tsc` in the web app.

## What the check found, and it was the load-bearing part

**My chain read a stale SDL.** I had `codegen → tsc` against the *committed*
`schema.gql`. Rename a field in the Nest model and that file does not move, so
codegen regenerates the same types and everything passes. The contract has to
start one step earlier:

```
apps/api  schema:emit   →  apps/web  codegen  →  apps/web  tsc
```

**`pregenerate` was the wrong hook.** It runs before `generate`, not before
`lint:tsc`. npm's hook would be `prelint:tsc`; chaining the three explicitly is
clearer and is what I will do.

**A schema emitter that boots `AppModule` still needs a database**, because
`PrismaService`'s constructor throws when `DATABASE_URL` is unset. The emitter
has to build the schema from resolver metadata without instantiating anything,
which is what `GraphQLSchemaFactory` is for.

**Documents go in `.ts` as `graphql(/* GraphQL */ ...)` calls**, not in
standalone `.graphql` files. The client preset's typed `TypedDocumentNode`
comes from a generated map keyed on statically discoverable operations;
scanning a loose `.graphql` file does not say how Vite would import it at
runtime. `unknown` is what an operation the map does not recognise degrades to,
which is exactly the failure mode to avoid.

**A removed field is a codegen validation error, not a `tsc` diagnostic**, and
the check said plainly that this is the honest reading: it is the earlier and
more precise contract failure, and insisting it reach `tsc` would weaken it.
`npm run lint:tsc` still fails, which is what the exit condition asks.

**No `gql.tada`, no `urql` here.** The client is SB-048.

## Approach

1. `apps/api/src/schema-emit.ts`: builds the SDL through `GraphQLSchemaFactory`
   from the resolver classes, writes `schema.gql`, exits. No listener, no
   database, no `DATABASE_URL`.
2. `apps/web/codegen.ts`: client preset, schema `../api/schema.gql`, documents
   `src/**/*.{ts,tsx}`, output `src/core/graphql/generated/`, committed.
3. One real operation and one typed consumer that reads a field. Without a real
   read the rename cannot break anything and the proof is theatre.
4. `lint:tsc` chains emit, codegen, then tsc.

## How I will prove it, and the trap the check confirmed

The trap is editing `schema.gql` and watching codegen complain. That proves
generated-file validation, not the server-to-web contract.

So the test **renames the field on the decorated Nest model**, runs
`schema:emit`, then runs the web app's typecheck, and expects it to fail. Then
restores and expects it to pass. That is a server developer renaming a field
and the app that consumes it refusing to build.

## Files

- `apps/api/src/schema-emit.ts`, `apps/api/package.json`
- `apps/web/codegen.ts`, `apps/web/package.json`
- `apps/web/src/core/graphql/documents.ts`, `index.ts`, `generated/*`
- `apps/web/src/core/graphql/contract.test.ts`

## Where I am least sure now

Whether `GraphQLSchemaFactory` can build the schema without instantiating the
resolvers' dependencies. It reads decorator metadata, so it should, but
`PrismaService` throwing in its constructor is exactly the kind of thing that
turns "should" into an afternoon. If it cannot, the fallback is
`NestFactory.create(AppModule, { preview: true })`, which is documented not to
instantiate providers, and failing that a `DATABASE_URL` set to a value that is
never connected to.
