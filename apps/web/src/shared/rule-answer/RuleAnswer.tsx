import { Trans } from '@lingui/react/macro'
import { Box, Button, Link, Stack, Typography, useTheme } from '@mui/material'
import { useId, type ReactNode } from 'react'
import { InfoPanel } from 'src/shared/info-panel'

/** One fact of a rule, as a line: what it is, what it says, and the page it was read on. */
export type RuleLine = {
  key: string
  label: ReactNode
  value: ReactNode
  source: { url: string; name: ReactNode; checked: ReactNode }
}

/** A rule's note, the agreed prose, in its own language. */
export type RuleNoteLine = { text: string; lang: string }

export type RuleAnswerProps = {
  title: ReactNode
  /**
   * `answered`: the reader's own answer. `general`: the rule for everyone in
   * the country, where a detail the reader has not given can change it.
   * `needsReview`: two rules apply and the reader has to decide. `noRule`: no
   * rule held applies to what the reader has said.
   */
  state: 'answered' | 'general' | 'needsReview' | 'noRule'
  lines: readonly RuleLine[]
  notes: readonly RuleNoteLine[]
  /** The detail that can change a general answer, in words: "Where you live". */
  asks?: ReactNode | undefined
  reason?: ReactNode | undefined
  onAsk?: (() => void) | undefined
}

export const RuleAnswer = ({ title, state, lines, notes, asks, reason, onAsk }: RuleAnswerProps) => {
  const { tokens } = useTheme()
  const heading = useId()

  return (
    <Stack component="section" aria-labelledby={heading} spacing="12px">
      <Stack spacing="4px">
        {state !== 'noRule' && (
          <Typography variant="caption" sx={{ color: state === 'answered' ? tokens.accentText : tokens.textSecondary }}>
            {state === 'answered' ? <Trans>For you</Trans> : <Trans>The rule for everyone</Trans>}
          </Typography>
        )}
        <Typography id={heading} variant="h4" component="h3">
          {title}
        </Typography>
      </Stack>

      {state === 'noRule' && (
        <Typography variant="body1" sx={{ color: tokens.textSecondary }}>
          <Trans>We hold no rule on this for what you have told us.</Trans>
        </Typography>
      )}

      {notes.map((note) => (
        <Typography key={note.text} variant="body1">
          <bdi lang={note.lang}>{note.text}</bdi>
        </Typography>
      ))}

      {lines.length > 0 && (
        <Box component="dl" sx={{ margin: 0, borderTop: `1px solid ${tokens.border}` }}>
          {lines.map((line) => (
            <Stack key={line.key} spacing="2px" sx={{ paddingBlock: '12px', borderBottom: `1px solid ${tokens.border}` }}>
              <Typography component="dt" variant="caption" sx={{ color: tokens.textSecondary }}>
                {line.label}
              </Typography>
              <Typography component="dd" variant="body1" sx={{ margin: 0 }}>
                {line.value}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ margin: 0, color: tokens.textSecondary }}>
                <Trans>
                  Read on{' '}
                  <Link href={line.source.url} target="_blank" rel="noopener noreferrer" sx={{ color: tokens.accentText }}>
                    {line.source.name}
                  </Link>
                  , checked {line.source.checked}
                </Trans>
              </Typography>
            </Stack>
          ))}
        </Box>
      )}

      {state === 'general' && asks && (
        <InfoPanel kind="coverageGap" heading={<Trans>{asks} can change this</Trans>}>
          <Stack spacing="12px" sx={{ alignItems: 'flex-start' }}>
            <span>
              <Trans>This is the rule for everyone. Tell us, and we show the answer for you.</Trans>
            </span>
            {onAsk && (
              <Button variant="secondary" onClick={onAsk}>
                <Trans>Tell us</Trans>
              </Button>
            )}
          </Stack>
        </InfoPanel>
      )}

      {state === 'needsReview' && reason && (
        <InfoPanel kind="warning" heading={<Trans>Two rules could apply to you</Trans>}>
          {reason}
        </InfoPanel>
      )}
    </Stack>
  )
}
