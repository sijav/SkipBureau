import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { ContextControl } from './ContextControl'

/** Figma 44:542: what SkipBureau knows about the reader, as a control. */
const meta = {
  title: 'Shared/ContextControl',
  component: ContextControl,
  args: { onClick: fn() },
} satisfies Meta<typeof ContextControl>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing said yet: the dashed invitation. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const control = await within(canvasElement).findByRole('button', { name: /Add your details/ })
    await expect(control).toHaveAttribute('aria-expanded', 'false')
    control.click()
    await expect(args.onClick).toHaveBeenCalled()
  },
}

/** The three states side by side, as the design draws them. */
export const States: Story = {
  render: (args) => (
    <Stack direction="row" spacing={3} sx={{ pointerEvents: 'none' }}>
      <ContextControl {...args} />
      <ContextControl {...args} known="From Iran" />
      <ContextControl {...args} known="From Iran" open controls="panel" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const [none, known, open] = await within(canvasElement).findAllByRole('button')
    await expect(window.getComputedStyle(none ?? canvasElement).borderTopStyle).toBe('dashed')
    await expect(window.getComputedStyle(known ?? canvasElement).borderTopStyle).toBe('solid')
    await expect(open).toHaveAttribute('aria-expanded', 'true')
    await expect(open).toHaveAttribute('aria-controls', 'panel')
  },
}
