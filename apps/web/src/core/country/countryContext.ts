import { createContext, use } from 'react'
import type { Country } from './countries'

export type CountryContext = {
  /** The country whose rules the page is showing. Comes from the URL. */
  country: Country
}

/**
 * Kept apart from the provider for Fast Refresh, the same reason as the locale
 * context. There is no setter: country is part of a page's address, so
 * changing it is a navigation.
 */
export const Context = createContext<CountryContext | null>(null)

export const useCountry = (): CountryContext => {
  const context = use(Context)
  if (!context) throw new Error('useCountry needs a CountryProvider above it')
  return context
}
