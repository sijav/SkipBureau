# SB-096, the contract test edits two files in another workspace and restores one

**Exit condition:** the contract test leaves `git status` clean after a pass,
after an assertion failure, and after being killed mid-run.

## What it does now

`contract.test.ts` proves the real thing, and it proves it by vandalising the
working tree. Three tracked files are written during a run:

| file | written by | restored |
|---|---|---|
| `apps/api/src/country/country.model.ts` | the test, directly | yes, immediately after the mutated run |
| `apps/api/schema.gql` | `npm run schema`, into `process.cwd()` | only by the final `restored` contract run |
| `apps/web/src/core/graphql/generated/*` | `npm run codegen` | never explicitly, only by regeneration |

So an assertion failing between the rename and the final `restored` run leaves
a `schema.gql` in the tree that says `countryCode`, which is committed-looking
and wrong. A hard kill can leave all three modified, and the next iteration
reads them as somebody's work in progress. The loop's own rules warn about
exactly this failure: a harness that plants a change and undoes it in a
`finally` does not undo it when the process dies.

Restoring harder cannot fix this. No in-process cleanup survives a kill, and
the exit condition names a kill. The only answer is to never write the tracked
file at all.

## The approach: run the whole thing against a copy

A scratch tree at `apps/api/.contract/`, gitignored, built fresh per run.

Copying `apps/api/src` is **54 files and 70ms**, measured, which is nothing
against a test that already shells out to three npm scripts and carries a 600
second timeout. It has to be inside the repository, not in the system temp
directory, so that `node_modules` still resolves by walking up.

**`schema-emit.ts` needs no change.** It writes to
`join(process.cwd(), 'schema.gql')`, so running it from `apps/api/.contract`
puts the SDL in the scratch tree by itself. The test invokes node directly
rather than `npm run schema:emit -w`, because the workspace flag is what forces
the real directory.

**`tsconfig.json` has to be copied too**, which I did not expect and found by
running it. `@swc-node/register` looks for a tsconfig at the current directory
and fails resolution without one:

```
Error: Tsconfig not found ...\.contract\tsconfig.json:
  ./country/country.resolver.js cannot be resolved
```

That is the `.js` specifier to `.ts` source mapping, which comes out of
`moduleResolution: nodenext`. With `tsconfig.json` copied alongside `src`, the
emit runs and writes a correct SDL from the scratch tree. Verified before
writing any of the test.

**`codegen.ts` gains two environment overrides**, which is what the card
suggested:

```
schema:     process.env.SKIPBUREAU_SCHEMA    ?? '../api/schema.gql'
generates:  process.env.SKIPBUREAU_GENERATED ?? './src/core/graphql/generated/'
```

Defaults unchanged, so every normal invocation behaves exactly as before.

### The two phases

**Baseline.** Copy `src` pristine, emit from the copy, run codegen against the
copied SDL into a scratch output directory, assert it succeeds. Then run the
web app's own `typecheck`, which only reads. Nothing tracked is written.

**Mutation.** Apply the rename **in the copy**, emit, run codegen, assert it
fails at codegen and generated nothing. `country.model.ts` is never touched.

### What is deliberately removed

The third `restored = contract()` run goes. It existed to prove the cleanup
worked, and there is now nothing to clean up. It was also a full contract run,
so this makes the test substantially faster as a side effect rather than as a
goal.

## Files

| file | change |
|---|---|
| `apps/web/src/core/graphql/contract.test.ts` | the rewrite |
| `apps/web/codegen.ts` | two environment overrides, defaults unchanged |
| `.gitignore` | `apps/api/.contract/` |
| `apps/api/eslint.config.mjs` | ignore the scratch tree, so a stale copy cannot fail lint |

## How it meets the exit condition

Proved by running it three ways and checking `git status --porcelain` after
each:

1. a normal pass
2. an assertion failure, forced by inverting one assertion by hand
3. killed mid-run, by starting it and killing the process during the mutated
   codegen, which is the widest window and the one that used to leave a
   renamed `schema.gql` behind

All three must print nothing. I will also confirm the test still fails for the
right reason by breaking the rename string, so that the mutation stops changing
anything and the "did NOT break the web app" assertion fires.

## What the probe already settled

The step I was least sure of, whether the emitter runs from a copied tree, is
answered: it does, once `tsconfig.json` comes with it. The resolver chain down
to `PrismaService` and `../generated/prisma/client.js` resolves inside the copy,
because `src/generated` is copied along with everything else.

It also turned up something unrelated and real, now **SB-111**: the SDL emitted
from the copy differs from the committed `schema.gql` by exactly the four line
`THIS FILE WAS AUTOMATICALLY GENERATED` banner. The running server writes that
file through `autoSchemaFile` and puts the banner in; `schema-emit.ts` writes
the same schema without it. So the tracked file flips depending on which ran
last. That is not this task, and it is the reason this task must not lean on
"regeneration is byte identical" for its cleanliness.

## Corrected after the plan check, and after the task roast

Two things in the draft above were wrong and are recorded rather than quietly
edited out.

**The failure assertion.** The draft matched npm's `Lifecycle script codegen
failed` and codegen's `no files were generated`, which is matching prose. The
plan check pointed out that the CLI here is **7.4.0**, not 6, and that vitest
sets `NODE_ENV=test`, under which it picks a silent renderer that swallows the
validation error entirely. With `NODE_ENV` overridden and `--verbose` the real
message reaches the pipe, so the test asserts the validator's own words,
`Cannot query field "code" on type "Country"`, and asserts the scratch output
directory is **empty** rather than matching prose about no files.

**"The real typecheck only reads."** True of the tracked files this task was
about, and it hides a hole the task roast found: the baseline typechecks the
app against the **committed** generated types, not the ones it just generated
into the scratch directory. A scalar changed on the server, `String` to `Int`,
still validates the document and so still passes, where the old in-place
version caught it. That is **SB-113**, and it is a real narrowing of what this
test proves, traded for the cleanliness this card asked for.

The same roast said the baseline typecheck can dirty the tracked
`tsbuildinfo` files. It does not: `tsc -b --noEmit` writes no build info, which
I checked by invalidating the project with a real content change and watching
only the source file move. The tracked `tsbuildinfo` is a real problem on its
own and it is SB-109.
