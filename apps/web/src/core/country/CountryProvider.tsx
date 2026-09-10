import type { ReactNode } from 'react'
import { Context } from './countryContext'
import type { CountryCode } from './countries'

export type CountryProviderProps = {
  children: ReactNode
  country: CountryCode
  name: string
}

export const CountryProvider = ({ children, country, name }: CountryProviderProps) => (
  <Context value={{ country, name }}>{children}</Context>
)
