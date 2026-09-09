import { createContext, use } from 'react'
import type { Locale } from './locales'

export type LocaleContext = {
  /** The locale that is actually active, never one that was only requested. */
  locale: Locale
}

/**
 * The context and its hook live apart from the provider component.
 *
 * Not a style preference: a module that exports both a component and a hook
 * breaks React Fast Refresh, so editing the provider would reload the whole
 * app instead of the component. The lint rule that says so is on.
 *
 * There is no `setLocale`. The locale lives in the URL, so changing it is a
 * navigation, which the language control does with `samePageIn`.
 */
export const Context = createContext<LocaleContext | null>(null)

export const useLocale = (): LocaleContext => {
  const context = use(Context)
  if (!context) throw new Error('useLocale needs an I18nProvider above it')
  return context
}
