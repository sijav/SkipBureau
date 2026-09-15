import { useMemo, useState, type ReactNode } from 'react'
import type { CountryCode } from 'src/core/country'
import { ShellContext } from './shell'

/** The country an address names, once the database has answered for it, and what the reader has said of their place and status in it. */
export type ShellPlace = {
  country: CountryCode
  countryName: string
  origin: string | null
  place?: { code: string; name: string } | null | undefined
  status?: string | null | undefined
}

export type ShellProviderProps = {
  children: ReactNode
  place?: ShellPlace | null
  ownsAskAtStart?: boolean
  readsStatus?: boolean
}

export const ShellProvider = ({ children, place = null, ownsAskAtStart = false, readsStatus = true }: ShellProviderProps) => {
  // Where the page starts, from its address, so the first render, the
  // prerender's included, already has it; the scroll handoff moves it after.
  const [pageOwnsAsk, setPageOwnsAsk] = useState(ownsAskAtStart)
  const country = place?.country ?? null
  const countryName = place?.countryName ?? null
  const origin = place?.origin ?? null
  const placeCode = place?.place?.code ?? null
  const placeName = place?.place?.name ?? null
  const status = place?.status ?? null
  const value = useMemo(
    () => ({
      pageOwnsAsk,
      setPageOwnsAsk,
      country,
      countryName,
      origin,
      place: placeCode !== null && placeName !== null ? { code: placeCode, name: placeName } : null,
      status,
      readsStatus,
    }),
    [pageOwnsAsk, country, countryName, origin, placeCode, placeName, status, readsStatus],
  )
  return <ShellContext value={value}>{children}</ShellContext>
}
