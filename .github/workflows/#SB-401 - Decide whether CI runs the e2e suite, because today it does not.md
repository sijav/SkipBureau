# SB-401, decide whether CI runs the e2e suite, because today it does not

**Exit:** it is written down whether the e2e suite runs in CI: either `ci.yml`
runs it and a run appears on a push, or `CLAUDE.md` records that e2e is
deliberately local only and says why.

## The decision is not mine, and it has already been made

This card was filed as a question for the owner, because inventing a gate they
did not ask for is forbidden. They answered on 2026-09-16, asked whether CI
should run the browser tests:

> "Yes, the whole suite"

Both projects, `dev` and `pages`, not a subset. The option they chose carried one
condition: the seven failing tests are fixed first, so main never goes red. That
is why SB-400 was this card's blocker, and it is now closed with the suite green
at 49 across both projects.

So this card builds. The only open questions are where the job sits and what it
gates.

## What is there now, read rather than remembered

`.github/workflows/ci.yml` has three jobs. `check` installs, generates the Prisma
client, emits the GraphQL contract, lints and typechecks both workspaces, runs
`test:coverage` (both vitest projects) and the API tests, then builds both.
`secrets` scans every object reachable from every ref. `pages` runs on main only,
`needs: [check, secrets]`, and builds, prerenders and deploys the site.

**The only Playwright line in the file is `npx playwright install-deps chromium`**
at line 33, which installs the system libraries for a browser that the Storybook
vitest project uses. Nothing runs `npm run test:e2e`. Every Playwright assertion
has therefore never run in CI, including the whole `pages` project, which is
where the SEO claims this product rests on are checked: that a guide's file
carries its title, description, canonical, alternates and structured data, and
that a URL answers 200 rather than `404.html`.

## The approach: a job of its own

Not a step appended to `check`. Three reasons, in order of weight:

1. **It runs in parallel with `check`** rather than extending it. The e2e job is
   the long one, because the `pages` web server builds and prerenders the whole
   site before a test runs.
2. **A failure says which kind of failure it is** from the job name alone,
   without reading a log to see whether lint or a browser broke.
3. `check` is already a long serial list, and a suite that takes minutes is a
   different kind of thing from a linter.

The cost is a duplicated setup, roughly a minute of `npm ci` and Chromium
libraries. That is the right trade against serialising minutes onto the path that
`pages` waits for.

### What the job needs, each for a reason read from the repository

- **`npx playwright install-deps chromium`.** `postinstall` in `apps/web`
  installs the Chromium binary; this adds the system libraries it does not carry,
  exactly as `check` does at line 33.
- **`npm run db:generate -w @skipbureau/api`.** The generated Prisma client is
  not committed. `e2e/api-server.mjs` spawns the built API, which imports it, and
  `e2e/countries.spec.ts` imports `../../api/src/generated/prisma/client.js`
  directly to insert and delete a country row.
- **`npm run contract -w @skipbureau/web`.** The generated GraphQL types are not
  committed either, and the `pages` web server runs `npm run build`, which is
  `tsc -b && vite build`. Without the contract that typecheck fails before a
  browser opens. `ci.yml` lines 35 to 45 already state this ordering for the same
  reason.
- **No database service.** `e2e/api-server.mjs` starts PGlite, Postgres compiled
  to WebAssembly, in process and applies the committed migrations, which is the
  same reason `ci.yml` line 68 gives for the API tests needing none.
- **No repository variables.** `playwright.config.ts` passes `VITE_GRAPHQL_URL`,
  `SKIPBUREAU_BASE`, `SKIPBUREAU_ORIGIN` and the ports to its own web servers, so
  nothing here depends on `vars.GRAPHQL_URL`, which is the deployed API and must
  not be what a test run writes to.
- **Ports are free on a fresh runner**, and SB-397 turned `reuseExistingServer`
  off, so if anything ever did answer on 4500, 5190 or 5191 the run would stop
  during web server setup rather than test someone else's app.

`playwright.config.ts` already reads `process.env.CI`: `forbidOnly` becomes true,
so a stray `test.only` fails the run rather than silently skipping the rest, and
`retries` becomes 2.

## What it gates: nothing, and that is the plan check's correction

An earlier version of this plan made `pages` wait for the new job,
`needs: [check, secrets, e2e]`, and argued it was "a consequence of the owner's
decision rather than a new gate". The plan check refused that, and it is right:

> That changes "run the suite in CI" into "block production deployment on the
> suite," which the owner has not explicitly chosen. Retries reduce intermittent
> failures but do not make that deployment-policy decision implicit.

Calling something a consequence rather than a gate is exactly how a gate nobody
asked for gets installed, which is the rule this repository states most firmly.
The owner asked that CI run the suite. It will. **`pages.needs` is left alone.**

Whether a red suite should hold the deployment is a real question with a real
argument behind it, since the `pages` project is the only thing asserting the
built artefact's SEO claims. It is filed as its own card for the owner to answer,
not decided here.

## What the plan check settled, which I could not settle from this machine

- **`npm ci` at the root runs a workspace's lifecycle scripts**, so `apps/web`'s
  `postinstall`, which is `playwright install chromium`, delivers the browser
  binary to this job. No explicit install step is needed, and
  `install-deps chromium` correctly supplies only the OS libraries.
- **`webServer.timeout` runs from spawning the command until its readiness URL
  answers**, so the 360 seconds covers the vite build and the prerender, not just
  the static server at the end. On expiry Playwright fails setup with
  `Timed out waiting 360000ms from config.webServer.`, before any test runs, so a
  slow runner reads as a web server problem rather than a broken suite.
- **Cold runner timing cannot be established from this repository.** The first CI
  run is what establishes it, which is why reading that run is proof step one
  rather than a formality.

## What it costs, said plainly

Every push and pull request now runs a full build and prerender of the site plus
49 tests across two browsers' worth of projects, on top of the existing jobs.
Locally the tests themselves take about 1.2 minutes and the servers dominate.
Expect several minutes added to a run, in parallel rather than in series.

The alternative the owner rejected was leaving it local only. What that cost is
already measured: seven tests failed for days against another project's app and
nothing anywhere noticed.

## Files

- `.github/workflows/ci.yml`, one new job. Nothing else in the file changes.
- this plan.

## How it is proved

Unlike the three cards before it, this one cannot be proved locally. Its exit
says a run appears on a push, so the push is the proof.

1. **Push and read the run.** The `e2e` job appears, and its log shows tests from
   BOTH projects, `[dev]` and `[pages]`, with a count of 49. A job that ran zero
   tests and exited green is the check that cannot fail, which is the failure
   mode this whole card exists to remove, so the count is read rather than the
   colour.
2. **Prove it can go red, without turning main red.** On a scratch branch, break
   one assertion by hand, push, watch the `e2e` job fail, then delete the branch.
   A CI job nobody has watched fail is exactly the same untested claim as the
   suite that was never wired up.

## The step I am least sure of

**Whether the `pages` web server survives a CI runner inside Playwright's
timeout.** Its command is `npm run build && npm run prerender && node
e2e/pages-server.mjs` with a 360 second timeout, and the prerender waits for the
API that the same run starts. Locally that is comfortable; a cold runner with no
npm cache for the API build is slower, and if it times out the whole job fails on
setup rather than on a test, which reads as a broken suite rather than a slow one.
