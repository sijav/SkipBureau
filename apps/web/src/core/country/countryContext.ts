import { createContext, use } from 'react'
import type { CountryCode } from './countries'

export type CountryContext = {
  /** The country whose rules the page is showing. Confirmed by the API. */
  country: CountryCode
  /** Its name in the reader's language, where the API had one. */
  name: string
  /** Where the reader comes from, when they have said: part of the address, like the country. */
  origin: string | null
  /** The place in the country where the reader lives, when they have said, as the API codes it and confirmed (SB-256). */
  place: string | null
  /** The residence status the reader holds there, when they have said, confirmed by the API (SB-256). */
  status: string | null
  /** Their role there, a situation the country's rules name, such as `worker`, when they have said, confirmed by the API (SB-286). */
  situation: string | null
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
