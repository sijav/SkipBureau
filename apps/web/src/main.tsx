import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRoot } from './AppRoot'

const root = window.document.getElementById('root')
if (!root) throw new Error('index.html has no #root, so there is nowhere to mount')

createRoot(root).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)
