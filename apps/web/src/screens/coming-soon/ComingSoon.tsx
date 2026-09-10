import { Trans } from '@lingui/react/macro'
import { Box, Button, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Page } from 'src/shared/page'

export type ComingSoonProps = {
  /** What will be here, "Guided setup". */
  title: ReactNode
  /** What it will do, in a sentence or two. */
  children?: ReactNode
  /** Where the reader goes instead, and what that is called. */
  back: { to: string; label: ReactNode }
}

/**
 * Where everything not built yet leads, the owner's instruction of 2026-09-10:
 * a page that says what will be here, not a button that does nothing or a
 * link that quietly goes Home.
 */
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
