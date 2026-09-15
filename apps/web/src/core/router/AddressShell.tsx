import { startTransition, useEffect, useState, type ReactNode } from 'react'
import { validated } from 'src/core/country'
import { ShellProvider } from 'src/core/shell'
import { useAddressCountry } from './addressCountry'
import { ownsAskAt } from './routes'

export const AddressShell = ({ children, hydrating = false }: { children: ReactNode; hydrating?: boolean }) => {
  // SB-256: a page hydrated from its file first renders as the file was
  // rendered, without its address's status or role (SB-286), and reads both
  // straight after, in a transition; every other render reads them at once.
  const [readsQuery, setReadsQuery] = useState(!hydrating)
  useEffect(() => {
    if (!readsQuery) startTransition(() => setReadsQuery(true))
  }, [readsQuery])

  const { location, reader, result, place, status, situation, details } = useAddressCountry({ readsQuery })
  const confirmed = result.data?.country
  const placeRow = place === null ? undefined : details.data?.places.find((row) => row.code === place)
  const statusKnown = status !== null && Boolean(details.data?.residenceStatuses.some((row) => row.code === status))
  const situationKnown = situation !== null && Boolean(details.data?.situations.includes(situation))
  const shellPlace =
    confirmed && reader
      ? {
          country: validated(confirmed.code),
          countryName: confirmed.name,
          origin: reader.origin,
          place: placeRow ? { code: placeRow.code, name: placeRow.name } : null,
          status: statusKnown ? status : null,
          situation: situationKnown ? situation : null,
        }
      : null

  return (
    <ShellProvider place={shellPlace} ownsAskAtStart={ownsAskAt(location.pathname)} readsQuery={readsQuery}>
      {children}
    </ShellProvider>
  )
}
