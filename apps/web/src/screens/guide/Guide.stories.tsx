import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, graphql } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { GraphQLProvider, endpoint } from 'src/core/graphql'
import { handlers } from 'src/core/graphql/mocks'
import { isLocale } from 'src/core/i18n'
import { AddressShell, CountryRoute, localeSegment } from 'src/core/router'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { Guide } from './Guide'

/** The whole page as the app assembles it, at the address the language toolbar implies. */
const meta = {
  title: 'Screens/Guide',
  component: Guide,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    (Story, { parameters, globals }) => (
      <GraphQLProvider>
        <MemoryRouter
          initialEntries={[
            `/${localeSegment(isLocale(globals['locale']) ? globals['locale'] : 'en-US')}/${typeof parameters['country'] === 'string' ? parameters['country'] : 'TR'}/guides/${typeof parameters['guide'] === 'string' ? parameters['guide'] : 'sim-card'}`,
          ]}
        >
          <AddressShell>
            <AppShell header={<Header />}>
              <Routes>
                <Route path=":reader/:country" element={<CountryRoute />}>
                  <Route path="guides/:guide" element={<Story />} />
                </Route>
              </Routes>
            </AppShell>
          </AddressShell>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof Guide>

export default meta
type Story = StoryObj<typeof meta>

/** How many times Unreachable's guide has been asked for, so the first can fail. */
let asked = 0

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Two requests in sequence stand before the page: allow for a loaded runner.
    await expect(await canvas.findByRole('heading', { level: 1, name: /Get a SIM Card or eSIM/ }, { timeout: 5000 })).toBeVisible()

    // The way back is to its area, which for Getting Settled is the goal itself.
    const crumbs = within(canvas.getByRole('navigation', { name: /Breadcrumb/ }))
    await expect(crumbs.getByRole('link', { name: /Getting Settled/ })).toHaveAttribute('href', '/en/TR/tasks/getting-settled')

    // The quick answer comes before any detail.
    await expect(canvas.getByText(/Quick answer/)).toBeVisible()

    // Four options, five numbered steps, and the sections the design draws.
    await expect(canvas.getAllByText(/Best for/)).toHaveLength(4)
    for (const name of [/Your options/, /Before you get a SIM/, /What you need/, /How to get it/, /foreign phone/, /What to check/, /Cost and time/, /Where to do it/, /Common problems/]) {
      await expect(canvas.getByRole('heading', { level: 2, name })).toBeVisible()
    }
    const steps = canvas.getByRole('heading', { level: 2, name: /How to get it/ }).closest('section')
    if (steps) await expect(within(steps).getAllByRole('listitem')).toHaveLength(5)

    // The sources, the operator's labelled as such, and the standing disclaimer.
    await expect(canvas.getAllByText(/Official source/).length).toBeGreaterThanOrEqual(3)
    await expect(canvas.getByText(/Operator source/)).toBeVisible()
    await expect(canvas.getByText(/For general information only/)).toBeVisible()

    // Something changed leads to suggesting an update to this guide.
    await expect(canvas.getByRole('link', { name: /Suggest an update/ })).toHaveAttribute('href', '/en/TR/guides/sim-card/suggest')
  },
}

/** SB-086: written in two languages, it names both and x-default, absolute and canonical, and its own canonical. */
export const Alternates: Story = {
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('heading', { level: 1 }, { timeout: 5000 })
    const alternates = [...window.document.head.querySelectorAll('link[rel="alternate"]')]
    await expect(alternates.map((link) => link.getAttribute('hreflang'))).toEqual(['en', 'fa', 'x-default'])
    for (const link of alternates) await expect(link.getAttribute('href')).toMatch(/^https?:\/\/[^/]+.*\/(en|fa)\/TR\/guides\/sim-card$/)
    await expect(window.document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/en\/TR\/guides\/sim-card$/)
  },
}

/**
 * SB-049: written only in a language the reader did not ask for, the guide is
 * shown in the language it has, marked as that language, and says so, and its
 * canonical is that language's address.
 */
export const NotYetTranslated: Story = {
  parameters: { guide: 'written-elsewhere' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByRole('heading', { level: 1 }, { timeout: 5000 })
    await expect(canvas.getByText(/Not in your language yet/)).toBeVisible()
    await expect(title.querySelector('[lang]')?.getAttribute('lang')).toBe('fa-IR')
    await expect(window.document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/[/]fa[/]TR[/]guides[/]written-elsewhere$/)
  },
}

/** Written in English only, it claims no other language, and its canonical is still its own. */
export const OneLanguage: Story = {
  parameters: { guide: 'register-your-address' },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('heading', { level: 1 }, { timeout: 5000 })
    await expect(window.document.head.querySelectorAll('link[rel="alternate"]')).toHaveLength(0)
    await expect(window.document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/en\/TR\/guides\/register-your-address$/)
  },
}

/**
 * SB-257: a guide that links a researched rule shows the rule for everyone and
 * asks where the reader lives; saying Hamburg in the panel its button opens
 * answers for Hamburg, its fee beside the federal deadline and fine, on the same page.
 */
