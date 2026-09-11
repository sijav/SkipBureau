import { i18n } from '@lingui/core'
import { I18nProvider as LinguiProvider } from '@lingui/react'
import { useEffect, useState, type ReactNode } from 'react'
import { activateCatalog, type Messages } from './activateCatalog'
import { loadCatalog } from './loadCatalog'
import { Context } from './localeContext'
import { defaultLocale, isLocale, type Locale } from './locales'

export type I18nProviderProps = {
  children: ReactNode
  /** The locale the URL names. This provider does not choose one. */
  locale: Locale
  /** How a catalog is fetched. Overridden so a story can render the failure. */
  load?: ((locale: Locale) => Promise<Messages>) | undefined
}

/**
 * Activates a catalog and reports the one that is ACTUALLY ACTIVE.
 *
 * `AppTheme` reads its direction off that value, so reporting a locale whose
 * catalog failed would put English text inside a right-to-left layout.
 */
export const I18nProvider = ({ children, locale: wanted, load = loadCatalog }: I18nProviderProps) => {
  // Already active when the catalog was loaded before this rendered: a page
  // rendered at build time, or a prerendered one whose catalog main.tsx loads
  // first (SB-155). Rendering nothing then would clear what the file shows.
  const [active, setActive] = useState<Locale | null>(() => (i18n.locale === wanted ? wanted : null))

  useEffect(() => {
    // React runs this cleanup before the next setup, so the flag alone
    // invalidates a request the reader has moved on from.
    let current = true

    void activateCatalog({
      locale: wanted,
      load,
      isCurrent: () => current,
      activate: (locale, messages) => {
        i18n.loadAndActivate({ locale, messages })
        setActive(locale)
      },
    }).then((result) => {
      if (result !== 'failed' || !current) return

      console.error(`The ${wanted} catalog failed to load.`)

      // Something is already live under this provider: keep it and report it,
      // rather than the locale that just failed.
      if (i18n.locale) {
        setActive(isLocale(i18n.locale) ? i18n.locale : defaultLocale)
        return
      }

      // Nothing is active at all, and lingui renders nothing until something
      // is. Every message id here IS its English text, so an empty English
      // catalog still reads.
      i18n.loadAndActivate({ locale: defaultLocale, messages: {} })
      setActive(defaultLocale)
    })

    return () => {
      current = false
    }
  }, [wanted, load])

  useEffect(() => {
    if (active) window.document.documentElement.lang = active
  }, [active])

  // Only before ANY catalog has activated. A later switch keeps rendering the
  // one already live rather than blanking a page that is working.
  if (!active) return null

  return (
    <Context value={{ locale: active }}>
      <LinguiProvider i18n={i18n}>{children}</LinguiProvider>
    </Context>
  )
}
