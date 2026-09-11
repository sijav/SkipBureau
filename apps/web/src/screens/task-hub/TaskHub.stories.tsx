import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { GraphQLProvider } from 'src/core/graphql'
import { handlers } from 'src/core/graphql/mocks'
import { isLocale } from 'src/core/i18n'
import { AddressShell, CountryRoute, localeSegment } from 'src/core/router'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { TaskHub } from './TaskHub'

/** The whole page as the app assembles it, at the address the language toolbar implies. */
const meta = {
  title: 'Screens/TaskHub',
  component: TaskHub,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    (Story, { parameters, globals }) => (
      <GraphQLProvider>
        <MemoryRouter
          initialEntries={[
            `/${localeSegment(isLocale(globals['locale']) ? globals['locale'] : 'en-US')}/TR/tasks/${typeof parameters['goal'] === 'string' ? parameters['goal'] : 'start-a-business'}`,
          ]}
        >
          <AddressShell>
            <AppShell header={<Header />}>
              <Routes>
                <Route path=":reader/:country" element={<CountryRoute />}>
                  <Route path="tasks/:goal" element={<Story />} />
                </Route>
              </Routes>
            </AppShell>
          </AddressShell>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof TaskHub>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The goal's own heading, naming the country it is being read in. Two
    // requests stand before it, the country and then the hub, one after the
    // other, which is more than the 1s default on a loaded CI runner.
    await expect(await canvas.findByRole('heading', { level: 1, name: /Start a business in Turkey/ }, { timeout: 5000 })).toBeVisible()

    // Eight areas under the heading, the four with a kind labelled, each a link
    // to its category hub.
    const areas = (await canvas.findByRole('heading', { level: 2, name: /What you’ll need to think about/ })).closest('section')
    await expect(areas).toBeTruthy()
    if (!areas) return
    const rows = within(areas).getAllByRole('link')
    await expect(rows).toHaveLength(8)
    await expect(rows[0]).toHaveTextContent(/Decision/)
    await expect(rows[0]).toHaveAttribute('href', '/en/TR/tasks/start-a-business/choose-a-company-type')

    // The alternative route is kept apart from the areas.
    const other = (await canvas.findByRole('heading', { level: 2, name: /Other routes/ })).closest('section')
    if (other) await expect(within(other).getByRole('link', { name: /Startup and tech visa/ })).toBeVisible()

    // Six guides, and the source behind them, with when it was last checked.
    const guides = (await canvas.findByRole('heading', { level: 2, name: /^Guides$/ })).closest('section')
    if (guides) await expect(within(guides).getAllByRole('link')).toHaveLength(6)
    await expect(canvas.getByText(/Last checked 24 Aug 2026/)).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Visit official source/ })).toHaveAttribute('href', 'https://ticaret.gov.tr/')
  },
}

/** A goal this country has nothing under is not a page. */
export const ComingSoon: Story = {
  parameters: { goal: 'taxes' },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('heading', { level: 1, name: /not/i }, { timeout: 5000 })).toBeVisible()
  },
}
