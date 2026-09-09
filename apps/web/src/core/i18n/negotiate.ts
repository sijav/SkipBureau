import { defaultLocale, isLocale, nearestLocale, type Locale } from './locales'

const STORAGE_KEY = 'skipbureau.locale'

/**
 * Where to send a visitor who arrived at `/` with no language in the URL.
 *
 * This runs once, at the root redirect, and nowhere else. Once a URL names a
 * language that URL is the only authority: a stored preference must never
 * override the language of a link somebody was sent.
 */
export const negotiateLocale = (): Locale => {
  const stored = remembered()
  if (stored) return stored
  if (typeof navigator === 'undefined') return defaultLocale
  return nearestLocale(navigator.languages ?? [navigator.language])
}

export const remembered = (): Locale | null => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored && isLocale(stored) ? stored : null
  } catch {
    // Storage blocked. A visitor still gets a language, just not a remembered
    // one.
    return null
  }
}

export const remember = (locale: Locale): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Not remembering is survivable. Refusing to switch is not.
  }
}
