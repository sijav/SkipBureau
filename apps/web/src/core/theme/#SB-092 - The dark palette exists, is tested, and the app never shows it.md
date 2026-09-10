# SB-092, the dark palette exists, is tested, and the app never shows it

**Exit condition:** emulating `prefers-color-scheme: dark` against the running
app renders the dark palette, and switching back renders light.

## What is actually broken

`LocaleShell` renders `<AppTheme direction={...}>` and passes no `mode`.
`AppTheme` defaults `mode = 'light'`. Nothing in `src/` calls `matchMedia`, a
grep for it returns nothing outside `node_modules`. So `dark` in `tokens.ts`,
which is 36 transcribed values with a contrast test over them, is reachable
only from Storybook's toolbar. A reader who has set their operating system to
dark gets the light page.

This is not a missing feature, it is a wire that was never connected.

## The approach

### 1. A media query is an external store, so read it as one

`src/core/theme/systemMode.ts`, new, two functions and no React:

- `systemMode(): Mode`, reads `window.matchMedia('(prefers-color-scheme: dark)').matches`
- `onSystemModeChange(listener): () => void`, subscribes to that list's
  `change` event and returns the unsubscribe

`src/core/theme/useSystemMode.ts`, new, is a `useSyncExternalStore` over those
two. That hook is one line of logic.

The split is not for the tests. Reading a media query and subscribing to it is
a browser concern with no React in it, and it is the exact shape
`useSyncExternalStore` expects to be handed. It also gives the third argument,
`getServerSnapshot`, somewhere honest to live for when this app is prerendered
for SEO, where there is no `window` and the answer has to be light.

Browser globals go through `window.*` per the working agreement, which the
agreement says is so they stay mockable. That is what makes the node test
below possible without jsdom.

### 2. `AppTheme` learns the value `'system'`, and defaults to it

`mode?: Mode | 'system'`, defaulting to `'system'`. Inside:

```
const system = useSystemMode()
const resolved = mode === 'system' ? system : mode
```

`LocaleShell` then needs **no change at all**: it already passes no `mode`, so
the default carries it. That is the smallest correct edit, and it keeps every
explicit `mode` caller, which is Storybook, deterministic.

### 3. `CssBaseline` moves inside `AppTheme` and gets `enableColorScheme`

Read from the installed source rather than remembered: in `@mui/material`
9.4.0, `CssBaseline` defaults `enableColorScheme = false`, and with it on and
no `theme.vars` present it emits `html { color-scheme: <palette.mode> }`. That
is what tells the browser to paint its own scrollbars, form controls and canvas
dark. Without it the page is dark and the scrollbar is white.

**Corrected after the plan check.** The first draft of this plan said
`LocaleShell` needed no change, and that was false. `CssBaseline` is rendered
by `LocaleShell` and by the Storybook preview, as a child of `AppTheme` rather
than inside it, so turning the prop on at one site would leave the other
painting a white scrollbar over a dark page. Rather than set the prop twice, the
baseline moves **into** `AppTheme` and both callers drop theirs. Applying a
theme's baseline is the job of the thing that owns the theme, and one call site
cannot drift from the other.

### 4. `index.html` gets `<meta name="color-scheme" content="light dark">`

Before React mounts, `#root` is empty and the browser paints its default white
canvas, so a dark reader gets a white flash on every cold load. The meta tag
moves that decision to the user agent, before a byte of JavaScript runs. Once
the app mounts, the CssBaseline rule from step 3 states the actual mode and
takes over. This matters more once the SEO work prerenders these pages.

## Files

| file | change |
|---|---|
| `src/core/theme/systemMode.ts` | new, the media query as a store |
| `src/core/theme/useSystemMode.ts` | new, the `useSyncExternalStore` over it |
| `src/core/theme/AppTheme.tsx` | `mode` accepts `'system'` and defaults to it, and renders `CssBaseline` |
| `src/core/theme/index.ts` | export the new hook and the widened type |
| `src/core/theme/systemMode.test.ts` | new, node, a fake `window.matchMedia` |
| `src/core/router/LocaleShell.tsx` | drops its own `CssBaseline` |
| `.storybook/preview.tsx` | drops its `CssBaseline`, toolbar gains `system` |
| `index.html` | the `color-scheme` meta |
| `e2e/theme.spec.ts` | new, the exit condition |

## What the meta tag does not do

The plan check was right to press on this. `<meta name="color-scheme">` lets the
browser pick its own canvas, scrollbar and form control colours before any
script runs. It cannot paint `#121714`, because that value is ours and lives in
the bundle. So it removes the white flash of the browser's default canvas, and
it does not remove the gap between first paint and hydration once these pages
are prerendered. Closing that gap properly means MUI's `colorSchemes` with
`cssVariables`, which emits both palettes as CSS variables behind
`getColorSchemeSelector` so dark applies before React exists. That is a real
migration and it belongs with the prerendering work, not here. It gets a card.

## How it meets the exit condition

`e2e/theme.spec.ts`, against the real running app:

1. `page.emulateMedia({ colorScheme: 'dark' })`, then `goto('/en/tr')`, assert
   the computed `background-color` of `body` is `rgb(18, 23, 20)`, which is
   `#121714`, `dark.background`.
2. `page.emulateMedia({ colorScheme: 'light' })` **with no reload**, assert it
   becomes `rgb(248, 250, 248)`, which is `#F8FAF8`, `light.background`.

Step 2 is the half that has teeth. A version that reads the preference once at
startup passes step 1 and fails step 2, so the live switch is what proves the
subscription rather than the initial read. I will watch it fail by hand: delete
the `change` subscription from `onSystemModeChange`, confirm step 2 goes red,
put it back.

The node test in `systemMode.test.ts` covers the store itself: a hand written
fake `MediaQueryList` on `globalThis.window`, asserting the snapshot follows
`matches`, that a listener is registered on subscribe, that it is removed on
unsubscribe, and that a dispatched change reaches the listener.

Coverage stays at 100%: `systemMode.ts` from the node project, `useSystemMode`
from the Storybook project, whose stories all render through `AppTheme` and
whose toolbar default is now `system`.

## The step I am least sure of

**That `page.emulateMedia` fires a `change` event on an already evaluated
`MediaQueryList` in a live page.** The whole proof of step 2 rests on it. If
CDP only changes what newly evaluated queries report, the listener never runs,
the test can only be written with a reload, and a reload proves nothing here
because it builds a fresh React tree that reads the preference once. I would
then need a different way to prove the subscription, and I do not have one that
is not a mock.

## What is NOT in this task

Remembering an explicit choice, and the control that would set one. The card
says "once there is a control for one", and there is no control. Persistence
with nothing able to write to it is speculative work with no exit condition, so
it gets its own card instead.
