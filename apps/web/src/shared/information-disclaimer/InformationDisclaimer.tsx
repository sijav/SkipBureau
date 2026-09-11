import { Trans } from '@lingui/react/macro'
import { Box, Typography, useTheme } from '@mui/material'
import { radius, spacing } from 'src/core/theme'

export type InformationDisclaimerProps = {
  country: string
}

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
