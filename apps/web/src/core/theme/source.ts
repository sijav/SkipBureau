import { panelStyle } from './panel'
import type { ColourTokens } from './tokens'

export const SOURCE_STATES = ['verified', 'recent', 'older', 'unavailable', 'pending'] as const
export type SourceState = (typeof SOURCE_STATES)[number]

export type SourcePaint = {
  fill: keyof ColourTokens
  stroke: keyof ColourTokens
  /** The eyebrow and the status line. */
  signal: keyof ColourTokens
  glyph: keyof ColourTokens
}

/**
 * The source citation card of Figma 30:84, its five states. Verified carries
 * the Official information panel's accent edge and ground, so official
 * material always reads as one register.
 */
export const SOURCE_PAINT: Record<SourceState, SourcePaint> = {
  verified: { fill: 'accentSubtle', stroke: 'accent', signal: 'accentText', glyph: 'accent' },
  recent: { fill: 'surface', stroke: 'accent', signal: 'accentText', glyph: 'accent' },
  older: { fill: 'surface', stroke: 'borderStrong', signal: 'textSecondary', glyph: 'textSecondary' },
  unavailable: { fill: 'surface', stroke: 'danger', signal: 'dangerText', glyph: 'danger' },
  pending: { fill: 'surface', stroke: 'warning', signal: 'warningText', glyph: 'warning' },
}

export const SOURCE_TEXT = { publisher: 'textPrimary', institution: 'textSecondary', rule: 'border', date: 'textSecondary', action: 'accentText', footer: 'textSecondary' } as const

/** The information panel's frame: 1px strokes inside, the 3px bar at the reading start. */
export const sourceCardStyle = (tokens: ColourTokens, state: SourceState) => {
  const paint = SOURCE_PAINT[state]
  return panelStyle(tokens, { eyebrow: paint.signal, body: 'textPrimary', meta: 'textSecondary', fill: paint.fill, stroke: paint.stroke, dashed: false })
}
