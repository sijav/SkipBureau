import { createContext, useContext } from 'react'
import type { CountryCode } from 'src/core/country'

/**
 * What the shell above the routes knows about the page. Context only flows
 * down, and the header sits above the routes.
 *
 * `pageOwnsAsk` is the design's scroll handoff, 62:849: one primary Ask at a
 * time. Home owns it while its large field is on screen; then the header takes
 * over. Internal pages never set it, so their header always asks. Where a page
 * starts comes from its address (SB-161), so the prerender draws one Ask.
 *
 * `country` is the country the address names, once the database has confirmed
 * it, read from the address rather than published by the route after mount
 * (SB-161), so the first render has it. The header links only to a confirmed
 * country; before one is known it links to the root, which decides.
 */
export type Shell = {
  pageOwnsAsk: boolean
  setPageOwnsAsk: (owns: boolean) => void
  country: CountryCode | null
  /** Its name in the reader's language, for Ask's results above the route. */
  countryName: string | null
  /** Where the reader comes from, as the address says, for links and the context control above the route. */
  origin: string | null
}

export const ShellContext = createContext<Shell>({
  pageOwnsAsk: false,
  setPageOwnsAsk: () => undefined,
  country: null,
  countryName: null,
  origin: null,
})

export const useShell = () => useContext(ShellContext)
