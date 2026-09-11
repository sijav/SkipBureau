import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { Box, ButtonBase, Stack, Typography, useTheme } from '@mui/material'
import { useId, useState, type ReactNode } from 'react'
import { CHECKLIST_PAINT, radius, rowInteraction, type ChecklistState } from 'src/core/theme'
import { RowMark } from 'src/shared/row-mark'

export type ChecklistDetail = { label: ReactNode; value: ReactNode }

export type ChecklistItemProps = {
  state: ChecklistState
  title: ReactNode
  /** The one compact line under the title: "Sworn translation · Notarised · 2 copies". */
  flags?: ReactNode | undefined
  /** Everything else, behind the row: it becomes a disclosure when there is any. */
  details?: readonly ChecklistDetail[] | undefined
}

// The status word, so a state is read as well as seen.
const STATUS = {
  required: msg`Required`,
  completed: msg`Ready`,
  optional: msg`Optional`,
  missing: msg`Missing`,
  expired: msg`Renew`,
  needsVerification: msg`Check date`,
  notApplicable: msg`Not for you`,
} satisfies Record<ChecklistState, unknown>

const RULE = 1
const BOX = 18
const BOX_STROKE = 1.5

/**
 * Figma 27:218. The row stays scannable, a title, one flag line and one status
 * word, and everything else is behind it. The state is carried by the box as
 * well as the colour: dashed for Optional, a bar for Missing, a mark for
 * Expired, dots for Needs verification.
 */
export const ChecklistItem = ({ state, title, flags, details }: ChecklistItemProps) => {
  const { tokens } = useTheme()
  const { i18n } = useLingui()
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  const paint = CHECKLIST_PAINT[state]
  const hasDetails = Boolean(details && details.length > 0)

  // 64 as drawn: 14 around a 36 content block, the rule inside the lower 14
  // while nothing opens under the row.
  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    paddingTop: '14px',
    paddingInline: '16px',
    paddingBottom: `${open ? 14 : 14 - RULE}px`,
    textAlign: 'start',
  }

  const row = (
    <>
      <Box
        component="span"
        sx={{
          position: 'relative',
          flexShrink: 0,
          width: `${BOX}px`,
          height: `${BOX}px`,
          borderRadius: `${radius.xs}px`,
          border: `${BOX_STROKE}px ${paint.dashed ? 'dashed' : 'solid'} ${tokens[paint.box]}`,
          backgroundColor: paint.fill ? tokens[paint.fill] : 'transparent',
        }}
      >
        {/* Figma lays the mark over the box's outer edge, not inside its stroke. */}
        <Box component="span" sx={{ position: 'absolute', top: `-${BOX_STROKE}px`, left: `-${BOX_STROKE}px` }}>
          <RowMark mark={paint.mark} size={BOX} color={tokens[paint.glyph]} />
        </Box>
      </Box>
      <Stack component="span" spacing="2px" sx={{ flex: '1 0 0', minWidth: 0 }}>
        <Typography component="span" variant="button" sx={{ color: tokens[paint.title] }}>
          {title}
        </Typography>
        {flags && (
          <Typography component="span" variant="caption" sx={{ color: tokens[paint.flags] }}>
            {flags}
          </Typography>
        )}
      </Stack>
      <Typography component="span" variant="overline" sx={{ flexShrink: 0, color: tokens[paint.status] }}>
        {i18n._(STATUS[state])}
      </Typography>
    </>
  )

  return (
    <Box data-state={state} sx={{ borderBottom: `${RULE}px solid ${tokens.border}`, backgroundColor: tokens.surface }}>
      {hasDetails ? (
        <ButtonBase
          disableRipple
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen(!open)}
          sx={{ ...rowStyle, ...rowInteraction(tokens, 'surfaceSubtle') }}
        >
          {row}
        </ButtonBase>
      ) : (
        <Box sx={rowStyle}>{row}</Box>
      )}
      {hasDetails && open && (
        // Under the title, not the box: 16 + 18 + 12 in from the edge.
        <Box
          component="dl"
          id={detailsId}
          sx={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: 0, padding: `0 16px ${16 - RULE}px 46px` }}
        >
          {details?.map((detail, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Typography component="dt" variant="caption" sx={{ width: '140px', flexShrink: 0, color: tokens.textSecondary }}>
                {detail.label}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ flex: '1 0 0', minWidth: 0, margin: 0, color: tokens.textPrimary }}>
                {detail.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