export const RuleAnswers: Story = {
  parameters: { country: 'DE', guide: 'anmeldung' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const section = (await canvas.findByRole('heading', { level: 2, name: /The rules that apply/ }, { timeout: 5000 })).closest('section')
    if (!section) throw new Error('the rules have no section')
    const rules = within(section)
    await expect(rules.getByText(/The rule for everyone/)).toBeVisible()
    await expect(rules.getByText('within 2 weeks')).toBeVisible()
    await expect(rules.getByText('at most €1,000')).toBeVisible()
    await expect(rules.getByRole('link', { name: /§ 17 Anmeldung/ })).toHaveAttribute('href', 'https://www.gesetze-im-internet.de/bmg/__17.html')
    await expect(await rules.findByText(/Where you live can change this/, {}, { timeout: 5000 })).toBeVisible()

    await userEvent.click(rules.getByRole('button', { name: /Tell us/ }))
    const page = within(window.document.body)
    const city = (await page.findByText(/^City in Germany$/, {}, { timeout: 5000 })).parentElement
    if (!city) throw new Error('the panel has no City row')
    await userEvent.click(within(city).getByRole('button', { name: /^Add$/ }))
    await userEvent.click(await page.findByRole('option', { name: /Hamburg/ }, { timeout: 5000 }))

    await expect(await canvas.findByText(/Registration fee/, {}, { timeout: 5000 })).toBeVisible()
    await expect(canvas.getByText('€16')).toBeVisible()
    await expect(canvas.getByText(/For you/)).toBeVisible()
    await expect(canvas.queryByText(/can change this/)).toBeNull()
  },
}

/** A guide the country does not have is not a page. */
export const Missing: Story = {
  parameters: { guide: 'no-such-guide' },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('heading', { level: 1, name: /not/i }, { timeout: 5000 })).toBeVisible()
  },
}

/** A guide with none of the optional sections still holds together. */
export const Sparse: Story = {
  parameters: { guide: 'register-your-address' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 1, name: /Register your address/ }, { timeout: 5000 })).toBeVisible()
    await expect(canvas.queryByText(/Best for/)).toBeNull()
  },
}

/**
 * The API is down after the country answered: the reader is told, and a retry
 * that works brings the guide back rather than blanking the page (SB-046).
 */
export const Unreachable: Story = {
  parameters: {
    msw: {
      // Fails once, then hands the request on: a resolver that returns nothing
      // is not answering, so the next handler that matches does.
      handlers: [
        graphql.link(endpoint()).query('Guide', () => {
          asked += 1
          return asked > 1 ? undefined : HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })
        }),
        ...handlers,
      ],
    },
  },
  beforeEach: () => {
    asked = 0
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /Try again/ }, { timeout: 5000 }))
    await expect(await canvas.findByRole('heading', { level: 1, name: /Get a SIM Card or eSIM/ }, { timeout: 5000 })).toBeVisible()
  },
}

/** Its own counter, not Unreachable's: two stories sharing one would couple their runs. */
let answersAsked = 0

/**
 * SB-272: the guide loaded and the reader's own answer did not. The rule for everyone stays, a notice
 * says what is missing, and asking again brings Hamburg's fee and takes the notice away.
 *
 * The request that fails is the first one CARRYING Hamburg, not the first of all. The answers query
 * fires once at load with an empty reader, so failing that one would leave the retry asking with an
 * empty reader too, and the fee would arrive from picking the city rather than from the retry, which is
 * not what this is meant to prove.
 */
export const AnswersUnreachable: Story = {
  parameters: {
    country: 'DE',
    guide: 'anmeldung',
    msw: {
      handlers: [
        graphql.link(endpoint()).query('GuideAnswers', ({ variables }) => {
          const reader = variables['reader']
          const places = Array.isArray(reader?.residenceRegions) ? reader.residenceRegions : []
          if (!places.includes('DE-HH')) return undefined
          answersAsked += 1
          return answersAsked > 1 ? undefined : HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })
        }),
        ...handlers,
      ],
    },
  },
  beforeEach: () => {
    answersAsked = 0
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const section = (await canvas.findByRole('heading', { level: 2, name: /The rules that apply/ }, { timeout: 5000 })).closest('section')
    if (!section) throw new Error('the rules have no section')
    const rules = within(section)

    await userEvent.click(await rules.findByRole('button', { name: /Tell us/ }, { timeout: 5000 }))
    const page = within(window.document.body)
    const city = (await page.findByText(/^City in Germany$/, {}, { timeout: 5000 })).parentElement
    if (!city) throw new Error('the panel has no City row')
    await userEvent.click(within(city).getByRole('button', { name: /^Add$/ }))
    await userEvent.click(await page.findByRole('option', { name: /Hamburg/ }, { timeout: 5000 }))

    await expect(await canvas.findByText(/could not load the answer for you/, {}, { timeout: 5000 })).toBeVisible()
    await expect(canvas.getByText(/The rule for everyone/)).toBeVisible()
    await expect(canvas.queryByText('€16')).toBeNull()

    await userEvent.click(canvas.getByRole('button', { name: /Try again/ }))

    await expect(await canvas.findByText(/Registration fee/, {}, { timeout: 5000 })).toBeVisible()
    await expect(canvas.getByText('€16')).toBeVisible()
    await expect(canvas.queryByText(/could not load the answer for you/)).toBeNull()
  },
}
