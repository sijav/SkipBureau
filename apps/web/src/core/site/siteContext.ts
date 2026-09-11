import { createContext, use } from 'react'

/**
 * Where the site is served from, for the absolute addresses a page gives a
 * search engine and a link preview. The browser knows its own; a page rendered
 * at build time (SB-155) is told which site it is being built for.
 */
export const Context = createContext<string | null>(null)

export const useSiteOrigin = (): string => use(Context) ?? window.location.origin
