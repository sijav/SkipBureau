import type { CSSObject } from '@mui/material'
import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The search field of Figma 17:17, the product's primary entry point. Built on
 * MUI's bare InputBase, not OutlinedInput, whose theme overrides carry the form
 * field's look: this one is 56 tall, serif, and focuses with a 2px stroke and
 * no ring.
 */
export const SEARCH_PAINT = {
  fill: 'surface',
  // The OWNER'S DECISION for text fields, 2026-09-10, applied here too: the
  // design's border-strong is 1.54 against the page and the white fill 1.05, so
  // the stroke is all that shows where the field is. text-tertiary is 3.34.
  stroke: 'textTertiary',
  focusStroke: 'accentText',
  placeholder: 'textSecondary',
  value: 'textPrimary',
  icon: 'textTertiary',
  iconFilled: 'textSecondary',
} as const satisfies Record<string, keyof ColourTokens>

const HEIGHT = 56
const STROKE = 1
const FOCUS_STROKE = 2

// Strokes inside the frame, as Figma draws them: the 1px border gives its width
// back from the padding, and focus is an outline laid inward over it, so the
// 2px focus stroke moves nothing. Lengths are strings because this goes
// through sx, which multiplies bare numbers.
export const searchStyle = (tokens: ColourTokens, text: CSSObject) => ({
  height: `${HEIGHT}px`,
  gap: `${spacing.sm}px`,
  paddingLeft: `${spacing.md - STROKE}px`,
  paddingRight: `${spacing.sm - STROKE}px`,
  border: `${STROKE}px solid ${tokens[SEARCH_PAINT.stroke]}`,
  borderRadius: `${radius.sm}px`,
  backgroundColor: tokens[SEARCH_PAINT.fill],
  color: tokens[SEARCH_PAINT.value],
  '&.Mui-focused': { outline: `${FOCUS_STROKE}px solid ${tokens[SEARCH_PAINT.focusStroke]}`, outlineOffset: `-${FOCUS_STROKE}px` },
  '& .MuiInputBase-input': {
    ...text,
    height: text['lineHeight'],
    padding: 0,
    '&::placeholder': { color: tokens[SEARCH_PAINT.placeholder], opacity: 1 },
    // The browser's own clear button is not in the design.
    '&::-webkit-search-cancel-button': { WebkitAppearance: 'none' },
  },
})

/**
 * The home ask field of Figma 58:538, the Homepage's primary tool: 64 tall,
 * 24 in at the start, 8 at the end where its Ask button sits, 14 between. A
 * question box, not site search, so it carries a submit button, and nothing
 * sits beside it. Focus is the same inward 2px accent-text stroke as search.
 */
export const ASK_PAINT = { glyph: 'textSecondary', glyphFocused: 'textPrimary' } as const satisfies Record<string, keyof ColourTokens>

export const askStyle = (tokens: ColourTokens, text: CSSObject) => ({
  ...searchStyle(tokens, text),
  height: '64px',
  gap: '14px',
  paddingLeft: `${spacing.lg - STROKE}px`,
  paddingRight: `${spacing.sm - STROKE}px`,
  '& .ask-glyph': { color: tokens[ASK_PAINT.glyph] },
  '&.Mui-focused .ask-glyph': { color: tokens[ASK_PAINT.glyphFocused] },
})
