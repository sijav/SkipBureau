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

// The ink of each part of a control's text, in order.
const inks = (control: HTMLElement | undefined): string[] =>
  [...(control?.querySelectorAll('span') ?? [])].map((part) => window.getComputedStyle(part).color)

/**
 * The states side by side, as the design draws them: none, Partial 44:527 with
 * the gap said inline in the quieter ink, Complete 44:532 with the place in the
 * ink of what is known, and open.
 */
export const States: Story = {
  render: (args) => (
    <Stack direction="row" spacing={3} sx={{ pointerEvents: 'none' }}>
      <ContextControl {...args} />
      <ContextControl {...args} known="From Iran" missing="Add city" />
      <ContextControl {...args} known="From Iran" place="Hamburg" />
      <ContextControl {...args} known="From Iran" open controls="panel" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const [none, partial, complete, open] = await within(canvasElement).findAllByRole('button')
    await expect(window.getComputedStyle(none ?? canvasElement).borderTopStyle).toBe('dashed')
    await expect(window.getComputedStyle(partial ?? canvasElement).borderTopStyle).toBe('solid')

    await expect(partial).toHaveTextContent(/From Iran\s*· Add city/)
    const [known, gap] = inks(partial)
    await expect(gap).not.toBe(known)

    await expect(complete).toHaveTextContent(/From Iran\s*· Hamburg/)
    const [nationality, place] = inks(complete)
    await expect(place).toBe(nationality)

    await expect(open).toHaveAttribute('aria-expanded', 'true')
    await expect(open).toHaveAttribute('aria-controls', 'panel')
  },
}
