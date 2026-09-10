import { graphql, HttpResponse } from 'msw'
import { endpoint } from 'src/core/graphql'
import { countries, guide, tasks, untranslatedGuide } from './fixtures'

/**
 * The network, faked at the network.
 *
 * Not a mock exchange. An exchange never sends a request, so the endpoint, the
 * request body and urql's own fetch path all go untested, and every story
 * passes while the browser fails. Here the component and the client are both
 * real and only the server is not.
 *
 * Handlers match the operation AND its variables. A handler keyed on the
 * operation name alone answers a query that asked for the wrong country with
 * the right country's data, which is the bug this is supposed to catch.
 */

const api = graphql.link(endpoint())

export const handlers = [
  api.query('Countries', () => HttpResponse.json({ data: { countries } })),

  api.query('Tasks', () => HttpResponse.json({ data: { tasks } })),

  // Keyed on the variable, so asking for a country we do not have answers
  // null rather than handing back the one we do.
  api.query('Country', ({ variables }) => {
    const match = countries.find((country) => country.code === variables['code'])
    return HttpResponse.json({ data: { country: match ?? null } })
  }),

  api.query('Guide', ({ variables }) => {
    if (variables.country !== 'tr' || variables.slug !== 'register-your-address') {
      return HttpResponse.json({ data: { guide: null } })
    }

    return HttpResponse.json({
      data: { guide: variables.locale === 'fa-IR' ? untranslatedGuide : guide },
    })
  }),
]

/** An empty server, for the states a reader hits when there is nothing. */
export const emptyHandlers = [
  api.query('Country', () => HttpResponse.json({ data: { country: null } })),
  api.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
  api.query('Tasks', () => HttpResponse.json({ data: { tasks: [] } })),
  api.query('Guide', () => HttpResponse.json({ data: { guide: null } })),
]

/** A server that is down, which is a state the reader also hits. */
export const failingHandlers = [
  api.query('Country', () => HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })),
  api.query('Countries', () => HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })),
]
