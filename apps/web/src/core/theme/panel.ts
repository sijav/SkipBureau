import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The six information panels of Figma 14:26, token by token. Figma calls the
 * component "Alert / Information panel"; it is built on layout primitives, not
 * MUI's Alert, whose default role="alert" would announce every panel on a guide
 * page the moment it loads.
 */

export const PANEL_KINDS = ['officialInformation', 'practicalAdvice', 'warning', 'scamWarning', 'legalUncertainty', 'coverageGap'] as const
export type PanelKind = (typeof PANEL_KINDS)[number]

export type PanelPaint = {
  eyebrow: keyof ColourTokens
  body: keyof ColourTokens
  meta: keyof ColourTokens
  fill: keyof ColourTokens
  stroke: keyof ColourTokens
  /** The design's rule: dashed means incomplete, the edge of what we know. */
  dashed: boolean
}

export const PANEL_PAINT: Record<PanelKind, PanelPaint> = {
  officialInformation: { eyebrow: 'accentText', body: 'textPrimary', meta: 'textSecondary', fill: 'accentSubtle', stroke: 'accent', dashed: false },
  practicalAdvice: { eyebrow: 'textSecondary', body: 'textPrimary', meta: 'textSecondary', fill: 'surface', stroke: 'borderStrong', dashed: false },
  warning: { eyebrow: 'warningText', body: 'textPrimary', meta: 'textSecondary', fill: 'warningSubtle', stroke: 'warning', dashed: false },
  scamWarning: { eyebrow: 'dangerText', body: 'textPrimary', meta: 'textSecondary', fill: 'dangerSubtle', stroke: 'danger', dashed: false },
  legalUncertainty: { eyebrow: 'warningText', body: 'textPrimary', meta: 'textSecondary', fill: 'surface', stroke: 'warning', dashed: true },
  coverageGap: { eyebrow: 'textSecondary', body: 'textPrimary', meta: 'textSecondary', fill: 'surfaceSubtle', stroke: 'borderStrong', dashed: true },
}

/** The bar on the reading-start side. The RTL cache mirrors it for Persian. */
const BAR = 3
const STROKE = 1

// Figma draws the strokes INSIDE and does not count them in the padding: the
// text sits 16px from the outer edge on both sides, bar included. So the
// padding gives back each side's stroke. Lengths are strings because this goes
// through sx, which multiplies bare numbers.
export const panelStyle = (tokens: ColourTokens, paint: PanelPaint) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: `${spacing.sm}px`,
  paddingTop: `${spacing.md - STROKE}px`,
  paddingBottom: `${spacing.md - STROKE}px`,
  paddingRight: `${spacing.md - STROKE}px`,
  paddingLeft: `${spacing.md - BAR}px`,
  borderStyle: paint.dashed ? 'dashed' : 'solid',
  borderColor: tokens[paint.stroke],
  borderWidth: `${STROKE}px`,
  borderLeftWidth: `${BAR}px`,
  borderRadius: `${radius.xs}px`,
  backgroundColor: tokens[paint.fill],
  color: tokens[paint.body],
})
