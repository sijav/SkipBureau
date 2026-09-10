import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { Box, Typography, useTheme } from '@mui/material'
import { useId, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react'
import { PANEL_PAINT, panelStyle, type PanelKind } from 'src/core/theme'

// The register's name, fixed per kind rather than passed in, so no caller can
// relabel one register as another.
const EYEBROW = {
  officialInformation: msg`Official information`,
  practicalAdvice: msg`Practical advice`,
  warning: msg`Warning`,
  scamWarning: msg`Scam risk`,
  legalUncertainty: msg`This depends on your situation`,
  coverageGap: msg`Not yet verified`,
} satisfies Record<PanelKind, unknown>

// The design: Official information carries a named source, and Practical advice
// always says where it came from. So for those two the line is not optional.
type Sourced = { kind: 'officialInformation' | 'practicalAdvice'; meta: ReactElement | string }
type Unsourced = { kind: Exclude<PanelKind, Sourced['kind']>; meta?: ReactNode }

export type InfoPanelProps = Omit<ComponentPropsWithoutRef<'aside'>, 'children' | 'color' | 'role'> &
  (Sourced | Unsourced) & {
    children: ReactNode
  }

export const InfoPanel = ({ kind, meta, children, ...rest }: InfoPanelProps) => {
  const { tokens } = useTheme()
  const { t } = useLingui()
  const eyebrow = useId()
  const paint = PANEL_PAINT[kind]

  return (
    // role="note", not "alert": the panels are part of the page, and an alert
    // is announced the moment it renders.
    <Box {...rest} role="note" aria-labelledby={eyebrow} sx={panelStyle(tokens, paint)}>
      <Typography id={eyebrow} variant="caption" sx={{ color: tokens[paint.eyebrow] }}>
        {t(EYEBROW[kind])}
      </Typography>
      <Typography variant="body2">{children}</Typography>
      {meta && (
        <Typography variant="monoData" sx={{ color: tokens[paint.meta] }}>
          {meta}
        </Typography>
      )}
    </Box>
  )
}
