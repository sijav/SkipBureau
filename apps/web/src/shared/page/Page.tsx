import { Box, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type PageProps = {
  children: ReactNode
  /** The cap to use. `content` is the 1280 column; `main` is the 1080 one. */
  width?: 'content' | 'main'
}

/**
 * The content column. Every screen sits in one.
 *
 * The design's 1280 inset 80 is a CAP, not a size: below 1440 the column keeps
 * shrinking and the inset steps down with it, so nothing needs a horizontal
 * scrollbar. See DESIGN.md on why a design width is never a fixed width.
 */
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
