# SB-155, Prerendered pages carry their content, and hydrate

**Exit:** viewing the source of a built guide with JavaScript off shows its
steps and verified date in the body, and loading it with JavaScript on logs no
hydration mismatch and sends no request for what the file already carries.

## What is true now

Every page that should be found has a file with the right head (SB-076, 085,
087, 089), and an empty `#root`. A crawler that runs no script (most AI
crawlers, every link preview, Bing much of the time) sees a well-titled empty
page, and even Google puts the content in a second, slower queue.

## The approach, and the one not taken

**Render the page's body at build time, and let the client render the same
page from the same data, replacing the snapshot in one commit.** The file
carries the rendered markup and the GraphQL results it was made from; the
client's urql starts from those results, so its first render needs no request
and produces what the file already shows.

**Not `hydrateRoot`**, which the card named. Hydration requires the client's
first render to match the server's markup byte for byte, and this app's first
render depends on things the build cannot know: the reader's colour scheme
(the theme is a JavaScript palette; SB-108), stored Ask history, the header
state published by an effect. Every one of those is a hydration mismatch in
one of the four combinations. Rendering fresh over a snapshot gets the exit's
two observable promises, content in the source and no refetch, and logs no
mismatch because it hydrates nothing. If a later change makes the first render
deterministic, switching to `hydrateRoot` is a one-line change in `main.tsx`.

## The pieces

1. **One place for the site's origin.** PageHead, PageLanguages and the
   structured data read `window.location.origin` while rendering, which does
   not exist at build time. `SiteProvider` and `useSiteOrigin` (`src/core/site`)
   give them the origin: the browser's own, or the one the build is for.
2. **A client that can start from the file.** `createClient` takes an initial
   state for urql's `ssrExchange`; `AppRoot` passes what the file carries.
3. **A catalog that is ready before the first render.** `I18nProvider` renders
   nothing until its catalog loads, and that nothing would clear the snapshot
   for a moment. `main.tsx` loads the page's catalog first, and the provider
   starts active when the catalog it wants is already the active one.
4. **CountryRoute** asks `cache-first` instead of `network-only`. urql's
   `ssrExchange` never answers a `network-only` query from its initial state
   (checked in `@urql/core`'s source), so the guard would refetch the country
   on every cold load and render nothing meanwhile. `cache-and-network` was
   tried first and still sent one request: urql runs a query for the first
   render and again when it subscribes, the second is a cache hit, and that
   policy answers a hit with a request. `cache-first` keeps the guard's point,
   because every session starts with an empty cache: a stale link to a
   removed country still reaches the network. What it gives up is a country
   removed while a reader has the site open, until they reload.
5. **The head is the file's, not the snapshot's.** PageHead and StructuredData
   render nothing on the server: the prerender already writes the head, and a
   second copy in the body would duplicate it for a crawler.
6. **The server render.** `src/core/prerender/page.tsx` renders one address
   through a `StaticRouter`, the app's own `LocaleShell` and routes, an urql
   client in suspense mode with an `ssrExchange`, the catalog activated, and
   React 19's `prerenderToNodeStream`, which waits for every query. emotion
   writes its styles inline in the markup, and on the client its cache picks
   those style tags up by their key, so the snapshot never loses its styles.
7. **The file.** The rendered body goes inside `#root` in a wrapper, and the
   extracted results go in a script tag with `<` escaped. A reader who prefers
   dark gets the snapshot hidden by one CSS rule until the page is rendered in
   dark: without SB-108 the snapshot can only be light, and a flash of the
   wrong theme is worse than today's empty canvas.

## Least sure of

That clearing `#root` on the first commit and the styles emotion moves into
the head happen without a visible frame between them in all four
combinations. Checked by loading a built page in each and watching the first
paints, not by reasoning.

## What building it turned up

- **emotion's cache is module-level**, and every page renders in one process,
  so the first page took every shared style and later pages lost them: the
  first file carried 51 style tags, a guide 22 where rendering it alone gives
  101. On the server AppTheme now makes a fresh cache pair per render; the
  browser keeps its one pair.
- **The hidden snapshot still painted the body light.** Its own baseline
  styles set the body's ground, so a dark-scheme reader with the snapshot
  hidden saw a light page. The dark rule also sets `html body` to the dark
  ground, from the tokens.
- **Measured, not assumed:** a built guide with scripts off and on
  screenshots identically in light; in dark with scripts off the heading is
  hidden on a dark ground, and with scripts on it shows in dark; a cold load
  sends no GraphQL request and logs no error. Rendering all 38 pages takes
  under nine seconds.

## How it is checked

`e2e/pages.spec.ts`: the guide's served source contains a step's title and its
verified date inside `#root`; loading it with scripts on logs no error and
sends no GraphQL request for the country or the guide. And the four
combinations looked at in a browser.
