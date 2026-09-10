import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { GraphQLProvider } from 'src/core/graphql'
import { handlers } from 'src/core/graphql/mocks'
import { ShellProvider, useShell } from 'src/core/shell'
import { expect, within } from 'storybook/test'
import { Header } from './Header'

/** Lets a story say the page owns Ask, as Home does before it scrolls. */
const OwnsAsk = ({ owns }: { owns: boolean }) => {
  const { setPageOwnsAsk } = useShell()
  useEffect(() => setPageOwnsAsk(owns), [owns, setPageOwnsAsk])
  return null
}

const meta = {
  title: 'Shared/Header',
  component: Header,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    // The header's Ask asks the API, so the story has a client, and the mocked network.
    (Story, { parameters }) => (
      <GraphQLProvider>
        <MemoryRouter initialEntries={['/en/TR']}>
          <ShellProvider>
            <OwnsAsk owns={parameters['pageOwnsAsk'] === true} />
            {Story()}
          </ShellProvider>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

/** Internal pages: the header asks. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('banner')).toBeInTheDocument()
    await expect(await canvas.findByRole('navigation', { name: /Main/ })).toBeInTheDocument()
    await expect(await canvas.findByRole('combobox', { name: /Ask Skipbureau/ })).toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: /Language/ })).toBeInTheDocument()
  },
}

/** Home before it scrolls: one primary Ask at a time, and it is the page's. */
export const PageOwnsAsk: Story = {
  parameters: { pageOwnsAsk: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('combobox')).toBeNull()
  },
}
