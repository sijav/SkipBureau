import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ContextPanel } from './ContextPanel'

const options = [
  { code: 'af', name: 'Afghanistan' },
  { code: 'de', name: 'Germany' },
  { code: 'ir', name: 'Iran' },
  { code: 'tr', name: 'Turkey' },
]

/** Figma 47:686: a record of what the reader has said, not a settings form. */
const meta = {
  title: 'Shared/ContextPanel',
  component: ContextPanel,
  args: { id: 'details', origin: null, countryName: 'Turkey', options, onOrigin: fn() },
} satisfies Meta<typeof ContextPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing said: Add in the accent, and saying it names where the reader comes from. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const panel = within(canvasElement)
    await expect(await panel.findByRole('dialog', { name: /What Skipbureau knows about you/ })).toBeVisible()
    await userEvent.click(panel.getByRole('button', { name: /^Add$/ }))
    await userEvent.type(panel.getByRole('combobox', { name: /Nationality/ }), 'Ira')
    await userEvent.click(await within(window.document.body).findByRole('option', { name: /Iran/ }))
    await expect(args.onOrigin).toHaveBeenCalledWith('ir')
  },
}

/** Said: the country as text, and Clear all takes it back. */
export const Known: Story = {
  args: { origin: { code: 'ir', name: 'Iran' } },
  play: async ({ canvasElement, args }) => {
    const panel = within(canvasElement)
    await expect(await panel.findByRole('button', { name: /Iran/ })).toBeVisible()
    await userEvent.click(panel.getByRole('button', { name: /Clear all/ }))
    await expect(args.onOrigin).toHaveBeenCalledWith(null)
  },
}
