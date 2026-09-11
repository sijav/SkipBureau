import type { I18n } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { CountryCode } from 'src/core/country'
import { locales } from 'src/core/i18n'
import { paths } from 'src/core/router'
import type { PageHeadProps } from 'src/shared/page-head'

// The heading and the line under it, the same messages the hero shows.
export const homeHead = (i18n: I18n, country: CountryCode, name: string): PageHeadProps => ({
  title: i18n._(msg`What do you need to do in ${name}?`),
  description: i18n._(msg`Clear, step-by-step guidance for living, studying, working and doing business in ${name}.`),
  path: (locale) => paths.home({ locale, origin: null, country }),
  languages: Object.keys(locales),
})
