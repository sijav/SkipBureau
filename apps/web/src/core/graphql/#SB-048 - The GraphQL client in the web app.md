# SB-048: the GraphQL client in the web app

Revised after the plan check. Not re-checking: every change is an adoption of
what it prescribed.

**Exit condition.** A data-backed component renders in Storybook, in vitest and
in the running app, from one set of mocks in the first two cases.

## What the check changed

**MSW, not a mock exchange.** I leaned the wrong way and said so in the plan,
which is why it was worth asking. A mock exchange satisfies the literal
rendering half of the exit condition and "would only appear to prove the client
works": it never sends a request, so the endpoint, the request body and urql's
own fetch path are all untested. In a project where the stories **are** the
tests, that is not a good enough boundary. Storybook's real Chromium uses the
MSW worker; node vitest uses `setupServer` with the same handlers.

**The API has no CORS, and the running-app half would have failed on it.** The
check read `main.ts` and found it: `VITE_GRAPHQL_URL` points the app at a
different origin and the browser blocks it. Development, the deployed site and
the prerender process all need allowing.

**The provider takes an injected client**, so each story and test gets a fresh
one rather than sharing cache state and becoming order-dependent.

**Handlers match the operation AND its variables**, and unhandled requests
fail. An operation-name-to-result map ignores variables and hides exactly the
request mistakes this is meant to catch.

**urql does not cost anything at prerender time.** `ssrExchange` collects
server results and rehydrates. My Apollo comparison was stale: `getDataFromTree`
is legacy there now and `prerenderStatic` is the recommendation.

**Keep the document cache.** A context-dependent query carries every context
value in its variables, which gives it a distinct cache key. A normalised cache
would not inherently prevent stale personalised content and adds invalidation
the MVP does not need. Graphcache can come later if editing ever becomes real.

## What I will build

- `client.ts`: the urql client, endpoint from `VITE_GRAPHQL_URL`.
- `GraphQLProvider.tsx`: takes an optional client, defaults to the real one.
- `mocks/handlers.ts` and `mocks/fixtures.ts`: one module, used by Storybook
  and by vitest, matching operation and variables, erroring on anything
  unhandled.
- `CountryName`, the first data-backed component: reads `countries` and shows
  the current one's name. The header needs it anyway.
- Its story with args and a play function, and a test.
- CORS on the API.

## Files

`apps/web/src/core/graphql/`: `client.ts`, `GraphQLProvider.tsx`, `mocks/*`.
`apps/web/src/shared/country-name/`: component, story.
`apps/web/.storybook/preview.tsx`: MSW loader.
`apps/api/src/main.ts`: CORS.

## Where I am least sure now

Whether MSW's worker will register inside vitest's Storybook project, which
runs in headless Chromium through `@vitest/browser-playwright`. The addon
documents Storybook itself; the browser-mode test runner serving
`mockServiceWorker.js` from the right path is the part I expect to fight.
