import { radius, spacing, type ColourTokens } from './tokens'

/**
 * The task tile of Figma 65:1285. The design: the whole tile is the target, no
 * button inside; states escalate through surface tokens only, surface to
 * accent-subtle to accent-subtle-hover; focus keeps the resting surface and
 * adds a 2px accent-text outline; Coming soon is recessed and not interactive.
 */
export const TILE_PAINT = {
  rest: { fill: 'surface', stroke: 'border' },
  hover: { fill: 'accentSubtle', stroke: 'borderStrong' },
  pressed: { fill: 'accentSubtleHover', stroke: 'accent' },
  comingSoon: { fill: 'surfaceSubtle', stroke: 'border' },
  title: 'textPrimary',
  description: 'textSecondary',
  arrow: 'textSecondary',
  arrowActive: 'accentText',
  focus: 'accentText',
} as const

const STROKE = 1

// Strokes inside, as Figma draws them; lengths are strings because this goes
// through sx, which multiplies bare numbers.
export const tileStyle = (tokens: ColourTokens, comingSoon: boolean) => {
  const rest = comingSoon ? TILE_PAINT.comingSoon : TILE_PAINT.rest
  const active = { '& .tile-arrow': { color: tokens[TILE_PAINT.arrowActive] } }

  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    width: '100%',
    padding: `${spacing.md - STROKE}px`,
    textAlign: 'start',
    borderRadius: `${radius.xs}px`,
    border: `${STROKE}px solid ${tokens[rest.stroke]}`,
    backgroundColor: tokens[rest.fill],
    color: comingSoon ? tokens[TILE_PAINT.description] : tokens[TILE_PAINT.title],
    ...(comingSoon
      ? {}
      : {
          '@media (hover: hover)': {
            '&:hover': { backgroundColor: tokens[TILE_PAINT.hover.fill], borderColor: tokens[TILE_PAINT.hover.stroke], ...active },
          },
          '&:active': { backgroundColor: tokens[TILE_PAINT.pressed.fill], borderColor: tokens[TILE_PAINT.pressed.stroke], ...active },
          '&.Mui-focusVisible': { outline: `2px solid ${tokens[TILE_PAINT.focus]}`, outlineOffset: '-2px', ...active },
        }),
  }
}
