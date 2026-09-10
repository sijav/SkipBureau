import type { ColourTokens } from './tokens'

/**
 * Contrast, measured rather than judged.
 *
 * The inventory below is the point of this file, not the arithmetic. It names
 * the pairs the application actually puts on screen, so a green test means
 * "nothing a reader sees misses its target" rather than "some token
 * combinations happen to pass".
 *
 * Two rules were learned the hard way and are why this is shaped the way it is:
 *
 * A pair is a ROLE, not two token names, and it says where MUI paints it from.
 * `textOnAccent` is `primary.contrastText`, one value shared by every fill that
 * entry has, so each fill has to pass or the button is unreadable in a state
 * nobody screenshotted. The `from` binding is what stops a pair drifting into
 * measuring a token no component ever paints, which is what happened here.
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
 * Where MUI paints this pair from.
 *
 * Read out of `@mui/material` 9.4's `Button.js`: a contained button sets its
 * background from `palette[color].main`, and to `palette[color].dark` inside a
 * `@media (hover: hover)` block. Its ACTIVE state changes the shadow, not the
 * fill, so there is no third background. Coloured `Fab` follows the same
 * contract.
 *
 * This does not generalise. Filled `Chip` composites its hover instead of using
 * `dark`; `Badge` has no hover fill; filled `Alert` paints `dark` in dark mode
 * and takes its text from `getContrastText(main)` rather than `contrastText`,
 * which is this exact defect waiting for the day an Alert is used. Each of
 * those needs its own declaration then, not an assumption now.
 *
 * A `@mui/material` upgrade invalidates all of it, because it is read out of
 * component source and the lockfile is what pins that source.
 */
export type PaletteBinding = {
  entry: 'primary' | 'error' | 'warning' | 'success'
  fill: 'main' | 'dark'
}

export type Declared = {
  /** What a reader is actually looking at. Reads as a sentence in a failure. */
  role: string
  fore: Token
  back: Token
  /** 4.5 for text, 3 for a non-text thing that has to be seen on its own. */
  target: 4.5 | 3
  /**
   * Present when MUI renders this pair from a palette entry, so the test can
   * check the theme really puts these tokens in those slots. Without it the
   * inventory is free to measure a token nothing paints, which is what SB-116
   * was filed about.
   */
  from?: PaletteBinding
}

/**
 * Every pair the app renders, with the role that renders it.
 *
 * The filled states come in PAIRS, not threes: MUI paints a contained fill from
 * `main` and its hover from `dark`, and its active state changes the shadow
 * rather than the background. An earlier version of this list had a third
 * "pressed" entry measuring a token nothing paints.
 */
export const DECLARED: readonly Declared[] = [
  { role: 'body text on the page', fore: 'textPrimary', back: 'background', target: 4.5 },
  { role: 'body text on a card', fore: 'textPrimary', back: 'surface', target: 4.5 },
  { role: 'body text on a sunk panel', fore: 'textPrimary', back: 'surfaceSubtle', target: 4.5 },

  { role: 'secondary text on the page', fore: 'textSecondary', back: 'background', target: 4.5 },
  { role: 'secondary text on a card', fore: 'textSecondary', back: 'surface', target: 4.5 },
  { role: 'secondary text on a sunk panel', fore: 'textSecondary', back: 'surfaceSubtle', target: 4.5 },

  { role: 'a link, and the focus ring, on the page', fore: 'accentText', back: 'background', target: 4.5 },
  { role: 'a link on a card', fore: 'accentText', back: 'surface', target: 4.5 },
  { role: 'a label inside an accent tag', fore: 'accentText', back: 'accentSubtle', target: 4.5 },

  { role: 'a primary button label', fore: 'textOnAccent', back: 'accent', target: 4.5, from: { entry: 'primary', fill: 'main' } },
  { role: 'a primary button label, hovered', fore: 'textOnAccent', back: 'accentPressed', target: 4.5, from: { entry: 'primary', fill: 'dark' } },

  { role: 'a label on a success fill', fore: 'textOnAccent', back: 'success', target: 4.5, from: { entry: 'success', fill: 'main' } },
  { role: 'a label on a success fill, hovered', fore: 'textOnAccent', back: 'accentPressed', target: 4.5, from: { entry: 'success', fill: 'dark' } },

  { role: 'a destructive button label', fore: 'textOnDanger', back: 'danger', target: 4.5, from: { entry: 'error', fill: 'main' } },
  { role: 'a destructive button label, hovered', fore: 'textOnDanger', back: 'dangerPressed', target: 4.5, from: { entry: 'error', fill: 'dark' } },

  { role: 'a label on a warning fill', fore: 'textOnWarning', back: 'warning', target: 4.5, from: { entry: 'warning', fill: 'main' } },
  { role: 'a label on a warning fill, hovered', fore: 'textOnWarning', back: 'warningPressed', target: 4.5, from: { entry: 'warning', fill: 'dark' } },

  { role: 'text inside a warning notice', fore: 'warningText', back: 'warningSubtle', target: 4.5 },
  { role: 'text inside a danger notice', fore: 'dangerText', back: 'dangerSubtle', target: 4.5 },
]

/**
 * Pairs someone will reach for, and why each is not required.
 *
 * These are answers, not omissions. Anything moved out of here into `DECLARED`
 * needs the reason below to have stopped being true.
 */
export const EXEMPT: readonly { pair: string; because: string }[] = [
  {
    pair: 'textTertiary on any ground',
    because:
      'It is the theme\'s text.disabled and nothing else. WCAG 1.4.3 exempts inactive controls. The moment it is used for ordinary small text it has to reach 4.5, and it currently measures 3.34 on the light page, so that use has to be a deliberate change rather than a reach for a lighter grey.',
  },
  {
    pair: 'accent, success and warning against the page',
    because:
      'They are fills that carry text on top, never a standalone indicator. The thing that must be seen on its own, the focus ring, is accentText, which measures 6.11. This is already recorded in DESIGN.md and was the reason accentText exists.',
  },
  {
    pair: 'accentHover, warningHover and dangerHover against anything',
    because:
      'No component paints them. MUI takes a contained fill from main and its hover from dark, which are the pressed tokens, so these three are mapped nowhere. They stay because they are real values in the Figma table and the design means them as a third step; they are not measured until something renders one. SB-116 is the card where the inventory claimed otherwise.',
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
