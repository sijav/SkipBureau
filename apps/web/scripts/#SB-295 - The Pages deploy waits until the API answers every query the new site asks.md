# SB-295, the Pages deploy waits until the API answers every query the new site asks

**Exit:** the Pages job refuses to deploy while the API lacks a field the web's
documents ask, proven by running the step against the live API with a document
naming a field that does not exist, and deploys once the documents validate.

## What the card assumed, and what is actually true

Checked rather than taken.

- **The harm is larger than the card says.** `src/core/prerender/prerender.ts`
  line 48 to 51: `ask()` ends `if (error) throw error`. `collect()`, lines 143 to
  149, drives six documents through it, Countries, Home, TaskHub, CategoryHub,
  Guides and Guide. So a mismatch in any of those throws, the retry loop at
  `scripts/prerender.mjs` line 35 burns its `patience` of 600 seconds, and line
  28's `giveUp` prints a `::warning::` and **ships anyway**, with every address
  falling back to `404.html`. The deploy stays green while the entire
  prerendered site disappears. Against a working agreement that calls SEO
  utmost, that is the worse of the two harms, and the card does not mention it.
- **The card's own example is the other harm.** `ReaderDetailsQuery` and
  `GuideAnswersQuery` are not used by `collect`. SB-286's `situations` field
  therefore cannot break the prerender at all: it breaks in the reader's browser
  after a green deploy. A check that validated only what the prerender asks would
  miss the exact case this card was filed about, so it has to cover all thirteen
  documents rather than the six that are prerendered.
- **Introspection is off on the live API.** Probed:
  `{ __schema { queryType { name } } }` answers `INTROSPECTION_DISABLED`, "pass
  introspection: true to ApolloServer in production". `apps/api/src/app.module.ts`
  lines 17 to 21 set `autoSchemaFile` and `playground: false` and no
  `introspection` key, and Apollo disables it when `NODE_ENV` is production. So
  pointing codegen at the live URL through `SKIPBUREAU_SCHEMA`, an override
  `contract.test.ts` already proves works, **cannot work here**. This is the
  assumption that would have cost the most, because it is the obvious design and
  it fails only against the deployed server.
- **`tsx` is absent** from `apps/web` and from the root, although
  `test:storybook` invokes it. A `.ts` script is not directly runnable.

## The approach

**One request validates the whole contract, and executes nothing.**

GraphQL validates the entire document and executes only the operation named by
`operationName`. So the check concatenates all thirteen operations with a trivial
probe and asks the live API to run the probe:

```graphql
query Countries($locale: String) { ... }
... the other twelve ...
query __Probe { __typename }
```

sent as `{"query": "...", "operationName": "__Probe", "variables": {}}`.

Proved against the live API before this plan was written:

| sent | answered |
|---|---|
| the probe alone | `{"data":{"__typename":"Query"}}` |
| probe plus the real `SuggestUpdate` mutation | `{"data":{"__typename":"Query"}}` |
| probe plus that mutation with one invented field | `GRAPHQL_VALIDATION_FAILED`, `Cannot query field "fieldThatDoesNotExist" on type "SuggestUpdateResult".` |

The third row is the one that matters: the bad field sat in an operation that was
**not executed**, and the request still failed. Validation is document wide,
execution is not. That buys three things at once.

- **The mutation is covered without ever running.** `SuggestUpdate` writes a
  proposal row. Here it is validated and never executed, so a check that runs on
  every deploy cannot write to the live database. This was the one part of the
  design worth being afraid of, and it is the reason the probe is the executed
  operation rather than one of the real ones.
- **Required variables stop mattering.** Eleven of the thirteen operations take
  `String!` arguments. Nothing is coerced because nothing is executed, so
  `variables: {}` is correct rather than a compromise that needs fixtures.
- **It works with introspection off**, which is the constraint that killed every
  other design.

**Where the document text comes from.** `documents.ts` holds all thirteen
`graphql()` calls and nothing outside it defines one, checked with a repository
wide grep. `codegen.ts` states the preset emits a `TypedDocumentNode` rather than
a string, so `print()` from `graphql` 16.14.2 turns each export back into text.
The script loads that TypeScript the way `prerender.mjs` already loads the app's
own code, `server.ssrLoadModule('/src/core/graphql/documents.ts')` through Vite,
because `tsx` is not available and regexing template literals out of source is
the fragile alternative. No new dependency.

There are no fragments and no spreads in that file, and all thirteen operation
names are unique, so concatenating them is safe. The script asserts both rather
than trusting them, because either one silently breaks the concatenation.

**The wait.** `prerender.mjs` lines 21 and 22 already wait on the same Northflank
rollout, `patience = PRERENDER_PATIENCE_SECONDS ?? 600` seconds with a
`pause` of 15000, and the comment above them says why: "Every push restarts the
API (SB-136), and this runs shortly after one." The check reuses those numbers so
one rollout is not waited on by two steps holding different opinions about how
long it takes.

Three outcomes, and they are deliberately not the same.

- **`GRAPHQL_VALIDATION_FAILED`**: the API does not yet serve the schema this
  push asks for. Retry until the deadline, then **fail the job**.
