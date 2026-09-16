import { useMemo, useState, type ReactNode } from 'react'
import type { CountryCode } from 'src/core/country'
import { ShellContext } from './shell'

/** The country an address names, once the database has answered for it, and what the reader has said of their place, status, role and workplace in it. */
export type ShellPlace = {
  country: CountryCode
  countryName: string
  origin: string | null
  place?: { code: string; name: string } | null | undefined
  status?: string | null | undefined
  situation?: string | null | undefined
  work?: string | null | undefined
}

export type ShellProviderProps = {
  children: ReactNode
  place?: ShellPlace | null
  ownsAskAtStart?: boolean
  readsQuery?: boolean
}

export const ShellProvider = ({ children, place = null, ownsAskAtStart = false, readsQuery = true }: ShellProviderProps) => {
  // Where the page starts, from its address, so the first render, the
  // prerender's included, already has it; the scroll handoff moves it after.
  const [pageOwnsAsk, setPageOwnsAsk] = useState(ownsAskAtStart)
  // The details panel's, here rather than in the header, so a page can open it (SB-257).
  const [detailsOpen, setDetailsOpen] = useState(false)
  const country = place?.country ?? null
  const countryName = place?.countryName ?? null
  const origin = place?.origin ?? null
  const placeCode = place?.place?.code ?? null
  const placeName = place?.place?.name ?? null
  const status = place?.status ?? null
  const situation = place?.situation ?? null
  const work = place?.work ?? null
  const value = useMemo(
    () => ({
      pageOwnsAsk,
      setPageOwnsAsk,
      country,
      countryName,
      origin,
      place: placeCode !== null && placeName !== null ? { code: placeCode, name: placeName } : null,
      status,
      situation,
      work,
      readsQuery,
      detailsOpen,
      setDetailsOpen,
    }),
    [pageOwnsAsk, country, countryName, origin, placeCode, placeName, status, situation, work, readsQuery, detailsOpen],
  )
  return <ShellContext value={value}>{children}</ShellContext>
}
