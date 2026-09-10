import { execFile, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { startPglite } from '../../api/scripts/pglite-server.mjs'

/**
 * A real API for Playwright: PGlite, the committed migrations, the seed, and
 * the built NestJS server.
 *
 * The web tests used to start Vite alone, which meant nothing could prove a
 * claim about data. "Insert a country row and the URL works" is not testable
 * against a mock: MSW would prove a fresh client sees what MSW was told, which
 * is not the same question.
 *
 * It writes the database URL to a file so a test can connect to the same
 * database the API is using and change rows underneath it.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const API = resolve(HERE, '..', '..', 'api')
const PORT = Number(process.env.E2E_API_PORT ?? 4500)
const DB_PORT = Number(process.env.E2E_DB_PORT ?? 5520)

const cli = createRequire(join(API, 'package.json')).resolve('prisma/build/index.js')

/**
 * `shell` only where it is needed.
 *
 * `process.execPath` on Windows is `C:\Program Files\nodejs\node.exe`, and
 * under a shell the space splits it: the error is `'C:\Program' is not
 * recognized`, which names a program nobody asked for.
 */
const run = (file, args, env, shell = false) =>
  promisify(execFile)(file, args, { cwd: API, env: { ...process.env, ...env }, encoding: 'utf8', shell })

const { url } = await startPglite(DB_PORT)

await run(process.execPath, [cli, 'migrate', 'deploy'], { DATABASE_URL: url })
await run('npx', ['tsx', 'prisma/seed.ts'], { DATABASE_URL: url }, true)

// The test needs to reach the same database to insert and delete rows.
const { writeFileSync } = await import('node:fs')
writeFileSync(join(HERE, '.database-url'), url)

const api = spawn(process.execPath, ['dist/main.js'], {
  cwd: API,
  env: {
    ...process.env,
    DATABASE_URL: url,
    PORT: String(PORT),
    // Both origins the tests browse from: the Vite dev server and the
    // static server that mimics GitHub Pages.
    CORS_ORIGINS: [`http://localhost:${process.env.E2E_WEB_PORT ?? 5173}`, 'http://localhost:5190'].join(','),
  },
  stdio: ['ignore', 'inherit', 'inherit'],
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    api.kill()
    process.exit(0)
  })
}

api.on('exit', (code) => process.exit(code ?? 0))
