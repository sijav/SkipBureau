import { Trans } from '@lingui/react/macro'
import { Typography, useTheme } from '@mui/material'
import { spacing } from 'src/core/theme'

/** When a search finds nothing, the panel says so rather than closing. */
export const NothingFound = () => {
  const { tokens } = useTheme()
  return (
    <Typography variant="body2" sx={{ paddingInline: `${spacing.md}px`, paddingBlock: '11px', color: tokens.textSecondary }}>
      <Trans>Nothing matches yet. Try other words, or pick a goal on the home page.</Trans>
    </Typography>
  )
}
