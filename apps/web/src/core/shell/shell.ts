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
  /** The place where the reader lives, once the database has confirmed it, with its name, for the context control (SB-256). */
  place: { code: string; name: string } | null
  /** The residence status the reader holds, once confirmed, for links built above the route (SB-256). */
  status: string | null
  /**
   * Whether the address's status is read yet: false only for the first render
   * of a page hydrated from its file, which was rendered without it (SB-256).
   */
  readsStatus: boolean
  /** Whether the details panel is open, so a page can open it too, as a rule's answer asks for a detail (SB-257). */
  detailsOpen: boolean
  setDetailsOpen: (open: boolean) => void
}

export const ShellContext = createContext<Shell>({
  pageOwnsAsk: false,
  setPageOwnsAsk: () => undefined,
  country: null,
  countryName: null,
  origin: null,
  place: null,
  status: null,
  readsStatus: true,
  detailsOpen: false,
  setDetailsOpen: () => undefined,
})

export const useShell = () => useContext(ShellContext)
