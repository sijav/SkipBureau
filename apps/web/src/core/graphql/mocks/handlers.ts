import { graphql, HttpResponse } from 'msw'
import { endpoint } from 'src/core/graphql'
import { categories, categoryHub, countries, guide, persianNames, questions, simGuide, taskHub, tasks, untranslatedGuide } from './fixtures'

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
  api.query('Countries', ({ variables }) =>
    HttpResponse.json({
      data: { countries: countries.map((row) => (variables['locale'] === 'fa-IR' ? { ...row, name: persianNames[row.code] ?? row.name } : row)) },
    }),
  ),

  api.query('Tasks', () => HttpResponse.json({ data: { tasks } })),

  // Keyed on the country: another country answers with the goals, which are
  // global, and none of Turkey's content.
  api.query('Home', ({ variables }) => {
    const ours = variables['country'] === 'tr'
    return HttpResponse.json({ data: { tasks, categories: ours ? categories : [], questions: ours ? questions : [] } })
  }),

  // Keyed on the variable, so asking for a country we do not have answers
  // null rather than handing back the one we do.
  api.query('Country', ({ variables }) => {
    const match = countries.find((country) => country.code === variables['code'])
    const name = match && variables['locale'] === 'fa-IR' ? (persianNames[match.code] ?? match.name) : match?.name
    return HttpResponse.json({ data: { country: match ? { ...match, name } : null } })
  }),

  // Getting Settled has one area, so its goal opens that area's hub directly.
  api.query('CategoryHub', ({ variables }) =>
    HttpResponse.json({
      data: { categoryHub: variables['country'] === 'tr' && variables['goal'] === 'getting-settled' && variables['slug'] === 'first-week' ? categoryHub : null },
    }),
  ),

  // Only the hub the sample content has; any other goal is Coming soon.
  api.query('TaskHub', ({ variables }) =>
    HttpResponse.json({
      data: {
        taskHub:
          variables['country'] !== 'tr'
            ? null
            : variables['slug'] === 'start-a-business'
              ? taskHub
              : variables['slug'] === 'getting-settled'
                ? { ...taskHub, slug: 'getting-settled', title: 'Getting Settled', heading: null, areas: [{ slug: 'first-week', position: 0, kind: null, title: 'Getting Settled', description: null }], guides: [], sources: [] }
                : null,
      },
    }),
  ),

  // The server's own matching, in small: words of three letters or more, found
  // in a title or its line. With none, what is popular.
  api.query('Ask', ({ variables }) => {
    const ours = variables['country'] === 'tr'
    const words = (typeof variables['text'] === 'string' ? variables['text'] : '')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 3)
    const open = new Set(ours ? categories.map((category) => category.taskSlug) : [])
    const all = {
      tasks: tasks.map((task) => ({ slug: task.slug, title: task.title, subtitle: task.subtitle, open: open.has(task.slug) })),
      guides: ours ? [{ slug: simGuide.slug, title: simGuide.title, verifiedAt: simGuide.verifiedAt }, ...taskHub.guides] : [],
      answers: ours ? questions : [],
    }
    if (words.length === 0) {
      return HttpResponse.json({ data: { ask: { tasks: all.tasks.filter((task) => task.open).slice(0, 1), guides: [], answers: all.answers.slice(0, 1) } } })
    }
    const hits = (...texts: (string | null)[]) => words.some((word) => texts.join(' ').toLowerCase().includes(word))
    return HttpResponse.json({
      data: {
        ask: {
          tasks: all.tasks.filter((task) => hits(task.title, task.subtitle)).slice(0, 3),
          guides: all.guides.filter((guide) => hits(guide.title)).slice(0, 3),
          answers: all.answers.filter((answer) => hits(answer.question, answer.answer)).slice(0, 3),
        },
      },
    })
  }),

  // The results page: the same naive matching as Ask, all of it, and a guide
  // carries the sentence it matched in, as the server's does.
  api.query('Search', ({ variables }) => {
    const ours = variables['country'] === 'tr'
    const words = (typeof variables['text'] === 'string' ? variables['text'] : '')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 3)
    const open = new Set(ours ? categories.map((category) => category.taskSlug) : [])
    const hits = (...texts: (string | null)[]) => words.some((word) => texts.join(' ').toLowerCase().includes(word))
    const written = { slug: simGuide.slug, title: simGuide.title, verifiedAt: simGuide.verifiedAt, snippet: simGuide.quickAnswer, written: true }
    const listed = taskHub.guides.map((guide) => ({ ...guide, snippet: null, written: false }))
    return HttpResponse.json({
      data: {
        search: {
          tasks: tasks
            .filter((task) => open.has(task.slug) && hits(task.title, task.subtitle))
            .map((task) => ({ slug: task.slug, title: task.title, subtitle: task.subtitle, open: true })),
          guides: ours ? [...(hits(written.title, written.snippet) ? [written] : []), ...listed.filter((guide) => hits(guide.title))] : [],
          answers: (ours ? questions : []).filter((answer) => hits(answer.question, answer.answer)),
        },
      },
    })
  }),

  // The server's own checks, so a story sees the same answer the form will.
  api.mutation('SuggestUpdate', ({ variables }) => {
    const input = variables['input']
    const change = typeof input?.change === 'string' ? input.change.trim() : ''
    const email = typeof input?.email === 'string' ? input.email.trim() : ''
    const problem = !change ? 'change' : email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'email' : null
    return HttpResponse.json({ data: { suggestUpdate: { received: problem === null, problem } } })
  }),

  // Asked for in Persian, each answers in English and says so, which is the
  // state a reader of a guide not yet translated sees.
  api.query('Guide', ({ variables }) => {
    const persian = variables.locale === 'fa-IR'
    if (variables.country === 'tr' && variables.slug === 'sim-card') {
      return HttpResponse.json({ data: { guide: persian ? { ...simGuide, translationMissing: true, locales: ['en-US'] } : simGuide } })
    }
    if (variables.country === 'tr' && variables.slug === 'register-your-address') {
      return HttpResponse.json({ data: { guide: persian ? untranslatedGuide : guide } })
    }
    return HttpResponse.json({ data: { guide: null } })
  }),
]

/** An empty server, for the states a reader hits when there is nothing. */
export const emptyHandlers = [
  api.query('Country', () => HttpResponse.json({ data: { country: null } })),
  api.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
  api.query('Tasks', () => HttpResponse.json({ data: { tasks: [] } })),
  api.query('Home', () => HttpResponse.json({ data: { tasks: [], categories: [], questions: [] } })),
  api.query('Guide', () => HttpResponse.json({ data: { guide: null } })),
]

/** A server that is down, which is a state the reader also hits. */
export const failingHandlers = [
  api.query('Country', () => HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })),
  api.query('Countries', () => HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })),
  api.query('Home', () => HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })),
]
