import type { ReactNode } from 'react'
import { Context } from './siteContext'

export const SiteProvider = ({ origin, children }: { origin: string; children: ReactNode }) => <Context value={origin}>{children}</Context>
