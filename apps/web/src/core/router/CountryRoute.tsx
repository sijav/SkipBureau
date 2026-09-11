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
 * asks. `cache-first`, and the cache is the session's alone: a stale link to a
 * country removed since opens a new session with nothing cached, reaches the
 * network and is Not Found, which is the case the guard exists for. What it
 * gives up is a country removed while a reader has the site open, which they
 * see until they reload.
 *
 * Not `network-only`, which it was: a prerendered page carries the answer it
 * was built with (SB-155), urql's ssrExchange never gives that to a
 * `network-only` query, and the guard would ask again and render nothing over
 * a page the file already shows. Nor `cache-and-network`: urql runs a query
 * once for the first render and again when it subscribes, and the second is a
 * cache hit, which that policy answers with a request anyway.
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
    requestPolicy: 'cache-first',
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
