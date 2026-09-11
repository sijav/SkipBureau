# SB-076, Prerender or serve real files for each guide

**Exit:** the built output contains a file per guide path, and the Pages mimic
serves it with 200.

## What GitHub Pages does, measured on the live site

| request | answer |
|---|---|
| `/SkipBureau/storybook/iframe` | **200**, from `iframe.html`: an address without an extension is served from `address.html` |
| `/SkipBureau/storybook` | **301** to `/SkipBureau/storybook/`: a folder without its slash |
| any address with no file | `404.html`, with status **404** |

Not measured before this was built: an address that is **both** `X.html` and a
folder `X/`. `/en/TR` is exactly that, because every page of Turkey lives in
`en/TR/`, and a task hub with areas under it is the same. So both are written,
`en/TR.html` and `en/TR/index.html`, and whichever Pages preferred would serve
the page.

**Measured after the deploy, 2026-09-11:**

| request | answer |
|---|---|
| `/SkipBureau/en/TR` | **200**, no redirect: the `.html` wins over the folder |
| `/SkipBureau/en/TR/` | **200**, from `en/TR/index.html` |
| `/SkipBureau/en/TR/tasks/start-a-business` | **200**, the same case one level down |
| `/SkipBureau/en/TR/guides` | **301** to `guides/`, a folder with no index, which is then `404.html` |
| `/SkipBureau/en/TR/guides/company-types` | **404**, a guide not written yet, as intended |

So the order is: the file, then `address.html`, then the folder. The mimic
already used that order and now says it was measured. The `index.html` copies
stay: they are what makes the slash form of an address a page too.

## Which addresses get a file

For every country the API lists, in every language, at the page's canonical
address, the one without where the reader comes from:

- the country's home, `/en/TR`
- the hub of every goal that is open there, `/en/TR/tasks/<goal>`
- every area hub, `/en/TR/tasks/<goal>/<area>`
- every guide that is written, `/en/TR/guides/<guide>`

Everything else keeps today's answer, `404.html`: a guide listed but not written
yet, the guides index and guided setup (both Coming soon), search results, the
Suggest dialog, an address carrying an origin (`/en-IR/TR/...`) and the old
`/t/` and `/g/` forms. None of those is a page a search engine should list, and
a person still gets the page, because `404.html` is the app.

## What is in each file

`index.html` as built, with:

- `<html lang dir>` of the page's language, the same values the app sets
- `<title>` of the page, which React then takes over rather than duplicating
- the description, the canonical link and the alternates, each marked
  `data-prerendered`. `PageHead` (SB-085) removes those once it has rendered its
  own, so a page that is navigated away from never leaves its links behind.

The body stays the empty root. Putting the content itself in the file is a
separate step with its own problems, the light snapshot SB-108 describes among
them. The status was the blocker: Google renders JavaScript on a 200 and may skip
a 404 altogether (SB-133).

## Where the data comes from

The live API, `VITE_GRAPHQL_URL`, which is the one the built site calls. The
repository seed would be a copy of the content, and it stops being the same
content the first time someone edits a guide in the admin panel.

Every push restarts the API (SB-136), and the Pages job runs shortly after a
push, so the script retries for up to ten minutes. If the API still does not
answer, it prints a `::warning::` and writes nothing, and the site ships exactly
as it does today. It does not fail the build.

## Where the titles and links come from

The same functions the screens use, not a copy of them. `scripts/prerender.mjs`
starts Vite in middleware mode and loads `src/core/prerender` through
`ssrLoadModule`, with `vite.config.ts`, so lingui's macros, the compiled
catalogs and the `src/` alias all work in Node. Measured: loading the whole app
graph that way takes 12 seconds.

## Files

| file | change |
|---|---|
| `src/core/prerender/prerender.ts` | walks the API and fills the template for each page |
| `scripts/prerender.mjs` | runs it through Vite, retries, writes the files |
| `src/core/graphql/documents.ts` | a `Guides` query, the slugs of a country's guides |
| `package.json` | `npm run prerender` |
| `e2e/pages-server.mjs` | serves `address.html` and redirects a folder without its slash, as Pages does |
| `e2e/pages.spec.ts` | a guide opened cold answers **200** |
| `playwright.config.ts` | the pages server prerenders after building |
| `.github/workflows/ci.yml` | the Pages job prerenders, with the site's origin from `configure-pages` |
| `vite.config.ts`, `DESIGN.md` | say what `404.html` is still for |

## Known gaps, stated

- A guide added in the admin panel has no file until the next build. It still
  opens, from `404.html`. `workflow_dispatch` is added so a rebuild can be
  started without a commit.
- Pages matches addresses case-sensitively, Windows does not, so the mimic
  answers `/en/tr/...` from `en/TR/` on this machine where Pages would not. CI
  runs on Linux.
