import { Trans } from '@lingui/react/macro'
import { ButtonBase, Typography, useTheme } from '@mui/material'
import { SmallChevron } from './SmallChevron'

export type ContextControlProps = {
  onClick?: (() => void) | undefined
}

/**
 * Figma 44:542 in its No context state, the only one there is while the
 * product asks nobody for anything: a dashed neutral invitation, not an amber
 * error. The panel it opens is SB-039.
 */
export const ContextControl = ({ onClick }: ContextControlProps) => {
  const { tokens } = useTheme()

  return (
    <ButtonBase
      disableRipple
      onClick={onClick}
      sx={{
        gap: '5px',
        padding: '6px 7px',
        border: `1px dashed ${tokens.border}`,
        borderRadius: '2px',
        backgroundColor: tokens.surface,
        color: tokens.textSecondary,
        '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
      }}
    >
      <Typography component="span" variant="overline">
        <Trans>Add your details</Trans>
      </Typography>
      <SmallChevron aria-hidden sx={{ width: '14px', height: '14px' }} />
    </ButtonBase>
  )
}
