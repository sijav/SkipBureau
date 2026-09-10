import { plural } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { Box, LinearProgress, Stack, Typography, useTheme } from '@mui/material'
import { useId } from 'react'
import { PROGRESS_PAINT, PROGRESS_SIZE, segments } from 'src/core/theme'

export type ProgressIndicatorProps = {
  completed: number
  total: number
  /** Steps is the default; the design keeps the bar for aggregate dashboards. */
  variant?: 'steps' | 'bar' | undefined
}

export const ProgressIndicator = ({ completed, total, variant = 'steps' }: ProgressIndicatorProps) => {
  const { tokens } = useTheme()
  const { t, i18n } = useLingui()
  const labelId = useId()

  // The count through the locale's own digits: ۳ in Persian, not 3.
  const done = i18n.number(completed)
  const label = t`${done} of ${plural(total, { one: '# step completed', other: '# steps completed' })}`
  const round = `${PROGRESS_SIZE.radius}px`

  return (
    <Stack spacing={1}>
      <Typography id={labelId} variant="monoData" sx={{ color: tokens[PROGRESS_PAINT.label] }}>
        {label}
      </Typography>
      {variant === 'bar' ? (
        <LinearProgress
          variant="determinate"
          value={(completed / total) * 100}
          aria-labelledby={labelId}
          aria-valuetext={label}
          sx={{
            height: `${PROGRESS_SIZE.barHeight}px`,
            borderRadius: round,
            backgroundColor: tokens[PROGRESS_PAINT.remaining],
            '& .MuiLinearProgress-bar': { backgroundColor: tokens[PROGRESS_PAINT.done], borderRadius: round },
          }}
        />
      ) : (
        // A determinate progress bar drawn in pieces, with the count as its
        // value, so assistive technology hears three of nine, not a percentage.
        <Box
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuetext={label}
          sx={{ display: 'flex', gap: `${PROGRESS_SIZE.stepsGap}px`, height: `${PROGRESS_SIZE.stepsHeight}px` }}
        >
          {segments(completed, total).map((state, index) => (
            <Box key={index} sx={{ flex: '1 0 0', minWidth: '1px', borderRadius: round, backgroundColor: tokens[PROGRESS_PAINT[state]] }} />
          ))}
        </Box>
      )}
    </Stack>
  )
}
