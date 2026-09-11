import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { Box, ButtonBase, Stack, SvgIcon, Typography, useTheme, type SvgIconProps } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type SavedKind = 'guide' | 'process' | 'document'

export type SavedItemProps = {
  kind: SavedKind
  to: string
  title: ReactNode
  context?: ReactNode | undefined
  dated?: ReactNode | undefined
  onRemove: () => void
}

const KIND = { guide: msg`Guide`, process: msg`Process`, document: msg`Document` } satisfies Record<SavedKind, unknown>

/** Figma 28:101's remove mark, 18px, geometry verbatim. */
const Remove = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 18 18" {...props}>
    <path d="M5 5L13 13M13 5L5 13" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </SvgIcon>
)

const RULE = 1

export const SavedItem = ({ kind, to, title, context, dated, onRemove }: SavedItemProps) => {
  const { tokens } = useTheme()
  const { i18n, t } = useLingui()

  return (
    <Box
      data-kind={kind}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        paddingInline: '8px',
        borderBottom: `${RULE}px solid ${tokens.border}`,
        backgroundColor: tokens.surface,
        // The whole row tints under the pointer, both controls with it.
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: tokens.surfaceSubtle, '& .saved-remove': { color: tokens.textSecondary } },
        },
      }}
    >
      <ButtonBase
        component={Link}
        to={to}
        disableRipple
        sx={{
          flex: '1 0 0',
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          paddingTop: '14px',
          paddingBottom: `${14 - RULE}px`,
          textAlign: 'start',
          textDecoration: 'none',
          color: tokens.textPrimary,
          '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
        }}
      >
        <Typography component="span" variant="caption" sx={{ width: '72px', flexShrink: 0, color: tokens.textSecondary }}>
          {i18n._(KIND[kind])}
        </Typography>
        <Stack component="span" spacing="2px" sx={{ flex: '1 0 0', minWidth: 0 }}>
          <Typography component="span" variant="button">
            {title}
          </Typography>
          {context && (
            <Typography component="span" variant="body2" sx={{ color: tokens.textSecondary }}>
              {context}
            </Typography>
          )}
          {dated && (
            <Typography component="span" variant="caption" sx={{ color: tokens.textSecondary }}>
              {dated}
            </Typography>
          )}
        </Stack>
        <Typography component="span" variant="overline" sx={{ flexShrink: 0, color: tokens.accentText }}>
          {kind === 'process' ? i18n._(msg`Continue`) : i18n._(msg`Open`)}
        </Typography>
      </ButtonBase>
      <ButtonBase
        className="saved-remove"
        disableRipple
        aria-label={t`Remove from saved`}
        onClick={onRemove}
        sx={{
          flexShrink: 0,
          borderRadius: '2px',
          color: tokens.textTertiary,
          '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px' },
        }}
      >
        <Remove sx={{ width: '18px', height: '18px' }} />
      </ButtonBase>
    </Box>
  )
}
