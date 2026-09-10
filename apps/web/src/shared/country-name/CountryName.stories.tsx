import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { CountryProvider } from 'src/core/country'
import { GraphQLProvider, createClient } from 'src/core/graphql'
import { emptyHandlers, failingHandlers, handlers } from 'src/core/graphql/mocks'
import { CountryName } from './CountryName'

// The network is faked at the network, by MSW, so the component and the urql
// client are both real here. A mock exchange would have made every one of
// these pass without a request ever being sent.

const meta = {
  title: 'Shared/CountryName',
  component: CountryName,
  argTypes: { variant: { control: 'inline-radio', options: ['body2', 'body1', 'h6'] } },
  args: { variant: 'body2' },
  parameters: { msw: { handlers } },
  decorators: [
    (Story) => (
      // A fresh client per story. One shared client shares its cache, and a
      // story then passes or fails depending on which ran before it.
      <GraphQLProvider client={createClient()}>
        <CountryProvider country="tr">
          <Story />
        </CountryProvider>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof CountryName>

export default meta
type Story = StoryObj<typeof meta>

export const Named: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByTestId('country-name')).toHaveTextContent('Turkey')
  },
}

export const Prominent: Story = { args: { variant: 'h6' } }

export const NotCovered: Story = {
  // The server answered, and this country is not in what it returned.
  parameters: { msw: { handlers: emptyHandlers } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByTestId('country-name')).toHaveTextContent(/Unknown country|کشور ناشناخته/)
  },
}

export const ServerDown: Story = {
  // Not a blank space. A reader on a bad connection gets told something.
  parameters: { msw: { handlers: failingHandlers } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByTestId('country-name')).toBeVisible()
  },
}
