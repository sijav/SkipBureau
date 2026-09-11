import { useLingui } from '@lingui/react/macro'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

export type StepRowProps = {
  number: number
  title: ReactNode
  description?: ReactNode | undefined
  note?: ReactNode | undefined
}

export const StepRow = ({ number, title, description, note }: StepRowProps) => {
  const { tokens } = useTheme()
  const { i18n } = useLingui()

  return (
    // 95 high as drawn: the rule sits inside the 20 above, not on top of it.
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        paddingTop: '19px',
        paddingBottom: '20px',
        borderTop: `1px solid ${tokens.border}`,
        listStyle: 'none',
      }}
    >
      <Typography component="span" variant="monoData" aria-hidden sx={{ width: '32px', flexShrink: 0, color: tokens.accentText }}>
        {i18n.number(number, { minimumIntegerDigits: 2 })}
      </Typography>
      <Stack spacing="5px" sx={{ flex: '1 0 0', minWidth: 0 }}>
        <Typography variant="h4" component="h3">
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
            {description}
          </Typography>
        )}
        {note && (
          <Typography variant="body2" sx={{ color: tokens.accentText }}>
            {note}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
