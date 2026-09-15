import { Trans } from '@lingui/react/macro'
import { ButtonBase, Typography, useTheme } from '@mui/material'
import type { MouseEvent, ReactNode, Ref } from 'react'
import { tapHeight } from 'src/core/theme'
import { SmallChevron } from './SmallChevron'

export type ContextControlProps = {
  known?: ReactNode | undefined
  place?: ReactNode | undefined
  missing?: ReactNode | undefined
  open?: boolean | undefined
  onClick?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined
  controls?: string | undefined
  ref?: Ref<HTMLButtonElement> | undefined
}

export const ContextControl = ({ known, place, missing, open = false, onClick, controls, ref }: ContextControlProps) => {
  const { tokens } = useTheme()
  const said = Boolean(known || place)
  // Figma 44:527 and 44:532: what we know, then a second part after a dot,
  // the place in the ink of what is known or what is missing in the quieter one.
  const second = place ?? missing

  return (
    <ButtonBase
      ref={ref}
      disableRipple
      onClick={onClick}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={open ? controls : undefined}
      sx={{
        gap: '5px',
        // Figma's 8 and 7, the stroke inside them.
        padding: '6px 7px',
        // A finger's 44 below md, where there is no design to match (SB-072).
        ...tapHeight,
        border: `1px ${said || open ? 'solid' : 'dashed'} ${tokens[open ? 'accent' : 'border']}`,
        borderRadius: '2px',
        backgroundColor: tokens[open ? 'accentSubtle' : 'surface'],
        color: tokens[said ? 'textPrimary' : 'textSecondary'],
        '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
      }}
    >
      {said ? (
        <>
          {known && (
            <Typography component="span" variant="overline" sx={{ whiteSpace: 'nowrap' }}>
              {known}
            </Typography>
          )}
          {second && (
            <Typography component="span" variant="overline" sx={{ whiteSpace: 'nowrap', color: tokens[place ? 'textPrimary' : 'textSecondary'] }}>
              {known ? <>· {second}</> : second}
            </Typography>
          )}
        </>
      ) : (
        <Typography component="span" variant="overline" sx={{ whiteSpace: 'nowrap' }}>
          <Trans>Add your details</Trans>
        </Typography>
      )}
      <SmallChevron
        aria-hidden
        sx={{ width: '14px', height: '14px', color: tokens.textSecondary, transform: open ? 'rotate(180deg)' : 'none' }}
      />
    </ButtonBase>
  )
}
