import { Trans } from '@lingui/react/macro'
import { Box, Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { FIELD_PAINT, SELECT_TEXT, dark, light, type ColourTokens } from 'src/core/theme'
import { expect, fn, userEvent, within } from 'storybook/test'
import { SelectField } from './SelectField'

const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

const CITIES = [
  { value: 'istanbul', label: <Trans>Istanbul</Trans> },
  { value: 'ankara', label: <Trans>Ankara</Trans> },
  { value: 'izmir', label: <Trans>Izmir</Trans> },
  { value: 'antalya', label: <Trans>Antalya</Trans> },
]

/** The design's sample, controlled, with its copy following the language toolbar. */
const City = ({ initial = 'istanbul', disabled = false, onChange, testId }: { initial?: string; disabled?: boolean; onChange?: (value: string) => void; testId?: string }) => {
  const [city, setCity] = useState(initial)

  return (
    <SelectField
      data-testid={testId}
      label={<Trans>City in Turkey</Trans>}
      placeholder={<Trans>Select a city</Trans>}
      options={CITIES}
      value={city}
      disabled={disabled}
      onChange={(value) => {
        setCity(value)
        onChange?.(value)
      }}
    />
  )
}

const meta = {
  title: 'Shared/SelectField',
  component: City,
  args: { onChange: fn() },
  // The design's sample is 320 wide; in a form the field fills its column.
  decorators: [(Story) => <Box sx={{ maxWidth: 320 }}>{Story()}</Box>],
} satisfies Meta<typeof City>

export default meta
type Story = StoryObj<typeof meta>

/** Named by its label, and choosing reaches the handler. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    // The design's rule: a select always carries its own label, because a
    // placeholder standing in for one is gone the moment a value is chosen.
    const select = await canvas.findByRole('combobox', { name: /City in Turkey|شهری در ترکیه/ })
    await expect(select).toHaveTextContent(/Istanbul|استانبول/)

    await userEvent.click(select)
    // The menu renders in a portal, outside the canvas.
    await userEvent.click(await within(window.document.body).findByRole('option', { name: /Ankara|آنکارا/ }))
    await expect(args.onChange).toHaveBeenCalledWith('ankara')
    await expect(select).toHaveTextContent(/Ankara|آنکارا/)
  },
}

/** Rest and disabled, against their tokens. */
export const States: Story = {
  render: () => (
    <Stack spacing={4}>
      <City testId="rest" />
      <City testId="disabled" initial="" disabled />
    </Stack>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])

    for (const [testId, state] of [
      ['rest', 'rest'],
      ['disabled', 'disabled'],
    ] as const) {
      const control = await canvas.findByTestId(testId)
      const field = control.querySelector('.MuiOutlinedInput-root')
      const outline = control.querySelector('.MuiOutlinedInput-notchedOutline')
      const chevron = control.querySelector('.MuiSelect-icon')
      await expect(field && outline && chevron).toBeTruthy()
      if (!field || !outline || !chevron) continue

      await expect(asHex(window.getComputedStyle(field).backgroundColor)).toBe(tokens[FIELD_PAINT[state].fill].toLowerCase())
      await expect(asHex(window.getComputedStyle(outline).borderTopColor)).toBe(tokens[FIELD_PAINT[state].stroke].toLowerCase())
      await expect(window.getComputedStyle(field).height).toBe('40px')

      const chevronStyle = window.getComputedStyle(chevron)
      await expect(asHex(chevronStyle.color)).toBe(tokens[state === 'disabled' ? SELECT_TEXT.chevronDisabled : SELECT_TEXT.chevron].toLowerCase())
      await expect(chevronStyle.width).toBe('9px')
      await expect(chevronStyle.height).toBe('6px')
    }

    // An empty, disabled select shows its placeholder, never a blank field.
    await expect(await canvas.findByTestId('disabled')).toHaveTextContent(/Select a city|یک شهر انتخاب کنید/)
  },
}

export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const tokens = tokensFor(globals['mode'])
    const select = await within(canvasElement).findByRole('combobox')
    await userEvent.tab()
    await expect(select).toHaveFocus()

    const field = select.closest('.MuiOutlinedInput-root')
    const outline = field?.querySelector('.MuiOutlinedInput-notchedOutline')
    await expect(field && outline).toBeTruthy()
    if (!outline) return
    await expect(asHex(window.getComputedStyle(outline).borderTopColor)).toBe(tokens[FIELD_PAINT.focus.stroke].toLowerCase())
    await expect(window.getComputedStyle(outline).borderTopWidth).toBe('1px')
  },
}

// Hover for LOOKING at: storybook/test's userEvent never applies :hover.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
