import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Postgres on localhost, with no daemon and nothing to install.
 *
 * PGlite is Postgres itself compiled to WASM, and `pglite-socket` puts it
 * behind the Postgres wire protocol. So `prisma migrate deploy` and the
 * `@prisma/adapter-pg` client both talk to it exactly as they would to a
 * server: the migrations that build the test database are the same SQL
 * production receives, which is the only reason a local database is worth
 * anything.
 *
 * Not Docker, because the daemon is a large resident process and this project
 * has already cost its owner a RAM upgrade. Not `prisma dev`, which installs a
 * dynamic subcommand at run time and is refused by this machine's npm
 * `allowScripts` policy. See TECH-DEBT.md.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PGLITE_PORT ?? 5433)

/** In memory unless a path is given, so a test run leaves nothing behind. */
const dataDir = process.env.PGLITE_DIR ? resolve(HERE, '..', process.env.PGLITE_DIR) : undefined
if (dataDir) mkdirSync(dataDir, { recursive: true })

export const startPglite = async (port = PORT) => {
  const db = await PGlite.create(dataDir ? { dataDir } : {})
  const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 100, idleTimeout: 0 })
  await server.start()

  return {
    // `sslmode=disable` is required, not tidy-up. Prisma's migrate engine
    // opens with an SSLRequest, PGlite's socket server does not answer one,
    // and Prisma reports the closed connection as P1001 "can't reach database
    // server" while pointing at a server that is running and accepting
    // connections. The error names the wrong problem entirely.
    url: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`,
    stop: async () => {
      await server.stop()
      await db.close()
    },
  }
}

// Run directly: stay up until interrupted. Imported: the caller owns the stop.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url, stop } = await startPglite()
  console.log(`postgres on ${url}`)

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      void stop().then(() => process.exit(0))
    })
  }
}
