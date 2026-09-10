import { Trans, useLingui } from '@lingui/react/macro'
import { Box, Typography, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { formatDay, formatMonth, useLocale } from 'src/core/i18n'
import { SOURCE_PAINT, SOURCE_TEXT, sourceCardStyle, type SourceState } from 'src/core/theme'
import { CheckGlyph, DashGlyph, DotsGlyph, ForwardGlyph, RingGlyph } from './glyphs'

export type SourceCardProps = {
  state: SourceState
  /** Who stands behind it, "Republic of Türkiye". */
  publisher?: ReactNode | undefined
  /** The institution, "Ministry of Trade · Trade Registry". */
  institution: ReactNode
  url: string
  /** When it was last checked, or last reachable when it is unavailable. As the API sends it, "2026-08-24". */
  checkedAt: string
  'data-testid'?: string | undefined
}

const GLYPH = { verified: CheckGlyph, recent: CheckGlyph, older: RingGlyph, unavailable: DashGlyph, pending: DotsGlyph } satisfies Record<SourceState, unknown>

/** Figma 30:84: who published it, when we last checked, whether it is verified, in that order. */
export const SourceCard = ({ state, publisher, institution, url, checkedAt, 'data-testid': testId }: SourceCardProps) => {
  const { tokens } = useTheme()
  const { t } = useLingui()
  const { locale } = useLocale()
  const paint = SOURCE_PAINT[state]
  const Glyph = GLYPH[state]
  const day = formatDay(checkedAt, locale)
  const month = formatMonth(checkedAt, locale)

  const status = {
    verified: t`Verified against this source`,
    recent: t`Checked this month`,
    older: t`Not re-checked since ${month}`,
    unavailable: t`Official page did not respond`,
    pending: t`Re-verification in progress`,
  }[state]

  return (
    <Box data-testid={testId} sx={sourceCardStyle(tokens, state)}>
      <Typography variant="caption" className="source-eyebrow" sx={{ color: tokens[paint.signal] }}>
        <Trans>Official source</Trans>
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {publisher && (
          <Typography component="span" variant="button" sx={{ display: 'block', color: tokens[SOURCE_TEXT.publisher] }}>
            {publisher}
          </Typography>
        )}
        <Typography component="span" variant="body2" sx={{ color: tokens[SOURCE_TEXT.institution] }}>
          {institution}
        </Typography>
      </Box>
      <Box sx={{ height: '1px', backgroundColor: tokens[SOURCE_TEXT.rule] }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Glyph aria-hidden sx={{ width: '16px', height: '16px', flexShrink: 0, color: tokens[paint.glyph] }} />
        <Typography component="span" variant="overline" sx={{ flex: '1 0 0', minWidth: 0, color: tokens[paint.signal] }}>
          {status}
        </Typography>
        <Typography component="span" variant="monoData" sx={{ flexShrink: 0, whiteSpace: 'nowrap', color: tokens[SOURCE_TEXT.date] }}>
          {state === 'unavailable' ? <Trans>Last reachable {day}</Trans> : <Trans>Last checked {day}</Trans>}
        </Typography>
      </Box>
      {state === 'unavailable' ? (
        <Typography component="span" variant="overline" sx={{ color: tokens[SOURCE_TEXT.footer] }}>
          <Trans>Official page unavailable</Trans>
        </Typography>
      ) : (
        <Box
          component="a"
          href={url}
          target="_blank"
          rel="noreferrer"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: '6px',
            color: tokens[SOURCE_TEXT.action],
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
            '&:focus-visible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px', borderRadius: '2px' },
          }}
        >
          <Typography component="span" variant="overline">
            <Trans>Visit official source</Trans>
          </Typography>
          <ForwardGlyph aria-hidden sx={{ width: '16px', height: '16px', '[dir="rtl"] &': { transform: 'scaleX(-1)' } }} />
        </Box>
      )}
      <Typography variant="caption" sx={{ color: tokens[SOURCE_TEXT.footer] }}>
        <Trans>The institution’s own wording — not Skipbureau advice</Trans>
      </Typography>
    </Box>
  )
}
