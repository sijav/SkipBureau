import { i18n } from '@lingui/core'
import { I18nProvider as LinguiProvider } from '@lingui/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { activateCatalog, type Messages } from './activateCatalog'
import { Context } from './localeContext'
import { defaultLocale, isLocale, locales, nearestLocale, type Locale } from './locales'

const STORAGE_KEY = 'skipbureau.locale'

/**
 * The COMPILED catalog, not the `.po`. A `.po` is not JavaScript, so importing
 * one is parsed as source and throws, which rendered a blank page once already.
 * `lingui compile --namespace es` writes these `.mjs` files, and the pre-dev,
 * pre-build, pre-test and pre-storybook scripts run it.
 *
 * The import is dynamic so a locale's messages are only fetched when someone
 * actually reads in it. With two languages that is a small saving; with the ten
 * this product will end up with, shipping every catalog to every reader is a
 * large one.
 */
const loadCatalog = async (locale: Locale): Promise<Messages> => {
  const module: { messages: Messages } = await import(`../../locales/${locales[locale].catalog}.mjs`)
  return module.messages
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
  /**
   * How a catalog is fetched. Overridden so a story can render the failure
   * state, which is a state a reader on a bad connection actually reaches and
   * which cannot otherwise be seen without breaking the build output.
   */
  load?: ((locale: Locale) => Promise<Messages>) | undefined
}

/**
 * `locale` means the locale that is ACTUALLY ACTIVE, never the one requested.
 *
 * That distinction decides what a failure looks like. `AppTheme` reads its
 * direction straight off this value, so if a requested Persian catalog fails
 * while English is live, reporting Persian would put English text inside a
 * right-to-left layout with the control claiming a language that never loaded.
 * A request that fails changes nothing, and the page keeps working.
 */
export const I18nProvider = ({ children, locale: forced, load = loadCatalog }: I18nProviderProps) => {
  const [active, setActive] = useState<Locale | null>(null)
  const [requested, setRequested] = useState<Locale>(() => remembered())
  const wanted = forced ?? requested

  // Bumped per request, so a resolved import can ask whether it is still the
  // one being waited for.
  const generation = useRef(0)

  useEffect(() => {
    generation.current += 1
    const mine = generation.current
    let current = true
    const isCurrent = () => current && generation.current === mine

    void activateCatalog({
      locale: wanted,
      load,
      isCurrent,
      activate: (locale, messages) => {
        i18n.loadAndActivate({ locale, messages })
        setActive(locale)
      },
    }).then((result) => {
      if (result !== 'failed' || !isCurrent()) return

      console.error(`The ${wanted} catalog failed to load.`)

      // Something is already live. Keep rendering it, and report what is
      // actually active rather than the locale that just failed. Reading it
      // back off lingui rather than trusting a local variable is what keeps
      // this honest: whatever is on the screen is what gets reported.
      if (i18n.locale) {
        setActive(isLocale(i18n.locale) ? i18n.locale : defaultLocale)
        return
      }

      // A cold start with nothing active at all. Lingui renders nothing until
      // some catalog is, so English is activated with no messages: every id in
      // this codebase IS its English text, so the page still reads.
      i18n.loadAndActivate({ locale: defaultLocale, messages: {} })
      setActive(defaultLocale)
    })

    return () => {
      current = false
    }
  }, [wanted, load])

  const setLocale = useCallback((next: Locale) => {
    setRequested(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not remembering is survivable; refusing to switch is not.
    }
  }, [])

  // Only before ANY catalog has activated. A later switch keeps rendering the
  // one already live rather than blanking a page that is working.
  if (!active) return null

  return (
    <Context value={{ locale: active, setLocale }}>
      <LinguiProvider i18n={i18n}>{children}</LinguiProvider>
    </Context>
  )
}
