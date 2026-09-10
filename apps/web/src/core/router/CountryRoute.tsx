import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useQuery } from 'urql'
import { CountryProvider, looksLikeCountry, validated } from 'src/core/country'
import { CountryQuery } from 'src/core/graphql'
import { useShell } from 'src/core/shell'
import { NotFound, Unreachable } from 'src/screens'
import { aliasedLocale, localeFromSegment, samePageIn } from './paths'

/**
 * Guards `/:locale/:country` and hands the country down.
 *
 * Which countries exist is a database answer, not a compile-time one, so this
 * asks. `network-only`: a cached answer would render a country that has since
 * been removed, and the guard would be wrong in exactly the case it exists for.
 * It runs when this route mounts or its country changes, not on every
 * navigation below it.
 *
 * An unknown country is Not Found, never a redirect to one we do have. A stale
 * link reading `/en/zz/g/residence-permit` must not silently become another
 * country's rules: a reader would act on them.
 */
export const CountryRoute = () => {
  const { locale = '', country = '' } = useParams()
  const location = useLocation()

  // `/en-US/...` is the lingui tag, kept working for links already shared, but
  // canonicalised so one page has one address.
  const alias = aliasedLocale(locale)

  // Two letters before asking. It costs the API nothing to refuse `/en/xyz`
  // and it means a typo does not become a request.
  const shaped = !alias && Boolean(localeFromSegment(locale)) && looksLikeCountry(country)

  const [{ data, fetching, error }, refetch] = useQuery({
    query: CountryQuery,
    // The locale too: the country's name comes back in the reader's language.
    variables: { code: country, locale: localeFromSegment(locale) ?? undefined },
    pause: !shaped,
    requestPolicy: 'network-only',
  })

  // The header sits above this route, so the confirmed country is published
  // to the shell rather than handed down; it links only to a country the
  // database has answered for.
  const { setCountry } = useShell()
  const confirmed = data?.country?.code
  useEffect(() => {
    setCountry(confirmed ? validated(confirmed) : null)
    return () => setCountry(null)
  }, [confirmed, setCountry])

  if (alias) return <Navigate replace to={samePageIn(location, alias)} />
  if (!localeFromSegment(locale) || !looksLikeCountry(country)) return <NotFound />

  // Nothing, deliberately, rather than a skeleton: a skeleton shaped like the
  // page is a promise, and the answer may be Not Found.
  if (fetching) return null

  // We could not ask is not the same as the answer is no. One is our fault and
  // the reader can retry; the other is ours to fix and they should look
  // elsewhere. Telling them the second when the first happened sends them away
  // for good.
  // Retried in place rather than by reloading the document: the reader keeps
  // their language, their scroll and the rest of the app, and one failed query
  // does not cost a full boot.
  if (error) return <Unreachable onRetry={() => refetch({ requestPolicy: 'network-only' })} />
  if (!data?.country) return <NotFound />

  return (
    <CountryProvider country={validated(data.country.code)} name={data.country.name}>
      <Outlet />
    </CountryProvider>
  )
}
