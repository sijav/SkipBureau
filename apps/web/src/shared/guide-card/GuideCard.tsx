import { Trans } from '@lingui/react/macro'
import { Box, ButtonBase, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatMonth, useLocale } from 'src/core/i18n'
import { cardFrame, cardInteraction } from 'src/core/theme'

export type GuideCardProps = {
  to: string
  /** The area it belongs to, "Residence and immigration". */
  category: ReactNode
  title: ReactNode
  /** One sentence of what the reader actually gets. */
  description?: ReactNode | undefined
  /** When it was last verified, as the API sends one: "2026-08-24". */
  verifiedAt: string
}

/**
 * Figma 18:14, 360x154. The verified date is part of the card, not a detail on
 * the page behind it: it is the one sign a reader has that this is current.
 */
export const GuideCard = ({ to, category, title, description, verifiedAt }: GuideCardProps) => {
  const { tokens } = useTheme()
  const { locale } = useLocale()
  const verified = formatMonth(verifiedAt, locale)

  return (
    <ButtonBase component={Link} to={to} disableRipple sx={{ ...cardFrame(tokens, 'border'), ...cardInteraction(tokens) }}>
      <Typography component="span" variant="caption" sx={{ color: tokens.accentText }}>
        {category}
      </Typography>
      <Typography component="span" variant="h4">
        {title}
      </Typography>
      {description && (
        <Typography component="span" variant="body2" sx={{ color: tokens.textSecondary }}>
          {description}
        </Typography>
      )}
      {/* Figma's 16px foot, a floor so a longer date line still fits. */}
      <Box component="span" sx={{ display: 'flex', alignItems: 'center', minHeight: '16px' }}>
        <Typography component="span" variant="caption" sx={{ color: tokens.textSecondary }}>
          <Trans>Verified {verified}</Trans>
        </Typography>
      </Box>
    </ButtonBase>
  )
}
