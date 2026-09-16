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
   * `answered`: the reader's own answer. `general`: not answered for the reader
   * yet: the rule for everyone in the country where there is one, and the detail
   * the reader has not given that can change it, or decides a rule with none.
   * `needsReview`: two rules apply and the reader has to decide. `noRule`: no
   * rule held applies to what the reader has said.
   */
  state: 'answered' | 'general' | 'needsReview' | 'noRule'
  lines: readonly RuleLine[]
  notes: readonly RuleNoteLine[]
  /** The detail that can change the rule for everyone, or decides a rule with none, in words: "Where you live". */
  asks?: ReactNode | undefined
  reason?: ReactNode | undefined
  onAsk?: (() => void) | undefined
}

export const RuleAnswer = ({ title, state, lines, notes, asks, reason, onAsk }: RuleAnswerProps) => {
  const { tokens } = useTheme()
  const heading = useId()
  // SB-271: "The rule for everyone" names the lines and notes under it, so a rule with none on screen, one with no
  // version for everyone, is never called that, and its question says the detail decides the answer.
  const showsRule = lines.length > 0 || notes.length > 0

  return (
    <Stack component="section" aria-labelledby={heading} spacing="12px">
      <Stack spacing="4px">
        {(state === 'answered' || (state !== 'noRule' && showsRule)) && (
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
        <InfoPanel
          kind="coverageGap"
          heading={showsRule ? <Trans>{asks} can change this</Trans> : <Trans>{asks} decides the answer</Trans>}
        >
          <Stack spacing="12px" sx={{ alignItems: 'flex-start' }}>
            {/* SB-300: a detail nothing can take yet is said plainly, rather than asking the reader for something
                they have no way to give. The caller says which by giving or withholding onAsk. */}
            <span>
              {onAsk ? (
                showsRule ? (
                  <Trans>This is the rule for everyone. Tell us, and we show the answer for you.</Trans>
                ) : (
                  <Trans>Tell us to show your answer.</Trans>
                )
              ) : showsRule ? (
                <Trans>This is the rule for everyone. We cannot take this detail from you yet.</Trans>
              ) : (
                <Trans>We cannot take this detail from you yet.</Trans>
              )}
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
