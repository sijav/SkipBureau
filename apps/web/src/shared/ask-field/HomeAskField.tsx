import { Trans } from '@lingui/react/macro'
import { Box, Button, InputBase, useTheme } from '@mui/material'
import { askStyle } from 'src/core/theme'
import type { AskBindings } from 'src/shared/ask-panel'
import { AskGlyph } from './AskGlyph'

export type HomeAskFieldProps = {
  label: string
  placeholder?: string | undefined
  value: string
  onChange: (value: string) => void
  onAsk?: ((question: string) => void) | undefined
  bindings?: AskBindings | undefined
}

export const HomeAskField = ({ label, placeholder, value, onChange, onAsk, bindings }: HomeAskFieldProps) => {
  const theme = useTheme()

  return (
    // A question box, not site search, per the design; so no search role.
    <Box
      component="form"
      aria-label={label}
      ref={bindings?.anchorRef}
      onSubmit={(event) => {
        event.preventDefault()
        bindings?.onAsk(value)
        onAsk?.(value)
      }}
    >
      <InputBase
        {...bindings?.events}
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        sx={askStyle(theme.tokens, theme.typography.subtitle1)}
        slotProps={{ input: { 'aria-label': label, enterKeyHint: 'send', ...bindings?.input } }}
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
