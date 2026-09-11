import { radius, type ColourTokens } from './tokens'

/**
 * The paint of SB-037's rows, state by state, read off Figma: the checklist
 * item 27:218, the deadline item 28:46 and the roadmap step 32:437. Every
 * state differs by a marker's shape and a status word as well as by colour, as
 * the file asks, so none of them rests on hue alone.
 */

type Tone = keyof ColourTokens

/** A marker, drawn in `glyph`'s tone. */
export type Mark = 'check' | 'ring' | 'dash' | 'bang' | 'dots' | 'bar' | 'play' | 'none'

export const CHECKLIST_STATES = ['required', 'completed', 'optional', 'missing', 'expired', 'needsVerification', 'notApplicable'] as const
export type ChecklistState = (typeof CHECKLIST_STATES)[number]

export type ChecklistPaint = {
  box: Tone
  fill: Tone | null
  dashed: boolean
  mark: Mark
  glyph: Tone
  title: Tone
  flags: Tone
  status: Tone
}

// Not applicable is text-tertiary in Figma, 3.34:1, which axe fails as text.
// Its words take text-secondary, as the disabled field's helper did; the
// recessed box and its dash still say what it is.
export const CHECKLIST_PAINT: Record<ChecklistState, ChecklistPaint> = {
  required: {
    box: 'borderStrong',
    fill: null,
    dashed: false,
    mark: 'none',
    glyph: 'textPrimary',
    title: 'textPrimary',
    flags: 'textSecondary',
    status: 'textSecondary',
  },
  completed: {
    box: 'accent',
    fill: 'accent',
    dashed: false,
    mark: 'check',
    glyph: 'textOnAccent',
    title: 'textSecondary',
    flags: 'textSecondary',
    status: 'textSecondary',
  },
  optional: {
    box: 'border',
    fill: null,
    dashed: true,
    mark: 'none',
    glyph: 'textPrimary',
    title: 'textPrimary',
    flags: 'textSecondary',
    status: 'textSecondary',
  },
  missing: {
    box: 'danger',
    fill: null,
    dashed: false,
    mark: 'dash',
    glyph: 'danger',
    title: 'textPrimary',
    flags: 'textSecondary',
    status: 'dangerText',
  },
  expired: {
    box: 'warning',
    fill: null,
    dashed: false,
    mark: 'bang',
    glyph: 'warning',
    title: 'textPrimary',
    flags: 'textSecondary',
    status: 'warningText',
  },
  needsVerification: {
    box: 'warning',
    fill: null,
    dashed: false,
    mark: 'dots',
    glyph: 'warning',
    title: 'textPrimary',
    flags: 'textSecondary',
    status: 'warningText',
  },
  notApplicable: {
    box: 'border',
    fill: null,
    dashed: false,
    mark: 'dash',
    glyph: 'textTertiary',
    title: 'textSecondary',
    flags: 'textSecondary',
    status: 'textSecondary',
  },
}

export const DEADLINE_STATES = ['normal', 'upcoming', 'dueSoon', 'today', 'overdue', 'completed'] as const
export type DeadlineState = (typeof DEADLINE_STATES)[number]

export type FramePaint = { fill: Tone; stroke: Tone; bar: boolean }
export type DeadlinePaint = FramePaint & { mark: Mark; glyph: Tone; title: Tone; date: Tone; remaining: Tone }

// Urgency in three steps, not six: neutral until Due soon, amber from Due soon
// through Today, red only once overdue. The day count does the fine work.
export const DEADLINE_PAINT: Record<DeadlineState, DeadlinePaint> = {
  normal: {
    fill: 'surface',
    stroke: 'border',
    bar: false,
    mark: 'ring',
    glyph: 'borderStrong',
    title: 'textPrimary',
    date: 'textSecondary',
    remaining: 'textSecondary',
  },
  upcoming: {
    fill: 'surface',
    stroke: 'borderStrong',
    bar: false,
    mark: 'ring',
    glyph: 'textSecondary',
    title: 'textPrimary',
    date: 'textSecondary',
    remaining: 'textSecondary',
  },
  dueSoon: {
    fill: 'surface',
    stroke: 'warning',
    bar: true,
    mark: 'bang',
    glyph: 'warning',
    title: 'textPrimary',
    date: 'textSecondary',
    remaining: 'warningText',
  },
  today: {
    fill: 'warningSubtle',
    stroke: 'warning',
    bar: true,
    mark: 'bang',
    glyph: 'warning',
    title: 'textPrimary',
    date: 'textSecondary',
    remaining: 'warningText',
  },
  overdue: {
    fill: 'dangerSubtle',
    stroke: 'danger',
    bar: true,
    mark: 'dash',
    glyph: 'danger',
    title: 'textPrimary',
    date: 'textSecondary',
    remaining: 'dangerText',
  },
  completed: {
    fill: 'surface',
    stroke: 'border',
    bar: false,
    mark: 'check',
    glyph: 'accent',
    title: 'textSecondary',
    date: 'textSecondary',
    remaining: 'textSecondary',
  },
}

