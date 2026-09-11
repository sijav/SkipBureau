import { ButtonBase, Stack, SvgIcon, Typography, useTheme, type SvgIconProps } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { rowInteraction } from 'src/core/theme'

export type TaskRowProps = {
  title: ReactNode
  description?: ReactNode | undefined
  to: string
}

/** Figma 58:551's chevron, geometry verbatim: the polygon sits low in its box as drawn. */
const Chevron = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 16.5 16.6651" {...props}>
    <path d="M6 14.5L0 16.6651V12.3349L6 14.5Z" />
  </SvgIcon>
)

const RULE = 1

export const TaskRow = ({ title, description, to }: TaskRowProps) => {
  const { tokens } = useTheme()

  return (
    <ButtonBase
      component={Link}
      to={to}
      disableRipple
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        padding: `13px 16px ${13 - RULE}px`,
        borderBottom: `${RULE}px solid ${tokens.border}`,
        backgroundColor: tokens.surface,
        color: tokens.textPrimary,
        textAlign: 'start',
        textDecoration: 'none',
        // The chevron takes the accent on hover, as drawn.
        ...rowInteraction(tokens, 'surfaceSubtle', { '& .task-row-chevron': { color: tokens.accentText } }),
      }}
    >
      <Stack spacing="2px" sx={{ flex: '1 0 0', minWidth: 0 }}>
        <Typography component="span" variant="button">
          {title}
        </Typography>
        {description && (
          <Typography component="span" variant="body2" sx={{ color: tokens.textSecondary }}>
            {description}
          </Typography>
        )}
      </Stack>
      <Chevron
        className="task-row-chevron"
        aria-hidden
        sx={{ width: '16px', height: '16px', flexShrink: 0, color: tokens.textSecondary, '[dir="rtl"] &': { transform: 'scaleX(-1)' } }}
      />
    </ButtonBase>
  )
}
