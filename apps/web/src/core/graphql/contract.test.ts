import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, test } from 'vitest'
import { CountriesQuery, GuideQuery } from './documents'
import { countryCodes, isUntranslated, lastVerified } from './readers'

/**
 * The contract, proved the only way that means anything.
 *
 * The trap is editing `schema.gql` and watching codegen complain: that proves
 * a generated file validates against another generated file. The real question
 * is whether a server developer renaming a field breaks the app that reads it,
 * so the test edits the DECORATED NEST MODEL, re-emits the SDL from it, and
 * runs the web app's own typecheck.
 */

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const MODEL = join(WEB, '..', 'api', 'src', 'country', 'country.model.ts')

const original = readFileSync(MODEL, 'utf8')
afterAll(() => writeFileSync(MODEL, original))

/**
 * One npm script, with both streams kept.
 *
 * The steps run separately rather than through `lint:tsc` because npm nests
 * output when a script calls a script, and the GraphQL validation error, which
 * is the whole point, was being swallowed two levels down. Running each step
 * makes the failure attributable to the step that produced it.
 */
const script = (name: string): { ok: boolean; output: string } => {
  try {
    const output = execFileSync('npm', ['run', name], {
      cwd: WEB,
      encoding: 'utf8',
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { ok: true, output }
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string }
    return { ok: false, output: `${failure.stdout ?? ''}\n${failure.stderr ?? ''}` }
  }
}

const contract = (): { ok: boolean; output: string } => {
  const emitted = script('schema')
  if (!emitted.ok) return emitted

  const generated = script('codegen')
  if (!generated.ok) return generated

  return script('typecheck')
}

test('the generated types carry the fields the documents select', () => {
  // Cheap, and it fails the moment codegen stops running or starts producing
  // `unknown`, which is the client preset's fallback for an operation it could
  // not statically find.
  assert.equal(typeof CountriesQuery, 'object')
  assert.equal(typeof GuideQuery, 'object')

  assert.deepEqual(countryCodes({ countries: [{ code: 'tr', name: 'Turkey' }] }), ['tr'])
  assert.equal(isUntranslated({ guide: null }), false)
  assert.equal(lastVerified({ guide: null }), null)
  assert.equal(
    lastVerified({
      guide: {
        slug: 'x',
        title: 'X',
        quickAnswer: null,
        verifiedAt: '2026-01-01',
        locale: 'en-US',
        translationMissing: false,
        sources: [{ url: 'https://example.gov', name: 'gov', verifiedAt: '2026-05-05' }],
      },
    }),
    '2026-05-05',
  )
})

test('renaming a field on the server breaks the web app', { timeout: 600_000 }, () => {
  // The whole task. If this passes while the field is renamed, there are two
  // contracts rather than one and the GraphQL choice bought nothing.
  const before = contract()
  assert.ok(before.ok, `the contract should hold before anything is renamed:\n${before.output.slice(-2000)}`)

  writeFileSync(MODEL, original.replace('  code!: string', '  countryCode!: string'))
  assert.notEqual(readFileSync(MODEL, 'utf8'), original, 'the rename did not apply')

  const after = contract()
  writeFileSync(MODEL, original)

  assert.ok(!after.ok, 'a field renamed on the server did NOT break the web app, so the contract is not one')

  // It has to fail AT CODEGEN, which means the document no longer matches the
  // schema, rather than anywhere else for any other reason.
  //
  // Run in a terminal this prints `Cannot query field "code" on type
  // "Country"`, but codegen renders that detail through a task list that only
  // draws to a TTY, so a captured run gets the summary instead. The summary
  // still says the two things that matter: which step failed, and that it
  // produced nothing.
  assert.match(
    after.output,
    /Lifecycle script `codegen` failed/,
    `it failed, but not at codegen, so not because the document stopped matching the schema:\n${after.output.slice(-2000)}`,
  )
  assert.match(after.output, /no files were generated/, `codegen failed but still wrote output:\n${after.output.slice(-2000)}`)

  const restored = contract()
  assert.ok(restored.ok, `the contract should hold again once the rename is undone:\n${restored.output.slice(-2000)}`)
})
