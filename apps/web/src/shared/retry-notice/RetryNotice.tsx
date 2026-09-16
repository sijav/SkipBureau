import { Trans } from '@lingui/react/macro'
import { Box, Button, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { radius, spacing } from 'src/core/theme'

export type RetryNoticeProps = {
  children: ReactNode
  onRetry: () => void
}

export const RetryNotice = ({ children, onRetry }: RetryNoticeProps) => {
  const { tokens } = useTheme()

  return (
    // role="status", where InfoPanel is deliberately a note: a panel stands on the page from the first
    // paint, but this arrives when a request fails, so a reader whose attention is elsewhere is told,
    // politely, without the interruption an alert makes.
    <Box
      role="status"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: `${spacing.sm}px`,
        padding: `${spacing.md}px`,
        borderRadius: `${radius.xs}px`,
        backgroundColor: tokens.surfaceSubtle,
      }}
    >
      <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
        {children}
      </Typography>
      <Button variant="secondary" onClick={onRetry}>
        <Trans>Try again</Trans>
      </Button>
    </Box>
  )
}
