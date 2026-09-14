import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { GraphQLProvider } from 'src/core/graphql'
import { handlers } from 'src/core/graphql/mocks'
import { AddressShell } from 'src/core/router'
import { YourDetails } from './YourDetails'

// What the address says now, so a story can read where choosing took the reader.
const Where = () => {
  const { pathname, search, hash } = useLocation()
  return <output data-testid="address">{`${pathname}${search}${hash}`}</output>
}

/** The context control wired to the address, the way the header renders it. */
const meta = {
  title: 'Shared/YourDetails',
  component: YourDetails,
  parameters: { msw: { handlers } },
  decorators: [
    (Story, { parameters }) => (
      <GraphQLProvider>
        <MemoryRouter initialEntries={[typeof parameters['at'] === 'string' ? parameters['at'] : '/en/TR']}>
          <AddressShell>
            <Story />
            <Where />
          </AddressShell>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof YourDetails>

export default meta
type Story = StoryObj<typeof meta>

const choose = async (canvasElement: HTMLElement, from: RegExp, country: RegExp) => {
  const canvas = within(canvasElement)
  await userEvent.click(await canvas.findByRole('button', { name: /Add your details|From / }, { timeout: 5000 }))
  const page = within(window.document.body)
  await userEvent.click(await page.findByRole('button', { name: from }, { timeout: 5000 }))
  await expect(await page.findByRole('option', { name: country }, { timeout: 5000 })).toBeVisible()
  // Only the countries SkipBureau covers. Afghanistan is somewhere a reader can
  // come from, never somewhere they can be here; handing this row the
  // nationality list by mistake would offer it.
  await expect(page.queryByRole('option', { name: /Afghanistan/ })).toBeNull()
  await userEvent.click(page.getByRole('option', { name: country }))
}

/** A search keeps its question, and who is reading, when the reader says they are in Germany (SB-172). */
export const ChangeDestination: Story = {
  parameters: { at: '/en-IR/TR/search?q=residence' },
  play: async ({ canvasElement }) => {
    await choose(canvasElement, /^Turkey$/, /Germany/)
    // A navigation is a transition, which React may defer on a loaded runner: this
    // failed once in the full suite at the default one second, and passed alone.
    await waitFor(() => expect(within(canvasElement).getByTestId('address')).toHaveTextContent('/en-IR/DE/search?q=residence'), { timeout: 5000 })
  },
}

/**
 * A guide belongs to one country, so changing where you are goes to the new
 * country's home rather than to a guide that may not exist there, and the row
 * then names the country the address is in.
 */
export const FromAGuide: Story = {
  parameters: { at: '/en/TR/guides/sim-card' },
  play: async ({ canvasElement }) => {
    await choose(canvasElement, /^Turkey$/, /Germany/)
    await waitFor(() => expect(within(canvasElement).getByTestId('address')).toHaveTextContent(/^\/en\/DE$/), { timeout: 5000 })

    await userEvent.click(await within(canvasElement).findByRole('button', { name: /Add your details/ }))
    await expect(await within(window.document.body).findByRole('button', { name: /^Germany$/ }, { timeout: 5000 })).toBeVisible()
  },
}
