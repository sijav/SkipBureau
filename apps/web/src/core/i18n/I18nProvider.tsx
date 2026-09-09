import { i18n } from '@lingui/core'
import { I18nProvider as LinguiProvider } from '@lingui/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Context } from './localeContext'
import { defaultLocale, isLocale, locales, nearestLocale, type Locale } from './locales'

const STORAGE_KEY = 'skipbureau.locale'

/**
 * Loads a catalog and makes it active.
 *
 * The import is dynamic so a locale's messages are only fetched when someone
 * actually reads in it. With two languages that is a small saving; with the
 * ten this product will end up with, shipping every catalog to every reader is
 * a large one.
 */
const activate = async (locale: Locale) => {
  // The COMPILED catalog, not the .po. A .po is not JavaScript, and importing
  // one gets parsed as source and throws. `lingui compile --namespace es` writes
  // these .mjs files, and
  // the pre-dev, pre-build, pre-test and pre-storybook scripts run it.
  const { messages } = await import(`../../locales/${locales[locale].catalog}.mjs`)
  i18n.loadAndActivate({ locale, messages })
}

const remembered = (): Locale => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isLocale(stored)) return stored
  } catch {
    // A browser with storage blocked still gets a language, just not a
    // remembered one.
  }
  return typeof navigator === 'undefined' ? defaultLocale : nearestLocale(navigator.languages ?? [navigator.language])
}

export type I18nProviderProps = {
  children: ReactNode
  /** Forced locale, for stories and tests. Otherwise remembered, then guessed. */
  locale?: Locale
}

export const I18nProvider = ({ children, locale: forced }: I18nProviderProps) => {
  // `forced` is derived, not copied into state. Syncing a prop into state
  // through an effect causes a cascading render and can show the old locale for
  // a frame, and eslint's react-hooks rule rejects it outright.
  const [chosen, setChosen] = useState<Locale>(() => remembered())
  const locale = forced ?? chosen
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let current = true
    void activate(locale).then(() => {
      if (current) setReady(true)
    })
    return () => {
      current = false
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setChosen(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not remembering is survivable; refusing to switch is not.
    }
  }, [])

  // Rendering before the catalog is active shows message ids for a frame, which
  // in this setup means English text appearing briefly inside a Persian page.
  if (!ready) return null

  return (
    <Context value={{ locale, setLocale }}>
      <LinguiProvider i18n={i18n}>{children}</LinguiProvider>
    </Context>
  )
}
