import { Trans } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ChecklistLine } from './ChecklistLine'

const meta = {
  title: 'Shared/ChecklistLine',
  component: ChecklistLine,
  args: { label: <Trans>Arrange home internet</Trans> },
  decorators: [(Story) => <Stack sx={{ maxWidth: 344 }}>{Story()}</Stack>],
} satisfies Meta<typeof ChecklistLine>

export default meta
type Story = StoryObj<typeof meta>

/** A checkbox, named by its line, that ticks and unticks; 40 high. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('checkbox', { name: /Arrange home internet/ })
    await expect(box).not.toBeChecked()
    await userEvent.click(box)
    await expect(box).toBeChecked()
    await userEvent.click(box)
    await expect(box).not.toBeChecked()
    const line = box.closest('label')
    if (line) await expect(window.getComputedStyle(line).height).toBe('40px')
  },
}

export const Checked: Story = { args: { defaultChecked: true } }

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('checkbox')
    await userEvent.tab()
    await expect(box).toHaveFocus()
    const line = box.closest('label')
    if (line) await expect(window.getComputedStyle(line).outlineWidth).toBe('2px')
  },
}

// For LOOKING at: synthetic events never apply :hover.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
