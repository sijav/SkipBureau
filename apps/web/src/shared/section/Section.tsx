import { Box, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type SectionProps = {
  title: ReactNode
  intro?: ReactNode | undefined
  children: ReactNode
  gap?: 16 | 20 | 24 | undefined
  block?: 48 | 56 | undefined
}

export const Section = ({ title, intro, children, gap = 24, block = 56 }: SectionProps) => {
  const { tokens, layout } = useTheme()

  return (
    <Box
      component="section"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        paddingBlock: `${block}px`,
        // SB-162: a section below the fold is not laid out until it comes
        // near, and keeps a placeholder height until it has been.
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 400px',
      }}
    >
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
