import { Navigate } from 'react-router-dom'
import { defaultCountry, validated } from 'src/core/country'
import { negotiateLocale } from 'src/core/i18n'
import { paths } from './paths'

/**
 * The only place a language is guessed.
 *
 * A visitor at `/` has told us nothing, so their stored choice, then their
 * browser's languages, decide where they land. Every URL below this one names
 * its own language and this never runs again.
 */
export const RootRedirect = () => <Navigate replace to={paths.home(negotiateLocale(), validated(defaultCountry))} />
