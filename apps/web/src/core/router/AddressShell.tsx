import type { ReactNode } from 'react'
import { validated } from 'src/core/country'
import { ShellProvider } from 'src/core/shell'
import { useAddressCountry } from './addressCountry'
import { ownsAskAt } from './routes'

/**
 * The shell for the address the reader is at: the country it names once the
 * database has confirmed it, and whether the page opens owning Ask. Both come
 * from the address, not from the page after it mounts (SB-161), so the first
 * render has them, the prerender's included, and nothing renders twice.
 */
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
