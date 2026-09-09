import type { ReactNode } from 'react'
import { Context } from './countryContext'
import type { Country } from './countries'

export type CountryProviderProps = {
  children: ReactNode
  country: Country
}

export const CountryProvider = ({ children, country }: CountryProviderProps) => (
  <Context value={{ country }}>{children}</Context>
)
