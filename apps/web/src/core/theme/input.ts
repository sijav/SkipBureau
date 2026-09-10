import type { CSSObject } from '@mui/material'
import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The text input of Figma 16:32, and the theme overrides that paint it.
 *
 * Figma puts the label ABOVE the field. MUI's outlined TextField floats its
 * label inside a notch in the outline, so the input is composed from
 * FormControl, FormLabel, OutlinedInput and FormHelperText instead, and every
 * state lives on those, not on TextField.
 */

export const FIELD_STATES = ['rest', 'hover', 'focus', 'disabled', 'error'] as const
export type FieldState = (typeof FIELD_STATES)[number]

export type FieldPaint = { fill: keyof ColourTokens; stroke: keyof ColourTokens; value: keyof ColourTokens }

export const FIELD_PAINT: Record<FieldState, FieldPaint> = {
  rest: { fill: 'surface', stroke: 'borderStrong', value: 'textPrimary' },
  hover: { fill: 'surface', stroke: 'textSecondary', value: 'textPrimary' },
  focus: { fill: 'surface', stroke: 'accent', value: 'textPrimary' },
  disabled: { fill: 'surfaceSubtle', stroke: 'border', value: 'textTertiary' },
  error: { fill: 'surface', stroke: 'danger', value: 'textPrimary' },
}

/** The text around the field. Placeholder is text-secondary, not MUI's faded currentColor. */
export const FIELD_TEXT = {
  label: 'textPrimary',
  labelDisabled: 'textTertiary',
  placeholder: 'textSecondary',
  helper: 'textSecondary',
  helperError: 'dangerText',
  // A measured departure from Figma, which has text-tertiary here. That is
  // 3.34 on the light page, and axe failed it: the disabled field's label and
  // value are exempt as parts of an inactive control, but this line is the one
  // that tells the reader how to ENABLE the field, so it has to be read. It
  // takes the ordinary helper colour, the smallest move that clears 4.5.
  helperDisabled: 'textSecondary',
  focusRing: 'accentText',
} as const satisfies Record<string, keyof ColourTokens>

/** Figma 16:32: the value sits 10 from the top and 16 from the side of a 40px field. */
const PAD_Y = 10

/**
 * Figma's focus effect, in its own order: a 4px accent-text ring listed over a
 * 2px background one. CSS paints the first shadow on top, so the ring covers
 * the gap exactly as Figma's canvas does, which the screenshot shows as a solid
 * ring with no gap.
 */
const focusRing = (tokens: ColourTokens) => `0 0 0 4px ${tokens[FIELD_TEXT.focusRing]}, 0 0 0 2px ${tokens.background}`

const OUTLINE = '.MuiOutlinedInput-notchedOutline'

/**
 * Order matters and is deliberate: rest, hover, focus, error, disabled. The
 * selectors are equally specific, so the later wins: a hovered field that is
 * focused shows focus, a hovered or focused one in error shows the error.
 */
export const outlinedInputOverrides = (tokens: ColourTokens, value: CSSObject) => ({
  root: {
    ...value,
    color: tokens[FIELD_PAINT.rest.value],
    backgroundColor: tokens[FIELD_PAINT.rest.fill],
    borderRadius: radius.sm,
    [`& ${OUTLINE}`]: { borderColor: tokens[FIELD_PAINT.rest.stroke], borderWidth: 1 },
    [`&:hover ${OUTLINE}`]: { borderColor: tokens[FIELD_PAINT.hover.stroke] },
    // As MUI does: a touch screen keeps no hover.
    '@media (hover: none)': { [`&:hover ${OUTLINE}`]: { borderColor: tokens[FIELD_PAINT.rest.stroke] } },
    '&.Mui-focused': { boxShadow: focusRing(tokens) },
    [`&.Mui-focused ${OUTLINE}`]: { borderColor: tokens[FIELD_PAINT.focus.stroke], borderWidth: 1 },
    [`&.Mui-error ${OUTLINE}`]: { borderColor: tokens[FIELD_PAINT.error.stroke] },
    '&.Mui-disabled': { backgroundColor: tokens[FIELD_PAINT.disabled.fill] },
    [`&.Mui-disabled ${OUTLINE}`]: { borderColor: tokens[FIELD_PAINT.disabled.stroke] },
  },
  input: {
    // The fieldset that draws the outline is absolutely positioned inside the
    // root, so the stroke sits inside the 40px as Figma draws it.
    padding: `${PAD_Y}px ${spacing.md}px`,
    height: value['lineHeight'],
    '&::placeholder': { color: tokens[FIELD_TEXT.placeholder], opacity: 1 },
    // MUI paints disabled text through -webkit-text-fill-color, so both.
    '&.Mui-disabled': { color: tokens[FIELD_PAINT.disabled.value], WebkitTextFillColor: tokens[FIELD_PAINT.disabled.value] },
  },
})

/** MUI turns a label primary on focus and red on error; the design keeps it text-primary. */
export const formLabelOverrides = (tokens: ColourTokens, label: CSSObject) => ({
  root: {
    ...label,
    display: 'block',
    marginBottom: `${spacing.sm}px`,
    color: tokens[FIELD_TEXT.label],
    '&.Mui-focused': { color: tokens[FIELD_TEXT.label] },
    '&.Mui-error': { color: tokens[FIELD_TEXT.label] },
    '&.Mui-disabled': { color: tokens[FIELD_TEXT.labelDisabled] },
  },
})

/** MUI's error helper is error.main, 3.82 on white; the design's is danger-text. */
export const formHelperTextOverrides = (tokens: ColourTokens, helper: CSSObject) => ({
  root: {
    ...helper,
    margin: `${spacing.sm}px 0 0`,
    color: tokens[FIELD_TEXT.helper],
    '&.Mui-error': { color: tokens[FIELD_TEXT.helperError] },
    '&.Mui-disabled': { color: tokens[FIELD_TEXT.helperDisabled] },
  },
})
