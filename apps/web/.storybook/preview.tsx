import type { Preview } from '@storybook/react-vite'
import type { RequestHandler } from 'msw'
import { applyHandlers } from './msw'
import type { ReactElement } from 'react'
import { I18nProvider, isLocale, loadCatalog, locales } from 'src/core/i18n'
import { AppTheme, type ModeChoice } from 'src/core/theme'

/**
 * Every story renders inside the real app theme, so a story cannot look right
 * while the app looks wrong.
 *
 * The mode and direction toolbars let a person switch between the four
 * combinations the design has to hold in: en-US and fa-IR, light and dark.
 *
 * They are also the test matrix. `vitest.config.ts` runs every story four
 * times, once per combination, through `storybookTest({ initialGlobals })`, so
 * a story that only holds in the default globals fails in the other three.
 * That was proven by planting an assertion of light and ltr, which failed in
 * exactly light-fa-IR, dark-en-US and dark-fa-IR.
 */
const preview: Preview = {
  // Every story's first frame used to wait on a dynamic catalog import, because
  // the decorator's I18nProvider renders nothing until a catalog is active. Run
  // alone that import is instant. Run as four browser projects at once it can
  // take longer than the one second Testing Library's findBy waits, and the
  // story renders an empty div: 42 of 80 failed that way after a single file
  // change invalidated the transform cache. Loaders are awaited before render
  // with no clock on them, so the catalogs are warm by the time anything
  // asserts, and a story's findBy races React rather than the network.
  //
  // Both catalogs, not just the active one: `Loaded` fetches fa-IR inside the
  // en-US projects, which is exactly where it kept failing.
  loaders: [
    async () => {
      await Promise.all(Object.keys(locales).filter(isLocale).map(loadCatalog))
    },
  ],

  // Handlers come from the story, through parameters.msw.handlers, and are
  // reset between stories so one cannot leak into the next.
  beforeEach: async ({ parameters }) => {
    const msw = parameters['msw'] as { handlers?: readonly RequestHandler[] } | undefined
    await applyHandlers(msw?.handlers)
  },

  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
  },
  globalTypes: {
    mode: {
      description: 'Follow the operating system, or pin one',
      defaultValue: 'system',
      toolbar: {
        title: 'Mode',
        icon: 'sun',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Language and reading direction',
      defaultValue: 'en-US',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'en-US', title: 'en-US, left to right' },
          { value: 'fa-IR', title: 'fa-IR, right to left' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context): ReactElement => {
      // Narrowed by lookup rather than by a cast: an unknown toolbar value
      // falls back to following the operating system.
      const choices = ['system', 'light', 'dark'] as const
      const mode: ModeChoice = choices.find((value) => value === context.globals.mode) ?? 'system'
      const locale = context.globals.direction === 'fa-IR' ? 'fa-IR' : 'en-US'

      return (
        <I18nProvider locale={locale}>
          <AppTheme mode={mode} direction={locale === 'fa-IR' ? 'rtl' : 'ltr'}>
            <Story />
          </AppTheme>
        </I18nProvider>
      )
    },
  ],
}

export default preview
