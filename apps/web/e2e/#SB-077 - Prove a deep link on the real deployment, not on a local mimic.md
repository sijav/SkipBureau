# SB-077, prove a deep link on the real deployment, not on a local mimic

Written 2026-09-11, before building. The plan roast waits, by the owner's
order of 2026-09-10.

## What is wrong now

`pages.spec.ts` opens `en/tr/g/get-a-sim-card`, an address the app stopped
using on 2026-09-10, and waits for a `resolved-country` test id that no screen
renders any more. It proves route bootstrapping on a local server that mimics
GitHub Pages, and nothing about GitHub Pages itself.

## What changes

- **`playwright.config.ts`**: with `PAGES_URL` set, the `pages` project points
  at that address and starts no local server, so the same spec runs against
  the live site: `PAGES_URL=https://sijav.github.io/SkipBureau/ npx playwright test --project pages`.
  Without it, nothing changes: the local mimic still builds and serves `dist`.
- **`pages.spec.ts`**, opened cold, by direction rather than by language:
  - left to right: `en/TR/guides/sim-card` answers 404, the compromise SB-075
    exists to remove, and still renders the guide: its h1, the address it
    stayed at, `lang` and `dir` on the document;
  - right to left: `fa/TR/guides/sim-card` renders with `dir="rtl"`;
  - an address shared before the markers were spelled out, `en/tr/g/sim-card`,
    arrives at `en/TR/guides/sim-card` and renders the guide.

## How it meets the exit

The exit asks for the same assertions to pass against the live URL opened
cold. They run once against the local mimic and once against
`https://sijav.github.io/SkipBureau/`, and both runs are recorded in the commit.

## The step I am least sure of

The 404 assertion on the live site. Pages serves `404.html` with a 404 status,
and the spec asserts exactly that, so the day SB-075 lands and the status
becomes 200 this test fails on purpose, and its comment says to flip it.
