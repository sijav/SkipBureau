import { startTransition } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { CountryProvider, validated } from 'src/core/country'
import { useShell } from 'src/core/shell'
import { NotFound } from 'src/screens/NotFound'
import { Unreachable } from 'src/screens/Unreachable'
import { useAddressCountry } from './addressCountry'

export const CountryRoute = () => {
  const { readsStatus } = useShell()
  const {
    location,
    reader,
    code,
    place,
    status,
    canonical,
    moved,
    result: { data, fetching, error },
    refetch,
    details,
    refetchDetails,
  } = useAddressCountry({ readsStatus })

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
  // link as a country we do not cover. A place is checked before the page
  // draws; a status once its answer is in, so a page hydrated from its file
  // stays on screen meanwhile, without the status.
  const places = details.data?.places
  const statuses = details.data?.residenceStatuses
  if (details.error && !details.data) {
    return <Unreachable onRetry={() => startTransition(() => refetchDetails({ requestPolicy: 'network-only' }))} />
  }
  if (place !== null && !places) return null
  if (place !== null && !places?.some((row) => row.code === place)) return <NotFound />
  if (status !== null && statuses && !statuses.some((row) => row.code === status)) return <NotFound />
  const confirmedStatus = status !== null && statuses?.some((row) => row.code === status) ? status : null

  return (
    <CountryProvider country={validated(data.country.code)} name={data.country.name} origin={reader.origin} place={place} status={confirmedStatus}>
      <Outlet />
    </CountryProvider>
  )
}
