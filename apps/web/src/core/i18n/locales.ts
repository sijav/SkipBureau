/**
 * The locales the app ships with.
 *
 * `dir` lives here rather than being derived at the call site, because the
 * document direction, the MUI theme direction and the emotion cache all have to
 * agree, and three places deciding it independently is how a layout ends up
 * half mirrored. `path` is here for the same reason: a locale cannot be added
 * without deciding what it looks like in a URL.
 */
export const locales = {
  'en-US': { label: 'English', dir: 'ltr', catalog: 'en', path: 'en' },
  'fa-IR': { label: 'فارسی', dir: 'rtl', catalog: 'fa', path: 'fa' },
} as const

export type Locale = keyof typeof locales
export type Direction = (typeof locales)[Locale]['dir']

export const defaultLocale: Locale = 'en-US'

export const isLocale = (value: string): value is Locale => value in locales

/** The tag a person's browser asks for, mapped to one we actually have. */
export const nearestLocale = (requested: readonly string[]): Locale => {
  for (const tag of requested) {
    if (isLocale(tag)) return tag
    const language = tag.split('-')[0]?.toLowerCase()
    const match = (Object.keys(locales) as Locale[]).find((locale) => locale.split('-')[0]?.toLowerCase() === language)
    if (match) return match
  }
  return defaultLocale
}
