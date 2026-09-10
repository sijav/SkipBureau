import type { ColourTokens } from './tokens'

/**
 * Contrast, measured rather than judged.
 *
 * The inventory below is the point of this file, not the arithmetic. It names
 * the pairs the application actually puts on screen, so a green test means
 * "nothing a reader sees misses its target" rather than "some token
 * combinations happen to pass".
 *
 * Three rules, each learned by getting it wrong:
 *
 * A pair is a ROLE, not two token names, and it says WHERE MUI paints it. An
 * earlier version declared a hovered primary button measuring `accentHover`, a
 * token nothing is mapped to, while the fill a cursor actually produces is
 * `accentPressed`.
 *
 * The binding is REQUIRED. It was optional once, and the test filtered to the
 * pairs that had one, so a pair added without a binding was contrast tested,
 * never bound, and green. Absence must not mean unchecked.
 *
 * An exemption is a RECORDED DECISION. `accent` against the page measures 2.47
 * and that is correct, because it is a fill that carries text and never a
 * standalone indicator. Without writing that down, someone measures it again in
 * six months and "fixes" it.
 */

const channel = (value: number): number => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)

/** WCAG 2.1 relative luminance. Six digit hex only, which tokens.ts enforces. */
export const luminance = (hex: string): number => {
  const packed = Number.parseInt(hex.slice(1), 16)
  const red = channel(((packed >> 16) & 255) / 255)
  const green = channel(((packed >> 8) & 255) / 255)
  const blue = channel((packed & 255) / 255)

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export const contrastRatio = (one: string, other: string): number => {
  const [lighter, darker] = [luminance(one), luminance(other)].sort((a, b) => b - a)

  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

export type Token = keyof ColourTokens

/**
 * Where MUI paints a pair. Required, and a union, so a declaration cannot
 * decline to say.
 *
 * `palette` is the filled control family, read out of `@mui/material` 9.4's
 * `Button.js`: a contained button takes its background from
 * `palette[color].main`, and from `palette[color].dark` inside a
 * `@media (hover: hover)` block. Its ACTIVE state changes the shadow, not the
 * fill, so there is no third background. Coloured `Fab` follows the same
 * contract. Filled `Chip` does NOT, it composites its hover. Filled `Alert`
 * does not either: it paints `dark` in dark mode and takes its text from
 * `getContrastText(main)` rather than `contrastText`. Each of those needs its
 * own variant on the day it is used.
 *
 * `text` is MUI's own text-on-background slots. `CssBaseline` paints `body` as
 * `palette.text.primary` on `palette.background.default`, and `Paper` paints
 * `palette.text.primary` on `palette.background.paper`. `Typography` with no
 * `color` sets nothing and inherits. Binding these checks `theme.ts`'s mapping,
 * which is a real claim, rather than restating `tokens.ts`.
 *
 * There was briefly a third variant for pairs reached through `theme.tokens`.
 * It was a fig leaf: both sides come from `tokens.ts` and `theme.tokens` is
 * already asserted to mirror it, so resolving one proved a token equals itself.
 * No ordinary component consumes `theme.tokens`. Those pairs are in `EXEMPT`
 * until something paints them.
 *
 * A `@mui/material` upgrade invalidates all of it, because it is read out of
 * component source and the lockfile is what pins that source.
 */
export type Painted =
  | { by: 'palette'; entry: 'primary' | 'error' | 'warning' | 'success'; fill: 'main' | 'dark' }
  | { by: 'text'; fore: 'primary' | 'secondary'; back: 'default' | 'paper' }

export type Declared = {
  /** What a reader is actually looking at. Reads as a sentence in a failure. */
  role: string
  fore: Token
  back: Token
  /** 4.5 for text, 3 for a non-text thing that has to be seen on its own. */
  target: 4.5 | 3
  painted: Painted
}

/**
 * Every pair the app renders, with the role and the slot that render it.
 *
 * The filled states come in PAIRS, not threes: MUI paints a contained fill from
 * `main` and its hover from `dark`, and its active state changes the shadow
 * rather than the background.
 */
export const DECLARED: readonly Declared[] = [
  { role: 'body text on the page', fore: 'textPrimary', back: 'background', target: 4.5, painted: { by: 'text', fore: 'primary', back: 'default' } },
  { role: 'body text on a card', fore: 'textPrimary', back: 'surface', target: 4.5, painted: { by: 'text', fore: 'primary', back: 'paper' } },
  { role: 'secondary text on the page', fore: 'textSecondary', back: 'background', target: 4.5, painted: { by: 'text', fore: 'secondary', back: 'default' } },
  { role: 'secondary text on a card', fore: 'textSecondary', back: 'surface', target: 4.5, painted: { by: 'text', fore: 'secondary', back: 'paper' } },

  { role: 'a primary button label', fore: 'textOnAccent', back: 'accent', target: 4.5, painted: { by: 'palette', entry: 'primary', fill: 'main' } },
  { role: 'a primary button label, hovered', fore: 'textOnAccent', back: 'accentPressed', target: 4.5, painted: { by: 'palette', entry: 'primary', fill: 'dark' } },

  { role: 'a label on a success fill', fore: 'textOnAccent', back: 'success', target: 4.5, painted: { by: 'palette', entry: 'success', fill: 'main' } },
  { role: 'a label on a success fill, hovered', fore: 'textOnAccent', back: 'accentPressed', target: 4.5, painted: { by: 'palette', entry: 'success', fill: 'dark' } },

  { role: 'a destructive button label', fore: 'textOnDanger', back: 'danger', target: 4.5, painted: { by: 'palette', entry: 'error', fill: 'main' } },
  { role: 'a destructive button label, hovered', fore: 'textOnDanger', back: 'dangerPressed', target: 4.5, painted: { by: 'palette', entry: 'error', fill: 'dark' } },

  { role: 'a label on a warning fill', fore: 'textOnWarning', back: 'warning', target: 4.5, painted: { by: 'palette', entry: 'warning', fill: 'main' } },
  { role: 'a label on a warning fill, hovered', fore: 'textOnWarning', back: 'warningPressed', target: 4.5, painted: { by: 'palette', entry: 'warning', fill: 'dark' } },
]

/**
 * Pairs someone will reach for, and why each is not required.
 *
 * These are answers, not omissions. Anything moved out of here into `DECLARED`
 * needs the reason below to have stopped being true, and needs a binding,
 * because `DECLARED` will not accept it without one.
 */
export const EXEMPT: readonly { pair: string; because: string }[] = [
  {
    pair: 'textTertiary on any ground',
    because:
      "It is the theme's text.disabled and nothing else. WCAG 1.4.3 exempts inactive controls. The moment it is used for ordinary small text it has to reach 4.5, and it currently measures 3.34 on the light page, so that use has to be a deliberate change rather than a reach for a lighter grey.",
  },
  {
    pair: 'accent, success and warning against the page',
    because:
      'They are fills that carry text on top, never a standalone indicator. The thing that must be seen on its own, the focus ring, is accentText, which measures 6.11. This is already recorded in DESIGN.md and was the reason accentText exists.',
  },
  {
    pair: 'accentHover, warningHover and dangerHover against anything',
    because:
      'No component paints them. MUI takes a contained fill from main and its hover from dark, which are the pressed tokens, so these three are mapped nowhere. They stay because they are real values in the Figma table and the design means them as a third step; they are not measured until something renders one.',
  },
  {
    pair: 'accentText on the page, on a card, and inside an accent tag',
    because:
      'Reached only through theme.tokens, and no ordinary component consumes theme.tokens: its one consumer today is the token swatch story. They were declared with a tokens binding until SB-121, and that binding proved a token equals itself, because both sides come from tokens.ts. They pass at 6.11, 6.41 and 5.66, and they get a real binding when a link or a focus ring actually paints one.',
  },
  {
    pair: 'text inside a warning notice, and inside a danger notice',
    because:
      'Same reason: theme.tokens only, and there is no notice component yet. A filled MUI Alert would NOT be this pair anyway, because it takes its text from getContrastText(main) rather than from a token we chose, which is a mismatch to declare deliberately when an Alert is first used.',
  },
  {
    pair: 'anything on surfaceSubtle',
    because:
      'surfaceSubtle has no MUI palette slot and no call site, so there is no paint path to bind it to and a declaration would have to invent one. It measures 14.39 and 5.17 against the two text tokens, so nothing is being hidden by leaving it here.',
  },
  {
    pair: 'the outlined and text button variants',
    because:
      'Both composite alpha(main, opacity) over whatever sits behind them, so their contrast is not two token lookups and cannot be declared without knowing every backing surface. Nothing uses either variant yet. When something does, declare the finite set of surfaces it may sit on and measure the composited result.',
  },
  {
    pair: 'borderStrong, warningBorder and dangerBorder against their grounds',
    because:
      'WCAG 1.4.11 asks 3:1 of a boundary only where the boundary is what identifies the control or carries the information. No component consumes these yet, so which of those they are is not yet a fact. Classify each when something renders it, rather than guessing now and encoding the guess as a target.',
  },
]
