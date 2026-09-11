import { useLingui } from '@lingui/react/macro'
import { Box, Divider, Paper, Popper, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { radius, spacing, withOpacity } from 'src/core/theme'

export type AskPanelGroup = {
  label: ReactNode
  rows: ReactNode
}

export type AskPanelProps = {
  anchor: HTMLElement | null
  open: boolean
  id: string
  groups: readonly AskPanelGroup[]
  footer?: ReactNode | undefined
}

const STROKE = 1

export const AskPanel = ({ anchor, open, id, groups, footer }: AskPanelProps) => {
  const { tokens } = useTheme()
  const { t } = useLingui()

  return (
    <Popper
      open={open && Boolean(anchor)}
      anchorEl={anchor}
      placement="bottom-start"
      modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
      sx={{ zIndex: 'modal', width: anchor ? `max(640px, ${anchor.getBoundingClientRect().width}px)` : '640px', maxWidth: 'calc(100vw - 32px)' }}
    >
      <Paper
        id={id}
        role="dialog"
        aria-label={t`What Ask found`}
        sx={{
          paddingBlock: `${spacing.sm - STROKE}px`,
          border: `${STROKE}px solid ${tokens.border}`,
          borderRadius: `${radius.sm}px`,
          backgroundColor: tokens.surface,
          backgroundImage: 'none',
          filter: `drop-shadow(0 8px 12px ${withOpacity(tokens.textPrimary, 0.07)}) drop-shadow(0 1px 1px ${withOpacity(tokens.textPrimary, 0.05)})`,
        }}
      >
        {groups.map((group, index) => (
          <Box key={index}>
            {index > 0 && <Divider />}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: `${spacing.sm}px` }}>
              <Typography variant="caption" sx={{ paddingInlineStart: `${spacing.md}px`, paddingBottom: '6px', color: tokens.textSecondary }}>
                {group.label}
              </Typography>
              {group.rows}
            </Box>
          </Box>
        ))}
        {footer && (
          <>
            <Divider />
            <Typography variant="body2" sx={{ padding: `10px ${spacing.lg}px 6px`, color: tokens.textSecondary }}>
              {footer}
            </Typography>
          </>
        )}
      </Paper>
    </Popper>
  )
}

