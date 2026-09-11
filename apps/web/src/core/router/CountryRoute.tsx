import { Navigate, Outlet } from 'react-router-dom'
import { CountryProvider, validated } from 'src/core/country'
import { NotFound } from 'src/screens/NotFound'
import { Unreachable } from 'src/screens/Unreachable'
import { useAddressCountry } from './addressCountry'

/**
 * Guards `/:reader/:country` and hands the country, and where the reader comes
 * from, down.
 *
 * Which countries exist is a database answer, not a compile-time one, so this
 * asks, through the same question the shell above it asks (SB-161).
 *
 * An unknown country is Not Found, never a redirect to one we do have. A stale
 * link reading `/en/ZZ/guides/residence-permit` must not silently become
 * another country's rules: a reader would act on them.
 */
export const CountryRoute = () => {
  const {
    location,
    reader,
    code,
    canonical,
    moved,
    result: { data, fetching, error },
    refetch,
  } = useAddressCountry()

  if (canonical !== null && moved) return <Navigate replace to={{ pathname: canonical, search: location.search, hash: location.hash }} />
  if (!reader || !code) return <NotFound />

  // Nothing, deliberately, rather than a skeleton: a skeleton shaped like the
  // page is a promise, and the answer may be Not Found.
  if (fetching) return null

  // We could not ask is not the same as the answer is no. One is our fault and
  // the reader can retry; the other is ours to fix and they should look
  // elsewhere. Retried in place rather than by reloading the document.
  if (error) return <Unreachable onRetry={() => refetch({ requestPolicy: 'network-only' })} />
  if (!data?.country) return <NotFound />

  return (
    <CountryProvider country={validated(data.country.code)} name={data.country.name} origin={reader.origin}>
      <Outlet />
    </CountryProvider>
  )
}
