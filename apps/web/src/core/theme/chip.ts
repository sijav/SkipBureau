import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The context chip of Figma 17:27: one piece of the reader's situation, their
 * nationality, city or status, shown where an answer depends on it. It is a
 * button, because the design says it is always editable.
 */

export type ChipPaint = {
  fill: keyof ColourTokens
  stroke: keyof ColourTokens
  dashed: boolean
  key: keyof ColourTokens
  value: keyof ColourTokens
}

export const CHIP_PAINT = {
  set: { fill: 'surface', stroke: 'border', dashed: false, key: 'textSecondary', value: 'textPrimary' },
  hover: { fill: 'surfaceSubtle', stroke: 'borderStrong', dashed: false, key: 'textSecondary', value: 'textPrimary' },
  // The design: unset is amber and dashed, because an unanswered context
  // question is the reason an answer may be wrong for this reader.
  unset: { fill: 'surface', stroke: 'warning', dashed: true, key: 'textSecondary', value: 'warningText' },
} as const satisfies Record<string, ChipPaint>

/** Figma draws the stroke inside a 26px frame: 1 + 4 + 16 + 4 + 1. */
const STROKE = 1
const PAD_Y = 5

// Lengths are strings because this goes through sx, which multiplies numbers.
export const chipStyle = (tokens: ColourTokens, set: boolean) => {
  const paint = set ? CHIP_PAINT.set : CHIP_PAINT.unset

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${spacing.xs}px`,
    padding: `${PAD_Y - STROKE}px ${spacing.sm - STROKE}px`,
    borderRadius: `${radius.xs}px`,
    border: `${STROKE}px ${paint.dashed ? 'dashed' : 'solid'} ${tokens[paint.stroke]}`,
    backgroundColor: tokens[paint.fill],
    color: tokens[paint.value],
    '@media (hover: hover)': {
      '&:hover': {
        backgroundColor: tokens[CHIP_PAINT.hover.fill],
        // An unset chip keeps its amber dash on hover: the design's signal that
        // something is missing must not disappear under the pointer.
        ...(set ? { borderColor: tokens[CHIP_PAINT.hover.stroke] } : {}),
      },
    },
    // The design draws no focus; the button's inward 2px accent-text outline
    // is the system's, so the chip uses it rather than inventing one.
    '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
  }
}
