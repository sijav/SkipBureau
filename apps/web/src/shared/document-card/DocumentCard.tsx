import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { Box, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { DOCUMENT_PAINT, cardFrame, type DocumentState } from 'src/core/theme'

export type DocumentCardProps = {
  state: DocumentState
  title: ReactNode
  /** Its name as the form and the office sign write it, "Öğrenci belgesi". */
  localName?: ReactNode | undefined
  /** What it is and where it comes from. */
  description?: ReactNode | undefined
  /** The requirements as words, never icons: "Original · No translation · No apostille". */
  flags?: ReactNode | undefined
  /** The status line where it says more than the state's word: "Missing, blocks step 4". */
  status?: ReactNode | undefined
}

const STATUS = {
  notStarted: msg`Not started`,
  ready: msg`Ready`,
  missing: msg`Missing`,
  expiring: msg`Expiring`,
} satisfies Record<DocumentState, unknown>

/**
 * Figma 18:65, 360x178. The name the reader will see on the form sits under
 * the one they know, and the requirements are text, because a misread icon
 * here costs a trip to an office.
 */
export const DocumentCard = ({ state, title, localName, description, flags, status }: DocumentCardProps) => {
  const { tokens } = useTheme()
  const { i18n } = useLingui()
  const paint = DOCUMENT_PAINT[state]

  return (
    <Box data-state={state} sx={cardFrame(tokens, paint.stroke)}>
      <Typography variant="button" component="p">
        {title}
      </Typography>
      {localName && (
        <Typography variant="monoData" sx={{ color: tokens.textSecondary }}>
          {localName}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
          {description}
        </Typography>
      )}
      {flags && (
        <Typography variant="caption" component="p" sx={{ color: tokens.textSecondary }}>
          {flags}
        </Typography>
      )}
      <Typography variant="overline" component="p" sx={{ color: tokens[paint.status] }}>
        {status ?? i18n._(STATUS[state])}
      </Typography>
    </Box>
  )
}
