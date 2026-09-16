import { startTransition } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { CountryProvider, validated } from 'src/core/country'
import { useShell } from 'src/core/shell'
import { NotFound } from 'src/screens/NotFound'
import { Unreachable } from 'src/screens/Unreachable'
import { confirmDetails, useAddressCountry } from './addressCountry'

export const CountryRoute = () => {
  const { readsQuery } = useShell()
  const {
    location,
    reader,
    code,
    place: saidPlace,
    status: saidStatus,
    situation: saidSituation,
    work: saidWork,
    canonical,
    moved,
    result: { data, fetching, error },
    refetch,
    details,
    refetchDetails,
  } = useAddressCountry({ readsQuery })

  if (canonical !== null && moved) return <Navigate replace to={{ pathname: canonical, search: location.search, hash: location.hash }} />
  if (!reader || !code) return <NotFound />

  // Nothing, deliberately, rather than a skeleton: a skeleton shaped like the
  // page is a promise, and the answer may be Not Found. Reachable only while a
  // retry is in flight now (SB-046), where the page already on screen stays.
  if (fetching && !data) return null

  // We could not ask is not the same as the answer is no. One is our fault and
  // the reader can retry; the other is ours to fix and they should look
  // elsewhere. Retried in place rather than by reloading the document.
  if (error) return <Unreachable onRetry={() => startTransition(() => refetch({ requestPolicy: 'network-only' }))} />
  if (!data?.country) return <NotFound />

  // SB-256: a place or a status the country does not have is the same stale
  // link as a country we do not cover, and so is a role its rules do not name
  // (SB-286). A place is checked before the page draws; a status and a role
  // once their answer is in, so a page hydrated from its file stays on screen
  // meanwhile, without them.
  if (details.error && !details.data) {
    return <Unreachable onRetry={() => startTransition(() => refetchDetails({ requestPolicy: 'network-only' }))} />
  }
  // SB-318: one confirmation, shared with the shell above this route, so the two cannot disagree about what the
  // reader has said. Where they work is a place of the same country, so the same list answers for it (SB-313).
  const said = confirmDetails(
    {
      places: details.data?.places,
      residenceStatuses: details.data?.residenceStatuses,
      situations: details.data?.situations,
    },
    { place: saidPlace, status: saidStatus, situation: saidSituation, work: saidWork },
  )
  if (said.waiting) return null
  if (said.unknown.length > 0) return <NotFound />

  return (
    <CountryProvider
      country={validated(data.country.code)}
      name={data.country.name}
      origin={reader.origin}
      place={said.place}
      status={said.status}
      situation={said.situation}
      work={said.work}
    >
      <Outlet />
    </CountryProvider>
  )
}
