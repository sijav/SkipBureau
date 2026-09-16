import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { RetryNotice } from './RetryNotice'

/**
 * SB-272: one request on a page failed and the reader can ask again. It is said
 * beside what is still on screen rather than replacing it, which is what makes it
 * different from the Unreachable screen.
 */
const meta = {
  title: 'Shared/RetryNotice',
  component: RetryNotice,
  args: {
    children: 'We could not load the answer for you.',
    onRetry: fn(),
  },
} satisfies Meta<typeof RetryNotice>

export default meta
type Story = StoryObj<typeof meta>

/** What failed, in the caller's words, and a way to ask again. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const notice = within(canvasElement)
    // The first story the runner opens can render after its play has started.
    await expect(await notice.findByText(/could not load the answer for you/, {}, { timeout: 5000 })).toBeVisible()
    await userEvent.click(notice.getByRole('button', { name: 'Try again' }))
    await expect(args.onRetry).toHaveBeenCalled()
  },
}

/** The caller decides the wording, so a longer sentence still reads as one note. */
export const LongerReason: Story = {
  args: { children: 'We could not load the answer for you. What is shown below is the rule for everyone.' },
  play: async ({ canvasElement }) => {
    const notice = within(canvasElement)
    await expect(await notice.findByText(/the rule for everyone/, {}, { timeout: 5000 })).toBeVisible()
    await expect(notice.getByRole('button', { name: 'Try again' })).toBeVisible()
  },
}
