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

/** Saying where you live puts the place where the country was, keeps the page and the reader, and the control names it (SB-256). */
export const ChooseCity: Story = {
  parameters: { at: '/en-IR/DE/guides/anmeldung' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Partial, Figma 44:527: the nationality, and the gap said inline.
    await userEvent.click(await canvas.findByRole('button', { name: /From Iran\s*· Add city/ }, { timeout: 5000 }))
    const page = within(window.document.body)
    const city = (await page.findByText(/^City in Germany$/, {}, { timeout: 5000 })).parentElement
    if (!city) throw new Error('the panel has no City row')
    await userEvent.click(within(city).getByRole('button', { name: /^Add$/ }))
    await userEvent.click(await page.findByRole('option', { name: /Hamburg/ }, { timeout: 5000 }))
    await waitFor(() => expect(canvas.getByTestId('address')).toHaveTextContent(/^\/en-IR\/DE-HH\/guides\/anmeldung$/), { timeout: 5000 })
    // Complete, Figma 44:532: the nationality and the place.
    await expect(await canvas.findByRole('button', { name: /From Iran\s*· Hamburg/ }, { timeout: 5000 })).toBeVisible()
  },
}

/** Saying what you hold adds it to the address, beside the page's own query (SB-256). */
export const ChooseStatus: Story = {
  parameters: { at: '/en/TR/search?q=residence' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /Add your details/ }, { timeout: 5000 }))
    const page = within(window.document.body)
    const row = (await page.findByText(/^Residence status$/, {}, { timeout: 5000 })).parentElement
    if (!row) throw new Error('the panel has no Residence status row')
    await userEvent.click(within(row).getByRole('button', { name: /^Add$/ }))
    await userEvent.click(await page.findByRole('option', { name: /^Residence permit$/ }, { timeout: 5000 }))
    await waitFor(() => expect(canvas.getByTestId('address')).toHaveTextContent('/en/TR/search?q=residence&status=tr.residence-permit'), {
      timeout: 5000,
    })
  },
}

/** Saying your role adds it to the address after the status, and the panel names it (SB-286). */
export const ChooseRole: Story = {
  parameters: { at: '/en/TR/search?q=residence&status=tr.residence-permit' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(window.document.body)
    const roleRow = async () => {
      const row = (await page.findByText(/^Role$/, {}, { timeout: 5000 })).parentElement
      if (!row) throw new Error('the panel has no Role row')
      return within(row)
    }
    await userEvent.click(await canvas.findByRole('button', { name: /Add your details/ }, { timeout: 5000 }))
    await userEvent.click((await roleRow()).getByRole('button', { name: /^Add$/ }))
    await userEvent.click(await page.findByRole('option', { name: /^Worker$/ }, { timeout: 5000 }))
    await waitFor(
      () => expect(canvas.getByTestId('address')).toHaveTextContent('/en/TR/search?q=residence&status=tr.residence-permit&situation=worker'),
      { timeout: 5000 },
    )

    await userEvent.click(await canvas.findByRole('button', { name: /Add your details/ }, { timeout: 5000 }))
    await expect(await (await roleRow()).findByRole('button', { name: /^Worker$/ }, { timeout: 5000 })).toBeVisible()
  },
}

/** Clear all takes back the nationality, the place, the status and the role, and keeps the country and the page (SB-256, SB-286). */
export const ClearAll: Story = {
  parameters: { at: '/en-IR/DE-HH/guides/anmeldung?status=de.visa-free&situation=company-founder' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /From Iran\s*· Hamburg/ }, { timeout: 5000 }))
    await userEvent.click(await within(window.document.body).findByRole('button', { name: /Clear all/ }, { timeout: 5000 }))
    await waitFor(() => expect(canvas.getByTestId('address')).toHaveTextContent(/^\/en\/DE\/guides\/anmeldung$/), { timeout: 5000 })
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
