// SB-232: publish one research case to the live database, or take its last publish down.
//
//   npm run research:publish -w @skipbureau/api -- src/rules/research/germany/anmeldung.ts
//   npm run research:publish -w @skipbureau/api -- --down src/rules/research/germany/anmeldung.ts
//
// It checks the case, commits exactly the bytes it checked without touching the main index, pushes,
// waits until the deployed database's receipt for the country equals the files' digest, and reads the
// case back through the deployed API. A failure ends in one line saying what failed, and exit 1: the
// owner's order of 2026-09-15 is that a mistaken command or file gives its error back, and data is not
// guarded.

import { spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { digestOf } from '../src/rules/research/digest.js'
import type { ResearchCase, ResearchFact, ResearchRules, ResearchVersion } from '../src/rules/research/rows.js'

const API = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LIVE = process.env['SKIPBUREAU_API'] ?? 'https://p01--buildfromgithub--fsy7zpnfgznq.code.run/graphql'
const ATTRIBUTION = 'Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>'
const RECORD = '\x1e'
const FIELD = '\x00'
const REPOSITORY = 'sijav/SkipBureau'
const NORTHFLANK_CONTEXT = 'northflank/sijavs-team/skipbureau/buildfromgithub'

/** A mistake in the command, a file or the run, given back as one line. */
export class PublishError extends Error {}

export type Case = { country: string; document: string; name: string; dataFile: string; countryFile: string; agreed: string; talk: string }

/** The case a data file is, from its path under apps/api: src/rules/research/<country>/<document>.ts. */
export const caseOf = (dataFile: string): Case => {
  const path = dataFile.replaceAll('\\', '/').replace(/^\.\//, '')
  const found = /^src\/rules\/research\/([a-z]+)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.ts$/.exec(path)
  const country = found?.[1]
  const document = found?.[2]
  if (!country || !document)
    throw new PublishError(`${dataFile} is not a research case: give src/rules/research/<country>/<case>.ts, from apps/api.`)
  return {
    country,
    document,
    name: `${country}/${document}`,
    dataFile: path,
    countryFile: `src/rules/research/${country}.ts`,
    agreed: `prisma/research/agreed/${country}/${document}.md`,
    talk: `prisma/research/talk/${country}/${document}.md`,
  }
}

/** The commit message: a subject to read, and trailers `git log --grep` finds. */
export const messageOf = (action: 'publish' | 'down', name: string, id: string): string =>
  [
    `Research ${action}: ${name}`,
    '',
    `Research-Case: ${name}`,
    `Research-Action: ${action}`,
    action === 'publish' ? `Research-Publish-Id: ${id}` : `Research-Reverts: ${id}`,
    ATTRIBUTION,
    '',
  ].join('\n')

/** From `git log --format=%H%x00%B%x1e` output, newest first, the last publish of a case that no down has reverted. */
export const lastUnreverted = (log: string, name: string): { id: string; commit: string } | null => {
  const reverted = new Set<string>()
  for (const record of log.split(RECORD)) {
    const [commit, body] = record.replace(/^\s+/, '').split(FIELD)
    if (!commit || body === undefined) continue
    const trailer = (key: string) => new RegExp(`^${key}: (.+)$`, 'm').exec(body)?.[1]?.trim()
    if (trailer('Research-Case') !== name) continue
    const reverts = trailer('Research-Reverts')
    if (trailer('Research-Action') === 'down' && reverts) reverted.add(reverts)
    const id = trailer('Research-Publish-Id')
    if (trailer('Research-Action') === 'publish' && id && !reverted.has(id)) return { id, commit }
  }
  return null
}

/** A case that had not been published: it names its document and composes to nothing. */
export const emptyCase = (document: string): string =>
  `import type { ResearchCase } from '../rows.js'\n\n// Taken down: this case had not been published before (SB-232).\n\nexport const CASE: ResearchCase = { document: '${document}' }\n`

type Run = { status: number | null; stdout: string; stderr: string }
type RunOptions = { cwd?: string; input?: string | Buffer; env?: NodeJS.ProcessEnv }

const run = (command: string, args: readonly string[], options: RunOptions = {}): Run => {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? API,
    input: options.input,
    env: options.env ?? process.env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

const git = (args: readonly string[], options: RunOptions = {}): string => {
  const result = run('git', args, options)
  if (result.status !== 0) throw new PublishError(`git ${args.join(' ')} failed: ${result.stderr.trim() || result.stdout.trim()}`)
  return result.stdout.trim()
}

/**
 * A commit of exactly the given bytes on top of `start`, built in a temporary index so the main index is
 * never touched, and the branch moved only if it still points at `start`.
 */
export const commitBytes = (
  repo: string,
  start: string,
  branch: string,
  files: readonly { path: string; bytes: Buffer }[],
  message: string,
): string => {
  const folder = mkdtempSync(join(tmpdir(), 'research-publish-'))
  const env = { ...process.env, GIT_INDEX_FILE: join(folder, 'index') }
  try {
    git(['read-tree', start], { cwd: repo, env })
    for (const file of files) {
      const blob = git(['hash-object', '-w', `--path=${file.path}`, '--stdin'], { cwd: repo, input: file.bytes })
      git(['update-index', '--add', '--cacheinfo', `100644,${blob},${file.path}`], { cwd: repo, env })
    }
    const tree = git(['write-tree'], { cwd: repo, env })
    const commit = git(['commit-tree', tree, '-p', start, '-F', '-'], { cwd: repo, input: message })
    git(['update-ref', branch, commit, start], { cwd: repo })
    return commit
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
}

/** A case's publishes and downs that changed its data file, newest first, as `lastUnreverted` reads them: a publish that changed nothing there has nothing for a down to take back. */
export const publishLog = (repo: string, the: Case): string =>
  git(['log', '--format=%H%x00%B%x1e', `--grep=^Research-Case: ${the.name}$`, '--', `apps/api/${the.dataFile}`], { cwd: repo })

const sha = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex')

/** The paths the deployed build is made from: everything under apps/api, and what its Dockerfile reads from the root. */
export const BUILD_INPUTS: readonly string[] = ['apps/api', 'package.json', 'package-lock.json', 'apps/web/package.json', '.dockerignore']

/** Changed inputs of the deployed build a publish of the selected paths would not carry. Markdown, which .dockerignore keeps out of the image, does not count. */
export const otherInputs = (changed: readonly string[], selected: readonly string[]): string[] =>
  [...new Set(changed)].filter((path) => !path.endsWith('.md') && !selected.includes(path))

/** The files of a snapshot whose bytes are no longer the ones it holds. */
export const changedSince = (snapshot: readonly { path: string; bytes: Buffer }[], read: (path: string) => Buffer): string[] =>
  snapshot.filter((file) => sha(read(file.path)) !== sha(file.bytes)).map((file) => file.path)

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isRules = (value: unknown): value is ResearchRules =>
  isRecord(value) &&
  typeof value['country'] === 'string' &&
  typeof value['research'] === 'string' &&
  Array.isArray(value['versions']) &&
  Array.isArray(value['regions'])

const isCase = (value: unknown): value is ResearchCase => isRecord(value) && typeof value['document'] === 'string'

const identity = (version: ResearchVersion): string =>
  `${version.obligation} from ${version.validFrom} for ${JSON.stringify(version.criteria.map((criterion) => `${criterion.dimension}:${criterion.value}`).sort())}`

export type Reader = { to: string; statuses?: string[]; nationality?: string; situation?: string; regions?: string[] }

export const readerFor = (rules: ResearchRules, version: ResearchVersion): Reader => {
  const reader: Reader = { to: rules.country }
  for (const criterion of version.criteria) {
    if (criterion.dimension === 'residenceStatus') reader.statuses = [criterion.value]
    if (criterion.dimension === 'situation') reader.situation = criterion.value
    if (criterion.dimension === 'nationality') reader.nationality = criterion.value
    if (criterion.dimension === 'residenceRegion') reader.regions = [criterion.value]
    if (criterion.dimension === 'nationalityGroup') {
      const member = rules.nationalityGroups.find((group) => group.code === criterion.value)?.members[0]?.nationality
      if (member) reader.nationality = member
    }
  }
  // A version with no place, whose obligation has a place's version, is asked from a Land in which no rule names a
  // place: a Land holding a named city asks where in it the reader will live.
  const named = new Set(
    rules.versions
      .filter((other) => other.obligation === version.obligation)
      .flatMap((other) =>
        other.criteria.filter((criterion) => criterion.dimension === 'residenceRegion').map((criterion) => criterion.value),
      ),
  )
  const elsewhere = rules.regions.find(
    (region) => region.parent === null && ![...named].some((code) => code === region.code || code.startsWith(`${region.code}.`)),
  )
  if (!reader.regions && named.size > 0 && elsewhere) reader.regions = [elsewhere.code]
  return reader
}

/** The versions a place's version takes the facts it does not state from: the same obligation and other criteria, no place. */
const widerOf = (rules: ResearchRules, version: ResearchVersion): ResearchVersion[] => {
  const place = version.criteria.some((criterion) => criterion.dimension === 'residenceRegion')
  if (!place) return []
  return rules.versions.filter(
    (other) =>
      other !== version &&
      other.obligation === version.obligation &&
      !other.criteria.some((criterion) => criterion.dimension === 'residenceRegion') &&
      other.criteria.length === version.criteria.length - 1 &&
      other.criteria.every((criterion) =>
        version.criteria.some((mine) => mine.dimension === criterion.dimension && mine.value === criterion.value),
      ),
  )
}

type Served = {
  key: string
  operator: string
  numericValue: string | null
  textValue: string | null
  unit: string | null
  currency: string | null
  sourceUrl: string
  sourceName: string
  verifiedAt: string
}
type Entry = { obligationSlug: string; to: { facts: Served[] } | null }

const isEntry = (value: unknown): value is Entry => isRecord(value) && typeof value['obligationSlug'] === 'string'

const shows = (sources: ResearchRules['sources'], served: readonly Served[], fact: ResearchFact): boolean => {
  const page = sources[fact.source]
  return served.some(
    (shown) =>
      shown.key === fact.key &&
      shown.operator === fact.operator &&
      shown.numericValue === (fact.numericValue === undefined ? null : String(fact.numericValue)) &&
      shown.textValue === (fact.textValue ?? null) &&
      shown.unit === (fact.unit ?? null) &&
      shown.currency === (fact.currency ?? null) &&
      shown.sourceUrl === page?.url &&
      shown.sourceName === page?.name &&
      shown.verifiedAt === page?.read,
  )
}

const ask = async (query: string, variables: Record<string, unknown>): Promise<{ data: unknown; errors: string[] }> => {
  const response = await fetch(LIVE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const parsed: unknown = await response.json().catch(() => null)
  const errors =
    isRecord(parsed) && Array.isArray(parsed['errors'])
      ? parsed['errors'].map((error: unknown) =>
          isRecord(error) && typeof error['message'] === 'string' ? error['message'] : String(error),
        )
      : []
  return {
    data: isRecord(parsed) ? parsed['data'] : undefined,
    errors: response.ok || errors.length > 0 ? errors : [`HTTP ${response.status}`],
  }
}

const MOVE = `query Sweep($to: String!, $statuses: [String!], $nationality: String, $situation: String, $regions: [String!]) {
  move(from: "xx", to: $to, residenceStatuses: $statuses, nationality: $nationality, situation: $situation, toResidenceRegions: $regions) {
    obligationSlug
    to { facts { key operator numericValue textValue unit currency sourceUrl sourceName verifiedAt } }
  }
}`

const servedFor = async (reader: Reader, obligation: string): Promise<{ served: Served[]; errors: string[] }> => {
  const { to, ...rest } = reader
  const { data, errors } = await ask(MOVE, { to, ...rest })
  const move = isRecord(data) ? data['move'] : undefined
  const entries = Array.isArray(move) ? move.filter(isEntry) : []
  return { served: entries.find((entry) => entry.obligationSlug === obligation)?.to?.facts ?? [], errors }
}

const receiptOf = async (research: string): Promise<string | null> => {
  const { data } = await ask('{ researchRows { research digest } }', {})
  const rows = isRecord(data) && Array.isArray(data['researchRows']) ? data['researchRows'] : []
  for (const row of rows) if (isRecord(row) && row['research'] === research && typeof row['digest'] === 'string') return row['digest']
  return null
}

const importFrom = async (file: string): Promise<Record<string, unknown>> => {
  const loaded: unknown = await import(pathToFileURL(file).href)
  if (!isRecord(loaded)) throw new PublishError(`${file} did not load as a module.`)
  return loaded
}

/** The case as the commit before this publish had it, imported from a temporary file beside it, or null. */
const caseAt = async (repo: string, commit: string, the: Case): Promise<ResearchCase | null> => {
  const shown = run('git', ['show', `${commit}:apps/api/${the.dataFile}`], { cwd: repo })
  if (shown.status !== 0) return null
  const file = resolve(API, `src/rules/research/${the.country}/.previous-${the.document}-${randomUUID()}.ts`)
  writeFileSync(file, shown.stdout)
  try {
    const found = (await importFrom(file))['CASE']
    return isCase(found) ? found : null
  } finally {
    rmSync(file, { force: true })
  }
}

export type BuildState = { state: string; description: string }

/** Northflank's newest status on a commit, from GitHub's statuses answer, which lists the newest first; null where it posted none. */
export const buildStateOf = (statuses: unknown): BuildState | null => {
  if (!Array.isArray(statuses)) return null
  for (const status of statuses) {
    if (!isRecord(status) || status['context'] !== NORTHFLANK_CONTEXT) continue
    const state = status['state']
    const description = status['description']
    if (typeof state === 'string') return { state, description: typeof description === 'string' ? description : '' }
  }
  return null
}

/** The `gh` arguments that start Northflank's build of a commit through northflank-build.yml, asking GitHub to name the run it starts. */
export const dispatchArgs = (branch: string, commit: string): string[] => [
  'api',
  '-X',
  'POST',
  `repos/${REPOSITORY}/actions/workflows/northflank-build.yml/dispatches`,
  '-f',
  `ref=${branch}`,
  '-f',
  `inputs[sha]=${commit}`,
  '-F',
  'return_run_details=true',
]

export type RunVerdict =
  { outcome: 'waiting'; runningSince: number | null } | { outcome: 'succeeded' } | { outcome: 'failed'; reason: string }

/** How long a dispatched run may stay unstarted, and run once started: its job's fifteen-minute limit and GitHub's five minutes to cancel it. */
const START_LIMIT = 30 * 60_000
const RUN_LIMIT = 22 * 60_000

/**
 * What a dispatched workflow run's record says at `now`. Only `completed` with `success` passes. A run never seen
 * `in_progress` is stuck thirty minutes after its dispatch, and one seen running is stuck twenty-two minutes after that.
 */
export const runVerdict = (record: unknown, dispatchedAt: number, runningSince: number | null, now: number): RunVerdict => {
  const status = isRecord(record) ? record['status'] : undefined
  const conclusion = isRecord(record) ? record['conclusion'] : undefined
  if (status === 'completed') {
    return conclusion === 'success'
      ? { outcome: 'succeeded' }
      : { outcome: 'failed', reason: `ended ${typeof conclusion === 'string' ? conclusion : 'with no conclusion'}` }
  }
  const since = runningSince ?? (status === 'in_progress' ? now : null)
  if (since !== null) {
    return now - since > RUN_LIMIT
      ? { outcome: 'failed', reason: 'is still running twenty-two minutes after it started' }
      : { outcome: 'waiting', runningSince: since }
  }
  return now - dispatchedAt > START_LIMIT
    ? { outcome: 'failed', reason: 'had not started thirty minutes after its dispatch' }
    : { outcome: 'waiting', runningSince: null }
}

/** A `gh` answer as JSON; a failure is the error. */
const ghJson = (args: readonly string[]): unknown => {
  const answer = run('gh', args)
  if (answer.status !== 0) throw new PublishError(`gh ${args.join(' ')} failed: ${answer.stderr.trim() || answer.stdout.trim()}`)
  try {
    const parsed: unknown = JSON.parse(answer.stdout)
    return parsed
  } catch {
    throw new PublishError(`gh ${args.join(' ')} answered with what is not JSON: ${answer.stdout.slice(0, 200)}`)
  }
}

/** A `gh` read that may fail for a moment inside a wait: undefined, said on the output, and read again next time. */
const readJson = (args: readonly string[]): unknown => {
  try {
    return ghJson(args)
  } catch (error) {
    console.log(`${new Date().toISOString()} ${error instanceof Error ? error.message : String(error)}; reading again`)
    return undefined
  }
}

/** Starts Northflank's build of a commit through northflank-build.yml, and returns the run GitHub names for it. */
export const startBuild = (branch: string, commit: string): number => {
  const answer = ghJson(dispatchArgs(branch, commit))
  const runId = isRecord(answer) ? answer['workflow_run_id'] : undefined
  if (typeof runId !== 'number') throw new PublishError(`GitHub started northflank-build.yml for ${commit} without naming its run.`)
  return runId
}

/** A workflow run's record, or undefined where it could not be read this time. */
export const readRun = (runId: number): unknown => readJson(['api', `repos/${REPOSITORY}/actions/runs/${runId}`])

const DIGEST_WAIT = 15 * 60_000
const NO_BUILD_WAIT = 3 * 60_000

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  const down = args.includes('--down')
  const given = args.filter((arg) => arg !== '--down')
  const [dataFile] = given
  if (given.length !== 1 || !dataFile)
    throw new PublishError(
      'give one data file: npm run research:publish -w @skipbureau/api -- [--down] src/rules/research/<country>/<case>.ts',
    )
  const the = caseOf(dataFile)
  const repo = git(['rev-parse', '--show-toplevel'])
  const inRepo = (path: string) => `apps/api/${path}`
  const branch = git(['symbolic-ref', 'HEAD'])
  const start = git(['rev-parse', 'HEAD'])
  if (!existsSync(resolve(API, the.agreed)))
    throw new PublishError(`${the.agreed} does not exist: a case is published from its agreed document.`)

  let reverts: string | undefined
  if (down) {
    const last = lastUnreverted(publishLog(repo, the), the.name)
    if (!last) throw new PublishError(`${the.name} has no publish that changed its data file and has not been taken down.`)
    reverts = last.id
    const before = run('git', ['show', `${last.commit}^:${inRepo(the.dataFile)}`], { cwd: repo })
    writeFileSync(resolve(API, the.dataFile), before.status === 0 ? before.stdout : emptyCase(the.document))
  }

  const selected = (
    down
      ? [the.dataFile]
      : [the.dataFile, the.countryFile, the.agreed, the.talk, 'prisma/research/sessions.json', 'prisma/research/README.md']
  ).filter((path) => existsSync(resolve(API, path)))
  // Paths alone, one to a line: a status column's leading space is lost to a trim, and a quoted path to a filter.
  const listed = (args: readonly string[]) =>
    run('git', ['-c', 'core.quotepath=false', ...args], { cwd: repo })
      .stdout.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  const changed = [
    ...listed(['diff', '--name-only', 'HEAD', '--', ...BUILD_INPUTS]),
    ...listed(['ls-files', '--others', '--exclude-standard', '--', ...BUILD_INPUTS]),
  ]
  const others = otherInputs(changed, selected.map(inRepo))
  if (others.length > 0)
    throw new PublishError(`the deployed build is made from changes this publish would not carry: ${others.join(', ')}. Commit them first.`)

  const snapshot = selected.map((path) => ({ path, bytes: readFileSync(resolve(API, path)) }))

  const require = createRequire(import.meta.url)
  console.log(`checking ${the.name}: types and the research specs`)
  const types = run(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit'])
  if (types.status !== 0)
    throw new PublishError(`the type check failed:\n${(types.stdout + types.stderr).trim().split('\n').slice(0, 20).join('\n')}`)
  const vitest = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs')
  // Without colour, so its failures read as plain lines.
  const specs = run(process.execPath, [vitest, 'run', 'test/research-rules.e2e.spec.ts', 'test/research-regions.e2e.spec.ts'], {
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  })
  if (specs.status !== 0) {
    const plain = specs.stdout + specs.stderr
    const failing = plain.split('\n').filter((line) => /FAIL|AssertionError|Error:|Tests\s/.test(line))
    throw new PublishError(`the research specs failed:\n${failing.slice(0, 20).join('\n')}`)
  }

  const moved = changedSince(snapshot, (path) => readFileSync(resolve(API, path)))
  if (moved.length > 0) throw new PublishError(`${moved.join(', ')} changed while the checks ran: run the publish again.`)

  const rules = Object.values(await importFrom(resolve(API, the.countryFile))).find(isRules)
  const current = (await importFrom(resolve(API, the.dataFile)))['CASE']
  if (!rules || !isCase(current))
    throw new PublishError(`${the.countryFile} or ${the.dataFile} does not export what a research case exports.`)
  const digest = digestOf(rules)
  const previous = await caseAt(repo, start, the)

  const id = reverts ?? randomUUID()
  const commit = commitBytes(
    repo,
    start,
    branch,
    snapshot.map((file) => ({ path: inRepo(file.path), bytes: file.bytes })),
    messageOf(down ? 'down' : 'publish', the.name, id),
  )
  const pushed = run('git', ['push', 'origin', branch.replace(/^refs\/heads\//, '')], { cwd: repo })
  if (pushed.status !== 0)
    throw new PublishError(`the push was refused: ${pushed.stderr.trim()}. ${commit} is on ${branch} and not on origin.`)
  console.log(`committed ${commit} and pushed; waiting for the deployed database's digest for ${rules.research} to be ${digest}`)

  // Northflank's build is watched on this commit alone. A push that lands while another build runs can go unbuilt,
  // as c5b8b25 did, and pushing again sends nothing, so a commit with no build status three minutes after its push
  // has its build started through northflank-build.yml, whose run is then followed within its own limits.
  const pushedAt = Date.now()
  let deadline = pushedAt + DIGEST_WAIT
  let fallback: { runId: number; dispatchedAt: number; runningSince: number | null; built: boolean } | null = null
  let deployed = await receiptOf(rules.research).catch(() => null)
  while (deployed !== digest) {
    const now = Date.now()
    if (!fallback) {
      const statuses = readJson(['api', `repos/${REPOSITORY}/commits/${commit}/statuses`])
      const build = statuses === undefined ? undefined : buildStateOf(statuses)
      if (build && (build.state === 'failure' || build.state === 'error')) {
        throw new PublishError(
          `Northflank's build of ${commit} ended ${build.state}: ${build.description}. Fix what it reports, commit that, and publish again.`,
        )
      }
      if (build === null && now - pushedAt > NO_BUILD_WAIT) {
        const runId = startBuild(branch.replace(/^refs\/heads\//, ''), commit)
        fallback = { runId, dispatchedAt: now, runningSince: null, built: false }
        console.log(
          `Northflank had not started building ${commit} three minutes after the push; started it through northflank-build.yml, run ${runId}`,
        )
      }
    } else if (!fallback.built) {
      const record = readRun(fallback.runId)
      const verdict = record === undefined ? null : runVerdict(record, fallback.dispatchedAt, fallback.runningSince, now)
      if (verdict?.outcome === 'failed') {
        throw new PublishError(
          `northflank-build.yml run ${fallback.runId}, building ${commit}, ${verdict.reason}: gh run view ${fallback.runId} --log says why.`,
        )
      }
      if (verdict?.outcome === 'waiting') fallback.runningSince = verdict.runningSince
      if (verdict?.outcome === 'succeeded') {
        fallback.built = true
        deadline = now + DIGEST_WAIT
        console.log(`run ${fallback.runId} built ${commit}; waiting up to 15 minutes for its deploy`)
      }
    }
    // While a started build's run is still going, its own limits apply instead of the digest's.
    if ((!fallback || fallback.built) && now > deadline) {
      throw new PublishError(
        `the deployed digest for ${rules.research} is ${deployed ?? 'missing'} ${fallback ? `15 minutes after run ${fallback.runId} built ${commit}` : 'after 15 minutes'}, not ${digest}: the deploy did not arrive or its load failed; a failed migration stops later deploys at P3009 until prisma migrate resolve runs on the deployed database.`,
      )
    }
    console.log(`${new Date().toISOString()} deployed digest ${deployed ?? 'missing'}, waiting`)
    await sleep(20_000)
    deployed = await receiptOf(rules.research).catch(() => null)
  }

  const problems: string[] = []
  for (const version of current.versions ?? []) {
    const { served, errors } = await servedFor(readerFor(rules, version), version.obligation)
    const expected = [
      ...version.facts,
      ...widerOf(rules, version).flatMap((wider) => wider.facts.filter((fact) => !version.facts.some((mine) => mine.key === fact.key))),
    ]
    const missing = expected.filter((fact) => !shows(rules.sources, served, fact)).map((fact) => fact.key)
    if (errors.length > 0 || missing.length > 0)
      problems.push(`${identity(version)}: ${[...errors, ...missing.map((key) => `${key} not served`)].join('; ')}`)
  }
  for (const region of current.regions ?? []) {
    const { errors } = await servedFor({ to: rules.country, regions: [region.code] }, '')
    if (errors.length > 0) problems.push(`place ${region.code}: ${errors.join('; ')}`)
  }
  const kept = new Set((current.versions ?? []).map(identity))
  const oldSources = { ...rules.sources, ...(previous?.sources ?? {}) }
  for (const version of (previous?.versions ?? []).filter((old) => !kept.has(identity(old)))) {
    const { served } = await servedFor(readerFor(rules, version), version.obligation)
    const still = version.facts.filter((fact) => shows(oldSources, served, fact)).map((fact) => fact.key)
    if (still.length > 0) problems.push(`${identity(version)} was removed and still serves ${still.join(', ')}`)
  }
  const placesKept = new Set((current.regions ?? []).map((region) => region.code))
  for (const region of (previous?.regions ?? []).filter((old) => !placesKept.has(old.code))) {
    const { errors } = await servedFor({ to: rules.country, regions: [region.code] }, '')
    if (errors.length === 0) problems.push(`place ${region.code} was removed and is still accepted`)
  }
  if (problems.length > 0) throw new PublishError(`the deployed API does not answer as ${the.name} says:\n${problems.join('\n')}`)

  console.log(
    `live: ${the.name} ${down ? `taken down, reverting ${reverts}` : `published as ${id}`} in ${commit}, digest ${digest}; ${current.versions?.length ?? 0} versions and ${current.regions?.length ?? 0} places read back`,
  )
  console.log(`now, in the foreground: git reset -q -- ${snapshot.map((file) => `"${inRepo(file.path)}"`).join(' ')}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof PublishError ? `research publish: ${error.message}` : error)
    // Not process.exit: on Windows it can abort while fetch's handles are closing.
    process.exitCode = 1
  })
}
