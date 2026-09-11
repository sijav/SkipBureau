import { Trans } from '@lingui/react/macro'
import { Box, Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { dark, light, type ColourTokens } from 'src/core/theme'
import { expect, fn, userEvent, within } from 'storybook/test'
import { SavedItem } from './SavedItem'

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

/** A computed colour as the token's hex, so the check names no colour of its own. */
const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const meta = {
  title: 'Shared/SavedItem',
  component: SavedItem,
  args: {
    kind: 'guide',
    to: '/en/TR/guides/student-residence-permit',
    title: <Trans>Student residence permit</Trans>,
    context: <Trans>Istanbul · Iranian nationality</Trans>,
    dated: <Trans>Verified 24 Aug 2026</Trans>,
    onRemove: fn(),
  },
  argTypes: { kind: { control: 'select', options: ['guide', 'process', 'document'] } },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Box sx={{ maxWidth: 560 }}>{Story()}</Box>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof SavedItem>

export default meta
type Story = StoryObj<typeof meta>

/** A ruled row, 88 high, the link and the remove control side by side and never nested. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const link = await canvas.findByRole('link', { name: /Student residence permit/ })
    await expect(link).toHaveAttribute('href', '/en/TR/guides/student-residence-permit')
    await expect(link.querySelectorAll('button')).toHaveLength(0)
    const row = canvasElement.querySelector('[data-kind="guide"]')
    await expect(window.getComputedStyle(row ?? canvasElement).height).toBe('88px')
    await userEvent.click(canvas.getByRole('button', { name: /Remove from saved/ }))
    await expect(args.onRemove).toHaveBeenCalled()
  },
}

/** Continue only on a process, where there is progress to go back to. */
export const Kinds: Story = {
  render: (args) => (
    <Stack>
      <SavedItem {...args} kind="guide" />
      <SavedItem
        {...args}
        kind="process"
        to="/en/TR/setup/start-a-business"
        title={<Trans>Start a company in Turkey</Trans>}
        context={<Trans>3 of 9 steps · paused 18 Aug</Trans>}
        dated={<Trans>Updated 28 Aug 2026</Trans>}
      />
      <SavedItem
        {...args}
        kind="document"
        to="/en/TR/guides/sworn-translation"
        title={<Trans>Sworn translation</Trans>}
        context={<Trans>What counts as a sworn translator in Turkey</Trans>}
        dated={<Trans>Verified 11 Aug 2026</Trans>}
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('link', { name: /Start a company in Turkey/ })).toHaveTextContent(/Continue/)
    await expect(canvas.getByRole('link', { name: /Sworn translation/ })).toHaveTextContent(/Open/)
  },
}

/** Three times the copy grows the row and never spills out of it. */
export const Long: Story = {
  args: {
    title: <Trans>Student residence permit for a second degree, an exchange term, or a language course</Trans>,
    context: <Trans>Istanbul · Iranian nationality · a university that is not on the list of state institutions</Trans>,
  },
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole('link')
    await expect(link.scrollWidth).toBeLessThanOrEqual(link.clientWidth)
    await expect(link.scrollHeight).toBeLessThanOrEqual(link.clientHeight)
  },
}

/** Without its optional lines it is the kind, the title and the action. */
export const Minimal: Story = {
  args: { context: undefined, dated: undefined },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('link')).toHaveTextContent(/Open/)
  },
}

/** The family's focus on the link: a 2px accent-text outline. */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const link = await within(canvasElement).findByRole('link')
    await userEvent.tab()
    await expect(link).toHaveFocus()
    const style = window.getComputedStyle(link)
    await expect(style.outlineWidth).toBe('2px')
    await expect(asHex(style.outlineColor)).toBe(tokensFor(globals['mode']).accentText.toLowerCase())
  },
}

// For LOOKING at: synthetic events never apply :hover.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
