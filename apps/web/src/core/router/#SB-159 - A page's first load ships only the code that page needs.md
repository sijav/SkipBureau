# SB-159, A page's first load ships only the code that page needs

**Exit:** a cold load of a built guide with the phone profile downloads and
runs measurably less JavaScript before the page answers a tap than today's
201 kB gzipped, measured the same way before and after, and no screen shows a
blank moment while its chunk loads.

## Measured before

Live guide, phone profile (4x CPU, 1.6 Mbps, 150 ms), light, three runs:

- scripts before `load`: the entry, 201.6 kB gzipped, then the catalog, 7.6 kB,
  asked for only once the entry has run;
- long tasks at 2.4 s (0.4 s, the entry evaluating), 3.0 s (1.1 s, hydration)
  and 4.2 s (0.1 to 0.2 s); the main thread is busy until 4.3 s.

What the entry holds, by size before minifying (local build): react-dom 31%,
MUI 25%, react-router 6%, all seven screens 4.5%. About 18% is MUI that only
the header's popups and the Suggest dialog use: Autocomplete, TextField with
the Select it brings, Menu with Popover and Modal, Popper with popper.js.

## The change

1. **`lazyPart(load)`** in `src/shared/lazy-part`: a component whose code comes
   later, with `preload()`. Once its code is in it renders synchronously, so a
   preloaded part never suspends; until then it suspends on the load through
   `use()`. Not `React.lazy`, which suspends on its first render even when the
   module is already loaded, and under `createRoot` (a reader in dark) that is
   a frame of fallback. Every part is registered, so `preloadEveryPart()`
   fetches them all.
2. **Screens.** AppRoutes imports each screen from its own folder, lazily. The
   route table becomes data (`createRoutesFromElements`), so `preloadRoute`
   can match an address before anything renders. One `Suspense` around the
   routes, with no fallback: React Router 7 applies a navigation in a
   transition, so the page on screen stays until the next one's code is in.
   NotFound and Unreachable stay in the entry, since the guard renders them,
   and CountryRoute stops importing them through `src/screens`: that barrel
   re-exports every screen, and one static import of it puts them all back.
3. **The header's three popups**: the language menu, the details panel with
   its Popper, the Ask panel with its Popper. Each goes in a file its folder's
   barrel does not export, is loaded the first time it opens, and has its own
   Suspense.
4. **main.tsx** awaits `preloadRoute` before hydrating or rendering, so the
   first render has its screen and hydration matches as it does now. After
   `load`, when idle, `preloadEveryPart()`, so a tap on a popup or a link finds
   its code already there.
5. **The file preloads the rest of its first render.** The prerender reads
   Vite's manifest and writes `<link rel="modulepreload">` for the page's
   screen chunk with its imports, and for its catalog, which today waits for
   the entry to run before it is even asked for.
6. **A deploy renames every chunk**, and a page opened before it asks for names
   that are gone. On `vite:preloadError`, reload, once per address per session.

## Least sure of

- **Chunking.** A module reachable statically from the entry stays in it,
  whatever imports it lazily as well. Read from the manifest after the build:
  the entry must not hold any screen, Autocomplete, Popper or Menu.
- **Hydrating a lazy route inside Suspense.** The server writes the boundary's
  markers and the client's first render does not suspend, since the screen is
  preloaded. The pages e2e already fails if the heading node is replaced.

## What building it turned up

- **React outlines a large finished boundary.** Rendering the routes inside a
  Suspense, the prerender wrote the whole page as a `hidden` block plus an
  inline script that moves it into place, since the boundary was over
  `progressiveChunkSize`. Without scripts the page was hidden, which is what a
  crawler that runs none reads, and the hydration no longer matched the file.
  The prerender sets that size to infinity: nothing streams there.
- **Rolldown makes common chunks.** What the entry imports is not one file but
  eight (the entry, `router`, `utils`, `theme` and smaller ones), which the
  built `index.html` already preloads. Measured by the manifest, gzipped:
  those eight come to 151.9 kB against 206.6 kB for the one script before, and
  a guide adds 10.3 kB of its own plus its 7.3 kB catalog, all asked for in
  the first 25 ms rather than the catalog after the script had run.
- **Seven dev e2e tests fail on main as well**, the same seven with or without
  this change: they expect addresses and test ids from before SB-147. That is
  SB-146. Running them also rebuilds `dist` from whatever is checked out,
  which is worth knowing before measuring `dist` afterwards.
- **A chunk that does not arrive.** Point 6 above was wrong as first built: a
  reload on `vite:preloadError` also fired for the idle preloads, so a reader
  whose signal dropped while reading would have had the page reloaded into
  the browser's offline page. As built:
  - a load that fails in the background is forgotten and asked for again when
    something needs it;
  - the load a render waits on keeps its failure, or React's retry of the
    suspended render would start a fresh load every time and never see the
    error (the unit test counts the loads; the first version made two);
  - a render that fails for want of code reloads the address once per
    session, from `onUncaughtError`, which also covers a deploy's renamed
    chunks. Asking again in the same page rarely helps: Chrome keeps a failed
    module fetch for the life of the document, dependencies included, so the
    retry fails at once and the reload is the recovery;
  - a prerendered page whose own screen cannot be fetched on first load stays
    the file, readable with plain links, in dark too, and React is not
    mounted, where a failing render would have left it blank. Before this card
    there was one script, and a page it failed to reach simply stayed the file.

  Checked in a browser against the built site: ten background chunks refused
  and no reload; a navigation whose chunk is refused reloads once and shows
  the hub; the guide's own chunk refused, light and dark, leaves the file on
  screen with its heading visible and no error.
- **A story opens a popup cold.** The app fetches the popups' code once it is
  idle; a story does not, so the Ask story's first wait allows for the load.
- **Checked:** all 40 prerendered pages, light and dark, with no console error
  or failed request, one heading and one canonical; in light the heading is
  the file's node, and in dark the first frame React shows already has its
  heading. A navigation with the next screen's chunk held back two seconds
  kept the guide on screen the whole time.

## Measured after

Live guide, the same profile and script, light, runs two and three (the first
after the deploy met a cold CDN and painted at 3.7 s):

- scripts before `load`: 174.0 kB gzipped in 17 files, the catalog included,
  against 209.2 kB in two; another 64 kB arrives after `load`, when idle;
- first paint and LCP at 1.05 s, the heading still the file's node;
- blocking time 0.85 to 1.0 s, was about 1.5 s, and the main thread is free
  at 3.1 s, was 4.3 s. The longest task is now 0.47 s, was 1.19 s.

A trace of the same load says what the long tasks left are: the browser's
first layout of the file (0.46 s, before first paint), evaluating the modules
(0.22 s), a React task (0.38 s), and 0.43 s of microtasks straight after it,
which the shell's country, published from an effect after mount, explains.
That second pass, and hydrating in a transition, is SB-161; the first layout
is SB-162.

On the deployed final build: the pages e2e passes live, 9 of 9, and every
page the live sitemap lists, 33 of them, loads in light and dark with no
console error or failed request, one heading and one canonical, hydrated in
light and with its heading in the first frame in dark. The held-back
navigation kept the guide on screen for the 1.8 s its chunk took.

## How it is checked

The phone measurement again, the same way: script bytes before `load` and the
long tasks. The pages e2e, locally and live, with the guide's file expected to
preload a script that exists. The Storybook stories that open the popups, and
every prerendered page in light and dark with the console watched.
