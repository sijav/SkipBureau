import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { CountryProvider, validated } from 'src/core/country'
import { CountryName } from './CountryName'

// No network here any more. The route guard confirms the country exists and
// puts its name in context, so this component reads rather than fetches: a
// second request would ask the same question twice and could answer it
// differently. The fetching states now belong to CountryRoute.

const meta = {
  title: 'Shared/CountryName',
  component: CountryName,
  argTypes: { variant: { control: 'inline-radio', options: ['body2', 'body1', 'h6'] } },
  args: { variant: 'body2' },
  decorators: [
    (Story) => (
      <CountryProvider country={validated('tr')} name="Turkey">
        <Story />
      </CountryProvider>
    ),
  ],
} satisfies Meta<typeof CountryName>

export default meta
type Story = StoryObj<typeof meta>

export const Named: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByTestId('country-name')).toHaveTextContent('Turkey')
  },
}

export const Prominent: Story = { args: { variant: 'h6' } }

export const Unnamed: Story = {
  // A country the API covers but has no name for in this language. SB-091 is
  // the per-locale name; until then this is what a Persian reader could see.
  decorators: [
    (Story) => (
      <CountryProvider country={validated('tr')} name="">
        <Story />
      </CountryProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByTestId('country-name')).toHaveTextContent(
      /Unnamed country/,
    )
  },
}
