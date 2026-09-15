import { createHash } from 'node:crypto'
import type { ResearchRules } from './rows.js'

const byCodeUnit = ([a]: [string, unknown], [b]: [string, unknown]): number => (a < b ? -1 : a > b ? 1 : 0)

/**
 * A value as canonical JSON: object keys sorted at every depth, every array in its order, and a key
 * whose value is undefined left out, as JSON leaves it out. A value JSON would change or drop is refused
 * rather than hashed as something else: NaN, an infinity, a BigInt, or undefined inside an array.
 */
const canonical = (value: unknown, path: string): string => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`The research digest cannot hold ${value} at ${path}.`)
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    const items = value.map((item: unknown, index) => {
      if (item === undefined) throw new Error(`The research digest cannot hold undefined at ${path}[${index}].`)
      return canonical(item, `${path}[${index}]`)
    })
    return `[${items.join(',')}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(byCodeUnit)
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item, `${path}.${key}`)}`).join(',')}}`
  }
  throw new Error(`The research digest cannot hold a ${typeof value} at ${path}.`)
}

/**
 * The SHA-256 of a country's composed research, as canonical JSON (SB-232). The load writes it as its
 * receipt in its own transaction, and the publish script waits for the deployed one to equal its own.
 */
export const digestOf = (rules: ResearchRules): string => createHash('sha256').update(canonical(rules, rules.research)).digest('hex')
