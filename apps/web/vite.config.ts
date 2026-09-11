import react from '@vitejs/plugin-react-swc'
import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import { dark, light } from './src/core/theme/tokens'

const here = dirname(fileURLToPath(import.meta.url))

const lingui = () => react({ plugins: [['@lingui/swc-plugin', {}]] })

/**
 * GitHub Pages has no rewrite rule, so an address with no file gets
 * `404.html`. Shipping the app shell there is what makes such a link open its
 * page instead of a Pages error page. Every page that should be found also
 * gets a file of its own, with a 200, from `npm run prerender` (SB-076); this
 * is for the rest. DESIGN.md says which those are.
 *
 * A build step rather than a checked-in copy, because a checked-in one drifts
 * from `index.html` silently and the first symptom is production only.
 */
const pagesFallback = (): Plugin => ({
  name: 'skipbureau-pages-fallback',
  apply: 'build',
  closeBundle() {
    const out = join(here, 'dist')
    copyFileSync(join(out, 'index.html'), join(out, '404.html'))
  },
})

/**
 * SB-157: the browser's own chrome, a phone's address bar, in the page's
 * ground, one per scheme. From the tokens rather than typed into index.html, so
 * it follows the palette with no second copy.
 */
const themeColour = (): Plugin => ({
  name: 'skipbureau-theme-colour',
  transformIndexHtml: () =>
    [
      { scheme: 'light', ground: light.background },
      { scheme: 'dark', ground: dark.background },
    ].map(({ scheme, ground }): HtmlTagDescriptor => ({
      tag: 'meta',
      attrs: { name: 'theme-color', content: ground, media: `(prefers-color-scheme: ${scheme})` },
      injectTo: 'head',
    })),
})

export default defineConfig({
  plugins: [lingui(), pagesFallback(), themeColour()],
  resolve: { alias: { src: join(here, 'src') } },
  // GitHub Pages serves the site from a repository subpath, so the built asset
  // URLs have to carry it. SB-013 sets this from CI; it is root in development.
  base: process.env.SKIPBUREAU_BASE ?? '/',
  // Which file each module was built into, for the prerender: a page's file
  // preloads its own screen's chunk and catalog alongside the entry (SB-159).
  build: { manifest: true },
})
