import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useQuery } from 'urql'
import { CountryProvider, validated } from 'src/core/country'
import { CountryQuery } from 'src/core/graphql'
import { useShell } from 'src/core/shell'
import { NotFound, Unreachable } from 'src/screens'
import { canonicalPath, countryFromSegment, readerFromSegment } from './paths'

/**
 * Guards `/:reader/:country` and hands the country, and where the reader comes
 * from, down.
 *
 * Which countries exist is a database answer, not a compile-time one, so this
 * asks. `network-only`: a cached answer would render a country that has since
 * been removed, and the guard would be wrong in exactly the case it exists for.
 * It runs when this route mounts or its country changes, not on every
 * navigation below it.
 *
 * An unknown country is Not Found, never a redirect to one we do have. A stale
 * link reading `/en/ZZ/guides/residence-permit` must not silently become
 * another country's rules: a reader would act on them.
 */
export const CountryRoute = () => {
  const { reader: readerSegment = '', country: countrySegment = '' } = useParams()
  const location = useLocation()

  const reader = readerFromSegment(readerSegment)
  const code = countryFromSegment(countrySegment)
  // One page, one address: `/en/tr/t/x` and `/EN/TR/tasks/x` are both
  // `/en/TR/tasks/x`, and links shared before the markers were spelled out
  // still arrive.
  const canonical = canonicalPath(location.pathname)
  const moved = canonical !== null && canonical !== location.pathname

  const [{ data, fetching, error }, refetch] = useQuery({
    query: CountryQuery,
    // The locale too: the country's name comes back in the reader's language.
    variables: { code: code ?? '', locale: reader?.locale },
    // Two letters before asking. It costs the API nothing to refuse `/en/xyz`
    // and it means a typo does not become a request.
    pause: !reader || !code || moved,
    requestPolicy: 'network-only',
  })

  // The header sits above this route, so the confirmed country is published
  // to the shell rather than handed down; it links only to a country the
  // database has answered for.
  const { setCountry } = useShell()
  const confirmed = data?.country?.code
  const confirmedName = data?.country?.name ?? null
  const origin = reader?.origin ?? null
  useEffect(() => {
    setCountry(confirmed ? validated(confirmed) : null, confirmedName, origin)
    return () => setCountry(null)
  }, [confirmed, confirmedName, origin, setCountry])

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
    <CountryProvider country={validated(data.country.code)} name={data.country.name} origin={origin}>
      <Outlet />
    </CountryProvider>
  )
}
