import CssBaseline from '@mui/material/CssBaseline'
import { App } from './App'
import { I18nProvider, locales, useLocale } from './core/i18n'
import { AppTheme } from './core/theme'

/**
 * Direction is not chosen here, it is read off the active locale. Everything
 * that cares, the MUI theme, the emotion cache and the document, takes it from
 * that one place, so they cannot drift apart.
 */
const Shell = () => {
  const { locale } = useLocale()

  return (
    <AppTheme direction={locales[locale].dir}>
      <CssBaseline />
      <App />
    </AppTheme>
  )
}

export const AppRoot = () => (
  <I18nProvider>
    <Shell />
  </I18nProvider>
)
