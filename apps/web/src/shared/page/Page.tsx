import { Box, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type PageProps = {
  children: ReactNode
  width?: 'content' | 'main'
}

export const Page = ({ children, width = 'content' }: PageProps) => {
  const { layout } = useTheme()

  return (
    // The cap is the CONTENT's, as the design measures it: 1280 of content in
    // a 1440 frame inset 80. So the inset is outside the capped box, not
    // inside it, where border-box took it out of the 1280 and left 1120.
    <Box sx={{ px: { xs: 2, sm: 3, lg: `${layout.contentInset}px` } }}>
      <Box sx={{ maxWidth: width === 'content' ? layout.contentWidth : layout.mainWidth, mx: 'auto' }}>{children}</Box>
    </Box>
  )
}
