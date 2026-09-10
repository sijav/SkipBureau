import { Trans } from '@lingui/react/macro'
import { Box, Button, Typography, useTheme } from '@mui/material'
import { radius, spacing } from 'src/core/theme'

const STROKE = 1

/**
 * Figma 81:577, guided setup offered beside the areas as a peer, not a funnel
 * in front of them. Guided setup itself is not built, so its button leads
 * nowhere yet.
 */
export const GuidedSetup = () => {
  const { tokens } = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${spacing.lg}px`,
        padding: `${spacing.lg - STROKE}px`,
        border: `${STROKE}px solid ${tokens.borderStrong}`,
        borderRadius: `${radius.sm}px`,
        backgroundColor: tokens.surface,
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 0 0', minWidth: 0 }}>
        <Typography variant="h4" component="h2">
          <Trans>Not sure where to start?</Trans>
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
          <Trans>Answer a few questions and we’ll build a roadmap for your situation.</Trans>
        </Typography>
        <Typography variant="overline" sx={{ color: tokens.accentText }}>
          <Trans>How it works</Trans>
        </Typography>
      </Box>
      <Button variant="primary" sx={{ flexShrink: 0 }}>
        <Trans>Start guided setup</Trans>
      </Button>
    </Box>
  )
}
