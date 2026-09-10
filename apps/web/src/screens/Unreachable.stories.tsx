import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { NotFound } from './NotFound'
import { Unreachable } from './Unreachable'

// Until this file existed, `Unreachable` was rendered by no test in either
// runner: coverage put it at zero statements. The screen that tells a reader
// our own API is down was the least proven thing in the app.

const meta = {
  title: 'Screens/Unreachable',
  component: Unreachable,
  parameters: { layout: 'fullscreen' },
  args: { onRetry: fn() },
} satisfies Meta<typeof Unreachable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { level: 1 })).toHaveTextContent(/could not load this|نتوانست/)

    // The retry has to DO something. A button that says "Try again" and is
    // wired to nothing is worse than no button, because the reader spends
    // their patience on it.
    await userEvent.click(await canvas.findByRole('button', { name: /Try again|تلاش دوباره/ }))
    await expect(args.onRetry).toHaveBeenCalledOnce()
  },
}

/**
 * The regression this card exists to prevent: the two screens collapsing into
 * one message. Each screen's own story would still pass if someone made them
 * identical, so this compares them to each other.
 *
 * It asserts the headings DIFFER rather than asserting fixed strings, so
 * rewording either message leaves it green and unifying them turns it red.
 */
export const DistinctFromNotFound: Story = {
  render: (args) => (
    <>
      <Unreachable {...args} />
      <NotFound />
    </>
  ),
  play: async ({ canvasElement }) => {
    const headings = await within(canvasElement).findAllByRole('heading', { level: 1 })
    const said = headings.map((heading) => heading.textContent?.trim() ?? '')

    await expect(said).toHaveLength(2)
    await expect(new Set(said).size, `both screens told the reader "${said[0]}"`).toBe(2)
  },
}
