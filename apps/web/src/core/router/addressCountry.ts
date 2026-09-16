import { useLocation } from 'react-router-dom'
import { useQuery } from 'urql'
import { CountryQuery, overThePage, ReaderDetailsQuery } from 'src/core/graphql'
import { canonicalPath, destinationFromSegment, readerFromSegment, situationFromSearch, statusFromSearch, workFromSearch } from './paths'

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
 *
 * SB-256: the place in the country the address names, `/en-IR/DE-HH/...`, and
 * the residence status in its query, with the country's places and statuses
 * to check them against, asked only when there is one to check and never
 * suspending, so a status applied after hydration leaves the page as it is
 * until they are in. SB-286: the role in its query too, `?situation=worker`,
 * checked against the situations the country's rules name. SB-313: where they
 * work too, `?work=DE-BE`, a place of the same country, checked against the
 * same places. `readsQuery` is false for the first render of a page hydrated
 * from its file, which was rendered without them, so they are read together
 * after.
 */
/** What a country has, as the reader details query answers it, while any of it may still be on its way. */
type CountryLists = {
  places?: readonly { code: string }[] | undefined
  residenceStatuses?: readonly { code: string }[] | undefined
  situations?: readonly string[] | undefined
}

/** What an address says about the reader, before the country has confirmed any of it. */
export type AddressDetails = { place: string | null; status: string | null; situation: string | null; work: string | null }

export type ConfirmedDetails = AddressDetails & {
  /** What the address named and the country does not have, which is a stale link rather than a page. */
  unknown: readonly (keyof AddressDetails)[]
  /** True while the list a named detail needs has not arrived, so nothing should be drawn from it yet. */
  waiting: boolean
}

/**
 * SB-318: one confirmation, used by both the route and the shell above it. The shell cannot read the route's context,
 * so both have to check what the address says against the country's own lists, and doing it twice by hand is how the
 * work place came to be confirmed in one and forgotten in the other. Where a place lives and where a reader works are
 * the same list.
 */
export const confirmDetails = (lists: CountryLists, said: AddressDetails): ConfirmedDetails => {
  const { places, residenceStatuses, situations } = lists
  const has = {
    place: places ? (code: string) => places.some((row) => row.code === code) : undefined,
    status: residenceStatuses ? (code: string) => residenceStatuses.some((row) => row.code === code) : undefined,
    situation: situations ? (code: string) => situations.includes(code) : undefined,
    work: places ? (code: string) => places.some((row) => row.code === code) : undefined,
  }
  const unknown: (keyof AddressDetails)[] = []
  let waiting = false
  const settle = (key: keyof AddressDetails): string | null => {
    const value = said[key]
    if (value === null) return null
    const known = has[key]
    // A place is in the address itself, so the page waits for its list rather than drawing without it; the rest are in
    // the query, which a page hydrated from its file reads after its first render anyway (SB-256).
    if (!known) {
      if (key === 'place') waiting = true
      return null
    }
    if (!known(value)) {
      unknown.push(key)
      return null
    }
    return value
  }
  return { place: settle('place'), status: settle('status'), situation: settle('situation'), work: settle('work'), unknown, waiting }
}

export const useAddressCountry = ({ readsQuery = true }: { readsQuery?: boolean } = {}) => {
  const location = useLocation()
  const [, readerSegment = '', destinationSegment = ''] = location.pathname.split('/')
  const reader = readerFromSegment(readerSegment)
  const destination = destinationFromSegment(destinationSegment)
  const code = destination?.country ?? null
  const place = destination?.place ?? null
  const status = readsQuery ? statusFromSearch(location.search) : null
  const situation = readsQuery ? situationFromSearch(location.search) : null
  const work = readsQuery ? workFromSearch(location.search) : null
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

  const [details, refetchDetails] = useQuery({
    query: ReaderDetailsQuery,
    variables: { country: code ?? '', locale: reader?.locale },
    pause: !reader || !code || moved || (place === null && status === null && situation === null && work === null),
    requestPolicy: 'cache-first',
    context: overThePage,
  })

  return { location, reader, code, place, status, situation, work, canonical, moved, result, refetch, details, refetchDetails }
}
