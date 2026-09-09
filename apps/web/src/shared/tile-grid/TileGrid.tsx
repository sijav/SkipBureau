import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

export type TileGridProps = {
  children: ReactNode
  /** Columns at the widest size. Steps down to two, then one. */
  columns?: 2 | 3 | 4
}

/**
 * The tile grid, expressed as a column count rather than a tile width.
 *
 * Home's twelve goals are drawn as four columns of 302 on a 24 gutter. The 302
 * is what 1280 minus three gutters divides into, so it is a result, not an
 * input: typing it in is what makes a grid that cannot reflow.
 */
export const TileGrid = ({ children, columns = 4 }: TileGridProps) => {
  const { spacing } = useTheme()

  return (
    <Box
      sx={{
        display: 'grid',
        gap: spacing(3),
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: `repeat(${columns}, minmax(0, 1fr))`,
        },
      }}
    >
      {children}
    </Box>
  )
}
