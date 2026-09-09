import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { CountryProvider } from 'src/core/country'
import { NotFound } from 'src/screens/NotFound'
import { aliasedLocale, countryFromSegment, localeFromSegment, samePageIn } from './paths'

/**
 * Guards `/:locale/:country` and hands the country down.
 *
 * An unknown language or country is Not Found, never a redirect to something
 * we do have. A stale link reading `/zz/xx/g/residence-permit` must not
 * silently become another country's rules: a reader would act on them.
 */
export const CountryRoute = () => {
  const { locale = '', country = '' } = useParams()
  const location = useLocation()

  // `/en-US/...` is the lingui tag, kept working for links already shared, but
  // canonicalised so one page has one address.
  const alias = aliasedLocale(locale)
  if (alias) return <Navigate replace to={samePageIn(location, alias)} />

  const known = countryFromSegment(country)
  if (!localeFromSegment(locale) || !known) return <NotFound />

  return (
    <CountryProvider country={known}>
      <Outlet />
    </CountryProvider>
  )
}
