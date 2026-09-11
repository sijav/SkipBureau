import { Plural, Trans } from '@lingui/react/macro'
import { Box, ButtonBase, Stack, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDay, useLocale } from 'src/core/i18n'
import { DEADLINE_PAINT, frameGiveBack, frameStyle, rowInteraction, type DeadlineState } from 'src/core/theme'
import { RowMark } from 'src/shared/row-mark'

export type DeadlineItemProps = {
  state: DeadlineState
  title: ReactNode
  /** The date it falls on, as the API sends one: "2026-10-15". */
  date: string
  /** Days left, or days late when overdue. Unused on the day and once done. */
  days?: number | undefined
  /** Where it leads, where it leads anywhere. */
  to?: string | undefined
}

const PAD = 16

/**
 * Figma 28:46, 380x66. Urgency escalates in three steps, not six: neutral
 * until Due soon, amber through Today, red only once overdue, and the day
 * count does the fine-grained work so colour does not have to.
 */
export const DeadlineItem = ({ state, title, date, days = 0, to }: DeadlineItemProps) => {
  const { tokens } = useTheme()
  const { locale } = useLocale()
  const paint = DEADLINE_PAINT[state]
  const giveBack = frameGiveBack(paint)

  const remaining = {
    normal: <Plural value={days} one="# day" other="# days" />,
    upcoming: <Plural value={days} one="# day" other="# days" />,
    dueSoon: <Plural value={days} one="# day" other="# days" />,
    today: <Trans>Today</Trans>,
    overdue: <Plural value={days} one="# day late" other="# days late" />,
    completed: <Trans>Done</Trans>,
  }[state]

  const sx = {
    ...frameStyle(tokens, paint),
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    // Physical sides, as the bar is: the RTL cache mirrors both together.
    paddingBlock: `${12 - giveBack.other}px`,
    paddingRight: `${PAD - giveBack.other}px`,
    paddingLeft: `${PAD - giveBack.start}px`,
    textAlign: 'start',
    textDecoration: 'none',
    color: tokens[paint.title],
  }

  const content = (
    <>
      <RowMark mark={paint.mark} size={18} color={tokens[paint.glyph]} />
      <Stack component="span" spacing="2px" sx={{ flex: '1 0 0', minWidth: 0 }}>
        <Typography component="span" variant="button" sx={{ color: tokens[paint.title] }}>
          {title}
        </Typography>
        <Typography component="span" variant="monoData" sx={{ color: tokens[paint.date] }}>
          {formatDay(date, locale)}
        </Typography>
      </Stack>
      <Typography component="span" variant="overline" sx={{ flexShrink: 0, color: tokens[paint.remaining] }}>
        {remaining}
      </Typography>
    </>
  )

  if (!to) {
    return (
      <Box data-state={state} sx={sx}>
        {content}
      </Box>
    )
  }

  return (
    <ButtonBase
      component={Link}
      to={to}
      disableRipple
      data-state={state}
      // A tinted state keeps its ground under the pointer; only a white one tints.
      sx={{ ...sx, ...rowInteraction(tokens, paint.fill === 'surface' ? 'surfaceSubtle' : paint.fill) }}
    >
      {content}
    </ButtonBase>
  )
}
