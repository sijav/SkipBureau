import CssBaseline from '@mui/material/CssBaseline'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { I18nProvider, defaultLocale, locales } from 'src/core/i18n'
import { AppTheme } from 'src/core/theme'
import { AppShell } from 'src/shared/app-shell'
import { aliasedLocale, localeFromSegment } from './paths'

/**
 * Reads the language out of the URL and puts the whole app inside it.
 *
 * It sits above the route table rather than inside it so that Not Found, and
 * an address whose country is wrong, still render in a working theme and a
 * language the reader probably asked for. Both URL forms are accepted here;
 * canonicalising the long one is `CountryRoute`'s job.
 */
export const LocaleShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation()
  const segment = pathname.split('/')[1] ?? ''
  const locale = localeFromSegment(segment) ?? aliasedLocale(segment) ?? defaultLocale

  return (
    <I18nProvider locale={locale}>
      <AppTheme direction={locales[locale].dir}>
        <CssBaseline />
        <AppShell>{children}</AppShell>
      </AppTheme>
    </I18nProvider>
  )
}
