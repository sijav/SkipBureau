import { Box, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type TileGridProps = {
  children: ReactNode
  columns?: 2 | 3 | 4
}

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
