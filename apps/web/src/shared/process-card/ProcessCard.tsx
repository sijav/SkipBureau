import { Trans } from '@lingui/react/macro'
import { Box, ButtonBase, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PROGRESS_PAINT, PROGRESS_SIZE, cardFrame, cardInteraction, segments } from 'src/core/theme'

export type ProcessProgress = {
  /** Steps finished. */
  completed: number
  total: number
  /** What to do next, which replaces the pitch once the process is under way. */
  next: ReactNode
}

export type ProcessCardProps = {
  to: string
  title: ReactNode
  facts: ReactNode
  pitch?: ReactNode | undefined
  progress?: ProcessProgress | undefined
}

// The card's own track: the progress indicator's segments, drawn at 6.
const TRACK = 6

export const ProcessCard = ({ to, title, facts, pitch, progress }: ProcessCardProps) => {
  const { tokens } = useTheme()
  const next = progress?.next

  return (
    <ButtonBase
      component={Link}
      to={to}
      disableRipple
      sx={{
        ...cardFrame(tokens, progress ? 'accent' : 'border'),
        ...cardInteraction(tokens),
        // Under way, the accent border stays under the pointer rather than dimming.
        ...(progress ? { '@media (hover: hover)': { '&:hover': { borderColor: tokens.accent } } } : {}),
      }}
    >
      <Typography component="span" variant="caption" sx={{ color: tokens.accentText }}>
        {progress ? <Trans>In progress</Trans> : <Trans>Guided process</Trans>}
      </Typography>
      <Typography component="span" variant="h4">
        {title}
      </Typography>
      <Typography component="span" variant="monoData" sx={{ color: tokens.textSecondary }}>
        {facts}
      </Typography>
      {progress ? (
        <>
          <Box component="span" aria-hidden sx={{ display: 'flex', gap: `${PROGRESS_SIZE.stepsGap}px`, height: `${TRACK}px` }}>
            {segments(progress.completed, progress.total).map((state, index) => (
              <Box
                key={index}
                component="span"
                sx={{
                  flex: '1 0 0',
                  minWidth: 0,
                  borderRadius: `${PROGRESS_SIZE.radius}px`,
                  backgroundColor: tokens[PROGRESS_PAINT[state]],
                }}
              />
            ))}
          </Box>
          <Typography component="span" variant="body2">
            <Trans>Next: {next}</Trans>
          </Typography>
        </>
      ) : (
        pitch && (
          <Typography component="span" variant="body2" sx={{ color: tokens.textSecondary }}>
            {pitch}
          </Typography>
        )
      )}
    </ButtonBase>
  )
}
