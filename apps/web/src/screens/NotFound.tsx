import { Trans } from '@lingui/react/macro'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Page } from 'src/shared/page'
import { Reading } from 'src/shared/reading'

/**
 * Minimal on purpose. The real empty and error states are SB-046; this exists
 * so an unknown URL has somewhere to land instead of a blank page.
 */
export const NotFound = () => (
  <Page>
    <Reading>
      <Stack spacing={2} sx={{ py: 4 }}>
        <Typography>A deliberate bare literal, to prove CI fails</Typography>
        <Typography variant="h4" component="h1">
          <Trans>This page does not exist</Trans>
        </Typography>
        <Typography>
          <Trans>
            The address may be mistyped, or it may point at a country or a guide SkipBureau does not cover yet.
          </Trans>
        </Typography>
      </Stack>
    </Reading>
  </Page>
)
