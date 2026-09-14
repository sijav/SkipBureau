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
  args: {
    id: 'details',
    origin: null,
    country: { code: 'tr', name: 'Turkey' },
    // Only the countries SkipBureau covers can be where the reader is, which is
    // a different list from every country somebody can come from.
    countries: [
      { code: 'de', name: 'Germany' },
      { code: 'tr', name: 'Turkey' },
    ],
    countryName: 'Turkey',
    options,
    onOrigin: fn(),
    onCountry: fn(),
  },
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

/** Where the reader is (SB-172): the address's country as text, and choosing another offers only the countries we cover. */
export const CurrentlyIn: Story = {
  play: async ({ canvasElement, args }) => {
    const panel = within(canvasElement)
    await userEvent.click(await panel.findByRole('button', { name: /^Turkey$/ }))
    const input = panel.getByRole('combobox', { name: /Currently in/ })
    await expect(input).toHaveFocus()
    const page = within(window.document.body)
    await expect(await page.findByRole('option', { name: /Germany/ })).toBeVisible()
    // Iran is somewhere a reader can come from, not somewhere we cover.
    await expect(page.queryByRole('option', { name: /Iran/ })).toBeNull()
    // A reader who taps the row and types is replacing the name it showed, not adding to it.
    await userEvent.keyboard('Ger')
    await expect(input).toHaveValue('Ger')
    await expect(page.queryByRole('option', { name: /Turkey/ })).toBeNull()
    await userEvent.click(page.getByRole('option', { name: /Germany/ }))
    await expect(args.onCountry).toHaveBeenCalledWith('de')
  },
}
