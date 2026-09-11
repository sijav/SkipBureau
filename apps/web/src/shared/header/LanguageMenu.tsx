import { Menu, MenuItem } from '@mui/material'
import { isLocale, locales, type Locale } from 'src/core/i18n'

export type LanguageMenuProps = {
  id: string
  anchor: HTMLElement | null
  current: Locale
  onChoose: (locale: Locale) => void
  onClose: () => void
}

// Its own file, which the barrel does not export, so its code and the Menu's
// arrive only when the control is first opened (SB-159).
export const LanguageMenu = ({ id, anchor, current, onChoose, onClose }: LanguageMenuProps) => (
  <Menu id={id} anchorEl={anchor} open={Boolean(anchor)} onClose={onClose}>
    {Object.keys(locales)
      .filter(isLocale)
      .map((option) => (
        <MenuItem key={option} selected={option === current} lang={option} onClick={() => onChoose(option)}>
          {locales[option].label}
        </MenuItem>
      ))}
  </Menu>
)
