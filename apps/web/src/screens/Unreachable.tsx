import { Trans } from '@lingui/react/macro'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Page } from 'src/shared/page'
import { Reading } from 'src/shared/reading'

/**
 * We could not reach our own API. Distinct from Not Found on purpose: one is
 * our fault and worth retrying, the other is a place we do not cover. Telling
 * a reader the second when the first happened sends them away for good.
 */
export const Unreachable = () => (
  <Page>
    <Reading>
      <Stack spacing={2} sx={{ py: 4, alignItems: 'flex-start' }}>
        <Typography variant="h4" component="h1">
          <Trans>SkipBureau could not load this</Trans>
        </Typography>
        <Typography>
          <Trans>
            Something on our side did not answer. The page exists, we just could not reach it. Trying again usually
            works.
          </Trans>
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          <Trans>Try again</Trans>
        </Button>
      </Stack>
    </Reading>
  </Page>
)
