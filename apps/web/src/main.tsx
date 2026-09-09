import CssBaseline from '@mui/material/CssBaseline'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppTheme } from './core/theme'

const root = document.getElementById('root')
if (!root) throw new Error('index.html has no #root, so there is nowhere to mount')

createRoot(root).render(
  <StrictMode>
    <AppTheme>
      <CssBaseline />
      <App />
    </AppTheme>
  </StrictMode>,
)
