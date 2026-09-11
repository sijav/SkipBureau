import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Serves `dist` the way GitHub Pages serves it, including the parts that hurt.
 *
 * A dev server with an SPA fallback answers every path with the app and a 200,
 * so it proves nothing about the deployed site. Pages answers from a file or
 * not at all, and for an address with no file it serves `404.html` WITH A 404
 * STATUS. That status is the thing the deep-link test has to see.
 *
 * How Pages finds the file, as measured on the live site (SB-076):
 * the file itself; then the address with `.html`, so `/storybook/iframe` is
 * `iframe.html`; then a folder, which without its slash is a 301 to it and
 * with it serves its `index.html`.
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
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

const send = (response, status, file) => {
  response.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(response)
}

const isFile = (path) => existsSync(path) && statSync(path).isFile()

/** A file to serve, a folder to redirect to, or nothing, which is 404.html. */
const answerFor = (urlPath) => {
  if (!urlPath.startsWith(BASE)) return null
  const within = normalize(urlPath.slice(BASE.length)).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(ROOT, within)
  if (!candidate.startsWith(ROOT)) return null
  if (isFile(candidate)) return { file: candidate }
  if (!urlPath.endsWith('/') && isFile(`${candidate}.html`)) return { file: `${candidate}.html` }
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    if (!urlPath.endsWith('/')) return { redirect: true }
    const index = join(candidate, 'index.html')
    return isFile(index) ? { file: index } : null
  }
  return null
}

createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost')
  const answer = answerFor(decodeURIComponent(url.pathname))

  if (answer?.file) return send(response, 200, answer.file)
  if (answer?.redirect) {
    // The raw path, still encoded: a decoded one is not a valid header.
    response.writeHead(301, { location: `${url.pathname}/${url.search}` })
    return response.end()
  }

  // Exactly what Pages does with an unknown path.
  const notFound = join(ROOT, '404.html')
  if (existsSync(notFound)) return send(response, 404, notFound)

  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  response.end('404')
}).listen(PORT, () => {
  console.log(`pages mimic on http://localhost:${PORT}${BASE}`)
})
