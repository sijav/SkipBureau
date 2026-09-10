import { Box, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type ReadingProps = {
  children: ReactNode
}

/**
 * The 720 reading measure, the one width the design gives a reason for.
 *
 * A cap like every other width here: on a phone the prose fills what there is.
 */
export const Reading = ({ children }: ReadingProps) => {
  const { layout } = useTheme()

  return <Box sx={{ maxWidth: layout.readingWidth, width: '100%' }}>{children}</Box>
}
