import { BELOW_MD, TAP } from './touch'
import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The four button styles, read token by token from Figma 11:44, and the
 * styles MUI receives for them.
 *
 * A table first, styles second, so contrast.test.ts can check the roles it
 * declares against what is actually emitted without reaching into MUI's
 * loosely typed style objects.
 */

export const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

export type ButtonFill = keyof ColourTokens | 'transparent'

export type ButtonPaint = {
  label: keyof ColourTokens
  rest: ButtonFill
  hover: ButtonFill
  pressed: ButtonFill
  stroke: ButtonFill
  pressedStroke: ButtonFill
  disabledFill: ButtonFill
  disabledStroke: ButtonFill
}

// Read from the design, not chosen. Two of these look like slips and are not:
// Destructive rests on `dangerHover`, and Primary presses to the SAME fill it
// hovers to, marking the press with an `accentPressed` stroke instead.
export const BUTTON_PAINT: Record<ButtonVariant, ButtonPaint> = {
  primary: {
    label: 'textOnAccent',
    rest: 'accent',
    hover: 'accentHover',
    pressed: 'accentHover',
    stroke: 'transparent',
    pressedStroke: 'accentPressed',
    disabledFill: 'surfaceSubtle',
    disabledStroke: 'transparent',
  },
  secondary: {
    label: 'textPrimary',
    rest: 'surface',
    hover: 'surfaceSubtle',
    pressed: 'surfaceSubtle',
    stroke: 'borderStrong',
    pressedStroke: 'textSecondary',
    disabledFill: 'surfaceSubtle',
    disabledStroke: 'border',
  },
  ghost: {
    label: 'accentText',
    rest: 'transparent',
    hover: 'accentSubtle',
    pressed: 'accentSubtleHover',
    stroke: 'transparent',
    pressedStroke: 'transparent',
    disabledFill: 'transparent',
    disabledStroke: 'transparent',
  },
  destructive: {
    label: 'textOnDanger',
    rest: 'dangerHover',
    hover: 'dangerPressed',
    pressed: 'dangerDeep',
    stroke: 'transparent',
    pressedStroke: 'transparent',
    disabledFill: 'surfaceSubtle',
    disabledStroke: 'transparent',
  },
}

/** Figma 11:4 pads 10 vertically, which is not on the 8px scale. Recorded in DESIGN.md. */
const PAD_Y = 10

/**
 * Figma draws every stroke INSIDE the 146x40 frame, and a CSS border sits
 * outside the padding. So every style carries a 1px border, transparent where
 * the design has none, and the padding gives that pixel back: 1 + 9 + 20 + 9 + 1
 * is the 40, and a style that gains a stroke on press does not move.
 */
const STROKE = 1

const fill = (tokens: ColourTokens, value: ButtonFill): string => (value === 'transparent' ? 'transparent' : tokens[value])

export type ButtonStyle = {
  color: string
  backgroundColor: string
  borderColor: string
  // MUI's own Button keeps hover fills behind this query, so a touch screen
  // does not keep a finger's last hover painted on.
  '@media (hover: hover)': { '&:hover': { backgroundColor: string } }
  '&:active': { backgroundColor: string; borderColor: string }
  '&.Mui-disabled': { color: string; backgroundColor: string; borderColor: string }
}

export const buttonStyle = (tokens: ColourTokens, paint: ButtonPaint): ButtonStyle => ({
  color: tokens[paint.label],
  backgroundColor: fill(tokens, paint.rest),
  borderColor: fill(tokens, paint.stroke),
  '@media (hover: hover)': { '&:hover': { backgroundColor: fill(tokens, paint.hover) } },
  '&:active': { backgroundColor: fill(tokens, paint.pressed), borderColor: fill(tokens, paint.pressedStroke) },
  // Every disabled style reads in textTertiary, the theme's text.disabled.
  '&.Mui-disabled': {
    color: tokens.textTertiary,
    backgroundColor: fill(tokens, paint.disabledFill),
    borderColor: fill(tokens, paint.disabledStroke),
  },
})

export const buttonVariants = (tokens: ColourTokens) =>
  BUTTON_VARIANTS.map((variant) => ({ props: { variant }, style: buttonStyle(tokens, BUTTON_PAINT[variant]) }))

export const buttonRoot = (tokens: ColourTokens) => ({
  // Hug the label as Figma does. MUI's 64px floor would widen a short one.
  minWidth: 0,
  // Below md, a finger's 44 (SB-072). Every Button in the app at once, since
  // the rule is about the hand holding the phone rather than about any one
  // button. Above md the design says what the height is, and this is not
  // applied. `TAP` lives in touch.ts; the media query is written out here
  // because this object is styleOverrides rather than an sx callback and has
  // no theme to ask.
  [BELOW_MD]: { minHeight: `${TAP}px` },
  border: `${STROKE}px solid transparent`,
  padding: `${PAD_Y - STROKE}px ${spacing.md - STROKE}px`,
  borderRadius: radius.sm,
  // An outline rather than a thicker border, so focusing moves nothing, and
  // offset inward so it sits where Figma draws its 2px focus stroke. Outlines
  // also survive forced-colors mode, where a box-shadow ring would vanish.
  '&.Mui-focusVisible': { outlineWidth: 2, outlineStyle: 'solid', outlineColor: tokens.accentText, outlineOffset: -2 },
})