export const ROADMAP_STATUSES = ['completed', 'current', 'upcoming', 'waiting', 'blocked', 'needsInput'] as const
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number]

export type RoadmapPaint = FramePaint & { mark: Mark; glyph: Tone; number: Tone; title: Tone; status: Tone; hover: Tone }

// Current is the only filled ground, so it is findable at a glance without the
// upcoming steps looking disabled. Completed goes quiet through text colour,
// never opacity. Waiting is neutral with dots, it needs patience; Blocked is
// red with a bar, it needs action.
export const ROADMAP_PAINT: Record<RoadmapStatus, RoadmapPaint> = {
  completed: {
    fill: 'surface',
    stroke: 'border',
    bar: false,
    mark: 'check',
    glyph: 'accent',
    number: 'textSecondary',
    title: 'textSecondary',
    status: 'textSecondary',
    hover: 'surfaceSubtle',
  },
  current: {
    fill: 'accentSubtle',
    stroke: 'accent',
    bar: true,
    mark: 'play',
    glyph: 'accent',
    number: 'accentText',
    title: 'textPrimary',
    status: 'accentText',
    hover: 'accentSubtleHover',
  },
  upcoming: {
    fill: 'surface',
    stroke: 'border',
    bar: false,
    mark: 'ring',
    glyph: 'borderStrong',
    number: 'textSecondary',
    title: 'textPrimary',
    status: 'textSecondary',
    hover: 'surfaceSubtle',
  },
  waiting: {
    fill: 'surface',
    stroke: 'borderStrong',
    bar: true,
    mark: 'dots',
    glyph: 'textSecondary',
    number: 'textSecondary',
    title: 'textPrimary',
    status: 'textSecondary',
    hover: 'surfaceSubtle',
  },
  blocked: {
    fill: 'surface',
    stroke: 'danger',
    bar: true,
    mark: 'bar',
    glyph: 'danger',
    number: 'textSecondary',
    title: 'textPrimary',
    status: 'dangerText',
    hover: 'surfaceSubtle',
  },
  needsInput: {
    fill: 'surface',
    stroke: 'warning',
    bar: true,
    mark: 'bang',
    glyph: 'warning',
    number: 'textSecondary',
    title: 'textPrimary',
    status: 'warningText',
    hover: 'surfaceSubtle',
  },
}

const STROKE = 1
const BAR = 3

/**
 * A framed row: hairlines all round and, where the state calls for it, the
 * 3px bar at the reading start. Figma draws them inside the frame and not in
 * its padding, so the padding gives each side's stroke back. The RTL cache
 * mirrors the bar for right-to-left reading.
 */
export const frameStyle = (tokens: ColourTokens, paint: FramePaint) => ({
  borderStyle: 'solid',
  borderColor: tokens[paint.stroke],
  borderWidth: `${STROKE}px`,
  borderLeftWidth: `${paint.bar ? BAR : STROKE}px`,
  borderRadius: `${radius.xs}px`,
  backgroundColor: tokens[paint.fill],
})

/** How much of a side's padding the frame's stroke takes. */
export const frameGiveBack = (paint: FramePaint) => ({ start: paint.bar ? BAR : STROKE, other: STROKE })

/**
 * The family's one interaction, shared by every row that leads somewhere:
 * hover tints the surface, focus keeps the resting surface and adds the 2px
 * accent-text outline inside the edge. A touch screen keeps no hover.
 */
export const rowInteraction = (tokens: ColourTokens, hover: Tone, alsoOnHover: Record<string, unknown> = {}) => ({
  '@media (hover: hover)': { '&:hover': { backgroundColor: tokens[hover], ...alsoOnHover } },
  '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
})
