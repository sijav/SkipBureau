import { Trans } from '@lingui/react/macro'
import { Box, Button, Typography, useTheme } from '@mui/material'
import { Link } from 'react-router-dom'
import { radius, spacing, tapLink } from 'src/core/theme'

const STROKE = 1

export const GuidedSetup = ({ to }: { to: string }) => {
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 0 0', minWidth: 0, alignItems: 'flex-start' }}>
        <Typography variant="h4" component="h2">
          <Trans>Not sure where to start?</Trans>
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
          <Trans>Answer a few questions and we’ll build a roadmap for your situation.</Trans>
        </Typography>
        <Typography
          component={Link}
          to={to}
          variant="overline"
          sx={{
            // A finger below md (SB-072); a run of text has to become a box
            // before it can have a height.
            ...tapLink,
            color: tokens.accentText,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
            '&:focus-visible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px', borderRadius: '2px' },
          }}
        >
          <Trans>How it works</Trans>
        </Typography>
      </Box>
      <Button component={Link} to={to} variant="primary" sx={{ flexShrink: 0 }}>
        <Trans>Start guided setup</Trans>
      </Button>
    </Box>
  )
}
