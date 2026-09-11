import { Box, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type ReadingProps = {
  children: ReactNode
}

export const Reading = ({ children }: ReadingProps) => {
  const { layout } = useTheme()

  return <Box sx={{ maxWidth: layout.readingWidth, width: '100%' }}>{children}</Box>
}
