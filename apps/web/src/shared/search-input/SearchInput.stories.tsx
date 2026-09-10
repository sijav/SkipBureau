import { useLingui } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SEARCH_PAINT, dark, light, type ColourTokens } from 'src/core/theme'
import { expect, fn, userEvent, within } from 'storybook/test'
import { SearchInput } from './SearchInput'

const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

/** The design's sample, controlled, with its copy following the language toolbar. */
const Search = ({ filled = false, onSubmit, testId }: { filled?: boolean; onSubmit?: (query: string) => void; testId?: string }) => {
  const { t } = useLingui()
  const [query, setQuery] = useState(filled ? t`Can my Turkish company hire an Iranian employee?` : '')

  return (
    <SearchInput
      data-testid={testId}
      label={t`Search the guides`}
      placeholder={t`Ask a question or describe what you’re trying to do…`}
      value={query}
      onChange={setQuery}
      onSubmit={(submitted) => onSubmit?.(submitted)}
    />
  )
}

const meta = {
  title: 'Shared/SearchInput',
  component: Search,
  args: { onSubmit: fn() },
  // The design's sample is 720 wide; on a page it fills its column.
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
} satisfies Meta<typeof Search>

export default meta
type Story = StoryObj<typeof meta>

/** A named search landmark, and Enter sends the sentence. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    // No visible label in the design, so the name comes from `label`; a
    // placeholder is not a name, and it is gone once typing starts.
    await expect(await canvas.findByRole('search')).toBeInTheDocument()
    const box = await canvas.findByRole('searchbox', { name: /Search the guides/ })

    await userEvent.type(box, 'residence permit{Enter}')
    await expect(args.onSubmit).toHaveBeenCalledWith('residence permit')
  },
}

/**
 * One search per story, as on a page: two unnamed search landmarks side by side
 * is exactly what axe's landmark-unique rule refuses, and it was right to.
 */
const checkState = async (canvasElement: HTMLElement, mode: unknown, filled: boolean) => {
  const tokens = tokensFor(mode)
  const form = await within(canvasElement).findByRole('search')
  const field = form.querySelector('.MuiInputBase-root')
  const input = form.querySelector('input')
  const icon = form.querySelector('svg')
  await expect(field && input && icon).toBeTruthy()
  if (!field || !input || !icon) return

  const style = window.getComputedStyle(field)
  await expect(asHex(style.backgroundColor)).toBe(tokens[SEARCH_PAINT.fill].toLowerCase())
  await expect(asHex(style.borderTopColor)).toBe(tokens[SEARCH_PAINT.stroke].toLowerCase())
  await expect(style.height).toBe('56px')

  // The icon deepens once there is a question in the box, as the design's two
  // exports do.
  const iconStyle = window.getComputedStyle(icon)
  await expect(asHex(iconStyle.color)).toBe(tokens[filled ? SEARCH_PAINT.iconFilled : SEARCH_PAINT.icon].toLowerCase())
  await expect(iconStyle.width).toBe('18px')
  await expect(iconStyle.height).toBe('18px')

  // Serif on purpose: the design wants a sentence, not a keyword.
  await expect(window.getComputedStyle(input).fontFamily).toMatch(/^"?Source Serif 4 Variable/)
  await expect(asHex(window.getComputedStyle(input).color)).toBe(tokens[SEARCH_PAINT.value].toLowerCase())
}

export const Empty: Story = { play: ({ canvasElement, globals }) => checkState(canvasElement, globals['mode'], false) }

export const Filled: Story = { args: { filled: true }, play: ({ canvasElement, globals }) => checkState(canvasElement, globals['mode'], true) }

/** A 2px stroke laid inward, so focusing moves nothing. */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const tokens = tokensFor(globals['mode'])
    const box = await within(canvasElement).findByRole('searchbox')
    await userEvent.tab()
    await expect(box).toHaveFocus()

    const field = box.closest('.MuiInputBase-root')
    await expect(field).toBeTruthy()
    if (!field) return
    const style = window.getComputedStyle(field)
    await expect(asHex(style.outlineColor)).toBe(tokens[SEARCH_PAINT.focusStroke].toLowerCase())
    await expect(style.outlineWidth).toBe('2px')
    await expect(style.outlineOffset).toBe('-2px')
    await expect(style.height).toBe('56px')
  },
}
