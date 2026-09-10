# SB-121, a contrast declaration with no binding is silently unchecked

**Exit condition:** a declaration without a binding or a recorded exemption
fails to compile.

## The hole

SB-116 gave every rendered pair a `from` binding and a test that resolves it out
of the theme. `from` is **optional**, and the test does
`DECLARED.filter((pair) => pair.from)`. So a pair added without one is contrast
tested, never bound, and the suite is green. That is the same failure SB-116
existed to fix, moved one level up: absence means unchecked, silently.

It will happen. Someone adds a filled state in good faith, copies the nearest
line, and the nearest line is a surface pair with no binding.

## The approach: absence must not be expressible

`from?: PaletteBinding` becomes `painted: Painted`, required, a discriminated
union. There is no way to write a declaration that says nothing about where it
is painted, because the type will not compile.

```ts
type Painted =
  | { by: 'palette'; entry: 'primary' | 'error' | 'warning' | 'success'; fill: 'main' | 'dark' }
  | { by: 'baseline'; fore: 'primary' | 'secondary'; back: 'default' | 'paper' }
  | { by: 'tokens'; renderedBy: string }
```

- **`palette`** is the contained button family: `contrastText` on `main`, and on
  `dark` for hover. Checked as it is today.
- **`baseline`** is what `CssBaseline` and `Typography` paint from MUI's own
  slots: `palette.text.primary` on `palette.background.default`. Those pairs
  are bindable and are currently unbound purely because I did not look.
- **`tokens`** is everything reached through `theme.tokens` rather than a MUI
  slot, `accentText` on `accentSubtle` among them. `renderedBy` is required and
  names what paints it.

The test then walks **every** declaration and switches on `by`, so adding a
kind without handling it is a type error too.

## Files

| file | change |
|---|---|
| `src/core/theme/contrast.ts` | `painted`, required, discriminated |
| `src/core/theme/contrast.test.ts` | exhaustive switch, no filter |

## How it meets the exit condition

The exit condition is about compiling, so it is proved with the type checker:
delete `painted` from one declaration and `npm run typecheck` must fail. Then
add a fourth `by` value without handling it and the switch must fail too. Both
watched, both reverted.

## Corrected by the plan check

**`by: 'tokens'` is gone.** It was a fig leaf and the check proved it by
looking: no ordinary component consumes `theme.tokens` at all, only the token
swatch story. A test resolving those pairs would assert that a token equals
itself. Those pairs, `accentText` on the page and on a card, the notice text
pairs, move to `EXEMPT` as not yet rendered, and get a real binding on the day
something paints them.

**The baseline branch was imprecise about who paints what.** In installed 9.4,
`Typography` with no `color` sets no colour and inherits. `CssBaseline` paints
`body` as `palette.text.primary` on `palette.background.default`. `Paper`
separately paints `palette.text.primary` on `palette.background.paper`. And
`text.secondary` arrives through explicit component styling, not the baseline.
So the branch becomes a general MUI text-on-background binding, `text[fore]` on
`background[back]`, which resolves out of the theme and checks `theme.ts`'s
mapping rather than restating `tokens.ts`.

**`surfaceSubtle` has no MUI slot and no call site**, so its pairs cannot fit
that branch truthfully. They go to `EXEMPT`.

**A switch is not exhaustive just because its discriminant is a union.**
`noFallthroughCasesInSwitch` only catches accidental fallthrough. Adding a
fourth variant would compile fine and silently do nothing, which is this card's
own bug in a new place. It needs a `default` handing the value to an
`assertNever`, so a new variant is a type error.

**The proof command in this plan was wrong.** There is no `typecheck` script at
the repository root. It is `npm run typecheck -w @skipbureau/web`, which is what
CI runs.

## The step I am least sure of

**Whether moving six pairs into `EXEMPT` is honest or is quietly shrinking the
thing being measured.** The pairs are the same, the colours are the same, and
they still pass; what changes is that the file stops claiming something renders
them. That is more truthful and it is also a smaller promise, and a reader
skimming `DECLARED` will now see eight entries where there were twenty one.

The mitigation is that `EXEMPT` entries carry their reason and the test refuses
a reason shorter than a sentence, so they are visible rather than deleted. Where
this goes wrong is if a component starts painting one and nobody moves it back,
which is exactly what SB-122 is for.
