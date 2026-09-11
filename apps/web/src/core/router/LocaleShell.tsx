import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { Client } from 'urql'
import { I18nProvider, defaultLocale, locales } from 'src/core/i18n'
import { GraphQLProvider } from 'src/core/graphql'
import { AppTheme } from 'src/core/theme'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { AddressShell } from './AddressShell'
import { readerFromSegment } from './paths'

export type LocaleShellProps = {
  children: ReactNode
  client?: Client | undefined
}

export const LocaleShell = ({ children, client }: LocaleShellProps) => {
  const { pathname } = useLocation()
  const segment = pathname.split('/')[1] ?? ''
  const locale = readerFromSegment(segment)?.locale ?? defaultLocale

  return (
    <GraphQLProvider client={client}>
      <I18nProvider locale={locale}>
        <AppTheme direction={locales[locale].dir}>
          <AddressShell>
            {/* The site's name, for a page that has none of its own: Not Found,
                search, Coming soon. A page's PageHead title goes in ahead of
                it, and the first title in the document is the one shown. Not
                at build time (SB-155), where the file's head has its title. */}
            {typeof window !== 'undefined' && <title>Skipbureau</title>}
            <AppShell header={<Header />}>{children}</AppShell>
          </AddressShell>
        </AppTheme>
      </I18nProvider>
    </GraphQLProvider>
  )
}
