import { ButtonBase, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { CHIP_PAINT, chipStyle } from 'src/core/theme'

export type ContextChipProps = {
  name: ReactNode
  value?: ReactNode
  prompt: ReactNode
  onClick: () => void
  'data-testid'?: string | undefined
}

export const ContextChip = ({ name, value, prompt, onClick, 'data-testid': testId }: ContextChipProps) => {
  const { tokens } = useTheme()
  const set = value !== undefined && value !== null

  return (
    <ButtonBase disableRipple onClick={onClick} data-testid={testId} sx={chipStyle(tokens, set)}>
      <Typography component="span" variant="caption" sx={{ color: tokens[CHIP_PAINT[set ? 'set' : 'unset'].key] }}>
        {name}
      </Typography>
      <Typography component="span" variant="overline">
        {set ? value : prompt}
      </Typography>
    </ButtonBase>
  )
}
