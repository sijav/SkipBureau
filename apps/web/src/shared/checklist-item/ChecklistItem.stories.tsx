import { Trans } from '@lingui/react/macro'
import { Box, Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { dark, light, type ColourTokens } from 'src/core/theme'
import { expect, userEvent, within } from 'storybook/test'
import { ChecklistItem } from './ChecklistItem'

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

/** A computed colour as the token's hex, so the check names no colour of its own. */
const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const details = [
  { label: <Trans>Original required</Trans>, value: <Trans>Yes, bring the original and one copy</Trans> },
  { label: <Trans>Translation</Trans>, value: <Trans>Turkish, by a sworn translator (yeminli tercüman)</Trans> },
  { label: <Trans>Notarisation</Trans>, value: <Trans>Required at any notary (noter)</Trans> },
  { label: <Trans>Copies</Trans>, value: '2' },
]

const meta = {
  title: 'Shared/ChecklistItem',
  component: ChecklistItem,
  args: {
    state: 'required',
    title: <Trans>Passport translation</Trans>,
    flags: <Trans>Sworn translation · Notarised · 2 copies</Trans>,
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['required', 'completed', 'optional', 'missing', 'expired', 'needsVerification', 'notApplicable'],
    },
  },
  decorators: [(Story) => <Box sx={{ maxWidth: 640 }}>{Story()}</Box>],
} satisfies Meta<typeof ChecklistItem>

export default meta
type Story = StoryObj<typeof meta>

/** 64 high, ruled underneath, the status a word as well as a colour. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Required')).toBeVisible()
    const item = canvasElement.querySelector('[data-state="required"]')
    await expect(window.getComputedStyle(item ?? canvasElement).height).toBe('64px')
  },
}

/** The seven states as the design draws them, every one the same height. */
export const States: Story = {
  render: () => (
    <Stack>
      <ChecklistItem
        state="required"
        title={<Trans>Passport translation</Trans>}
        flags={<Trans>Sworn translation · Notarised · 2 copies</Trans>}
      />
      <ChecklistItem state="completed" title={<Trans>Passport translation</Trans>} flags={<Trans>Ready since 14 Aug 2026</Trans>} />
      <ChecklistItem
        state="optional"
        title={<Trans>Previous residence permit</Trans>}
        flags={<Trans>Helps if you have held a permit before</Trans>}
      />
      <ChecklistItem
        state="missing"
        title={<Trans>Rental contract</Trans>}
        flags={<Trans>Notarised · blocks the appointment step</Trans>}
      />
      <ChecklistItem
        state="expired"
        title={<Trans>Health insurance policy</Trans>}
        flags={<Trans>Expired 12 Jul 2026 · must cover the full permit period</Trans>}
      />
      <ChecklistItem
        state="needsVerification"
        title={<Trans>Student certificate</Trans>}
        flags={<Trans>Must be dated within the last 30 days</Trans>}
      />
      <ChecklistItem state="notApplicable" title={<Trans>Parental consent</Trans>} flags={<Trans>Applies to applicants under 18</Trans>} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Whole words: Ready is also the start of a flag line.
    for (const word of ['Required', 'Ready', 'Optional', 'Missing', 'Renew', 'Check date', 'Not for you']) {
      await expect(await canvas.findByText(word)).toBeVisible()
    }
    for (const item of canvasElement.querySelectorAll('[data-state]')) {
      await expect(window.getComputedStyle(item).height).toBe('64px')
    }
  },
}

/** With details, the row is a disclosure that shows them underneath. */
export const Details: Story = {
  args: { details },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = await canvas.findByRole('button', { name: /Passport translation/ })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(await canvas.findByText(/sworn translator/)).toBeVisible()
  },
}

/** The family's focus: the resting surface and a 2px accent-text outline. */
export const Focus: Story = {
  args: { details },
  play: async ({ canvasElement, globals }) => {
    const toggle = await within(canvasElement).findByRole('button')
    await userEvent.tab()
    await expect(toggle).toHaveFocus()
    const style = window.getComputedStyle(toggle)
    await expect(style.outlineWidth).toBe('2px')
    await expect(asHex(style.outlineColor)).toBe(tokensFor(globals['mode']).accentText.toLowerCase())
  },
}

// For LOOKING at: synthetic events never apply :hover.
export const Hover: Story = { tags: ['!test'], args: { details }, parameters: { pseudo: { hover: true } } }
