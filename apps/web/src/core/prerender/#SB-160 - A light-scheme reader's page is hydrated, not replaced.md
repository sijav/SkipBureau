# SB-160, A light-scheme reader's page is hydrated, not replaced, so its largest paint is the file's

**Exit:** on the built guide with the same phone profile, light scheme, the
largest contentful paint is the snapshot's first paint rather than React's
render, and the page logs no hydration error in light, in either direction;
dark still renders without errors.

## Why SB-155 was not enough

Measured on the live guide, phone profile (4x CPU, 1.6 Mbps): the snapshot
paints at 1.1 s and LCP lands at 3.9 s. React replaces the snapshot with new
elements, and the new quick-answer paragraph, drawn in the web font that has
loaded by then, is a little larger than the snapshot's, drawn in the fallback.
A larger new element is a new LCP. Hydration keeps the file's elements, so
there is no new one.

## Who hydrates

A reader in **light**: their first client render can match the file, since the
data comes from the seed, the catalog is loaded first and the palette is the
one the file was drawn in. A reader in **dark** keeps SB-155's replace: the
file is light and hidden from them, and hydrating light markup under a dark
theme would mismatch on every styled element.

## What stands in the way, and the change for each

1. **emotion's inline `<style>` tags** sit between the file's elements, where
   the client renders none. The prerender moves them into the head, in order.
   The client's caches find them there by key and register them, globals by
   their own lookup, so nothing is inserted twice.
2. **StructuredData** writes `<script>` elements into the body on the client
   and nothing on the server. It now renders after mount, so hydration sees
   what the file has. PageHead needs no change: `<title>`, `<meta>` and `<link>`
   are hoistables, which React 19 places in the head without matching them
   against the markup.
3. `main.tsx` calls `hydrateRoot` for a seeded page in light, `createRoot`
   otherwise.

## Least sure of

Everything else that might render differently on the client. Dates are the
first suspect: `Intl` in Node and in Chrome may not write a Persian month the
same way. So every prerendered page, both languages, is loaded in light with
the console watched, not only the guide the e2e opens.

## What building it turned up

- **Hydrating, React adopts the file's own head tags.** Where the file's
  `<title>`, `<meta>` or `<link>` matches what PageHead renders, React claims
  that element rather than adding one. PageHead's cleanup then deleted them,
  since they still carried `data-prerendered`, and the page was left with no
  canonical at all; the replace path never adopted, which is why SB-155 did not
  see it. `main.tsx` now takes the mark off those three kinds before it
  hydrates; the file's JSON-LD and the snapshot style keep it and still go.
- **StructuredData** first set a flag in an effect, which the hooks lint
  refuses; it reads `useSyncExternalStore` with a server snapshot of false,
  which React also uses while hydrating.
- **Measured**, local build, phone profile: in light the heading on screen
  after the script is the file's own node, and there is one LCP entry, at first
  paint, 1.0 s (it was 3.9 s live before this). In dark the page is replaced,
  as intended. All 38 pages, light and dark: no console error, one heading
  each. Navigating from a hydrated guide to its hub leaves one canonical, one
  description and the hub's own `og:url` and structured data.

## How it is checked

The LCP measurement repeated with the same profile; a sweep of all 38 pages
in light for any console error; the pages e2e, whose cold-load test already
fails on any error; and dark loaded once more to see it still renders.
