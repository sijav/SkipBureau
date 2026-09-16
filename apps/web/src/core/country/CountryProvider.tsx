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
  situation?: string | null
  /** Where the reader works, which is not where they live (SB-313). */
  work?: string | null
}

export const CountryProvider = ({
  children,
  country,
  name,
  origin = null,
  place = null,
  status = null,
  situation = null,
  work = null,
}: CountryProviderProps) => <Context value={{ country, name, origin, place, status, situation, work }}>{children}</Context>
