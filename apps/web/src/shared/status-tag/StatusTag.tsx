import { Box, Typography, useTheme } from '@mui/material'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { TAG_PAINT, markStyle, tagStyle, type TagStatus } from 'src/core/theme'

export type StatusTagProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'color'> & {
  status: TagStatus
  children: ReactNode
  showMark?: boolean
}

export const StatusTag = ({ status, children, showMark = true, ...rest }: StatusTagProps) => {
  const { tokens } = useTheme()
  const paint = TAG_PAINT[status]

  return (
    <Box component="span" {...rest} sx={tagStyle(tokens, paint)}>
      {/* Decoration: the label carries the status, so colour is never the only signal. */}
      {showMark && <Box component="span" aria-hidden sx={markStyle(tokens, paint)} />}
      <Typography component="span" variant="overline">
        {children}
      </Typography>
    </Box>
  )
}
