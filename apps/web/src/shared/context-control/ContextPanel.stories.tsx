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
    place: null,
    places: [
      { code: 'TR-06', name: 'Ankara', depth: 0 },
      { code: 'TR-34', name: 'İstanbul', depth: 0 },
      { code: 'TR-35', name: 'İzmir', depth: 0 },
    ],
    status: null,
    // A kind of a status follows the one it is a kind of, a level in.
    statuses: [
      { code: 'tr.residence-permit', name: 'Residence permit', depth: 0 },
      { code: 'tr.short-stay', name: 'A stay on a visa or visa exemption', depth: 0 },
      { code: 'tr.short-stay.visa', name: 'Visa', depth: 1 },
    ],
    situation: null,
    situations: [
      { code: 'company-founder', name: 'Company founder' },
      { code: 'worker', name: 'Worker' },
    ],
    onOrigin: fn(),
    onCountry: fn(),
    onPlace: fn(),
    onStatus: fn(),
    onSituation: fn(),
    onWork: fn(),
    onClear: fn(),
  },
} satisfies Meta<typeof ContextPanel>

export default meta
type Story = StoryObj<typeof meta>

// The Add of one row, found by the row's label, so a story reads which row it taps.
const addIn = (canvasElement: HTMLElement, row: RegExp): HTMLElement => {
  const label = within(canvasElement).getByText(row)
  const line = label.parentElement
  if (!line) throw new Error(`no row holds ${row}`)
  return within(line).getByRole('button', { name: /^Add$/ })
}

/** Nothing said: Add in the accent, and saying it names where the reader comes from. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const panel = within(canvasElement)
    await expect(await panel.findByRole('dialog', { name: /What Skipbureau knows about you/ })).toBeVisible()
    await userEvent.click(addIn(canvasElement, /^Nationality$/))
    await userEvent.type(panel.getByRole('combobox', { name: /Nationality/ }), 'Ira')
    await userEvent.click(await within(window.document.body).findByRole('option', { name: /Iran/ }))
    await expect(args.onOrigin).toHaveBeenCalledWith('ir')
  },
}

/** Said: the country as text, and Clear all takes back everything the reader said. */
export const Known: Story = {
  args: { origin: { code: 'ir', name: 'Iran' } },
  play: async ({ canvasElement, args }) => {
    const panel = within(canvasElement)
    await expect(await panel.findByRole('button', { name: /Iran/ })).toBeVisible()
    await userEvent.click(panel.getByRole('button', { name: /Clear all/ }))
    await expect(args.onClear).toHaveBeenCalled()
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

/** Where in the country the reader lives (SB-256): Add in the accent, and choosing names the place. */
export const City: Story = {
  play: async ({ canvasElement, args }) => {
    const panel = within(canvasElement)
    await userEvent.click(addIn(canvasElement, /^City in Turkey$/))
    await userEvent.type(panel.getByRole('combobox', { name: /City in Turkey/ }), 'zmi')
    await userEvent.click(await within(window.document.body).findByRole('option', { name: /zmir/ }))
    await expect(args.onPlace).toHaveBeenCalledWith('TR-35')
  },
}

/** The residence status the reader holds (SB-256): a kind of a status is listed under it, a level in. */
export const ResidenceStatus: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(addIn(canvasElement, /^Residence status$/))
    const page = within(window.document.body)
    const visa = await page.findByRole('option', { name: /^Visa$/ })
    const stay = page.getByRole('option', { name: /A stay on a visa/ })
    await expect(parseFloat(window.getComputedStyle(visa).paddingInlineStart)).toBeGreaterThan(
      parseFloat(window.getComputedStyle(stay).paddingInlineStart),
    )
    await userEvent.click(visa)
    await expect(args.onStatus).toHaveBeenCalledWith('tr.short-stay.visa')
  },
}

/** The reader's role (SB-286): the situations the country's rules name, and choosing one says it. */
export const Role: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(addIn(canvasElement, /^Role$/))
    await userEvent.click(await within(window.document.body).findByRole('option', { name: /^Worker$/ }))
    await expect(args.onSituation).toHaveBeenCalledWith('worker')
  },
}

/** SB-313: where the reader works, which is not where they live, chosen from the same places the country has. */
export const WhereYouWork: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(addIn(canvasElement, /^Where you work$/))
    await userEvent.click(await within(window.document.body).findByRole('option', { name: /^Ankara$/ }))
    await expect(args.onWork).toHaveBeenCalledWith('TR-06')
  },
}

/** Figma 47:663, Complete: every row the reader has said, as text. */
export const Complete: Story = {
  args: {
    origin: { code: 'ir', name: 'Iran' },
    place: { code: 'TR-35', name: 'İzmir' },
    status: { code: 'tr.residence-permit', name: 'Residence permit' },
    situation: { code: 'worker', name: 'Worker' },
    work: { code: 'TR-06', name: 'Ankara' },
  },
  play: async ({ canvasElement, args }) => {
    const panel = within(canvasElement)
    await expect(await panel.findByRole('button', { name: /İzmir/ })).toBeVisible()
    await expect(panel.getByRole('button', { name: /Residence permit/ })).toBeVisible()
    await expect(panel.getByRole('button', { name: /^Worker$/ })).toBeVisible()
    await expect(panel.queryAllByRole('button', { name: /^Add$/ })).toHaveLength(0)
    await userEvent.click(panel.getByRole('button', { name: /Clear all/ }))
    await expect(args.onClear).toHaveBeenCalled()
  },
}
