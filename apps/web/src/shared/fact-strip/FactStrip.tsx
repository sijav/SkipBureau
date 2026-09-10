import { Box, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type Fact = { label: ReactNode; value: ReactNode }

export type FactStripProps = {
  facts: readonly Fact[]
}

/**
 * Figma 90:524: cost, time and deadlines. Borderless apart from two hairlines,
 * reference data rather than a dashboard widget; values are text, so a guide
 * with no verified figure can say it varies instead of inventing one.
 */
export const FactStrip = ({ facts }: FactStripProps) => {
  const { tokens } = useTheme()

  return (
    <Box
      component="dl"
      sx={{
        display: 'flex',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        margin: 0,
        borderTop: `1px solid ${tokens.border}`,
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
      {facts.map((fact, index) => (
        <Box
          key={index}
          sx={{
            flex: '1 0 0',
            minWidth: { xs: '100%', sm: 0 },
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            // 95 high as drawn: 16 around the text, the hairlines inside it.
            paddingBlock: '15px',
            // Stacked on a phone, every fact starts at the edge; side by side,
            // the divider sits inside the 20 before the text.
            paddingInlineStart: index === 0 ? 0 : { xs: 0, sm: '19px' },
            paddingInlineEnd: '20px',
            borderInlineStart: index === 0 ? 'none' : { xs: 'none', sm: `1px solid ${tokens.border}` },
          }}
        >
          <Typography component="dt" variant="caption" sx={{ color: tokens.textSecondary }}>
            {fact.label}
          </Typography>
          <Typography component="dd" variant="body2" sx={{ margin: 0, color: tokens.textPrimary }}>
            {fact.value}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
