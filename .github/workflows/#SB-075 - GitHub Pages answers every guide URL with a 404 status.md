# SB-075, GitHub Pages answers every guide URL with a 404 status

**Exit condition:** a guide URL on the real deployment returns HTTP 200.

## Confirmed on the live site, not inferred

```
https://sijav.github.io/SkipBureau/                          200
https://sijav.github.io/SkipBureau/en/tr                     404
https://sijav.github.io/SkipBureau/en/tr/g/register-your-address   404
```

`vite.config.ts` already copies `index.html` to `404.html`, so those URLs
**render** for a person. The status stays 404, and to a crawler the URL is
absent. That is the difference between being found and not existing, for a
product whose whole distribution is search.

## Two options, and they are not equivalent

The card says to bring the owner the choice with the cost of each. Having
looked, they fix different amounts of the problem.

### Option A, move the host

Cloudflare Pages and Netlify both have a rewrite on their free tier: any path
serves the shell with **200**. Cheap, quick, and it keeps the app exactly as it
is.

**What it does not fix.** `CLAUDE.md`'s SEO rule says a page must BE a page:
"content that only appears after JavaScript runs is content a crawler may never
index and can never rank properly." A rewrite returns 200 and an **empty
shell**. The guide's title, its steps, its verified date all arrive later, from
an API, after JavaScript. Google renders JavaScript, eventually and
inconsistently; a reference product competing on freshness should not be betting
on that queue. It also contradicts what `CLAUDE.md` records as the owner's host
choice.

### Option B, prerender each URL to a real file

Generate an HTML file per URL at build time. Pages then serves a 200 from disk
because the file exists, and the file already contains the content.

**It fixes far more than this card.** A prerendered page can carry its own
`<title>` and description (SB-085), reciprocal `hreflang` (SB-086), `HowTo`
structured data (SB-087) and the verified date, which `CLAUDE.md` calls the
sharpest advantage this product has. Those are four critical cards that a
rewrite does nothing for.

**The cost, stated honestly.** Prerendering needs the URL list and the content
at build time, and the content is edited through an admin panel, so a built site
is a snapshot. It goes stale until something rebuilds it. That is a real
architectural commitment, not a build step.

**The data is already reachable without a live API.** `e2e/api-server.mjs`
starts PGlite, applies the committed migrations and runs the seed. A prerender
step can do exactly the same to enumerate countries and guides and to answer the
queries, so this does not wait on SB-014.

## What I recommend, and why it is a question anyway

**B.** It is the only one that satisfies the rule the owner actually wrote, and
it unblocks four other critical cards. But it commits the product to rebuild on
publish, which is a decision about how the product works rather than a fix, so
it is his.

## Files, if B

| file | change |
|---|---|
| `apps/web/prerender.mjs` | enumerate URLs, render each to a file |
| `apps/web/package.json` | a `prerender` script after `build` |
| `.github/workflows/ci.yml` | run it in the `pages` job |
| `apps/web/e2e/pages.spec.ts` | assert **200**, not merely that it renders |

## How it meets the exit condition

`curl -o /dev/null -w "%{http_code}"` against a guide URL on
`sijav.github.io` returns 200. Watched failing first: it returns 404 today, and
that is recorded above with the exact commands.

## Corrected by the plan check, and the cost of B went up

**B is not a `prerender.mjs` addition, it is SSG.** `main.tsx` calls
`createRoot`, which REPLACES server markup rather than hydrating it, so
generated HTML would be thrown away by the client on load. And
`CountryRoute`'s `network-only` bypasses any cache, so neither "seed the cache"
nor "stop blocking" is enough on its own. The real shape:

- a server entry rendering the URL through `StaticRouter`, emitting the HTML
  **and** the serialized urql `ssrExchange` state
- a client entry using `hydrateRoot` with that state restored
- the guard reading the hydrated snapshot first, revalidating in the background,
  and showing `Unreachable` only when there is neither a snapshot nor a response

**No tool does this for us here.** React Router's `prerender` is framework mode
only, configured through `react-router.config.ts`; this app is declarative
`BrowserRouter`, not even `createBrowserRouter`. Vike supports SSG and adopting
it is a framework migration. A Playwright snapshot loop can prove an experiment
and is the wrong production renderer: it hides hydration mismatches. The
smallest honest route is a custom Vite SSR entry on React Router's own
`StaticRouter` and `hydrateRoot`.

**My PGlite claim was half right.** It prerenders the COMMITTED fixture content
and cannot see an admin's later edits, so it does not solve freshness for the
real product without SB-014.

**Freshness needs a pipeline, not a build step.** The normal mechanism: an admin
publishes, the API sends a signed `repository_dispatch`, Actions rebuilds
against the production API and redeploys. The free tier needs no build minutes
because Actions does the building, but it needs a narrowly scoped token and
debouncing so a batch of edits produces one build.

**And I overstated A.** I wrote that an empty shell "can never rank properly".
Google does render JavaScript on 200 responses; rendering is a separate queued
phase, and non-200 pages may be skipped entirely. So the real argument for B is
not that A cannot work, it is that A leaves the content behind a queue while B
does not, and that only B also delivers per-page titles, `hreflang` and
structured data. **That sentence is quoted from `CLAUDE.md`, which I wrote, so
the rule file overstates it too.**

## The step I am least sure of

**Answered, and it is why this is now a question for the owner rather than a
task.** B commits the product to static publishing with a rebuild on every
content change, and touches the entry point, the router, the client and the
guard. That is an architecture decision, not a fix, and the check was explicit
that it should not begin without the owner confirming it.
