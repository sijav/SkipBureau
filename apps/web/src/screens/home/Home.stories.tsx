import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, graphql } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { GraphQLProvider, endpoint } from 'src/core/graphql'
import { emptyHandlers, handlers } from 'src/core/graphql/mocks'
import { isLocale } from 'src/core/i18n'
import { CountryRoute, localeSegment } from 'src/core/router'
import { ShellProvider } from 'src/core/shell'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { Home } from './Home'

/** The whole page as the app assembles it: shell, header, route guard, screen. */
const meta = {
  title: 'Screens/Home',
  component: Home,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    (Story, { parameters, globals }) => (
      <GraphQLProvider>
        {/* The address carries the language in the app, so here it follows the toolbar. */}
        <MemoryRouter initialEntries={[`/${localeSegment(isLocale(globals['locale']) ? globals['locale'] : 'en-US')}/${typeof parameters['at'] === 'string' ? parameters['at'] : 'tr'}`]}>
          <ShellProvider>
            <AppShell header={<Header />}>
              <Routes>
                <Route path=":locale/:country" element={<CountryRoute />}>
                  <Route index element={<Story />} />
                </Route>
              </Routes>
            </AppShell>
          </ShellProvider>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof Home>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The country the route confirmed, by name, in the heading.
    // The country's request stands before the page; 1s is tight on a loaded CI runner.
    await expect(await canvas.findByRole('heading', { level: 1, name: /Turkey/ }, { timeout: 5000 })).toBeVisible()

    // Twelve goals; the two with content are links, the other ten Coming soon.
    const goals = await canvas.findByRole('heading', { level: 2, name: /What do you want to do/ })
    const grid = goals.closest('section')
    await expect(grid).toBeTruthy()
    if (!grid) return
    await expect(within(grid).getAllByRole('link')).toHaveLength(2)
    await expect(within(grid).getByRole('link', { name: /Start a business/ })).toHaveAttribute('href', '/en/tr/t/start-a-business')
    await expect(within(grid).getAllByText(/Coming soon/)).toHaveLength(10)
    // A global goal names the country it is being read in.
    await expect(within(grid).getByText(/Study in Turkey/)).toBeVisible()

    // Four common questions; the one with a guide links to it.
    const common = (await canvas.findByRole('heading', { level: 2, name: /Common questions/ })).closest('section')
    await expect(common).toBeTruthy()
    if (!common) return
    await expect(within(common).getAllByText(/Quick answer/)).toHaveLength(4)
    await expect(within(common).getByRole('link', { name: /buy a house/ })).toHaveAttribute('href', '/en/tr/g/register-your-address')
  },
}

/** One Ask at a time: with the page's field in view the header has none, and a question to try fills it. */
export const OneAsk: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Home first: before it renders, the header's is the only field there is.
    await canvas.findByRole('heading', { level: 1 }, { timeout: 5000 })
    const fields = await canvas.findAllByRole('combobox', { name: /Ask Skipbureau/ })
    await expect(fields).toHaveLength(1)
    const [field] = fields
    await expect(within(canvas.getByRole('banner')).queryByRole('combobox')).toBeNull()

    await userEvent.click(await canvas.findByRole('button', { name: /student residence/ }))
    await expect(field).toHaveValue('What documents do I need for student residence?')
  },
}

/** A country with no content yet: every goal is Coming soon and there are no questions. */
export const NothingYet: Story = {
  parameters: { at: 'de' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 1, name: /Germany/ }, { timeout: 5000 })).toBeVisible()
    await expect(await canvas.findAllByText(/Coming soon/)).toHaveLength(12)
    await expect(canvas.queryByRole('heading', { name: /Common questions/ })).toBeNull()
  },
}

/** The API is down after the country answered: the reader can retry. */
export const Unreachable: Story = {
  parameters: {
    msw: {
      // The first handler that matches answers, so Home fails and the rest do not.
      handlers: [graphql.link(endpoint()).query('Home', () => HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })), ...handlers],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('button', { name: /Try again/ }, { timeout: 5000 })).toBeVisible()
  },
}

/** An empty server has no country at all, which the route guard answers before Home. */
export const Empty: Story = { tags: ['!test'], parameters: { msw: { handlers: emptyHandlers } } }

/** The Ask field opens its panel: what is popular first, then what matches, grouped by kind. */
export const Ask: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { level: 1 }, { timeout: 5000 })
    const field = canvas.getByRole('combobox', { name: /Ask Skipbureau/ })
    await userEvent.click(field)
    await expect(field).toHaveAttribute('aria-expanded', 'true')

    // The panel renders in a portal, outside the canvas.
    const page = within(window.document.body)
    await expect(await page.findByText(/Popular right now/)).toBeVisible()

    await userEvent.type(field, 'company')
    await expect(await page.findByText(/Results for “company”/)).toBeVisible()
    const panel = within(page.getByRole('dialog', { name: /What Ask found/ }))
    await expect(await panel.findByRole('link', { name: /Start a business/ })).toHaveAttribute('href', '/en/tr/t/start-a-business')

    await userEvent.keyboard('{Escape}')
    await expect(field).toHaveAttribute('aria-expanded', 'false')
  },
}
