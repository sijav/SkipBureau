import { radius, spacing, type ColourTokens } from './tokens'

export const RESULT_KINDS = ['task', 'guide', 'quickAnswer', 'recent'] as const
export type ResultKind = (typeof RESULT_KINDS)[number]

/**
 * The ask result row of Figma 46:610. Every row declares what it is, and a
 * task row carries the accent ground because choosing one starts a process
 * rather than opening a page. The design draws no hover; a row that links
 * takes the task tile's escalation one step, and its focus ring.
 */
export const RESULT_PAINT = {
  task: { fill: 'accentSubtle', hover: 'accentSubtleHover', kind: 'accentText' },
  guide: { fill: 'surface', hover: 'accentSubtle', kind: 'textSecondary' },
  quickAnswer: { fill: 'surface', hover: 'accentSubtle', kind: 'textSecondary' },
  recent: { fill: 'surface', hover: 'accentSubtle', kind: 'textSecondary' },
  title: 'textPrimary',
  detail: 'textSecondary',
  focus: 'accentText',
} as const

// Lengths are strings because this goes through sx, which multiplies numbers.
export const resultRowStyle = (tokens: ColourTokens, kind: ResultKind, linked: boolean) => {
  const paint = RESULT_PAINT[kind]

  return {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.md}px`,
    width: '100%',
    padding: `11px ${spacing.md}px`,
    textAlign: 'start',
    borderRadius: `${radius.xs}px`,
    backgroundColor: tokens[paint.fill],
    color: tokens[RESULT_PAINT.title],
    textDecoration: 'none',
    ...(linked
      ? {
          '@media (hover: hover)': { '&:hover': { backgroundColor: tokens[paint.hover] } },
          '&.Mui-focusVisible': { outline: `2px solid ${tokens[RESULT_PAINT.focus]}`, outlineOffset: '-2px' },
        }
      : {}),
  }
}
