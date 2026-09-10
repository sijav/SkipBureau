import { Box, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type SectionProps = {
  title: ReactNode
  /** The line under the heading, at the reading measure. */
  intro?: ReactNode | undefined
  children: ReactNode
  /** Between the heading block and the content: 24 above a tile grid, 20 above a list, 16 in a hub's column. */
  gap?: 16 | 20 | 24 | undefined
  /** Above and below: 56 on a full-width page, 48 in a hub's column. */
  block?: 48 | 56 | undefined
}

/** A page section of the design: 56 above and below, an H2 and its intro, then the content. Figma 60:648. */
export const Section = ({ title, intro, children, gap = 24, block = 56 }: SectionProps) => {
  const { tokens, layout } = useTheme()

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, paddingBlock: `${block}px` }}>
      <Stack spacing={0.5}>
        <Typography variant="h3" component="h2">
          {title}
        </Typography>
        {intro && (
          // On a full-width page the intro keeps the reading measure; a hub's
          // column is already narrower, and there it runs the column's width.
          <Typography variant="body1" sx={{ color: tokens.textSecondary, maxWidth: block === 56 ? layout.readingWidth : 'none' }}>
            {intro}
          </Typography>
        )}
      </Stack>
      {children}
    </Box>
  )
}
