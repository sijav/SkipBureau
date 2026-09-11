import { Box } from '@mui/material'
import type { ReactNode } from 'react'

export type AppShellProps = {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
}

export const AppShell = ({ children, header, footer }: AppShellProps) => (
  // `100dvh` rather than `vh`: mobile browser chrome makes `vh` taller than the
  // visible area, which shows up as a page that scrolls a little for no reason.
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', overflowX: 'clip' }}>
    {header}
    <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
      {children}
    </Box>
    {footer}
  </Box>
)
