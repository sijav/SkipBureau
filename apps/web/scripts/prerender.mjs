import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import { createServer } from 'vite'

/**
 * SB-076: a real file for every page a search engine should find, so GitHub
 * Pages answers 200 from disk rather than 404.html with a 404.
 *
 * Runs after `vite build`. The pages and their heads come from
 * src/core/prerender, loaded through Vite so it is the app's own code: its
 * addresses, its catalogs, the same head functions its screens render.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
// Where the site is served from, for the absolute canonical and alternate links.
const origin = process.env.SKIPBUREAU_ORIGIN || 'http://localhost:5190'
// Every push restarts the API (SB-136), and this runs shortly after one.
const patience = Number(process.env.PRERENDER_PATIENCE_SECONDS ?? 600) * 1000
const pause = 15_000

const reason = (error) => (error instanceof Error ? error.message : String(error))

// Not a failure: without these files the site is exactly what it was before
// them, every address answered by 404.html. So it says so, and ships.
const giveUp = (why) => console.log(`::warning::prerender: ${why}, so every address falls back to 404.html`)

const run = async (server) => {
  const { collect, render } = await server.ssrLoadModule('/src/core/prerender/index.ts')
  const deadline = Date.now() + patience

  let pages
  for (let attempt = 1; !pages; attempt += 1) {
    try {
      pages = await collect(origin)
    } catch (error) {
      if (Date.now() + pause > deadline) return giveUp(`the API did not answer in ${patience / 1000}s (${reason(error)})`)
      console.log(`prerender: attempt ${attempt} failed (${reason(error)}), again in ${pause / 1000}s`)
      await sleep(pause)
    }
  }

  let files
  try {
    files = render(pages, readFileSync(join(dist, 'index.html'), 'utf8'), origin)
  } catch (error) {
    return giveUp(reason(error))
  }

  for (const { file, content } of files) {
    const target = join(dist, file)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  console.log(`prerender: ${pages.length} pages in ${files.length} files, linked from ${origin}`)
}

const server = await createServer({
  root,
  logLevel: 'warn',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  // Nothing is served to a browser, so there is nothing to pre-bundle. And a
  // cache of its own: this server's empty dependency list, written into the
  // shared node_modules/.vite, is the prime suspect for the Storybook tests
  // that then hung on a CommonJS package served unbundled.
  optimizeDeps: { noDiscovery: true, include: [] },
  cacheDir: 'node_modules/.vite-prerender',
})
try {
  await run(server)
} finally {
  await server.close()
}
