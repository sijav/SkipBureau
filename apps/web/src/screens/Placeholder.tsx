import { Trans } from '@lingui/react/macro'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router-dom'
import { useCountry } from 'src/core/country'
import { useLocale } from 'src/core/i18n'

export type PlaceholderProps = {
  /** Which screen will eventually live here. An identifier, not a label. */
  route: string
}

/**
 * Stands in for a screen that has not been built.
 *
 * One component rather than five throwaway files, deleted when the last real
 * screen lands. It prints what the URL resolved to, which is the thing SB-033
 * is actually proving.
 */
export const Placeholder = ({ route }: PlaceholderProps) => {
  const { locale } = useLocale()
  const { country } = useCountry()
  const params = useParams()

  // Keys come from the object, not from string literals: these are debug
  // identifiers on a page that says it is not built, not prose to translate.
  //
  // Params go FIRST. The route has its own `:locale` and `:country`, which are
  // the short URL forms, and spreading them last replaced the resolved lingui
  // tag with `en`. The values that won have to be the ones the app resolved.
  const resolved = Object.entries({ ...params, route, locale, country })

  return (
    <Box component="main" sx={{ p: 4 }}>
      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <Typography variant="h4" component="h1">
          <Trans>Not built yet</Trans>
        </Typography>
        <Typography>
          <Trans>The address resolved, which is what this page is here to show.</Trans>
        </Typography>
        <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 1, m: 0 }}>
          {resolved.map(([name, value]) => (
            <Box key={name} sx={{ display: 'contents' }}>
              <Typography component="dt" variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                {name}
              </Typography>
              <Typography component="dd" variant="body2" data-testid={`resolved-${name}`} sx={{ m: 0, fontFamily: 'monospace' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}
