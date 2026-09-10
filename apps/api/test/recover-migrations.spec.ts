import { describe, expect, it } from 'vitest'
import { schemaOf, verdict } from '../src/recover-migrations.js'
import { nodePostgresUrl } from '../src/database-url.js'

const clean = { failed: [], applied: 0, leftovers: [] }

describe('verdict', () => {
  it('does nothing when no migration has failed', () => {
    expect(verdict({ ...clean, applied: 3 })).toEqual({ action: 'none', reason: expect.stringContaining('no failed migration') })
  })

  it('resolves a first deploy that failed against an empty database', () => {
    const decision = verdict({ failed: ['20260909232306_init'], applied: 0, leftovers: [] })

    expect(decision.action).toBe('resolve')
    expect(decision).toHaveProperty('names', ['20260909232306_init'])
  })

  it('refuses when a migration has ever been applied, because the database has history', () => {
    const decision = verdict({ failed: ['20260909235425_guides'], applied: 2, leftovers: [] })

    expect(decision.action).toBe('refuse')
    expect(decision.reason).toContain('history')
  })

  // The reason Postgres needs this: Prisma does not wrap a migration in a
  // transaction, so a migration can fail halfway with its enums standing.
  it('refuses when the failed migration left objects behind', () => {
    const decision = verdict({ failed: ['20260909232306_init'], applied: 0, leftovers: ['ObligationKind', 'Country'] })

    expect(decision.action).toBe('refuse')
    expect(decision.reason).toContain('ObligationKind')
  })

  it('names every failed migration, not just the first', () => {
    const decision = verdict({ failed: ['a', 'b'], applied: 0, leftovers: [] })

    expect(decision).toHaveProperty('names', ['a', 'b'])
  })
})

describe('schemaOf', () => {
  it('defaults to public, which is what Prisma does', () => {
    expect(schemaOf('postgresql://u:p@host:5432/db?sslmode=require')).toBe('public')
  })

  it('takes the schema from the url when one is given', () => {
    expect(schemaOf('postgresql://u:p@host:5432/db?schema=tenant')).toBe('tenant')
  })
})

describe('nodePostgresUrl', () => {
  // Without this, sslmode=require makes node-postgres demand a publicly
  // trusted chain while Prisma's engine, on the same url, does not verify at
  // all. A managed add-on signs with a private CA, so only one of them connects.
  it('makes node-postgres read sslmode the way libpq and Prisma do', () => {
    expect(nodePostgresUrl('postgresql://u:p@host:5432/db?sslmode=require')).toContain('uselibpqcompat=true')
  })

  it('leaves a url with no sslmode alone', () => {
    expect(nodePostgresUrl('postgresql://u:p@host:5432/db')).toBe('postgresql://u:p@host:5432/db')
  })

  it('does not add the flag twice', () => {
    const once = nodePostgresUrl('postgresql://u:p@host:5432/db?sslmode=require')

    expect(nodePostgresUrl(once)).toBe(once)
  })

  it('keeps the credentials and database intact', () => {
    const url = new URL(nodePostgresUrl('postgresql://user:secret@host:5432/mydb?sslmode=require'))

    expect(url.username).toBe('user')
    expect(url.pathname).toBe('/mydb')
    expect(url.searchParams.get('sslmode')).toBe('require')
  })
})
