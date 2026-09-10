import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { CountryCode } from 'src/core/country'
import { ShellContext } from './shell'

export const ShellProvider = ({ children }: { children: ReactNode }) => {
  const [pageOwnsAsk, setPageOwnsAsk] = useState(false)
  const [place, setPlace] = useState<{ country: CountryCode | null; countryName: string | null }>({ country: null, countryName: null })
  const setCountry = useCallback((country: CountryCode | null, name: string | null = null) => setPlace({ country, countryName: country ? name : null }), [])
  const value = useMemo(() => ({ pageOwnsAsk, setPageOwnsAsk, ...place, setCountry }), [pageOwnsAsk, place, setCountry])
  return <ShellContext value={value}>{children}</ShellContext>
}
