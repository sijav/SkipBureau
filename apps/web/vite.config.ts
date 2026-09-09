import react from '@vitejs/plugin-react-swc'
import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))

const lingui = () => react({ plugins: [['@lingui/swc-plugin', {}]] })

/**
 * GitHub Pages has no rewrite rule, so a deep link resolves to no file and
 * Pages serves `404.html`. Shipping the app shell there is what makes a link
 * to a guide open that guide instead of a Pages error page.
 *
 * A build step rather than a checked-in copy, because a checked-in one drifts
 * from `index.html` silently and the first symptom is production only. See
 * DESIGN.md for what this does not fix, which is the 404 status code.
 */
const pagesFallback = (): Plugin => ({
  name: 'skipbureau-pages-fallback',
  apply: 'build',
  closeBundle() {
    const out = join(here, 'dist')
    copyFileSync(join(out, 'index.html'), join(out, '404.html'))
  },
})

export default defineConfig({
  plugins: [lingui(), pagesFallback()],
  resolve: { alias: { src: join(here, 'src') } },
  // GitHub Pages serves the site from a repository subpath, so the built asset
  // URLs have to carry it. SB-013 sets this from CI; it is root in development.
  base: process.env.SKIPBUREAU_BASE ?? '/',
})
