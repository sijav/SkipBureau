import { Box, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type SectionProps = {
  title: ReactNode
  /** The line under the heading, at the reading measure. */
  intro?: ReactNode | undefined
  children: ReactNode
  /** Between the heading block and the content: 24 above a tile grid, 20 above a list, per the design. */
  gap?: 20 | 24 | undefined
}

/** A page section of the design: 56 above and below, an H2 and its intro, then the content. Figma 60:648. */
export const Section = ({ title, intro, children, gap = 24 }: SectionProps) => {
  const { tokens, layout } = useTheme()

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, paddingBlock: '56px' }}>
      <Stack spacing={0.5}>
        <Typography variant="h3" component="h2">
          {title}
        </Typography>
        {intro && (
          <Typography variant="body1" sx={{ color: tokens.textSecondary, maxWidth: layout.readingWidth }}>
            {intro}
          </Typography>
        )}
      </Stack>
      {children}
    </Box>
  )
}
