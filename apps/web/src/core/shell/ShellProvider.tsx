import { useMemo, useState, type ReactNode } from 'react'
import type { CountryCode } from 'src/core/country'
import { ShellContext } from './shell'

export const ShellProvider = ({ children }: { children: ReactNode }) => {
  const [pageOwnsAsk, setPageOwnsAsk] = useState(false)
  const [country, setCountry] = useState<CountryCode | null>(null)
  const value = useMemo(() => ({ pageOwnsAsk, setPageOwnsAsk, country, setCountry }), [pageOwnsAsk, country])
  return <ShellContext value={value}>{children}</ShellContext>
}
