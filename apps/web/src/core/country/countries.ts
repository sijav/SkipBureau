/**
 * Placeholder. Countries become rows once SB-008 exists; this table is only
 * here so the router can reject an unknown code today.
 */
export const countries = {
  tr: { name: 'Turkey' },
} as const

export type Country = keyof typeof countries

export const defaultCountry: Country = 'tr'

export const isCountry = (value: string): value is Country => value in countries
