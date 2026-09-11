import { Box } from '@mui/material'
import type { Mark } from 'src/core/theme'

export type RowMarkProps = {
  mark: Mark
  /** 18 in the checklist and deadline items, 20 in the roadmap step. */
  size: 18 | 20
  /** A resolved colour; the shapes paint currentColor. */
  color: string
}

// Figma's own geometry, read from the SVGs it exports for 27:218, 28:46 and
// 32:437. The marks are drawn per size rather than scaled, because the two
// sizes are not the same drawing: the stroke widths and radii differ.
const shapes = (mark: Mark, size: 18 | 20) => {
  const big = size === 20
  switch (mark) {
    case 'check':
      return (
        <path
          d={big ? 'M4.5 10.5L8.5 14.5L15.5 5.5' : 'M4 9.5L7.5 13L14 5'}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )
    case 'ring':
      return <circle cx={size / 2} cy={size / 2} r={big ? 5.6 : 5.25} fill="none" stroke="currentColor" strokeWidth={big ? 1.8 : 1.5} />
    case 'dash':
      return <rect x={4} y={8} width={10} height={2} rx={1} fill="currentColor" />
    case 'bar':
      return <rect x={4} y={8.75} width={12} height={2.5} rx={1} fill="currentColor" />
    case 'bang':
      return big ? (
        <>
          <rect x={8.75} y={3} width={2.5} height={8} rx={1} fill="currentColor" />
          <rect x={8.75} y={14.5} width={2.5} height={2.5} rx={1} fill="currentColor" />
        </>
      ) : (
        <>
          <rect x={8} y={3} width={2} height={7} rx={1} fill="currentColor" />
          <rect x={8} y={13} width={2} height={2} rx={1} fill="currentColor" />
        </>
      )
    case 'dots':
      return (big ? [5, 10, 15] : [4.5, 9.5, 14.5]).map((cx) => <circle key={cx} cx={cx} cy={size / 2} r={1.5} fill="currentColor" />)
    case 'play':
      // Verbatim, and so outside its box: Figma's polygon sits low and to the
      // start of the 20px frame, and the roadmap's Current step is drawn so.
      return <path d="M5 22.5L-4.75 27.6962V17.3038L5 22.5Z" fill="currentColor" />
    case 'none':
      return null
  }
}

/** A row's state marker, SB-037: a distinct shape per state, so none of them depends on colour alone. */
export const RowMark = ({ mark, size, color }: RowMarkProps) => (
  <Box
    component="svg"
    viewBox={`0 0 ${size} ${size}`}
    aria-hidden
    sx={{
      display: 'block',
      width: `${size}px`,
      height: `${size}px`,
      flexShrink: 0,
      overflow: 'visible',
      color,
      // Only the play mark points somewhere; a check reads the same either way.
      ...(mark === 'play' ? { '[dir="rtl"] &': { transform: 'scaleX(-1)' } } : {}),
    }}
  >
    {shapes(mark, size)}
  </Box>
)
