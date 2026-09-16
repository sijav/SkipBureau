import { startTransition, useEffect, useState, type ReactNode } from 'react'
import { validated } from 'src/core/country'
import { ShellProvider } from 'src/core/shell'
import { confirmDetails, useAddressCountry } from './addressCountry'
import { ownsAskAt } from './routes'

export const AddressShell = ({ children, hydrating = false }: { children: ReactNode; hydrating?: boolean }) => {
  // SB-256: a page hydrated from its file first renders as the file was
  // rendered, without its address's status or role (SB-286), and reads both
  // straight after, in a transition; every other render reads them at once.
  const [readsQuery, setReadsQuery] = useState(!hydrating)
  useEffect(() => {
    if (!readsQuery) startTransition(() => setReadsQuery(true))
  }, [readsQuery])

  const { location, reader, result, place, status, situation, work, details } = useAddressCountry({ readsQuery })
  const confirmed = result.data?.country
  // SB-318: the same confirmation the route makes, so the panel cannot show a detail the route rejected, or
  // forget one it accepted, which is what happened to the work place.
  const said = confirmDetails(
    {
      places: details.data?.places,
      residenceStatuses: details.data?.residenceStatuses,
      situations: details.data?.situations,
    },
    { place, status, situation, work },
  )
  const placeRow = said.place === null ? undefined : details.data?.places.find((row) => row.code === said.place)
  const shellPlace =
    confirmed && reader
      ? {
          country: validated(confirmed.code),
          countryName: confirmed.name,
          origin: reader.origin,
          place: placeRow ? { code: placeRow.code, name: placeRow.name } : null,
          status: said.status,
          situation: said.situation,
          work: said.work,
        }
      : null

  return (
    <ShellProvider place={shellPlace} ownsAskAtStart={ownsAskAt(location.pathname)} readsQuery={readsQuery}>
      {children}
    </ShellProvider>
  )
}
