import react from '@vitejs/plugin-react-swc'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { src: join(here, 'src') } },
  // GitHub Pages serves the site from a repository subpath, so the built asset
  // URLs have to carry it. SB-013 sets this from CI; it is root in development.
  base: process.env.SKIPBUREAU_BASE ?? '/',
})
