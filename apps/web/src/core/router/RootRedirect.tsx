import { Navigate } from 'react-router-dom'
import { defaultCountry, validated } from 'src/core/country'
import { negotiateLocale } from 'src/core/i18n'
import { paths } from './paths'

export const RootRedirect = () => (
  <Navigate replace to={paths.home({ locale: negotiateLocale(), origin: null, country: validated(defaultCountry) })} />
)
