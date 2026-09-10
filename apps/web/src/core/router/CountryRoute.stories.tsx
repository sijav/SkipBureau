import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, graphql } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { GraphQLProvider, endpoint } from 'src/core/graphql'
import { emptyHandlers, failingHandlers, handlers } from 'src/core/graphql/mocks'
import { CountryName } from 'src/shared/country-name'
import { CountryRoute } from './CountryRoute'

/**
 * The wiring, which two screen stories cannot prove.
 *
 * `NotFound` and `Unreachable` each having a passing story says nothing about
 * whether an errored query reaches the second rather than the first, and that
 * distinction is the whole point: one means we do not cover this place, the
 * other means we could not reach our own API. So these drive the real
 * `useQuery` through MSW and watch which screen comes out.
 *
 * The handlers already existed in `src/core/graphql/mocks` and no story had
 * ever used them, which is why that file also sat at zero coverage.
 */

/** A country the fixtures do have, so the success path resolves. */
const AT = '/en/TR'

const meta = {
  title: 'Foundations/CountryRoute',
  component: CountryRoute,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    (Story) => (
      // No client passed, so the provider makes its own and memoises it: one
      // client per story, so a cached answer cannot leak into the next.
      <GraphQLProvider>
        <MemoryRouter initialEntries={[AT]}>
          <Routes>
            <Route path=":reader/:country" element={<Story />}>
              <Route index element={<CountryName variant="h6" />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof CountryRoute>

export default meta
type Story = StoryObj<typeof meta>

export const Found: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByTestId('country-name')).toHaveTextContent('Turkey')
  },
}

export const NotCovered: Story = {
  parameters: { msw: { handlers: emptyHandlers } },
  play: async ({ canvasElement }) => {
    // The server answered, and the answer was no. That is a place we do not
    // cover, and the reader should look elsewhere.
    await expect(await within(canvasElement).findByRole('heading', { level: 1 })).toHaveTextContent(
      /does not exist/,
    )
  },
}

export const ApiIsDown: Story = {
  parameters: { msw: { handlers: failingHandlers } },
  play: async ({ canvasElement }) => {
    // The server did not answer at all. Same absence of data, entirely
    // different fact, and the reader can act on this one by waiting.
    await expect(await within(canvasElement).findByRole('heading', { level: 1 })).toHaveTextContent(
      /could not load this/,
    )
  },
}

/**
 * Fails once, then works. The one story that ties the whole path together:
 * the error reaches `Unreachable`, the retry it was given re-executes the
 * query rather than reloading the document, and the country arrives.
 */
export const Recovers: Story = {
  parameters: {
    msw: {
      handlers: [
        graphql
          .link(endpoint())
          .query('Country', () => HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 }), {
            once: true,
          }),
        ...handlers,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { level: 1 })).toHaveTextContent(/could not load this/)

    await userEvent.click(await canvas.findByRole('button', { name: /Try again/ }))

    await expect(await canvas.findByTestId('country-name')).toHaveTextContent('Turkey')
  },
}
