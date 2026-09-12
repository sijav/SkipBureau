/**
 * What a finger needs, in pixels. SB-072.
 *
 * WCAG 2.2 asks for 24 at AA and 44 at AAA, and 44 is also what Apple and
 * Google publish. The card names 44, so 44 it is.
 */
export const TAP = 44

/**
 * Phones and tablets, which is everything below MUI's `md`.
 *
 * Written out rather than taken from `theme.breakpoints.down('md')` because
 * half of what uses it is a `styleOverrides` object with no theme to ask, and
 * two spellings of the same threshold would be free to drift apart. This is
 * the default `md` of 900, minus the 0.05 MUI subtracts so that `down` and
 * `up` cannot both match the same width.
 */
export const BELOW_MD = '@media (max-width: 899.95px)'

/**
 * A control grown to a finger's height below `md`.
 *
 * Above `md` there is a mouse and a design that says what the sizes are; below
 * it there is no mobile design at all (SB-019), so a taller control deviates
 * from nothing.
 *
 * **The box really grows.** The first version of this did it with an
 * absolutely positioned `::after` over the control, which enlarges what a
 * finger lands on while moving nothing. It works, and it is invisible: a
 * control's `getBoundingClientRect()` does not include its pseudo-elements, so
 * neither the sweep that found these nor any later check could tell the
 * difference between that and doing nothing at all. A guard that cannot see
 * the fix is worse than a slightly taller control on a phone.
 */
export const tapHeight = { [BELOW_MD]: { minHeight: `${TAP}px` } } as const

/**
 * The same, for a link that is a run of text rather than a box: it has to
 * become one before it can have a height, and its own text stays centred.
 */
export const tapLink = { [BELOW_MD]: { display: 'inline-flex', alignItems: 'center', minHeight: `${TAP}px` } } as const
