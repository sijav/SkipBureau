import { spacing, type ColourTokens } from './tokens'

/**
 * The progress indicator of Figma 17:45. Steps is the default and the design
 * says why: bureaucracy is discrete, and a segmented track shows there are nine
 * things, not an abstract 33%. Bar is for aggregate dashboards only.
 *
 * Steps is NOT MUI's Stepper. The plan roast asked whether the design is a
 * sequence of numbered steps; 17:28 answers no. Its segments carry no number,
 * label or icon, so it is a determinate progress bar drawn in pieces, and a
 * Stepper would announce a wizard that is not there.
 */
export const PROGRESS_PAINT = {
  done: 'accent',
  // The one step after the last completed: in progress, not yet done.
  current: 'borderStrong',
  remaining: 'surfaceSubtle',
  label: 'textSecondary',
} as const satisfies Record<string, keyof ColourTokens>

export const PROGRESS_SIZE = {
  stepsHeight: 8,
  stepsGap: spacing.xs,
  barHeight: 6,
  /** Figma rounds every segment, and the bar's two parts, by 1px. */
  radius: 1,
  /** Between the label and the track. */
  gap: spacing.sm,
} as const

export type SegmentState = 'done' | 'current' | 'remaining'

/** Which state each of `total` segments is in, with `completed` done. */
export const segments = (completed: number, total: number): SegmentState[] =>
  Array.from({ length: total }, (_, index) => (index < completed ? 'done' : index === completed ? 'current' : 'remaining'))
