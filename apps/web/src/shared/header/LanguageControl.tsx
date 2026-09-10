import { useLingui } from '@lingui/react/macro'
import { ButtonBase, Menu, MenuItem, Typography, useTheme } from '@mui/material'
import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isLocale, locales, useLocale, type Locale } from 'src/core/i18n'
import { samePageIn } from 'src/core/router'
import { SmallChevron } from './icons'

/**
 * In the header's profile slot, which is free because the product has no
 * end-user accounts, at the profile control's 54x34. Switching keeps the page.
 */
export const LanguageControl = () => {
  const { tokens } = useTheme()
  const { t } = useLingui()
  const { locale } = useLocale()
  const location = useLocation()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
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
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          height: '34px',
          minWidth: '54px',
          gap: '8px',
          padding: '4px 7px 4px 9px',
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
      <Menu id={menuId} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {Object.keys(locales)
          .filter(isLocale)
          .map((option) => (
            <MenuItem key={option} selected={option === locale} lang={option} onClick={() => choose(option)}>
              {locales[option].label}
            </MenuItem>
          ))}
      </Menu>
    </>
  )
}
