import { useCountry } from 'src/core/country'
import { useLocale } from 'src/core/i18n'
import { useShell } from 'src/core/shell'
import type { Journey } from './paths'

/** The reader and destination the page's address names, for building links inside a country's routes. */
export const useJourney = (): Journey => {
  const { locale } = useLocale()
  const { country, origin } = useCountry()
  return { locale, origin, country }
}

/**
 * The same, for what sits above the routes, the header and its Ask. Null until
 * the route has confirmed a country: nothing links to one the database has not
 * answered for.
 */
export const useShellJourney = (): Journey | null => {
  const { locale } = useLocale()
  const { country, origin } = useShell()
  return country ? { locale, origin, country } : null
}
