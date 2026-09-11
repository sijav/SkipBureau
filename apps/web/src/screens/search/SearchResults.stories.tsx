import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { GraphQLProvider } from 'src/core/graphql'
import { handlers } from 'src/core/graphql/mocks'
import { isLocale } from 'src/core/i18n'
import { AddressShell, CountryRoute, localeSegment } from 'src/core/router'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { SearchResults } from './SearchResults'

/** What a question found, at the address it was asked from. */
const meta = {
  title: 'Screens/SearchResults',
  component: SearchResults,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    (Story, { globals, parameters }) => (
      <GraphQLProvider>
        <MemoryRouter
          initialEntries={[
            `/${localeSegment(isLocale(globals['locale']) ? globals['locale'] : 'en-US')}/TR/search?q=${encodeURIComponent(typeof parameters['q'] === 'string' ? parameters['q'] : 'sim')}`,
          ]}
        >
          <AddressShell>
            <AppShell header={<Header />}>
              <Routes>
                <Route path=":reader/:country" element={<CountryRoute />}>
                  <Route path="search" element={<Story />} />
                </Route>
              </Routes>
            </AppShell>
          </AddressShell>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof SearchResults>

export default meta
type Story = StoryObj<typeof meta>

/** A guide found by what is written in it, with the sentence it was found in. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 1, name: /sim/ }, { timeout: 5000 })).toBeVisible()
    await expect(await canvas.findByRole('link', { name: /Get a SIM Card or eSIM/ })).toHaveAttribute('href', '/en/TR/guides/sim-card')
    await expect(canvas.getByRole('status')).toHaveTextContent(/result/)
  },
}

/** Nothing found is said, with somewhere to go, never an empty page. */
export const NothingFound: Story = {
  parameters: { q: 'zzzz' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 2, name: /Nothing matches yet/ }, { timeout: 5000 })).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Back to the home page/ })).toHaveAttribute('href', '/en/TR')
  },
}
