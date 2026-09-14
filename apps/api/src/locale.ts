/** The language every text falls back to, and a query's language when it names none. */
export const FALLBACK = 'en-US'

/** A query's `locale` argument. */
export const LOCALE = { type: () => String, nullable: true, defaultValue: FALLBACK } as const

const byLocale = <T extends { locale: string }>(a: T, b: T) => (a.locale < b.locale ? -1 : a.locale > b.locale ? 1 : 0)

/** A row picked in the asked-for language, or the fallback, or nothing. */
export const pick = <T extends { locale: string }>(texts: readonly T[], locale: string): { text: T | null; missing: boolean } => {
  const wanted = texts.find((text) => text.locale === locale)
  if (wanted) return { text: wanted, missing: false }

  // An ABSENT row means not translated. A present row with null columns means
  // deliberately empty. Keeping those apart is why no reader-facing field
  // lives on the parent table. With no English row either, the one whose locale
  // sorts first, so the same question always gets the same row rather than
  // whichever the database returned first (SB-209).
  const fallback = texts.find((text) => text.locale === FALLBACK) ?? [...texts].sort(byLocale)[0] ?? null
  return { text: fallback, missing: true }
}
