import { useLingui } from '@lingui/react/macro'
import { ButtonBase, Typography, useTheme } from '@mui/material'
import { Suspense, useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { locales, useLocale, type Locale } from 'src/core/i18n'
import { samePageIn } from 'src/core/router'
import { SmallChevron } from 'src/shared/context-control'
import { lazyPart } from 'src/shared/lazy-part'

// SB-159: the menu's code, and the Popover and Modal under it, arrive the
// first time it opens.
const LanguageMenu = lazyPart(() => import('./LanguageMenu').then((menu) => menu.LanguageMenu))

export const LanguageControl = () => {
  const { tokens } = useTheme()
  const { t } = useLingui()
  const { locale } = useLocale()
  const location = useLocation()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  // Once opened, kept, so closing it plays the menu's own exit.
  const [opened, setOpened] = useState(false)
  const menuId = useId()

  const choose = (next: Locale) => {
    setAnchor(null)
    if (next !== locale) void navigate(samePageIn(location, next))
  }

  return (
    <>
      <ButtonBase
        disableRipple
        aria-label={t`Language`}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        onClick={(event) => {
          setAnchor(event.currentTarget)
          setOpened(true)
        }}
        sx={{
          // The profile control's 34 high, from 8 above and below a 16 line and
          // the stroke inside, so the label sets the width, not a number.
          gap: '8px',
          padding: '8px 7px 8px 9px',
          border: `1px solid ${tokens.border}`,
          borderRadius: '2px',
          backgroundColor: tokens.surface,
          color: tokens.textPrimary,
          '&.Mui-focusVisible': { outline: `2px solid ${tokens.accentText}`, outlineOffset: '-2px' },
        }}
      >
        <Typography component="span" variant="overline" sx={{ textTransform: 'uppercase' }}>
          {locales[locale].path}
        </Typography>
        <SmallChevron aria-hidden sx={{ width: '14px', height: '14px', color: tokens.textSecondary }} />
      </ButtonBase>
      {opened && (
        <Suspense fallback={null}>
          <LanguageMenu id={menuId} anchor={anchor} current={locale} onChoose={choose} onClose={() => setAnchor(null)} />
        </Suspense>
      )}
    </>
  )
}
