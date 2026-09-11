import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The frame the card families share, Figma 18:14, 18:40 and 18:65: a white
 * card, a hairline, the small radius, and 16 inside it with the hairline in
 * that 16, as Figma draws strokes.
 */

type Tone = keyof ColourTokens

const STROKE = 1

export const cardFrame = (tokens: ColourTokens, stroke: Tone) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'stretch',
  gap: `${spacing.sm}px`,
  padding: `${spacing.md - STROKE}px`,
  border: `${STROKE}px solid ${tokens[stroke]}`,
  borderRadius: `${radius.sm}px`,
  backgroundColor: tokens.surface,
  textAlign: 'start' as const,
  textDecoration: 'none',
  color: tokens.textPrimary,
})

/**
 * A card that leads somewhere: hover strengthens the border, as the guide and
 * process cards draw it, and focus is the row family's 2px accent-text outline.
 */
export const cardInteraction = (tokens: ColourTokens) => ({
  '@media (hover: hover)': { '&:hover': { borderColor: tokens.borderStrong } },
  '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
})

export const DOCUMENT_STATES = ['notStarted', 'ready', 'missing', 'expiring'] as const
export type DocumentState = (typeof DOCUMENT_STATES)[number]

/** Figma 18:65: the border and the status line say the state, each in words as well. */
export const DOCUMENT_PAINT: Record<DocumentState, { stroke: Tone; status: Tone }> = {
  notStarted: { stroke: 'border', status: 'textSecondary' },
  ready: { stroke: 'border', status: 'accentText' },
  missing: { stroke: 'danger', status: 'dangerText' },
  expiring: { stroke: 'warning', status: 'warningText' },
}
