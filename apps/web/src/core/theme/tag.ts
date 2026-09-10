import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The eight status tags of Figma 13:26, token by token, and the styles the
 * StatusTag component applies. Here rather than beside the component so
 * contrast.test.ts can check them without the theme reaching into shared.
 */

export const TAG_STATUSES = ['official', 'verified', 'needsContext', 'deadline', 'warning', 'blocked', 'waiting', 'completed'] as const
export type TagStatus = (typeof TAG_STATUSES)[number]

export type TagPaint = {
  label: keyof ColourTokens
  fill: keyof ColourTokens
  stroke: keyof ColourTokens
  mark: keyof ColourTokens
}

// Read from the design. Its own note: Waiting is neutral because it needs
// patience, not action; Blocked is red because it needs action; Deadline and
// Needs context share amber, and the label does the disambiguating. Completed
// keeps an accent mark on a neutral tag.
export const TAG_PAINT: Record<TagStatus, TagPaint> = {
  official: { label: 'accentText', fill: 'accentSubtle', stroke: 'accent', mark: 'accent' },
  verified: { label: 'accentText', fill: 'surface', stroke: 'accent', mark: 'accent' },
  needsContext: { label: 'warningText', fill: 'warningSubtle', stroke: 'warning', mark: 'warning' },
  deadline: { label: 'warningText', fill: 'warningSubtle', stroke: 'warning', mark: 'warning' },
  warning: { label: 'warningText', fill: 'warningSubtle', stroke: 'warning', mark: 'warning' },
  blocked: { label: 'dangerText', fill: 'dangerSubtle', stroke: 'danger', mark: 'danger' },
  waiting: { label: 'textSecondary', fill: 'surfaceSubtle', stroke: 'borderStrong', mark: 'borderStrong' },
  completed: { label: 'textSecondary', fill: 'surface', stroke: 'border', mark: 'accent' },
}

/** Figma draws the 1px stroke inside a 24px frame: 1 + 3 + 16 + 3 + 1. */
const STROKE = 1

/** The 6px square in front of the label. Figma rounds it by 1px. */
const MARK = 6

// Every length is a string with its unit. These go through MUI's `sx`, which
// multiplies bare numbers: `gap: 4` would be 4 spacing units, 32px, and
// `borderRadius: 2` twice the theme radius, 12px.
export type TagStyle = {
  display: 'inline-flex'
  alignItems: 'center'
  gap: string
  padding: string
  border: string
  borderRadius: string
  color: string
  backgroundColor: string
}

export const tagStyle = (tokens: ColourTokens, paint: TagPaint): TagStyle => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: `${spacing.xs}px`,
  padding: `${spacing.xs - STROKE}px ${spacing.sm - STROKE}px`,
  border: `${STROKE}px solid ${tokens[paint.stroke]}`,
  borderRadius: `${radius.xs}px`,
  color: tokens[paint.label],
  backgroundColor: tokens[paint.fill],
})

export const markStyle = (tokens: ColourTokens, paint: TagPaint) => ({
  width: `${MARK}px`,
  height: `${MARK}px`,
  flexShrink: 0,
  borderRadius: '1px',
  backgroundColor: tokens[paint.mark],
})
