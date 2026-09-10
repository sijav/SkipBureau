import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { Client } from 'pg'
import { databaseUrl } from './database-url.js'

/**
 * Clears a failed migration that a first deploy left behind, when and only
 * when it provably left nothing else behind.
 *
 * A `prisma migrate deploy` that fails writes a row into `_prisma_migrations`
 * with no `finished_at`, and every later run stops at P3009 rather than
 * retrying it. The documented fix is to run `prisma migrate resolve` by hand
 * against the database. On a container host that is a trap: the entrypoint
 * migrates before it serves, so a failed migration means the container exits,
 * the platform restarts it, and there is never a running container to open a
 * shell into. The one command that fixes it needs the thing it is trying to
 * fix. That is why this runs in the entrypoint instead.
 *
 * Rolling a failed migration back is a claim that the database does not carry
 * its changes, and Prisma cannot check that claim. Postgres does NOT get a
 * transaction per migration from Prisma, so a migration really can fail
 * halfway and leave objects standing. So this refuses unless both are true:
 *
 *   - no migration has ever finished, and
 *   - the schema holds no tables or enums of ours
 *
 * which together mean the database is untouched and "rolled back" is simply
 * the truth. Anything else is a database with history or contents, where the
 * right call belongs to a person, and this prints what it found and stands
 * aside so `migrate deploy` fails with its own P3009.
 */

/** Prisma's own bookkeeping table, which is not one of ours. */
const HISTORY = '_prisma_migrations'

export type Inspection = {
  /** Migrations that started and neither finished nor were rolled back. */
  failed: string[]
  /** Migrations that have ever completed. */
  applied: number
  /** Tables and enums standing in the schema, excluding Prisma's own table. */
  leftovers: string[]
}

export type Verdict =
  | { action: 'none'; reason: string }
  | { action: 'resolve'; reason: string; names: string[] }
  | { action: 'refuse'; reason: string }

/**
 * The whole decision, with no database attached, because the interesting part
 * is which of these cases is which and that deserves to be tested directly.
 */
export const verdict = (inspection: Inspection): Verdict => {
  const { failed, applied, leftovers } = inspection

  if (failed.length === 0) return { action: 'none', reason: 'no failed migration is recorded' }

  if (applied > 0)
    return {
      action: 'refuse',
      reason: `${failed.length} failed migration(s), but ${applied} have been applied before, so this database has history and rolling back is a decision for a person`,
    }

  if (leftovers.length > 0)
    return {
      action: 'refuse',
      reason: `${failed.length} failed migration(s), and the schema still holds ${leftovers.length} object(s) (${leftovers.join(', ')}), so the failure left something standing and rolling back would be a lie`,
    }

  return {
    action: 'resolve',
    reason: 'nothing has ever been applied and the schema is empty, so the failed attempt(s) changed nothing',
    names: failed,
  }
}

/** Prisma reads the schema from the URL, defaulting to public, so this matches it. */
export const schemaOf = (url: string): string => new URL(url).searchParams.get('schema') ?? 'public'

/** Rejects anything that cannot be a bare identifier, since the schema is interpolated into SET search_path. */
const identifier = (name: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_$]*$/.test(name)) throw new Error(`refusing to use ${JSON.stringify(name)} as a schema name`)
  return `"${name}"`
}

export const inspect = async (client: Client, schema: string): Promise<Inspection | null> => {
  const { rows: present } = await client.query<{ present: boolean }>('SELECT to_regclass(format($1::text, $2::text)) IS NOT NULL AS present', [
    `%I.${HISTORY}`,
    schema,
  ])
  // No history table means migrate has never run here, so there is no failure to clear.
  if (!present[0]?.present) return null

  await client.query(`SET search_path TO ${identifier(schema)}`)

  const { rows: failed } = await client.query<{ migration_name: string }>(
    `SELECT migration_name FROM ${HISTORY} WHERE finished_at IS NULL AND rolled_back_at IS NULL ORDER BY started_at`
  )
  const { rows: applied } = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM ${HISTORY} WHERE finished_at IS NOT NULL`)
  const { rows: tables } = await client.query<{ name: string }>(
    'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = $1 AND table_name <> $2 ORDER BY table_name',
    [schema, HISTORY]
  )
  const { rows: enums } = await client.query<{ name: string }>(
    `SELECT t.typname AS name FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = $1 AND t.typtype = 'e' ORDER BY t.typname`,
    [schema]
  )

  return {
    failed: failed.map((row) => row.migration_name),
    applied: Number(applied[0]?.count ?? 0),
    leftovers: [...tables, ...enums].map((row) => row.name),
  }
}

/**
 * The prisma CLI's entry file, found through its own package manifest.
 *
 * Not `npx prisma`: npx is a shell shim rather than an executable on Windows,
 * so spawning it fails with ENOENT there and the recovery could only ever be
 * tested on the host it was going to run on. Reading `bin` from the manifest
 * asks the package where its entry point is instead of hardcoding a path that
 * a version bump can move.
 */
const prismaCli = (): string => {
  const manifest = createRequire(import.meta.url).resolve('prisma/package.json')
  const parsed: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
  const bin = typeof parsed === 'object' && parsed !== null && 'bin' in parsed ? parsed.bin : undefined
  // `bin` is either a path or a map of command name to path, per npm.
  const entry = typeof bin === 'string' ? bin : typeof bin === 'object' && bin !== null && 'prisma' in bin ? bin.prisma : undefined
  if (typeof entry !== 'string') throw new Error('the prisma package declares no bin, so the CLI cannot be located')
  return join(dirname(manifest), entry)
}

const recover = async (): Promise<void> => {
  const url = databaseUrl()
  const schema = schemaOf(url)
  const client = new Client({ connectionString: url })

  await client.connect()
  let inspection: Inspection | null
  try {
    inspection = await inspect(client, schema)
  } finally {
    await client.end()
  }

  if (!inspection) {
    console.log('recover: no migration history table yet, nothing to recover')
    return
  }

  const decision = verdict(inspection)
  if (decision.action === 'none') {
    console.log(`recover: ${decision.reason}`)
    return
  }

  if (decision.action === 'refuse') {
    // Deliberately not an error. `migrate deploy` runs next and fails with
    // P3009 naming the migration, which is the message worth searching for.
    // This line is the diagnosis printed just above it.
    console.warn(`recover: standing aside, ${decision.reason}`)
    return
  }

  console.log(`recover: ${decision.reason}`)
  const cli = prismaCli()
  for (const name of decision.names) {
    console.log(`recover: marking ${name} rolled back`)
    execFileSync(process.execPath, [cli, 'migrate', 'resolve', '--rolled-back', name], { stdio: 'inherit' })
  }
}

// Only when run as a program. Importing it for the tests must not connect.
if (process.argv[1]?.includes('recover-migrations')) void recover()
