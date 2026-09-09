import { Trans } from '@lingui/react/macro'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/**
 * Minimal on purpose. The real empty and error states are SB-046; this exists
 * so an unknown URL has somewhere to land instead of a blank page.
 */
export const NotFound = () => (
  <Box component="main" sx={{ p: 4 }}>
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <Typography variant="h4" component="h1">
        <Trans>This page does not exist</Trans>
      </Typography>
      <Typography>
        <Trans>
          The address may be mistyped, or it may point at a country or a guide SkipBureau does not cover yet.
        </Trans>
      </Typography>
    </Stack>
  </Box>
)
