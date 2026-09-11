import { useLocation } from 'react-router-dom'
import { useQuery } from 'urql'
import { CountryQuery } from 'src/core/graphql'
import { canonicalPath, countryFromSegment, readerFromSegment } from './paths'

/**
 * The reader and the country an address names, `/en-IR/TR/...`, and the
 * database's answer for that country. For the route's guard and for the shell
 * above the routes alike: both ask the same thing, so urql asks once, and on a
 * prerendered page both first renders have the answer (SB-161).
 *
 * `cache-first`, and the cache is the session's alone: a stale link to a
 * country removed since opens a new session with nothing cached, reaches the
 * network and is Not Found, which is the case the guard exists for. Not
 * `network-only`: a prerendered page carries the answer it was built with
 * (SB-155), urql's ssrExchange never gives that to a `network-only` query, and
 * the guard would ask again and render nothing over a page the file already
 * shows. Nor `cache-and-network`: urql runs a query once for the first render
 * and again when it subscribes, and the second is a cache hit, which that
 * policy answers with a request anyway.
 */
export const useAddressCountry = () => {
  const location = useLocation()
  const [, readerSegment = '', countrySegment = ''] = location.pathname.split('/')
  const reader = readerFromSegment(readerSegment)
  const code = countryFromSegment(countrySegment)
  // One page, one address: `/en/tr/t/x` and `/EN/TR/tasks/x` are both
  // `/en/TR/tasks/x`, and links shared before the markers were spelled out
  // still arrive.
  const canonical = canonicalPath(location.pathname)
  const moved = canonical !== null && canonical !== location.pathname

  const [result, refetch] = useQuery({
    query: CountryQuery,
    // The locale too: the country's name comes back in the reader's language.
    variables: { code: code ?? '', locale: reader?.locale },
    // Two letters before asking. It costs the API nothing to refuse `/en/xyz`
    // and it means a typo does not become a request.
    pause: !reader || !code || moved,
    requestPolicy: 'cache-first',
  })

  return { location, reader, code, canonical, moved, result, refetch }
}
