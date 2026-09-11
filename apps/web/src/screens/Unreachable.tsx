import { Trans } from '@lingui/react/macro'
import { Button, Stack, Typography } from '@mui/material'
import { Page } from 'src/shared/page'
import { Reading } from 'src/shared/reading'

export type UnreachableProps = {
  onRetry: () => void
}

export const Unreachable = ({ onRetry }: UnreachableProps) => (
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
        <Button variant="primary" onClick={onRetry}>
          <Trans>Try again</Trans>
        </Button>
      </Stack>
    </Reading>
  </Page>
)
