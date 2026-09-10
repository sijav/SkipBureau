import { Trans } from '@lingui/react/macro'
import { Box, Button, InputBase, useTheme } from '@mui/material'
import { askStyle } from 'src/core/theme'
import { AskGlyph } from './AskGlyph'

export type HomeAskFieldProps = {
  /** Required: the design shows no label, so this names the box for screen readers. */
  label: string
  placeholder?: string | undefined
  value: string
  onChange: (value: string) => void
  onAsk: (question: string) => void
}

export const HomeAskField = ({ label, placeholder, value, onChange, onAsk }: HomeAskFieldProps) => {
  const theme = useTheme()

  return (
    // A question box, not site search, per the design; so no search role.
    <Box
      component="form"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault()
        onAsk(value)
      }}
    >
      <InputBase
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        sx={askStyle(theme.tokens, theme.typography.subtitle1)}
        slotProps={{ input: { 'aria-label': label, enterKeyHint: 'send' } }}
        startAdornment={<AskGlyph className="ask-glyph" aria-hidden sx={{ width: '20px', height: '20px', flexShrink: 0 }} />}
        endAdornment={
          <Button type="submit" variant="primary" sx={{ flexShrink: 0 }}>
            <Trans>Ask</Trans>
          </Button>
        }
      />
    </Box>
  )
}
