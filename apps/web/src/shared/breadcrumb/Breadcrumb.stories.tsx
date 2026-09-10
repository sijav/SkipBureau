import { Trans } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { Breadcrumb } from './Breadcrumb'

const meta = {
  title: 'Shared/Breadcrumb',
  component: Breadcrumb,
  args: { trail: [{ label: <Trans>Home</Trans>, to: '/en/tr' }, { label: <Trans>Getting Settled</Trans> }] },
  decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>],
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

/** The way back is a link; where you are is not, and says so. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const nav = within(await within(canvasElement).findByRole('navigation', { name: /Breadcrumb/ }))
    await expect(nav.getByRole('link', { name: /Home/ })).toHaveAttribute('href', '/en/tr')
    await expect(nav.getByText(/Getting Settled/)).toHaveAttribute('aria-current', 'page')
  },
}

export const ThreeDeep: Story = {
  args: {
    trail: [{ label: <Trans>Home</Trans>, to: '/en/tr' }, { label: <Trans>Start a business</Trans>, to: '/en/tr/t/start-a-business' }, { label: <Trans>Register your company</Trans> }],
  },
}
