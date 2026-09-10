import { Trans } from '@lingui/react/macro'
import { Box, Typography, useTheme } from '@mui/material'
import { radius, spacing } from 'src/core/theme'

export type InformationDisclaimerProps = {
  /** The country the processes are in, by name, in the reader's language. */
  country: string
}

/**
 * Figma 149:988. Neutral by construction, a recessed surface with no bar and no
 * icon, so it reads as a standing note and not a warning. The design marks its
 * copy as a draft that needs legal review before production.
 */
export const InformationDisclaimer = ({ country }: InformationDisclaimerProps) => {
  const { tokens } = useTheme()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: `${spacing.md}px`, borderRadius: `${radius.xs}px`, backgroundColor: tokens.surfaceSubtle }}>
      <Typography variant="button" component="p">
        <Trans>For general information only</Trans>
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
        <Trans>
          Skipbureau explains everyday processes in {country}. Information can change and should not be treated as legal or professional advice. Check the linked
          official sources before making important decisions.
        </Trans>
      </Typography>
    </Box>
  )
}
