# SB-013, deploy the web app to GitHub Pages

**Exit condition:** a push to main publishes the site and the published URL
loads the home screen.

## Why this one is the unblocking task

It sat at `low`, blocked by nothing, and it was the only thing gating **SB-075,
which is critical**: GitHub Pages answers every deep link with a 404 status, so
a guide opens for a person and reads as **absent** to Google. A blocker cannot
be less severe than what it blocks, or the selection rule can never reach the
blocked card. That is why five SEO cards went untouched all day. Re-pointed to
critical, and this is the first product task of the session.

## What is actually true right now

- **Pages is not enabled on the repository.** `gh api repos/sijav/SkipBureau/pages`
  returns 404.
- **The base path is already parameterised**: `vite.config.ts` reads
  `base: process.env.SKIPBUREAU_BASE ?? '/'`. Pages at
  `sijav.github.io/SkipBureau/` needs `/SkipBureau/`, which the Playwright
  `pages` project already uses, so this is not new ground.
- **`VITE_GRAPHQL_URL` is baked in at build time.** With no value it falls back
  to `http://localhost:4000/graphql`, which is meaningless from a published
  page.
- **There is no API deployed.** SB-014 is `low/5pt` and untouched.

## The honest problem with the exit condition

`/` redirects to `/en/tr`. `CountryRoute` asks the API whether `tr` exists
before rendering anything. With no API the query fails and the reader gets
**Unreachable**, correctly: the app is working, and it is telling the truth
about not being able to reach its own server.

So **"the published URL loads the home screen" is not achievable by deploying
the web app alone.** I am not going to quietly narrow the exit condition to fit
what I can do, and I am not going to claim it met when a reader would see an
error screen.

Two readings, and the plan check is the right place to settle which:

1. The deploy is genuinely blocked on SB-014, and SB-014 should be raised and
   done first, exactly as SB-013 was raised for gating SB-075.
2. The deploy is worth landing now because **SB-075 does not need the API at
   all**: whether Pages returns 404 for `/SkipBureau/en/tr/g/x` is a property of
   static hosting, observable and fixable with no server. On that reading this
   card ships, its exit condition is recorded as partly met, and the remainder
   moves to SB-014.

I lean to the second, because it unblocks the critical SEO work today and the
first reading stalls on hosting choices that may need the owner.

## The approach

A `pages` job in `ci.yml`, on `main` only, after `check` and `secrets` pass:

- `actions/configure-pages`, which enables Pages for the repository
- build with `SKIPBUREAU_BASE=/SkipBureau/` and `VITE_GRAPHQL_URL` from a
  repository variable, so the API URL is configuration rather than a commit
- `actions/upload-pages-artifact` on `apps/web/dist`
- `actions/deploy-pages` with the `pages: write` and `id-token: write`
  permissions it requires

Versions checked with `gh` rather than remembered, the way `checkout@v7` and
`setup-node@v7` were.

## Files

| file | change |
|---|---|
| `.github/workflows/ci.yml` | the `pages` job |

## How it meets the exit condition

Push to main, then read the deployment from `gh`, then fetch the published URL
and assert it returns **200** and serves the app shell. Then say plainly what
the home screen shows, which with no API is Unreachable, and record the
remainder against SB-014 rather than calling it done.

## Corrected by the plan check: this is blocked on the owner

**`actions/configure-pages` will not bootstrap Pages.** Its `enablement` input
defaults to `false`, and turning Pages on for a repository that has never had it
requires authority the default `GITHUB_TOKEN` does not carry. `pages: write` and
`id-token: write` only permit deploying to a Pages site that already exists. So
the first enablement is either a human in Settings choosing GitHub Actions as
the source, or a personal access token with that authority.

**Do not call this partly complete.** The check was direct about it: shipping
the app shell is a useful separate task, and recording SB-013's exit condition
as partly met would be narrowing it to fit what I can reach. It stays open until
a deployed `/SkipBureau/` renders the actual home screen, which needs SB-014.

**Two practical gaps in the job as sketched.** Jobs do not share
`apps/web/dist`, so the `pages` job needs its own checkout, install, contract
generation and build, or `check` has to upload an artifact for it. And
`vite.config.ts` already copies `index.html` to `404.html`, which makes a deep
link RENDER while still returning **404**. That is not a fix for SB-075, it is
the thing SB-075 is about, and the local Pages mimic already models it.

**The repository variable is the right shape** for `VITE_GRAPHQL_URL`. Vite
replaces it at build time, it is public configuration rather than a secret, and
a runtime config file in the same artifact would need a redeploy anyway while an
externally hosted one adds an availability dependency.

**Action versions, checked rather than remembered:** `configure-pages@v6.0.0`,
`upload-pages-artifact@v5.0.0`, `deploy-pages@v5.0.1`.

## The step I am least sure of

**Answered, and the answer stops this card.** It cannot, and enabling Pages
publishes the repository to a public URL, which is the owner's to decide rather
than mine to do because I happen to hold an authenticated CLI. So the question
goes to him, and the workflow is not written until it has an answer.
