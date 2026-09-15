import type { ReactNode } from 'react'
import { Context } from './countryContext'
import type { CountryCode } from './countries'

export type CountryProviderProps = {
  children: ReactNode
  country: CountryCode
  name: string
  origin?: string | null
  place?: string | null
  status?: string | null
}

export const CountryProvider = ({ children, country, name, origin = null, place = null, status = null }: CountryProviderProps) => (
  <Context value={{ country, name, origin, place, status }}>{children}</Context>
)
