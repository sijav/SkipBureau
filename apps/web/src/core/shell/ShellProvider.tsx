import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
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
  requiresFreshCountry?: boolean
}

export const ShellProvider = ({
  children,
  place = null,
  ownsAskAtStart = false,
  readsQuery = true,
  // SB-403: published rather than derived here, because the address the document opened at is known to AddressShell
  // above and not to this provider. True by default, so a provider that says nothing gets the strict answer.
  requiresFreshCountry = true,
}: ShellProviderProps) => {
  // Where the page starts, from its address, so the first render, the
  // prerender's included, already has it; the scroll handoff moves it after.
  const [pageOwnsAsk, setPageOwnsAsk] = useState(ownsAskAtStart)
  // The details panel's, here rather than in the header, so a page can open it (SB-257).
  const [detailsOpen, setDetailsOpenState] = useState(false)
  // SB-275: what had focus when the panel opened, so closing can put it back on whatever opened it, the header's
  // control or a rule's Tell us far down a page. Refs rather than state: both are read and written synchronously at
  // the moment of the change and nothing renders from them. The focus call is here and not in the state updater,
  // which React may run twice.
  const wasOpen = useRef(false)
  const openedFrom = useRef<HTMLElement | null>(null)
  const setDetailsOpen = useCallback((open: boolean, options?: { restoreFocus?: boolean }) => {
    const was = wasOpen.current
    wasOpen.current = open
    if (open && !was) {
      const active = window.document.activeElement
      openedFrom.current = active instanceof HTMLElement ? active : null
    }
    if (!open && was) {
      const opener = openedFrom.current
      openedFrom.current = null
      // `contains` is not the whole guard: a close that navigates asks for no restore, because the opener can still
      // be connected while its page is on the way out.
      if (options?.restoreFocus !== false && opener && window.document.contains(opener)) opener.focus()
    }
    setDetailsOpenState(open)
  }, [])
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
      requiresFreshCountry,
      detailsOpen,
      setDetailsOpen,
    }),
    // SB-275: setDetailsOpen is listed because it is now a useCallback rather than a useState setter, which the rule
    // knows is stable and this is not. Its own dependency list is empty, so it never changes and the memo never churns.
    [
      pageOwnsAsk,
      country,
      countryName,
      origin,
      placeCode,
      placeName,
      status,
      situation,
      work,
      readsQuery,
      requiresFreshCountry,
      detailsOpen,
      setDetailsOpen,
    ],
  )
  return <ShellContext value={value}>{children}</ShellContext>
}
