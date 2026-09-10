import { Trans, useLingui } from '@lingui/react/macro'
import { Box, InputBase, Typography, useTheme } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useLocale } from 'src/core/i18n'
import { paths } from 'src/core/router'
import { useShell } from 'src/core/shell'
import { ContextControl } from 'src/shared/context-control'
import { HeaderGlyph } from './icons'
import { LanguageControl } from './LanguageControl'

/** Scrolled a little past the top: the header drops 68 to 60 and its rule strengthens, no shadow, no blur. */
const useScrolled = () => {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return scrolled
}

/**
 * Figma 45:637. Three destinations in the design, Explore, Guides and My
 * processes; the last is for accounts, which this product does not have. Ask
 * sits centre whenever the page does not own a large Ask of its own. The
 * profile slot, free without accounts, holds the language control.
 */
export const Header = ({ onAsk }: { onAsk?: (question: string) => void }) => {
  const { tokens, typography } = useTheme()
  const { t } = useLingui()
  const { locale } = useLocale()
  const { pageOwnsAsk, country } = useShell()
  const scrolled = useScrolled()
  const [question, setQuestion] = useState('')

  // Only a country the route confirmed; before one is known, the root decides.
  // No country is hardcoded here.
  const home = country ? paths.home(locale, country) : '/'

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 'appBar',
        display: 'flex',
        alignItems: 'center',
        height: scrolled ? '60px' : '68px',
        paddingInline: { xs: '24px', lg: '80px' },
        backgroundColor: tokens.surface,
        borderBottom: `1px solid ${tokens[scrolled ? 'borderStrong' : 'border']}`,
        transition: 'height 150ms ease',
      }}
    >
      <Box sx={{ display: 'flex', flex: '1 0 0', alignItems: 'center', gap: '32px', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 }}>
          <Box component={Link} to={home} sx={{ display: 'flex', alignItems: 'baseline', gap: '3px', textDecoration: 'none', color: tokens.textPrimary }}>
            <Typography component="span" variant="h4">
              <Trans>Skipbureau</Trans>
            </Typography>
            {/* The mint square is the sole brand mark in the shell. */}
            <Box component="span" aria-hidden sx={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: tokens.accent }} />
          </Box>
          <Box
            component="nav"
            aria-label={t`Main`}
            sx={{
              display: 'flex',
              gap: '22px',
              alignSelf: 'stretch',
              alignItems: 'center',
              '& a': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '7px',
                paddingInline: '2px',
                paddingTop: '9px',
                color: tokens.textSecondary,
                textDecoration: 'none',
                '&::after': { content: '""', height: '2px', width: '100%', borderRadius: '1px', backgroundColor: 'transparent' },
                // Location is a 2px underline, not a pill, and SemiBold, so the
                // current section survives a greyscale print and does not rest
                // on the accent alone.
                '&[aria-current="page"]': { color: tokens.textPrimary, fontWeight: 600, '&::after': { backgroundColor: tokens.accent } },
                '&:focus-visible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '2px', borderRadius: '2px' },
              },
            }}
          >
            <Typography component={NavLink} to={home} end variant="uiText">
              <Trans>Explore</Trans>
            </Typography>
            {/* No guides index is designed yet, so Guides is a plain link that
                never claims to be the current page. */}
            <Typography component={Link} to={home} variant="uiText">
              <Trans>Guides</Trans>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flex: '1 0 0', minWidth: 0 }}>
          {!pageOwnsAsk && (
            <Box
              component="form"
              aria-label={t`Ask Skipbureau`}
              sx={{ flex: 1, minWidth: 0 }}
              onSubmit={(event) => {
                event.preventDefault()
                onAsk?.(question)
              }}
            >
              <InputBase
                fullWidth
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={t`Ask Skipbureau…`}
                slotProps={{ input: { 'aria-label': t`Ask Skipbureau` } }}
                startAdornment={<HeaderGlyph aria-hidden sx={{ width: '16px', height: '16px', flexShrink: 0, color: tokens.textSecondary }} />}
                sx={{
                  ...typography.uiText,
                  height: '40px',
                  gap: '10px',
                  paddingInline: '15px',
                  // The owner's text-field decision: a 3:1 resting stroke.
                  border: `1px solid ${tokens.textTertiary}`,
                  borderRadius: '4px',
                  backgroundColor: tokens.surface,
                  '&.Mui-focused': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
                  '& .MuiInputBase-input': { padding: 0, '&::placeholder': { color: tokens.textSecondary, opacity: 1 } },
                }}
              />
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <ContextControl />
          <LanguageControl />
        </Box>
      </Box>
    </Box>
  )
}
