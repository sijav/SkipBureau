import { Box } from '@mui/material'
import type { ReactNode } from 'react'

export type AppShellProps = {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
}

/**
 * Slots, and nothing else.
 *
 * The header's own contents, its two heights and its drawer, are SB-038. This
 * exists so the page structure and its overflow behaviour can be proven before
 * anything is put in it.
 *
 * `100dvh` rather than `vh`: mobile browser chrome makes `vh` taller than the
 * visible area, which shows up as a page that scrolls a little for no reason.
 */
export const AppShell = ({ children, header, footer }: AppShellProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', overflowX: 'clip' }}>
    {header}
    <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
      {children}
    </Box>
    {footer}
  </Box>
)
