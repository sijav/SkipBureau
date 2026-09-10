import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The topic item of Figma 78:552: a hub's ruled row, the whole row the target.
 * Hover tints the surface for a pointer and focus keeps the resting surface
 * with a 2px accent-text outline, the task tile's escalation in a row. On
 * hover and press the arrow steps 2px toward where it points.
 */
export const TOPIC_PAINT = {
  rest: 'surface',
  hover: 'accentSubtle',
  pressed: 'accentSubtleHover',
  // The Coming soon tile's recessed ground, for a row that leads nowhere yet.
  unavailable: 'surfaceSubtle',
  rule: 'border',
  title: 'textPrimary',
  description: 'textSecondary',
  kind: 'textSecondary',
  arrow: 'textSecondary',
  arrowActive: 'accentText',
  focus: 'accentText',
} as const

const RULE = 1
const NUDGE = 2

// Figma draws the rule inside the row's bottom padding, which keeps a row 82
// high, 100 with a kind. A row that leads nowhere yet takes the Coming soon
// tile's recessed ground and no states. Lengths are strings because sx
// multiplies numbers.
export const topicStyle = (tokens: ColourTokens, interactive: boolean) => {
  const active = { paddingInlineEnd: `${spacing.md - NUDGE}px`, '& .topic-arrow': { color: tokens[TOPIC_PAINT.arrowActive] } }
  const frame = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: `${spacing.md}px`,
    width: '100%',
    padding: `${spacing.md}px ${spacing.md}px ${spacing.md - RULE}px`,
    borderBottom: `${RULE}px solid ${tokens[TOPIC_PAINT.rule]}`,
    textAlign: 'start',
    textDecoration: 'none',
  }

  if (!interactive) return { ...frame, backgroundColor: tokens[TOPIC_PAINT.unavailable], color: tokens[TOPIC_PAINT.description] }

  return {
    ...frame,
    backgroundColor: tokens[TOPIC_PAINT.rest],
    color: tokens[TOPIC_PAINT.title],
    '@media (hover: hover)': { '&:hover': { backgroundColor: tokens[TOPIC_PAINT.hover], ...active } },
    '&:active': { backgroundColor: tokens[TOPIC_PAINT.pressed], ...active },
    '&.Mui-focusVisible': {
      outline: `2px solid ${tokens[TOPIC_PAINT.focus]}`,
      outlineOffset: '-2px',
      borderRadius: `${radius.xs}px`,
      '& .topic-arrow': { color: tokens[TOPIC_PAINT.arrowActive] },
    },
  }
}
