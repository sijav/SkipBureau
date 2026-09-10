import { URL } from 'node:url'

/**
 * The connection string for the node-postgres consumers, which is not quite
 * the one Prisma's CLI uses.
 *
 * `sslmode=require` means different things to the two halves of this stack.
 * In libpq, and therefore in Prisma's migration engine, it means "encrypt the
 * connection, do not verify who is on the other end". node-postgres disagrees:
 * `pg-connection-string` turns any `sslmode` into an empty `ssl` object and
 * then leaves `rejectUnauthorized` at Node's default of true, so it demands a
 * publicly trusted certificate chain. A managed Postgres add-on signs its
 * certificate with a private CA, so the same URL that Prisma connects with
 * fails here with "unable to verify the first certificate".
 *
 * `uselibpqcompat=true` is that library's own switch for taking `sslmode` at
 * its libpq meaning, so this appends it rather than reaching past the parser
 * to force `rejectUnauthorized`. Encryption is unchanged either way; what
 * changes is that the whole stack now reads one `sslmode` the same way. A
 * deployment that wants the certificate checked writes `sslmode=verify-full`,
 * which stays verified under libpq rules.
 *
 * It is NOT added to DATABASE_URL itself, because that variable is also read
 * by the Prisma CLI and an unknown query parameter is a thing it may reject.
 */
export const nodePostgresUrl = (raw: string): string => {
  const url = new URL(raw)

  // No sslmode at all means no TLS was asked for, and libpq compatibility
  // would have nothing to reinterpret.
  if (!url.searchParams.has('sslmode')) return raw
  if (url.searchParams.has('uselibpqcompat')) return raw

  url.searchParams.set('uselibpqcompat', 'true')
  return url.toString()
}

/** Reads DATABASE_URL, or says which one is missing rather than failing at connect time. */
export const databaseUrl = (): string => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. See .env.example, and `npm run db:dev` for a local one.')
  return nodePostgresUrl(url)
}
