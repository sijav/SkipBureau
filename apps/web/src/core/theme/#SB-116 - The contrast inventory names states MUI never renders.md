# SB-116, the contrast inventory names states MUI never renders

**Exit condition:** `contrast.test.ts` fails when a palette state fill stops
pointing at the token its declared pair measures, and every declared state
corresponds to something a component actually renders.

## What is wrong

SB-025 built an inventory of 21 pairs and made them all pass. Three of those
pairs measure tokens **nothing renders**. Read out of the installed
`@mui/material` 9.4 `Button.js` rather than remembered:

```
'--variant-containedBg': palette[color].main,
'@media (hover: hover)': { '&:hover': {
  '--variant-containedBg': palette[color].dark,
} }
```

So a contained button has **two** background states, `main` and `dark`, and
its active state changes the shadow, not the fill. `theme.ts` maps `dark` to
the **pressed** tokens. `accentHover`, `warningHover` and `dangerHover` are
mapped nowhere at all.

The inventory therefore measured `accentHover` and called it "hovered", while
the value a reader's cursor actually produces is `accentPressed`. My own live
check read `rgb(50, 156, 138)` off a hovered button and I recorded it as
confirming the pressed token without noticing that made the inventory's label
wrong.

Three consequences, all recorded and all false:

- `DESIGN.md` claims a three step sequence `6.10, 5.22, 4.64`. The rendered
  sequence is **`6.10` then `4.64`**.
- The reason given for adding `mint/750` is wrong. The value is harmless; the
  story is not.
- `tokens.ts` still tells the reader dark "needs measuring", pointing at the
  task that measured it.

## A fourth thing, found while checking the first three

`theme.ts` gives `success` a `main` and a `contrastText` and **no `dark`**. MUI
fills that in itself, darkening `main` by its own coefficient. So a success
button's hover fill is a colour this repository never chose and the inventory
never measured, on a palette entry that does have a declared pair for its
normal state. That is the same defect one layer down.

## The approach

**Declare what the palette maps, and assert the mapping.**

`DECLARED` gains, per filled palette entry, both states MUI renders:
`contrastText` on `main`, and `contrastText` on `dark`. The fabricated
"hovered" and "pressed" pairs go.

`contrast.test.ts` gains an assertion that each declared state fill **is** the
token its pair measures: `palette.primary.dark === tokens.accentPressed`, and
so on. Today the test only asserts `contrastText`, which is why the fills were
free to drift from the inventory without anything noticing. That assertion is
what makes the exit condition's first half true.

`success` gets an explicit `dark`. It is the same mint as the accent, so it
takes `accentPressed`, and MUI stops choosing a colour for us.

`accentHover`, `warningHover` and `dangerHover` **stay as tokens and move into
`EXEMPT`**, with the reason the border tokens already have: no component
consumes them yet, so what they need to measure against is not yet a fact.
They are real values in the Figma table and deleting them would depart from the
design for no gain.

**`mint/750` stays and its reason is corrected.** The accent ramp had to shift
up a step because `accentPressed`, which is what MUI actually renders on hover,
measured 3.11 against ink and had to clear 4.5. `accentHover` moved with it to
keep the design's three distinct steps intact for whenever something consumes
it. That is the true reason, and it is a smaller claim than the one recorded.

## Files

| file | change |
|---|---|
| `src/core/theme/contrast.ts` | `DECLARED` states MUI renders, hover tokens into `EXEMPT` |
| `src/core/theme/contrast.test.ts` | assert each state fill is the token its pair measures |
| `src/core/theme/theme.ts` | `success.dark`, so MUI stops picking one |
| `src/core/theme/tokens.ts` | the stale "needs measuring" comment, and mint/750's reason |
| `DESIGN.md` | the two step sequence, not three |

## How it meets the exit condition

Two halves, and each is watched failing:

1. **"fails when a palette state fill stops pointing at the token its pair
   measures"**: repoint `primary.dark` at `accentHover` in `theme.ts` and the
   new assertion must go red naming the slot. That is the drift the whole card
   is about.
2. **"every declared state corresponds to something a component renders"**: the
   states now come from `main` and `dark`, which are the two the source above
   defines, and `EXEMPT` says why the rest are absent. Checked by re-reading
   `Button.js` rather than by assertion, since it is a claim about MUI.

This is a **child** of SB-025, so it closes on the tests for the files it
touches, the theme unit tests, plus lint and the type checker, per the owner's
rule of 2026-09-10.

## Corrected by the plan check

**`success.dark` alone does not stop MUI choosing.** `createPalette` still
derives `light` when it is absent, so the entry gets `light: accentSubtle` as
well. MUI always calls `augmentColor`; supplying all four fields is what stops
it deriving any of them, and none is required to avoid a crash.

**Hand written mapping assertions can drift from `DECLARED` too**, which is the
same class of bug one level up. So each declaration that MUI renders carries
its own binding, the palette entry and the slot, and **one generic test**
resolves it out of `appTheme()`. The inventory becomes self binding: a pair
cannot claim to be rendered from a slot without that slot being checked.

**Do not generalise the two state contract past Button and Fab.** Read out of
installed 9.4: filled `Chip` uses `main` and `contrastText` and composites its
hover rather than using `dark`; `Badge` has no hover fill; **filled `Alert`
paints `main` in light and `dark` in dark, and takes its text from
`getContrastText(main)` rather than from `contrastText`**, which is exactly the
mismatch this card exists to catch and will need its own declaration the day an
Alert is used; `Switch` and `Tooltip` composite. So the declarations cover
contained `Button` and coloured `Fab`, which are the only opaque
`main` then `dark` contract in the product today.

**A MUI upgrade invalidates this inventory.** It is read out of component
source, and the lockfile is what pins that source. Rechecking belongs with any
`@mui/material` version bump.

## The step I am least sure of

**Whether `main` and `dark` are the whole story for the components this product
will actually use.** They are for `contained`. `outlined` and `text` composite
`alpha(main, …)` over whatever is behind them, and a composited colour cannot
be measured by looking up two tokens. Nothing uses those variants yet, so I am
declaring the contained pairs and recording the alpha problem rather than
solving it. If that is the wrong call, the inventory grows a hole exactly where
it grew one before.