- **A network error, a timeout or a non 200**: retry, and do not count it as a
  mismatch. On this machine the first connect to an external host drops and then
  works, so a single blip must never read as a broken deploy.
- **`data.__typename` is `Query`**: every document validates. Continue.

Unlike `giveUp`, exhausting the deadline **fails the job**. That is the whole
point of the card: it refuses to deploy rather than publishing and warning.

**Where the step goes.** After "The API's address, before it is baked in", which
already validates `GRAPHQL_URL`, and before "Build for Pages". The card says
before the prerender; this is earlier still, so a mismatch costs neither the Vite
build nor the Storybook build.

## Files

- `apps/web/scripts/validate-documents.mjs`, new.
- `apps/web/package.json`, one script entry.
- `.github/workflows/ci.yml`, one step in the `pages` job.
- this plan.

## How it meets the exit condition

The exit asks for the step run against the live API with a document naming a
field that does not exist. The script takes an environment override that appends
one extra operation carrying an invented field, so the proof is a run of the real
script against the real API rather than a mock: with the override set it must
fail and name the field, and without it the same command must pass and let the
job continue. Both halves are run before the card closes.

## What the plan check answered, and what changed because of it

Both questions it was asked came back answered, and seven corrections are taken.

**The document wide validation this rests on is a spec guarantee, not an Apollo
behaviour.** A request with known validation errors must fail without execution,
while execution selects only the named operation and coerces only that
operation's variables, per the October 2021 spec, Executing Requests. Installed
`graphql` 16.14.2 does exactly that: parse, `validate(schema, document)`, return
validation errors, and only then `execute` with `operationName`. So the live
probe run before this plan was written is proof of the rule rather than of one
server's quirk. This was the answer that mattered most: had validation been
scoped to the executed operation, this check would have passed for ever while
appearing to work, which is worse than not having it.

**`ssrLoadModule` needs no prior build.** It is Vite's development time source
transformer. The checker could not execute it only because its workspace was
read only and Vite writes a temporary compiled config file. The `contract` step
earlier in the job produces `./generated`, which is the single generated import
`documents.ts` has, so the placement before "Build for Pages" stands.

**The `generated/gql.ts` fallback is withdrawn.** Reading the thirteen operation
strings out of the `Documents` type keys would work today and would make a deploy
gate depend on the internal output shape of a codegen preset. `documents.ts` is
the canonical module and stays the only source.

Five corrections to the script itself, all taken.

- **Its own cache directory, and closed in `finally`**, exactly as
  `prerender.mjs` lines 62 to 78 do. That is not tidiness: the comment there
  records that this server's empty dependency list written into the shared
  `node_modules/.vite` is the prime suspect for Storybook tests that hung on a
  CommonJS package served unbundled. So `cacheDir: 'node_modules/.vite-documents'`,
  its own, with `optimizeDeps: { noDiscovery: true, include: [] }`.
- **Anything that stops it establishing what it checked is a hard failure**, not
  a pass: failing to load the module, an export that is not a document, a
  duplicate operation name, a fragment or spread the concatenation cannot safely
  carry, or a response shape it does not recognise. A validator that cannot say
  what it validated must not let a deploy through.
- **Assert the operation names and the count**, so an incomplete export set is
  caught rather than silently shrinking what is checked. Thirteen today, and the
  number is read from the module rather than hardcoded, but a count of zero or
  one is refused outright.
- **A permanent response fails immediately.** 401, 403 and 404 are configuration
  errors and waiting ten minutes for one to heal only delays the report.
  Retries stay for connection failures, timeouts and 5xx.
- **The likeliest mistake is not GraphQL semantics**, it is loading an incomplete
  set of exports or mishandling a fragment added later. Both are covered by the
  assertions above, and the live bad field proof is run before the card closes.

## What the proof caught, which reasoning had not

The planted run is the reason this card has a working check rather than a
plausible one.

**A schema mismatch arrives as HTTP 400.** Apollo answers a document it cannot
validate with status 400 and the errors in the body. The first version of `judge`
tested `response.ok` before it ever parsed the body, so the single failure this
whole card exists to catch was classified as a transport blip: it retried for the
full patience and then reported "the API did not answer", naming no field at all.
It did fail the job, so the exit condition's letter was met while its purpose was
not.

The earlier curl probes hid this precisely because `curl -s` prints the body and
says nothing about the status, so every one of them looked like a success for the
design. Reading the body before judging the status is now the rule, and the
comment on `judge` says why so it is not tidied back.

That is also the answer to why the planted proof is part of the exit condition
rather than a nicety. The clean run passed identically before and after the fix.

## The step I am least sure of, now

**Whether every export of `documents.ts` is something `print()` accepts.** The
module exports thirteen `graphql()` results today and `codegen.ts` states the
preset emits a `TypedDocumentNode`, but the check is written against the export
list rather than a fixed set of names, so an export added later that is not a
document would reach `print()`. The script refuses an export it cannot print
rather than skipping it, which turns that into a loud failure instead of a
quietly smaller check, but it does mean adding a non document export to that file
breaks the deploy until the script learns about it. That is the correct direction
for a gate, and it is worth writing down so the next person is not surprised.
