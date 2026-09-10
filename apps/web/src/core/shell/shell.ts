import { createContext, useContext } from 'react'
import type { CountryCode } from 'src/core/country'

/**
 * What a page tells the shell above it. Context only flows down, and the
 * header sits above the routes, so a page publishes here instead.
 *
 * `pageOwnsAsk` is the design's scroll handoff, 62:849: one primary Ask at a
 * time. Home owns it while its large field is on screen; then the header takes
 * over. Internal pages never set it, so their header always asks.
 *
 * `country` is the country the route confirmed against the database. The
 * header links only to a confirmed country; before one is known it links to
 * the root, which decides.
 */
export type Shell = {
  pageOwnsAsk: boolean
  setPageOwnsAsk: (owns: boolean) => void
  country: CountryCode | null
  /** Its name in the reader's language, for Ask's results above the route. */
  countryName: string | null
  /** Where the reader comes from, as the address says, for links and the context control above the route. */
  origin: string | null
  setCountry: (country: CountryCode | null, name?: string | null, origin?: string | null) => void
}

export const ShellContext = createContext<Shell>({
  pageOwnsAsk: false,
  setPageOwnsAsk: () => undefined,
  country: null,
  countryName: null,
  origin: null,
  setCountry: () => undefined,
})

export const useShell = () => useContext(ShellContext)
