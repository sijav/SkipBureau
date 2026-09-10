import { Trans, useLingui } from '@lingui/react/macro'
import { Box, InputBase, Typography, useTheme } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { paths, useShellJourney } from 'src/core/router'
import { useShell } from 'src/core/shell'
import { useAsk } from 'src/shared/ask-panel'
import { YourDetails } from 'src/shared/context-control'
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
  const { pageOwnsAsk } = useShell()
  const journey = useShellJourney()
  const scrolled = useScrolled()
  const [question, setQuestion] = useState('')
  const { bindings: ask, panel } = useAsk({ question, onQuestion: setQuestion })
  const { anchorRef, events: askEvents, input: askInput } = ask

  // Only a country the route confirmed; before one is known, the root decides.
  // No country is hardcoded here.
  const home = journey ? paths.home(journey) : '/'

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 'appBar',
        paddingInline: { xs: '16px', sm: '24px', lg: '80px' },
        backgroundColor: tokens.surface,
        borderBottom: `1px solid ${tokens[scrolled ? 'borderStrong' : 'border']}`,
      }}
    >
      {/*
        Figma 45:524. The header is its row and the padding around it, never a
        fixed height: 14 above and below a 40 row makes the 68, 10 makes the
        scrolled 60. Those two are floors, not sizes, so the header stays 68
        where the page owns Ask and the field steps aside, and grows when the
        row wraps. Below md, which the design
        does not draw and so is derived, the row wraps and Ask takes a line of
        its own rather than squeezing to nothing.
      */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          alignItems: 'center',
          columnGap: { xs: '12px', md: '32px' },
          rowGap: '12px',
          // The rule below is inside the 68, as Figma draws strokes, so the
          // bottom padding and the floor each give back its pixel.
          minHeight: scrolled ? '59px' : '67px',
          paddingTop: scrolled ? '10px' : { xs: '12px', md: '14px' },
          paddingBottom: scrolled ? '9px' : { xs: '11px', md: '13px' },
          transition: 'padding 150ms ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '28px', minWidth: 0 }}>
          <Box
            component={Link}
            to={home}
            sx={{ display: 'flex', alignItems: 'baseline', gap: '3px', textDecoration: 'none', color: tokens.textPrimary }}
          >
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
              // Both destinations lead Home until there is a guides index, which
              // the wordmark already does, so a phone keeps its width for Ask.
              display: { xs: 'none', sm: 'flex' },
              gap: '22px',
              alignSelf: 'stretch',
              alignItems: 'center',
              '& a': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                // Figma 43:526: 20 of text, 7, a 2px underline, 29 in all,
                // centred in the row like the wordmark beside it.
                gap: '7px',
                paddingInline: '2px',
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
            {/* There is no index of every guide yet, so Guides leads to its
                Coming soon page, which it can then mark as the current one. */}
            <Typography component={NavLink} to={journey ? paths.guides(journey) : '/'} end variant="uiText">
              <Trans>Guides</Trans>
            </Typography>
          </Box>
        </Box>

        {!pageOwnsAsk && (
          <Box
            component="form"
            // Unnamed, so not a landmark: the page's own Ask is the one, and
            // two forms of the same name confuse a landmark list. The field
            // inside keeps its name.
            ref={anchorRef}
            sx={{ order: { xs: 1, md: 0 }, flex: { xs: '1 0 100%', md: '1 0 0' }, minWidth: 0 }}
            onSubmit={(event) => {
              event.preventDefault()
              ask.onAsk(question)
              onAsk?.(question)
            }}
          >
            <InputBase
              {...askEvents}
              fullWidth
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t`Ask Skipbureau…`}
              slotProps={{ input: { 'aria-label': t`Ask Skipbureau`, ...askInput } }}
              startAdornment={
                <HeaderGlyph aria-hidden sx={{ width: '16px', height: '16px', flexShrink: 0, color: tokens.textSecondary }} />
              }
              sx={{
                ...typography.uiText,
                // 40 from its padding around a 20 line, strokes inside, as drawn.
                gap: '10px',
                paddingBlock: '9px',
                paddingInline: '15px',
                // The owner's text-field decision: a 3:1 resting stroke.
                border: `1px solid ${tokens.textTertiary}`,
                borderRadius: '4px',
                backgroundColor: tokens.surface,
                '&.Mui-focused': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
                // The design's 20 line; MUI's own input box is 1.4375em, 20.125 here.
                '& .MuiInputBase-input': {
                  padding: 0,
                  height: typography.uiText.lineHeight,
                  '&::placeholder': { color: tokens.textSecondary, opacity: 1 },
                },
              }}
            />
            {panel}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginInlineStart: 'auto' }}>
          <YourDetails />
          <LanguageControl />
        </Box>
      </Box>
    </Box>
  )
}
