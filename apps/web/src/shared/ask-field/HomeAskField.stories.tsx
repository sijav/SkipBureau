import { useLingui } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { HomeAskField } from './HomeAskField'

const Ask = ({ onAsk }: { onAsk?: (question: string) => void }) => {
  const { t } = useLingui()
  const [question, setQuestion] = useState('')
  return (
    <HomeAskField
      label={t`Ask SkipBureau`}
      placeholder={t`Ask a question or describe what you’re trying to do…`}
      value={question}
      onChange={setQuestion}
      onAsk={(asked) => onAsk?.(asked)}
    />
  )
}

const meta = {
  title: 'Shared/HomeAskField',
  component: Ask,
  args: { onAsk: fn() },
  decorators: [(Story) => <Box sx={{ maxWidth: 760 }}>{Story()}</Box>],
} satisfies Meta<typeof Ask>

export default meta
type Story = StoryObj<typeof meta>

/** A question box with its own Ask button; Enter and the button both ask. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const box = await canvas.findByRole('textbox', { name: /Ask SkipBureau/ })
    await expect(window.getComputedStyle(box.closest('.MuiInputBase-root') ?? box).height).toBe('64px')

    await userEvent.type(box, 'Can I buy a house?')
    await userEvent.click(await canvas.findByRole('button', { name: /Ask/ }))
    await expect(args.onAsk).toHaveBeenCalledWith('Can I buy a house?')
  },
}
