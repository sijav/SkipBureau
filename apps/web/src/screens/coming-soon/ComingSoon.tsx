import { Trans } from '@lingui/react/macro'
import { Box, Button, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Page } from 'src/shared/page'

export type ComingSoonProps = {
  title: ReactNode
  children?: ReactNode
  back: { to: string; label: ReactNode }
}

export const ComingSoon = ({ title, children, back }: ComingSoonProps) => {
  const { tokens, layout } = useTheme()

  return (
    <Page>
      <Stack spacing="12px" sx={{ paddingTop: '72px', paddingBottom: '96px', maxWidth: layout.readingWidth, alignItems: 'flex-start' }}>
        <Typography variant="caption" sx={{ color: tokens.accentText }}>
          <Trans>Coming soon</Trans>
        </Typography>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
        {children && (
          <Typography variant="subtitle1" sx={{ color: tokens.textSecondary }}>
            {children}
          </Typography>
        )}
        <Box sx={{ paddingTop: '12px' }}>
          <Button component={Link} to={back.to} variant="secondary">
            {back.label}
          </Button>
        </Box>
      </Stack>
    </Page>
  )
}
