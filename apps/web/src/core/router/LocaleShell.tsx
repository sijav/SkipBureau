import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { I18nProvider, defaultLocale, locales } from 'src/core/i18n'
import { GraphQLProvider } from 'src/core/graphql'
import { AppTheme } from 'src/core/theme'
import { ShellProvider } from 'src/core/shell'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { readerFromSegment } from './paths'

/**
 * Reads the language out of the URL and puts the whole app inside it.
 *
 * It sits above the route table rather than inside it so that Not Found, and
 * an address whose country is wrong, still render in a working theme and a
 * language the reader probably asked for. Any casing is accepted here;
 * canonicalising it is `CountryRoute`'s job.
 */
export const LocaleShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation()
  const segment = pathname.split('/')[1] ?? ''
  const locale = readerFromSegment(segment)?.locale ?? defaultLocale

  return (
    <GraphQLProvider>
      <I18nProvider locale={locale}>
        <AppTheme direction={locales[locale].dir}>
          <ShellProvider>
            {/* The site's name, for a page that has none of its own: Not Found,
                search, Coming soon. A page's PageHead title goes in ahead of
                it, and the first title in the document is the one shown. */}
            <title>SkipBureau</title>
            <AppShell header={<Header />}>{children}</AppShell>
          </ShellProvider>
        </AppTheme>
      </I18nProvider>
    </GraphQLProvider>
  )
}
