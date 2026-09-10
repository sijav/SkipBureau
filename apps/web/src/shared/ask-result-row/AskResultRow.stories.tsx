import { Trans } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { RESULT_PAINT, dark, light, type ColourTokens } from 'src/core/theme'
import { expect, userEvent, within } from 'storybook/test'
import { AskResultRow } from './AskResultRow'

const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

const meta = {
  title: 'Shared/AskResultRow',
  component: AskResultRow,
  args: {
    kind: 'quickAnswer',
    title: <Trans>Can foreigners own a Turkish company?</Trans>,
    detail: <Trans>Yes, no residence permit is required to own shares</Trans>,
  },
  argTypes: { kind: { control: 'select', options: ['task', 'guide', 'quickAnswer', 'recent'] } },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Stack sx={{ maxWidth: 640 }}>{Story()}</Stack>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AskResultRow>

export default meta
type Story = StoryObj<typeof meta>

/** Without a destination the row is text, not a control. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('link')).toBeNull()
    await expect(await canvas.findByText(/Quick answer/)).toBeVisible()
  },
}

/** With one, the whole row is the link. */
export const Linked: Story = {
  args: { to: '/en/tr/g/register-your-address' },
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole('link', { name: /Can foreigners own a Turkish company/ })
    await expect(link).toHaveAttribute('href', '/en/tr/g/register-your-address')
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await expect(window.getComputedStyle(link).outlineWidth).toBe('2px')
  },
}

/** The four kinds of Figma 46:610, each against its tokens. */
export const Kinds: Story = {
  render: () => (
    <Stack spacing={1.25}>
      <AskResultRow data-testid="task" kind="task" title={<Trans>Start a business in Turkey</Trans>} detail={<Trans>Guided process · 9 steps</Trans>} />
      <AskResultRow data-testid="guide" kind="guide" title={<Trans>How to register a company</Trans>} detail={<Trans>Reading · verified Aug 2026</Trans>} />
      <AskResultRow
        data-testid="quickAnswer"
        kind="quickAnswer"
        title={<Trans>Can foreigners own a Turkish company?</Trans>}
        detail={<Trans>Yes, no residence permit is required to own shares</Trans>}
      />
      <AskResultRow data-testid="recent" kind="recent" title={<Trans>What documents do I need for student residence?</Trans>} />
    </Stack>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])

    for (const kind of ['task', 'guide', 'quickAnswer', 'recent'] as const) {
      const row = await canvas.findByTestId(kind)
      await expect(asHex(window.getComputedStyle(row).backgroundColor)).toBe(tokens[RESULT_PAINT[kind].fill].toLowerCase())
      const label = row.querySelector('.result-kind')
      await expect(label).toBeTruthy()
      if (label) await expect(asHex(window.getComputedStyle(label).color)).toBe(tokens[RESULT_PAINT[kind].kind].toLowerCase())
    }

    // A recent search is one line, 42 high; the rest carry a second line, 66.
    await expect(window.getComputedStyle(await canvas.findByTestId('recent')).height).toBe('42px')
    await expect(window.getComputedStyle(await canvas.findByTestId('guide')).height).toBe('66px')
  },
}

// Hover for LOOKING at: storybook/test's userEvent never applies :hover.
export const Hover: Story = { tags: ['!test'], args: { to: '/en/tr/g/register-your-address' }, parameters: { pseudo: { hover: true } } }
