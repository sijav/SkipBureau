import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { GraphQLProvider } from 'src/core/graphql'
import { handlers } from 'src/core/graphql/mocks'
import { isLocale } from 'src/core/i18n'
import { CountryRoute, localeSegment } from 'src/core/router'
import { ShellProvider } from 'src/core/shell'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { SuggestUpdate } from './SuggestUpdate'

/** Over the guide it is about, at the address the language toolbar implies. */
const meta = {
  title: 'Screens/SuggestUpdate',
  component: SuggestUpdate,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    (Story, { globals }) => (
      <GraphQLProvider>
        <MemoryRouter initialEntries={[`/${localeSegment(isLocale(globals['locale']) ? globals['locale'] : 'en-US')}/tr/g/sim-card/suggest`]}>
          <ShellProvider>
            <AppShell header={<Header />}>
              <Routes>
                <Route path=":locale/:country" element={<CountryRoute />}>
                  <Route path="g/:guide/suggest" element={<Story />} />
                </Route>
              </Routes>
            </AppShell>
          </ShellProvider>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof SuggestUpdate>

export default meta
type Story = StoryObj<typeof meta>

// The dialog renders in a portal, outside the canvas.
const screen = () => within(window.document.body)

/** Named by its title, and a description is all it needs to be sent. */
export const Default: Story = {
  play: async () => {
    const dialog = within(await screen().findByRole('dialog', { name: /Suggest an update/ }, { timeout: 5000 }))
    await userEvent.type(dialog.getByRole('textbox', { name: /What changed/ }), 'Now 90 days.')
    await userEvent.click(dialog.getByRole('button', { name: /Send suggestion/ }))
    await expect(await screen().findByRole('dialog', { name: /Thank you/ })).toBeVisible()
  },
}

/** Sending nothing says what to write, next to the field it is about. */
export const Empty: Story = {
  play: async () => {
    const dialog = within(await screen().findByRole('dialog', { name: /Suggest an update/ }, { timeout: 5000 }))
    await userEvent.click(dialog.getByRole('button', { name: /Send suggestion/ }))
    const field = dialog.getByRole('textbox', { name: /What changed/ })
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(dialog.getByText(/even in one sentence/)).toBeVisible()
  },
}

/** An address the server cannot use comes back as how to fix it. */
export const BadEmail: Story = {
  play: async () => {
    const dialog = within(await screen().findByRole('dialog', { name: /Suggest an update/ }, { timeout: 5000 }))
    await userEvent.type(dialog.getByRole('textbox', { name: /What changed/ }), 'The fee changed.')
    await userEvent.type(dialog.getByRole('textbox', { name: /Your email/ }), 'not-an-address')
    await userEvent.click(dialog.getByRole('button', { name: /Send suggestion/ }))
    await expect(await dialog.findByText(/needs an @ and a domain/)).toBeVisible()
  },
}
