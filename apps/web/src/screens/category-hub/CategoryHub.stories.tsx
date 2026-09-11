import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { GraphQLProvider } from 'src/core/graphql'
import { handlers } from 'src/core/graphql/mocks'
import { isLocale } from 'src/core/i18n'
import { AddressShell, CountryRoute, localeSegment } from 'src/core/router'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { TaskHub } from 'src/screens/task-hub'
import { CategoryHub } from './CategoryHub'

/** The whole page as the app assembles it, at the address the language toolbar implies. */
const meta = {
  title: 'Screens/CategoryHub',
  component: CategoryHub,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    (Story, { parameters, globals }) => (
      <GraphQLProvider>
        <MemoryRouter
          initialEntries={[
            `/${localeSegment(isLocale(globals['locale']) ? globals['locale'] : 'en-US')}/TR/tasks/${typeof parameters['path'] === 'string' ? parameters['path'] : 'getting-settled/first-week'}`,
          ]}
        >
          <AddressShell>
            <AppShell header={<Header />}>
              <Routes>
                <Route path=":reader/:country" element={<CountryRoute />}>
                  <Route path="tasks/:goal" element={<TaskHub />} />
                  <Route path="tasks/:goal/:category" element={<Story />} />
                </Route>
              </Routes>
            </AppShell>
          </AddressShell>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof CategoryHub>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Two requests in sequence stand before the page: allow for a loaded runner.
    await expect(await canvas.findByRole('heading', { level: 1, name: /Getting Settled/ }, { timeout: 5000 })).toBeVisible()

    // A goal with one area: the way back is straight to Home.
    const crumbs = within(canvas.getByRole('navigation', { name: /Breadcrumb/ }))
    await expect(crumbs.getAllByRole('link')).toHaveLength(1)

    // Where to start, and it leads to that guide.
    await expect(canvas.getByRole('link', { name: /Start here/ })).toHaveAttribute('href', '/en/TR/guides/sim-card')

    // Six guides, each with its reading time.
    const list = canvas.getByRole('heading', { level: 2, name: /What do you need help with/ }).parentElement
    if (list) await expect(within(list).getAllByText(/min read/)).toHaveLength(6)

    // The checklist ticks, and nothing about it is saved.
    const checklist = within(canvas.getByRole('region', { name: /Getting started checklist/ }))
    const [first] = checklist.getAllByRole('checkbox')
    await expect(checklist.getAllByRole('checkbox')).toHaveLength(6)
    if (first) {
      await userEvent.click(first)
      await expect(first).toBeChecked()
    }

    // A related goal with nothing in this country yet is not a link.
    await expect(canvas.getByRole('link', { name: /Start a business/ })).toBeVisible()
    await expect(canvas.queryByRole('link', { name: /Renting a Home/ })).toBeNull()
  },
}

/** The goal's own address opens its single area's hub, with no hub of its own between. */
export const ThroughItsGoal: Story = {
  parameters: { path: 'getting-settled' },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('heading', { level: 1, name: /Getting Settled/ }, { timeout: 5000 })).toBeVisible()
    await expect(within(canvasElement).queryByText(/Task hub/)).toBeNull()
  },
}

/** An area that is not under the goal the address names is not a page. */
export const WrongGoal: Story = {
  parameters: { path: 'start-a-business/first-week' },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('heading', { level: 1, name: /not/i }, { timeout: 5000 })).toBeVisible()
  },
}
