import { Trans } from '@lingui/react/macro'
import { Box, Button, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { spacing } from 'src/core/theme'

export type RecommendedStartProps = {
  title: ReactNode
  reason?: ReactNode | undefined
  to: string
}

const BAR = 3

export const RecommendedStart = ({ title, reason, to }: RecommendedStartProps) => {
  const { tokens } = useTheme()

  return (
    <Stack spacing="10px" sx={{ paddingTop: '36px' }}>
      <Typography variant="caption" sx={{ color: tokens.accentText }}>
        <Trans>Recommended starting point</Trans>
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: '32px',
          padding: `${spacing.lg}px`,
          paddingInlineStart: `${spacing.lg - BAR}px`,
          borderInlineStart: `${BAR}px solid ${tokens.accent}`,
          backgroundColor: tokens.accentSubtle,
        }}
      >
        <Stack spacing="6px" sx={{ flex: '1 1 auto', minWidth: 0, maxWidth: '760px' }}>
          <Typography variant="h4" component="h2">
            {title}
          </Typography>
          {reason && (
            <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
              {reason}
            </Typography>
          )}
        </Stack>
        <Box sx={{ flex: '1 0 0', display: { xs: 'none', sm: 'block' } }} />
        <Button component={Link} to={to} variant="primary" sx={{ flexShrink: 0 }}>
          <Trans>Start here</Trans>
        </Button>
      </Box>
    </Stack>
  )
}
