import { startTransition, useEffect, useState, type ReactNode } from 'react'
import { validated } from 'src/core/country'
import { ShellProvider } from 'src/core/shell'
import { useAddressCountry } from './addressCountry'
import { ownsAskAt } from './routes'

export const AddressShell = ({ children, hydrating = false }: { children: ReactNode; hydrating?: boolean }) => {
  // SB-256: a page hydrated from its file first renders as the file was
  // rendered, without its address's status, and reads the status straight
  // after, in a transition; every other render reads it at once.
  const [readsStatus, setReadsStatus] = useState(!hydrating)
  useEffect(() => {
    if (!readsStatus) startTransition(() => setReadsStatus(true))
  }, [readsStatus])

  const { location, reader, result, place, status, details } = useAddressCountry({ readsStatus })
  const confirmed = result.data?.country
  const placeRow = place === null ? undefined : details.data?.places.find((row) => row.code === place)
  const statusKnown = status !== null && Boolean(details.data?.residenceStatuses.some((row) => row.code === status))
  const shellPlace =
    confirmed && reader
      ? {
          country: validated(confirmed.code),
          countryName: confirmed.name,
          origin: reader.origin,
          place: placeRow ? { code: placeRow.code, name: placeRow.name } : null,
          status: statusKnown ? status : null,
        }
      : null

  return (
    <ShellProvider place={shellPlace} ownsAskAtStart={ownsAskAt(location.pathname)} readsStatus={readsStatus}>
      {children}
    </ShellProvider>
  )
}
