import { Trans } from '@lingui/react/macro'
import { Box, ButtonBase, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TILE_PAINT, tileStyle } from 'src/core/theme'
import { ArrowIcon } from './ArrowIcon'

export type TaskTileProps = {
  title: ReactNode
  description: ReactNode
  to: string
  comingSoon?: boolean | undefined
}

export const TaskTile = ({ title, description, to, comingSoon = false }: TaskTileProps) => {
  const { tokens } = useTheme()

  const content = (
    <Stack spacing={0.5} sx={{ flex: '1 0 0', minWidth: 0 }}>
      {comingSoon && (
        <Typography component="span" variant="monoData" sx={{ fontSize: '12px', lineHeight: '16px' }}>
          <Trans>Coming soon</Trans>
        </Typography>
      )}
      <Typography component="span" variant="button" sx={{ display: 'block' }}>
        {title}
      </Typography>
      <Typography component="span" variant="body2" sx={{ color: tokens[TILE_PAINT.description] }}>
        {description}
      </Typography>
    </Stack>
  )

  if (comingSoon) return <Box sx={tileStyle(tokens, true)}>{content}</Box>

  return (
    <ButtonBase component={Link} to={to} disableRipple sx={tileStyle(tokens, false)}>
      {content}
      <ArrowIcon
        className="tile-arrow"
        aria-hidden
        // A directional arrow points the way the page reads.
        sx={{ width: '16px', height: '16px', flexShrink: 0, color: tokens[TILE_PAINT.arrow], '[dir="rtl"] &': { transform: 'scaleX(-1)' } }}
      />
    </ButtonBase>
  )
}
