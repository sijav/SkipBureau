import { useMemo, useState, type ReactNode } from 'react'
import type { CountryCode } from 'src/core/country'
import { ShellContext } from './shell'

/** The country an address names, once the database has answered for it. */
export type ShellPlace = { country: CountryCode; countryName: string; origin: string | null }

export type ShellProviderProps = {
  children: ReactNode
  /** Null until the database has confirmed the address's country, and for an address without one. */
  place?: ShellPlace | null
  /** Whether the page at this address opens with its own Ask on screen, as Home does. */
  ownsAskAtStart?: boolean
}

export const ShellProvider = ({ children, place = null, ownsAskAtStart = false }: ShellProviderProps) => {
  // Where the page starts, from its address, so the first render, the
  // prerender's included, already has it; the scroll handoff moves it after.
  const [pageOwnsAsk, setPageOwnsAsk] = useState(ownsAskAtStart)
  const country = place?.country ?? null
  const countryName = place?.countryName ?? null
  const origin = place?.origin ?? null
  const value = useMemo(() => ({ pageOwnsAsk, setPageOwnsAsk, country, countryName, origin }), [pageOwnsAsk, country, countryName, origin])
  return <ShellContext value={value}>{children}</ShellContext>
}
