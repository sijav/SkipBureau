import { Box, ButtonBase, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TOPIC_PAINT, topicStyle } from 'src/core/theme'
import { ArrowIcon } from 'src/shared/task-tile'

export type TopicItemProps = {
  title: ReactNode
  description?: ReactNode | undefined
  kind?: ReactNode | undefined
  to?: string | undefined
  unavailable?: boolean | undefined
}

export const TopicItem = ({ title, description, kind, to, unavailable = false }: TopicItemProps) => {
  const { tokens } = useTheme()

  const content = (
    <Stack spacing={0.5} sx={{ flex: '1 0 0', minWidth: 0 }}>
      {kind && (
        <Typography component="span" variant="caption" sx={{ color: tokens[TOPIC_PAINT.kind] }}>
          {kind}
        </Typography>
      )}
      <Typography component="span" variant="h4" sx={{ display: 'block' }}>
        {title}
      </Typography>
      {description && (
        <Typography component="span" variant="body2" sx={{ color: tokens[TOPIC_PAINT.description] }}>
          {description}
        </Typography>
      )}
    </Stack>
  )

  if (!to) return <Box sx={topicStyle(tokens, unavailable ? 'unavailable' : 'plain')}>{content}</Box>

  return (
    <ButtonBase component={Link} to={to} disableRipple sx={topicStyle(tokens, 'link')}>
      {content}
      <ArrowIcon
        className="topic-arrow"
        aria-hidden
        sx={{ width: '16px', height: '16px', flexShrink: 0, color: tokens[TOPIC_PAINT.arrow], '[dir="rtl"] &': { transform: 'scaleX(-1)' } }}
      />
    </ButtonBase>
  )
}
