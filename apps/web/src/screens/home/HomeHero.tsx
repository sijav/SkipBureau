import { Trans, useLingui } from '@lingui/react/macro'
import { Box, ButtonBase, Typography, useTheme } from '@mui/material'
import type { Ref } from 'react'
import { HomeAskField } from 'src/shared/ask-field'

export type HomeHeroProps = {
  /** The country's name, in the reader's language. */
  name: string
  question: string
  onQuestion: (question: string) => void
  onAsk: (question: string) => void
  /** Questions to try, which fill the field. */
  examples: readonly string[]
  askRef?: Ref<HTMLDivElement> | undefined
}

/** Figma 60:629: the heading, its line, the ask field and questions to try. */
export const HomeHero = ({ name, question, onQuestion, onAsk, examples, askRef }: HomeHeroProps) => {
  const { tokens, layout } = useTheme()
  const { t } = useLingui()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '72px', paddingBottom: '56px' }}>
      <Typography variant="h2" component="h1">
        <Trans>What do you need to do in {name}?</Trans>
      </Typography>
      <Typography variant="subtitle1" sx={{ color: tokens.textSecondary, maxWidth: layout.panelWidth }}>
        <Trans>Clear, step-by-step guidance for living, studying, working and doing business in {name}.</Trans>
      </Typography>
      <Box ref={askRef} sx={{ maxWidth: layout.askWidth }}>
        <HomeAskField
          label={t`Ask Skipbureau`}
          placeholder={t`Ask a question or describe what you’re trying to do…`}
          value={question}
          onChange={onQuestion}
          onAsk={onAsk}
        />
      </Box>
      {examples.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px' }}>
          <Typography variant="caption" sx={{ color: tokens.textSecondary }}>
            <Trans>Try</Trans>
          </Typography>
          {examples.map((example) => (
            <ButtonBase
              key={example}
              disableRipple
              onClick={() => onQuestion(example)}
              sx={{
                // Figma draws the rule inside the 2px under the text, so the
                // example stays 24 tall.
                paddingBottom: '1px',
                borderBottom: `1px solid ${tokens.borderStrong}`,
                color: tokens.textSecondary,
                textAlign: 'start',
                '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px', borderRadius: '2px' },
              }}
            >
              <Typography component="span" variant="body2">
                <bdi>{example}</bdi>
              </Typography>
            </ButtonBase>
          ))}
        </Box>
      )}
    </Box>
  )
}
