# SB-108, Prerendered dark still flashes light before React exists

**Exit:** a prerendered page loaded with prefers-color-scheme dark and
JavaScript disabled paints the dark background, and `e2e/theme.spec.ts` still
passes unchanged.

## Measured before

Live guide, phone profile (4x CPU, 1.6 Mbps, 150 ms): in light, first paint
and LCP at 1.06 to 1.27 s from the prerendered file; in dark, 4.2 s, because
the file is drawn in the light palette, so it is hidden from a dark reader
(`#root[data-snapshot]`), and React replaces it once every script has run.

## Why the file can only be light today

The theme is one palette, picked in JavaScript: `appTheme(mode)` chooses the
`light` or `dark` token set and every style emotion writes carries its hex.
The build knows no reader's scheme, so it writes light.

## The change

1. **One theme for both schemes, from CSS variables.** `appTheme(direction)`
   builds MUI 9.4's `cssVariables` theme with `colorSchemes.light` and
   `colorSchemes.dark`, each a palette from the matching token set. MUI writes
   every palette value as a variable, light on `:root` and dark under
   `@media (prefers-color-scheme: dark)` (its `media` selector, the default
   when both schemes are given, verified in the installed
   `prepareCssVars.mjs`), so the scheme is applied by CSS, with or without
   scripts. The design's own tokens go in each palette under a custom key,
   `tokens`, so they get variables too, and `theme.tokens` holds the
   references, `var(--mui-palette-tokens-surface)` and so on: every component
   already reads its colours from `theme.tokens`, so none of the 170 call sites
   changes. The component overrides (`button.ts`, `input.ts`) are built from
   the references.
2. **The four computed colours**, `alpha(tokens.textPrimary, n)` in two
   shadows, a backdrop and a panel, become `color-mix()`, which takes a
   variable where `alpha()` needs a hex.
3. **Storybook's toolbar still forces a scheme.** The theme takes the
   selector; Storybook's decorator passes `[data-mode="%s"]` and sets
   `data-mode` on `<html>`, so the four-combination story matrix keeps working.
   The app passes nothing and follows the reader's system.
4. **Every prerendered page hydrates**, dark as well as light: the markup and
   styles are the same for both schemes now. The snapshot's hiding rule, its
   `data-snapshot` mark and AppRoot's effect that removed it go.
5. **The tests that read the palette** read it from `colorSchemes[mode]`, and
   the contrast inventory builds the Button's overrides from the hex token sets
   directly, since the theme's own now hold references.

Touches `main.tsx`, `AppRoot.tsx`, `src/core/prerender`, the four files with
`alpha()`, `.storybook/preview.tsx` and the pages e2e besides the theme.

## Least sure of

- **MUI's provider with a variables theme, at build time and on hydration.**
  At build time it must write its variable stylesheet into emotion's output,
  so the prerender hoists it into the head: read from the file. On the client
  it must not render anything that differs by scheme, or dark hydration
  mismatches: the pages e2e and the sweep, in both schemes.
- **MUI components that still branch on `palette.mode` in JavaScript.** In
  variables mode MUI's own use `applyStyles`, which writes CSS per scheme; a
  component of ours that branched would draw light in dark. The sweep's dark
  pass, and the dark stories, show it.

## What building it turned up

- **Only the tests used the old API.** The 170 places that read a colour from
  `theme.tokens` compiled unchanged, since a reference to a variable is a
  string like a hex; the tests that read a palette per mode now read it from
  `colorSchemes[mode]`, and the contrast inventory also asserts that the
  variables the styles name hold each scheme's hex.
- **MUI's variables mode changes two things a test had assumed.** A token's
  reference carries light's value as a fallback,
  `var(--mui-palette-tokens-accentText, #1F6B50)`, and `theme.spacing(2)` is
  `calc(2 * var(--mui-spacing, 8px))`, still 16px in CSS. Nothing did
  arithmetic on `theme.spacing()`.
- **MUI's provider rendered again after hydration.** Its colour-scheme hook
  sets `isClient` in an effect, "to rerender the component after hydration",
  and that update landed while the routes were still hydrating, so React
  finished them in one task: 572 ms locally on the phone profile, where the
  same work had been sliced. It is the same trap SB-161 found in lingui. With
  `noSsr` the hook starts on the client's side, which is safe here because
  nothing it renders differs by scheme; the React tasks went back to 66, 135
  and 87 ms.
- **The guard was watched failing**: the test that finds dark's variables
  under the media query fails when the app's selector is planted as an
  attribute, and the e2e that expects the page visible and dark with scripts
  off fails against the live site, which still hid it.
- **Checked locally**: the pages e2e, 10 of 10; all 40 pages in light and dark
  with the heading the file's node in both, which is to say dark now hydrates;
  dark's first paint locally the same as light's.

## How it is checked

The pages e2e with scripts off in dark expects the heading visible and the
dark ground; `theme.spec.ts` unchanged; the phone measurement in dark; every
page in the sitemap in light and dark; the full suite, whose dark stories now
get their palette from the variables.
