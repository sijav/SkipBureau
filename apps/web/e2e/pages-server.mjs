import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Serves `dist` the way GitHub Pages serves it, including the parts that hurt.
 *
 * A dev server with an SPA fallback answers every path with the app and a 200,
 * so it proves nothing about the deployed site. Pages serves a file if one
 * exists at that exact path, and otherwise serves `404.html` WITH A 404 STATUS.
 * That status is the thing the deep-link test has to see.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const BASE = process.env.SKIPBUREAU_BASE ?? '/'
const PORT = Number(process.env.PAGES_PORT ?? 5190)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

const send = (response, status, file) => {
  response.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(response)
}

const fileFor = (urlPath) => {
  if (!urlPath.startsWith(BASE)) return null
  const within = normalize(urlPath.slice(BASE.length)).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(ROOT, within)
  if (!candidate.startsWith(ROOT)) return null
  if (!existsSync(candidate)) return null
  if (statSync(candidate).isDirectory()) {
    const index = join(candidate, 'index.html')
    return existsSync(index) ? index : null
  }
  return candidate
}

createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  const file = fileFor(urlPath)

  if (file) return send(response, 200, file)

  // Exactly what Pages does with an unknown path.
  const notFound = join(ROOT, '404.html')
  if (existsSync(notFound)) return send(response, 404, notFound)

  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  response.end('404')
}).listen(PORT, () => {
  console.log(`pages mimic on http://localhost:${PORT}${BASE}`)
})
