import { Trans } from '@lingui/react/macro'
import { Stack, Typography } from '@mui/material'
import { Page } from 'src/shared/page'
import { Reading } from 'src/shared/reading'

export const NotFound = () => (
  <Page>
    <Reading>
      <Stack spacing={2} sx={{ py: 4 }}>
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
