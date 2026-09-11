import type { ReactNode } from 'react'
import { validated } from 'src/core/country'
import { ShellProvider } from 'src/core/shell'
import { useAddressCountry } from './addressCountry'
import { ownsAskAt } from './routes'

export const AddressShell = ({ children }: { children: ReactNode }) => {
  const { location, reader, result } = useAddressCountry()
  const confirmed = result.data?.country
  const place = confirmed && reader ? { country: validated(confirmed.code), countryName: confirmed.name, origin: reader.origin } : null

  return (
    <ShellProvider place={place} ownsAskAtStart={ownsAskAt(location.pathname)}>
      {children}
    </ShellProvider>
  )
}
