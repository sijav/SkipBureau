import { Trans } from '@lingui/react/macro'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Page } from 'src/shared/page'
import { Reading } from 'src/shared/reading'

export type UnreachableProps = {
  /**
   * How to try again. Required, because a screen that says "trying again
   * usually works" and has no way to try again is worse than one that does not
   * offer.
   */
  onRetry: () => void
}

/**
 * We could not reach our own API. Distinct from Not Found on purpose: one is
 * our fault and worth retrying, the other is a place we do not cover. Telling
 * a reader the second when the first happened sends them away for good.
 *
 * The retry is the caller's to supply. This used to reload the document, which
 * throws away the whole app to ask one question again; `CountryRoute` now
 * re-executes the query in place, which is both better and, unlike a reload,
 * something a story can click.
 */
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
        <Button variant="contained" onClick={onRetry}>
          <Trans>Try again</Trans>
        </Button>
      </Stack>
    </Reading>
  </Page>
)
