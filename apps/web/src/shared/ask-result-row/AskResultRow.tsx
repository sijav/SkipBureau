import { Trans } from '@lingui/react/macro'
import { Box, ButtonBase, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { RESULT_PAINT, resultRowStyle, type ResultKind } from 'src/core/theme'

export type AskResultRowProps = {
  kind: ResultKind
  title: ReactNode
  /** The second line. A recent search has none. */
  detail?: ReactNode | undefined
  /** Where choosing the row goes. Without one the row is text, not a control. */
  to?: string | undefined
  'data-testid'?: string | undefined
}

const KindLabel = ({ kind }: { kind: ResultKind }) => {
  switch (kind) {
    case 'task':
      return <Trans>Task</Trans>
    case 'guide':
      return <Trans>Guide</Trans>
    case 'quickAnswer':
      return <Trans>Quick answer</Trans>
    case 'recent':
      return <Trans>Recent</Trans>
  }
}

export const AskResultRow = ({ kind, title, detail, to, 'data-testid': testId }: AskResultRowProps) => {
  const { tokens } = useTheme()

  const content = (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 0 0', minWidth: 0 }}>
        <Typography component="span" variant="button" sx={{ display: 'block' }}>
          {title}
        </Typography>
        {detail && (
          <Typography component="span" variant="body2" sx={{ color: tokens[RESULT_PAINT.detail] }}>
            {detail}
          </Typography>
        )}
      </Box>
      <Typography component="span" variant="caption" className="result-kind" sx={{ flexShrink: 0, whiteSpace: 'nowrap', color: tokens[RESULT_PAINT[kind].kind] }}>
        <KindLabel kind={kind} />
      </Typography>
    </>
  )

  if (!to) {
    return (
      <Box data-testid={testId} sx={resultRowStyle(tokens, kind, false)}>
        {content}
      </Box>
    )
  }

  return (
    <ButtonBase component={Link} to={to} disableRipple data-testid={testId} sx={resultRowStyle(tokens, kind, true)}>
      {content}
    </ButtonBase>
  )
}
