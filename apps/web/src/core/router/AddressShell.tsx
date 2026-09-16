import { startTransition, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { validated } from 'src/core/country'
import { ShellProvider } from 'src/core/shell'
import { confirmDetails, useAddressCountry } from './addressCountry'
import { ownsAskAt } from './routes'

export const AddressShell = ({ children, hydrating = false }: { children: ReactNode; hydrating?: boolean }) => {
  const location = useLocation()
  // SB-256: a page hydrated from its file first renders as the file was
  // rendered, without its address's status or role (SB-286), and reads both
  // straight after, in a transition; every other render reads them at once.
  const [readsQuery, setReadsQuery] = useState(!hydrating)
  useEffect(() => {
    if (!readsQuery) startTransition(() => setReadsQuery(true))
  }, [readsQuery])

  // SB-403: the address this document opened at, and whether the reader has left it since.
  //
  // A prerendered file carries the answer it was built with and ssrExchange seeds the client from it (SB-155), so the
  // first render of THAT address may read the country from the cache and ask nothing. Nothing after it may: the cache
  // then holds an answer of unknown age, and a country deleted since is still in it for as long as the reader stays,
  // which is the one case the guard exists to refuse.
  //
  // A one-way latch, not a comparison with the opening address. The reader in countries.spec.ts navigates away and
  // BACK, so a comparison would say "the opening address" again on the return and serve the deleted country from the
  // cache, failing the very test it was written for. Leaving turns this on; coming back does not turn it off.
  //
  // State rather than a ref, and set during render rather than in an effect. The plan check proposed a ref read in
  // render with the set in an effect; `react-hooks/refs` and `react-hooks/set-state-in-effect` both refuse it, and
  // they are right on the merits here. The comparison has to happen during render, because an effect runs after the
  // render that would already have drawn from the cache. A set during render re-runs this component before its
  // children, so the route below reads the latch on the same navigation that tripped it, and the `!latched` guard
  // means it happens once rather than every render.
  //
  // SB-406: the whole address, the path AND the query, not the path alone. Three of this app's navigations change
  // only the query: `samePageAs`, `samePageInRole` and `samePageAtWork` in paths.ts each return the pathname verbatim
  // and rewrite only the search, for `?status`, `?situation` and `?work`. Comparing paths therefore missed the
  // commonest thing a reader does on a seeded page, answering a rule's question in the details panel, and kept
  // serving the country the file was built with. Choosing a place is different and already worked, because a place
  // goes into the path.
  //
  // The hash is left out on purpose: neither the country query nor the reader details read it, so a jump to #sources
  // is not a new page to this guard and should not start asking the API. Not `location.key` either, which looks like
  // the general answer and is not: react-router takes its key from `history.state.key`, and a `history.pushState({},
  // ...)` navigation sets none, so the opening entry and that navigation both read as "default".
  const address = location.pathname + location.search
  const [openedAt] = useState(address)
  const [latched, setLatched] = useState(false)
  const wentAway = latched || address !== openedAt
  if (wentAway && !latched) setLatched(true)
  // `readsQuery` is NOT this, despite the shape: it governs whether the query string is read (SB-256, SB-286) and it
  // flips in an effect immediately after mount, which would send the first hydrated render to the network.
  const requiresFreshCountry = !hydrating || wentAway

  const { reader, result, place, status, situation, work, details } = useAddressCountry({ readsQuery, requiresFreshCountry })
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
    <ShellProvider
      place={shellPlace}
      ownsAskAtStart={ownsAskAt(location.pathname)}
      readsQuery={readsQuery}
      // SB-403: the route below reads it from here rather than latching again, so the shell and the guard cannot
      // disagree about whether the cache may answer. This shell cannot read it back out of the provider it renders,
      // which is why the latch is owned here and published, not the other way round.
      requiresFreshCountry={requiresFreshCountry}
    >
      {children}
    </ShellProvider>
  )
}
