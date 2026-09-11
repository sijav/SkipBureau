import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { Box, ButtonBase, Stack, SvgIcon, Typography, useTheme, type SvgIconProps } from '@mui/material'
import { useId, useState, type ReactNode } from 'react'
import { ROADMAP_PAINT, frameGiveBack, frameStyle, rowInteraction, type RoadmapStatus } from 'src/core/theme'
import { RowMark } from 'src/shared/row-mark'

export type RoadmapStepProps = {
  /** Its place in the process, printed in two digits. */
  number: number
  status: RoadmapStatus
  title: ReactNode
  /** The line under the title: "About 2 days · ₺1,400 · notary". An upcoming step has none. */
  meta?: ReactNode | undefined
  /** What opens under the step. Without it the step does not expand. */
  children?: ReactNode | undefined
  defaultExpanded?: boolean | undefined
}

// The status word, so no state rests on colour alone.
const STATUS = {
  completed: msg`Completed`,
  current: msg`Next action`,
  upcoming: msg`Upcoming`,
  waiting: msg`Waiting on institution`,
  blocked: msg`Blocked`,
  needsInput: msg`Needs your answer`,
} satisfies Record<RoadmapStatus, unknown>

/** Figma 32:437's expand control, a 20px triangle, down while closed and up while open. */
const Expand = ({ open, ...props }: SvgIconProps & { open: boolean }) => (
  <SvgIcon viewBox="0 0 20 20" {...props}>
    <path d={open ? 'M10 7L14.3301 11.5H5.66987L10 7Z' : 'M10 13L5.66987 8.5H14.3301L10 13Z'} />
  </SvgIcon>
)

const PAD = 16
// The body starts under the title: 16, a 24 number column, 16, and 8 more.
const BODY_START = 64

/**
 * Figma 32:437, the spine of every process, 720 wide, 73 collapsed and 56 for
 * an upcoming step with no meta line. Current is the only filled ground, so it
 * is found at a glance while upcoming steps keep full-strength titles.
 */
export const RoadmapStep = ({ number, status, title, meta, children, defaultExpanded = false }: RoadmapStepProps) => {
  const { tokens } = useTheme()
  const { i18n } = useLingui()
  const [open, setOpen] = useState(defaultExpanded)
  const bodyId = useId()
  const paint = ROADMAP_PAINT[status]
  const giveBack = frameGiveBack(paint)
  const expands = Boolean(children)

  const row = (
    <>
      <Typography component="span" variant="monoData" sx={{ width: '24px', flexShrink: 0, color: tokens[paint.number] }}>
        {i18n.number(number, { minimumIntegerDigits: 2 })}
      </Typography>
      <RowMark mark={paint.mark} size={20} color={tokens[paint.glyph]} />
      <Stack component="span" spacing="3px" sx={{ flex: '1 0 0', minWidth: 0 }}>
        <Typography component="span" variant="h4" sx={{ color: tokens[paint.title] }}>
          {title}
        </Typography>
        {meta && (
          <Typography component="span" variant="caption" sx={{ color: tokens.textSecondary }}>
            {meta}
          </Typography>
        )}
      </Stack>
      <Typography component="span" variant="overline" sx={{ flexShrink: 0, color: tokens[paint.status] }}>
        {i18n._(STATUS[status])}
      </Typography>
      {expands && <Expand open={open} aria-hidden sx={{ width: '20px', height: '20px', flexShrink: 0, color: tokens.textTertiary }} />}
    </>
  )

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    // The frame's stroke is inside the 16 on every side, and the bar inside
    // the start; physical sides, as the bar is, so the RTL cache mirrors both.
    paddingTop: `${PAD - giveBack.other}px`,
    paddingRight: `${PAD - giveBack.other}px`,
    paddingBottom: `${open ? PAD : PAD - giveBack.other}px`,
    paddingLeft: `${PAD - giveBack.start}px`,
    textAlign: 'start',
  }

  return (
    <Box data-status={status} sx={{ ...frameStyle(tokens, paint), width: '100%' }}>
      {/* A heading that is a disclosure: the title stays in the page's outline. */}
      <Box component="h3" sx={{ margin: 0, font: 'inherit' }}>
        {expands ? (
          <ButtonBase
            disableRipple
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(!open)}
            sx={{ ...rowStyle, ...rowInteraction(tokens, paint.hover) }}
          >
            {row}
          </ButtonBase>
        ) : (
          <Box component="span" sx={rowStyle}>
            {row}
          </Box>
        )}
      </Box>
      {expands && open && (
        <Box
          id={bodyId}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: `0 ${PAD - giveBack.other}px ${24 - giveBack.other}px ${BODY_START - giveBack.start}px`,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  )
}
