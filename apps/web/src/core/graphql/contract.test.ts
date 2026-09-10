import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
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
 * runs codegen against the result.
 *
 * It does all of that to a THROWAWAY COPY of the API source. It used to rename
 * the real `country.model.ts` and re-emit the real `schema.gql`, restoring only
 * the first, so an assertion failing in between left a tracked SDL in the tree
 * saying `countryCode`. Restoring harder does not fix that, because nothing
 * written here runs when the process is killed. Not writing the file is the
 * only version that holds.
 */

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const API = join(WEB, '..', 'api')

/**
 * A directory per run, under a gitignored parent.
 *
 * Unique rather than reused so that a run which was killed cannot leave a
 * half-copied tree for the next one to emit from and then blame the code for.
 */
const scratchRoot = join(API, '.contract')
mkdirSync(scratchRoot, { recursive: true })

// A run that was killed never reached `afterAll`, so its directory is still
// there. Sweep the stale ones rather than the lot, because a concurrent run
// owns its own and deleting it underneath would be a far worse failure than a
// megabyte of ignored garbage.
const STALE = 60 * 60 * 1000
for (const entry of readdirSync(scratchRoot)) {
  const path = join(scratchRoot, entry)
  if (Date.now() - statSync(path).mtimeMs > STALE) rmSync(path, { recursive: true, force: true })
}

const scratch = mkdtempSync(join(scratchRoot, 'run-'))

afterAll(() => rmSync(scratch, { recursive: true, force: true }))

type Run = { ok: boolean; output: string }

const run = (file: string, args: string[], options: { cwd: string; shell?: boolean; env?: NodeJS.ProcessEnv }): Run => {
  try {
    const output = execFileSync(file, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    })
    return { ok: true, output }
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string }
    return { ok: false, output: `${failure.stdout ?? ''}\n${failure.stderr ?? ''}` }
  }
}

const script = (name: string): Run => run('npm', ['run', name], { cwd: WEB, shell: true })

/**
 * Copy the API source into the scratch tree, optionally with the field renamed.
 *
 * `tsconfig.json` goes with it. `@swc-node/register` looks for one at the
 * directory it is running in, and without it every `./x.js` specifier fails to
 * resolve to its `.ts` source, which is a confusing way to learn this.
 */
const plant = ({ renamed }: { renamed: boolean }): void => {
  rmSync(join(scratch, 'src'), { recursive: true, force: true })
  cpSync(join(API, 'src'), join(scratch, 'src'), { recursive: true })
  cpSync(join(API, 'tsconfig.json'), join(scratch, 'tsconfig.json'))

  if (!renamed) return

  const model = join(scratch, 'src', 'country', 'country.model.ts')
  const before = readFileSync(model, 'utf8')
  const after = before.replace('  code!: string', '  countryCode!: string')

  assert.notEqual(after, before, 'the rename matched nothing, so the mutated run would prove nothing')
  writeFileSync(model, after)
}

/**
 * No shell here, deliberately. `process.execPath` is
 * `C:\Program Files\nodejs\node.exe`, and a shell splits it at the space into
 * a program nobody asked for.
 */
const emit = (): Run =>
  run(process.execPath, ['--import', '@swc-node/register/esm-register', join('src', 'schema-emit.ts')], { cwd: scratch })

/**
 * Codegen against the scratch SDL, writing to a scratch directory.
 *
 * `NODE_ENV` is overridden because vitest sets it to `test`, and the codegen
 * CLI picks a silent renderer under it, which swallows the GraphQL validation
 * error that is the entire point of the mutated run. With `--verbose` and a
 * normal `NODE_ENV` the real message reaches the pipe.
 */
const codegen = (into: string): Run =>
  run('npm', ['run', 'codegen', '--', '--verbose'], {
    cwd: WEB,
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      SKIPBUREAU_SCHEMA: join(scratch, 'schema.gql'),
      SKIPBUREAU_GENERATED: `${into}/`,
    },
  })

const wrote = (into: string): string[] => (existsSync(into) ? readdirSync(into) : [])

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
        description: null,
        intro: null,
        quickAnswer: null,
        verifiedAt: '2026-01-01',
        locale: 'en-US',
        translationMissing: false,
        showDisclaimer: false,
        showSuggestUpdate: true,
        cost: null,
        time: null,
        deadlines: null,
        costNote: null,
        place: null,
        sections: [],
        options: [],
        related: [],
        sources: [{ url: 'https://example.gov', name: 'gov', publisher: null, official: true, note: null, verifiedAt: '2026-05-05' }],
      },
    }),
    '2026-05-05',
  )
})

test('the contract holds as the server stands', { timeout: 600_000 }, () => {
  const into = join(scratch, 'generated-baseline')

  plant({ renamed: false })

  const emitted = emit()
  assert.ok(emitted.ok, `the SDL could not be emitted from the API source:\n${emitted.output.slice(-2000)}`)

  const generated = codegen(into)
  assert.ok(generated.ok, `the documents do not match the server's own schema:\n${generated.output.slice(-2000)}`)
  assert.ok(wrote(into).length > 0, 'codegen reported success and wrote nothing')

  // Reads only, and it is the app's real typecheck rather than the scratch
  // copy's, because the question is whether the app compiles.
  const typechecked = script('typecheck')
  assert.ok(typechecked.ok, `the app does not typecheck against its own generated types:\n${typechecked.output.slice(-2000)}`)
})

test('renaming a field on the server breaks the web app', { timeout: 600_000 }, () => {
  const into = join(scratch, 'generated-renamed')

  plant({ renamed: true })

  const emitted = emit()
  assert.ok(emitted.ok, `the mutated source did not emit at all, so nothing was proved:\n${emitted.output.slice(-2000)}`)
  assert.match(
    readFileSync(join(scratch, 'schema.gql'), 'utf8'),
    /countryCode/,
    'the emitted SDL does not carry the rename, so the run below would pass for the wrong reason',
  )

  const generated = codegen(into)

  // The whole task. If this succeeds while the field is renamed, there are two
  // contracts rather than one and the GraphQL choice bought nothing.
  assert.ok(!generated.ok, 'a field renamed on the server did NOT break the web app, so the contract is not one')

  // It has to fail BECAUSE THE DOCUMENT NO LONGER MATCHES, not for any other
  // reason a subprocess might exit non-zero. This asserts the validator's own
  // words rather than a summary line, so a reworded summary cannot turn this
  // into a test that accepts any failure at all.
  assert.match(
    generated.output,
    /Cannot query field "code" on type "Country"/,
    `it failed, but not because the document stopped matching the schema:\n${generated.output.slice(-3000)}`,
  )

  assert.deepEqual(wrote(into), [], 'codegen failed and still wrote types, which would be a stale contract')
})
