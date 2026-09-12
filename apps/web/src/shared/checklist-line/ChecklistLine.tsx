import { Box, Typography, useTheme } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { radius, tapHeight } from 'src/core/theme'

export type ChecklistLineProps = {
  label: ReactNode
  defaultChecked?: boolean | undefined
}

export const ChecklistLine = ({ label, defaultChecked = false }: ChecklistLineProps) => {
  const { tokens } = useTheme()
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <Box
      component="label"
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '10px',
        // A finger below md (SB-072). The whole row is the label, so this is
        // what a tap lands on; at 40 it was four pixels short.
        ...tapHeight,
        borderRadius: `${radius.xs}px`,
        backgroundColor: tokens.surface,
        cursor: 'pointer',
        '@media (hover: hover)': { '&:hover': { backgroundColor: tokens.surfaceSubtle, '& .checklist-box': { borderColor: checked ? tokens.accent : tokens.textSecondary } } },
        '&:has(input:focus-visible)': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
      }}
    >
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        sx={{ position: 'absolute', opacity: 0, width: '18px', height: '18px', margin: 0, cursor: 'pointer' }}
      />
      <Box
        className="checklist-box"
        aria-hidden
        sx={{
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          width: '18px',
          height: '18px',
          marginTop: '1px',
          borderRadius: `${radius.xs}px`,
          border: `1.5px solid ${checked ? tokens.accent : tokens.borderStrong}`,
          backgroundColor: checked ? tokens.accent : 'transparent',
        }}
      >
        {checked && (
          <Box component="svg" viewBox="0 0 18 18" sx={{ width: '18px', height: '18px', margin: '-1.5px' }}>
            <path d="M4 9.5L7.5 13L14 5" fill="none" stroke={tokens.textOnAccent} strokeWidth="2" strokeLinecap="round" />
          </Box>
        )}
      </Box>
      <Typography component="span" variant="uiText" sx={{ flex: '1 0 0', minWidth: 0, color: checked ? tokens.textSecondary : tokens.textPrimary }}>
        {label}
      </Typography>
    </Box>
  )
}
