import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, graphql } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { GraphQLProvider, endpoint } from 'src/core/graphql'
import { fixtures, handlers } from 'src/core/graphql/mocks'
import { isLocale } from 'src/core/i18n'
import { AddressShell, CountryRoute, localeSegment } from 'src/core/router'
import { AppShell } from 'src/shared/app-shell'
import { Header } from 'src/shared/header'
import { TaskHub } from './TaskHub'

/** The whole page as the app assembles it, at the address the language toolbar implies. */
const meta = {
  title: 'Screens/TaskHub',
  component: TaskHub,
  parameters: { layout: 'fullscreen', msw: { handlers } },
  decorators: [
    (Story, { parameters, globals }) => (
      <GraphQLProvider>
        <MemoryRouter
          initialEntries={[
            `/${localeSegment(isLocale(globals['locale']) ? globals['locale'] : 'en-US')}/TR/tasks/${typeof parameters['goal'] === 'string' ? parameters['goal'] : 'start-a-business'}`,
          ]}
        >
          <AddressShell>
            <AppShell header={<Header />}>
              <Routes>
                <Route path=":reader/:country" element={<CountryRoute />}>
                  <Route path="tasks/:goal" element={<Story />} />
                </Route>
              </Routes>
            </AppShell>
          </AddressShell>
        </MemoryRouter>
      </GraphQLProvider>
    ),
  ],
} satisfies Meta<typeof TaskHub>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The goal's own heading, naming the country it is being read in. Two
    // requests stand before it, the country and then the hub, one after the
    // other, which is more than the 1s default on a loaded CI runner.
    await expect(await canvas.findByRole('heading', { level: 1, name: /Start a business in Turkey/ }, { timeout: 5000 })).toBeVisible()

    // Eight areas under the heading, the four with a kind labelled, each a link
    // to its category hub.
    const areas = (await canvas.findByRole('heading', { level: 2, name: /What you’ll need to think about/ })).closest('section')
    await expect(areas).toBeTruthy()
    if (!areas) return
    const rows = within(areas).getAllByRole('link')
    await expect(rows).toHaveLength(8)
    await expect(rows[0]).toHaveTextContent(/Decision/)
    await expect(rows[0]).toHaveAttribute('href', '/en/TR/tasks/start-a-business/choose-a-company-type')

    // The alternative route is kept apart from the areas.
    const other = (await canvas.findByRole('heading', { level: 2, name: /Other routes/ })).closest('section')
    if (other) await expect(within(other).getByRole('link', { name: /Startup and tech visa/ })).toBeVisible()

    // Six guides, and the source behind them, with when it was last checked.
    const guides = (await canvas.findByRole('heading', { level: 2, name: /^Guides$/ })).closest('section')
    if (guides) await expect(within(guides).getAllByRole('link')).toHaveLength(6)
    await expect(canvas.getByText(/Last checked 24 Aug 2026/)).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Visit official source/ })).toHaveAttribute('href', 'https://ticaret.gov.tr/')
  },
}

/** A goal this country has nothing under is not a page. */
export const ComingSoon: Story = {
  parameters: { goal: 'taxes' },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('heading', { level: 1, name: /not/i }, { timeout: 5000 })).toBeVisible()
  },
}

/** The API is down after the country answered: the reader can retry, never a blank page. */
export const Unreachable: Story = {
  parameters: {
    // The first handler that matches answers, so this screen's request fails
    // while everything the page stands on, the country above all, still lands.
    msw: { handlers: [graphql.link(endpoint()).query('TaskHub', () => HttpResponse.json({ errors: [{ message: 'the API is unreachable' }] }, { status: 500 })), ...handlers] },
  },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('button', { name: /Try again/ }, { timeout: 5000 })).toBeVisible()
  },
}

/** A goal whose areas and guides are all researched says nothing about sample content (SB-302). */
export const Researched: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 1 }, { timeout: 5000 })).toBeVisible()
    await expect(canvas.queryByText(/sample content for design review/)).toBeNull()
  },
}

/** A goal still holding a sample area says so, under its sources. */
export const SampleContent: Story = {
  parameters: {
    msw: {
      handlers: [
        graphql
          .link(endpoint())
          .query('TaskHub', () => HttpResponse.json({ data: { taskHub: { ...fixtures.taskHub, sample: true } } })),
        ...handlers,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/sample content for design review/, {}, { timeout: 5000 })).toBeVisible()
  },
}

/**
 * A goal holding a researched area beside a sample one (SB-304). The flag is one boolean for the page and it means
 * `.some()`, so the notice has to claim only part of the page: a researched, dated row must not be called sample
 * material. The pair is the one apps/api/test/hub-sample.e2e.spec.ts proves the API really returns together.
 */
export const Mixed: Story = {
  parameters: {
    goal: 'getting-settled',
    msw: {
      handlers: [
        graphql.link(endpoint()).query('TaskHub', () =>
          HttpResponse.json({
            data: {
              taskHub: {
                ...fixtures.taskHub,
                slug: 'getting-settled',
                title: 'Getting Settled',
                heading: null,
                sample: true,
                areas: [
                  { slug: 'first-week', position: 0, kind: null, title: 'Your first week', description: 'What most people deal with first.' },
                  { slug: 'register-your-address', position: 1, kind: null, title: 'Register your address', description: 'Where you live, on the record.' },
                ],
                guides: [],
                sources: [],
              },
            },
          }),
        ),
        ...handlers,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/Some descriptions on this page are sample content/, {}, { timeout: 5000 })).toBeVisible()
    // The wording it must not go back to, which called the researched row sample material too.
    await expect(canvas.queryByText(/^Descriptions on this page are sample content/)).toBeNull()
  },
}
