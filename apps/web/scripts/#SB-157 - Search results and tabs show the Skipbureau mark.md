# SB-157, Search results and tabs show the Skipbureau mark: favicon, touch icon, manifest, theme colour

**Exit:** every built page links an SVG and a 48px PNG icon, an
apple-touch-icon and a manifest that all load with 200 on the live site, and
theme-color is set for both schemes.

## The icon, since Figma draws none

Figma has no app icon. The wordmark (43:523) is the word and, after it, a
**mark** (43:525): a 6 by 6 square with 2px corners in the accent. The icon is
that mark alone, scaled, corners kept at a third of the side:

- `favicon.svg`, transparent, the mark in `accent`, switching to the dark
  palette's accent under `prefers-color-scheme: dark`. Google Search accepts an
  SVG favicon.
- `favicon-48.png`, the same, because Google asks for a multiple of 48px and
  not every browser takes SVG.
- `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, on the paper
  background, because iOS paints a transparent icon black and an installed
  icon needs a ground. The mark sits inside the middle 60%, so the 512 is also
  safe as a `maskable` icon.

A derived design, stated as one: the owner's order is that design corrections
come after they have looked, and this is the thing to look at.

## Colours from the tokens, not typed in

`scripts/icons.mjs` imports `src/core/theme/tokens.ts` (Node 24 strips the
types) and writes every icon and `manifest.webmanifest` into `public/`, so a
palette change is one command away from the icons. The PNGs are rendered from
the SVG in Playwright's Chromium, which the repository already installs. The
outputs are committed: they are a few kilobytes and a build should not need a
browser.

`theme-color` is written into the page by a small plugin in `vite.config.ts`
from the same tokens, `background` for light and dark, so it follows the
palette with no second copy.

## Where they are linked

`index.html` links the two favicons, the touch icon and the manifest, by
root-absolute paths, which Vite rewrites under `/SkipBureau/`. Every page the
prerender writes is `index.html` filled in, so every page carries them.

## How it is checked

`e2e/pages.spec.ts` reads the icon, touch-icon and manifest links out of a
built guide's source and requests each: 200. The same run against the live
site with `PAGES_URL` is the exit.
