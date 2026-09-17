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
import type { ResearchCase, ResearchRules, ResearchVersion } from '../src/rules/research/rows.js'
import { answerOf, type Answer } from '../src/rules/answer.js'
import type { Fact } from '../src/rules/diff.js'
import type { Trees } from '../src/rules/eligibility.js'

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

/**
 * What the report says when the publish is done (SB-235).
 *
 * The commit is built in a temporary index and the branch moved with `update-ref`, so the repository's
 * own index still holds the bytes from before the publish for exactly these paths. Until the reset
 * runs, a bare `git commit` commits those old entries as an immediate revert, and `git checkout --` or
 * `git restore` writes them back into the working tree so the next commit does. Exported so the spec
 * can hold the wording: a warning nobody can assert is a warning that rots, which is how the guide came
 * to say what to do without saying why.
 */
export const resetNotice = (paths: readonly string[]): string =>
  `now, in the foreground: git reset -q -- ${paths.map((path) => `"${path}"`).join(' ')}\n` +
  'Before any commit, checkout or restore, run that line: the main index still holds the pre-publish bytes, and a plain commit would take this publish back.'

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

/**
 * What the case's data file held, ready to be put back (SB-343).
 *
 * A take-down rewrites that file BEFORE the checks, and has to: the type check, the research specs and the digest
 * all read the reverted state, so checking the state a take-down is removing would prove nothing about it. That
 * leaves a window where any failure would abandon an edit in the working tree that nobody made and nothing reports.
 *
 * The file may not be there to begin with, since caseOf parses the path and checks nothing on disk, so restoring
 * one that did not exist REMOVES it rather than writing bytes back.
 */
export const restorer = (path: string): (() => void) => {
  const was = existsSync(path) ? readFileSync(path) : null
  return () => {
    if (was === null) rmSync(path, { force: true })
    else writeFileSync(path, was)
  }
}

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

export type Reader = {
  to: string
  statuses?: string[]
  nationality?: string
  situation?: string
  regions?: string[]
  workRegions?: string[]
}

/** The nationality of a reader no nationality rule is for: ISO 3166 leaves `xx` to users, so no rule or group may name it (SB-242). */
export const NO_RULE_NATIONALITY = 'xx'

const namesNationality = (version: ResearchVersion): boolean =>
  version.criteria.some((criterion) => criterion.dimension === 'nationality' || criterion.dimension === 'nationalityGroup')

/** A Land in which no version of the obligation names a place of this kind, or none where no version names one. */
const unnamedLand = (rules: ResearchRules, obligation: string, dimension: 'residenceRegion' | 'workRegion'): string | undefined => {
  const named = rules.versions
    .filter((other) => other.obligation === obligation)
    .flatMap((other) => other.criteria.filter((criterion) => criterion.dimension === dimension).map((criterion) => criterion.value))
  if (named.length === 0) return undefined
  return rules.regions.find(
    (region) => region.parent === null && !named.some((code) => code === region.code || code.startsWith(`${region.code}.`)),
  )?.code
}

export const readerFor = (rules: ResearchRules, version: ResearchVersion): Reader => {
  const reader: Reader = { to: rules.country }
  // A reader who has said no nationality is asked for it wherever another version of the obligation names one.
  if (!namesNationality(version) && rules.versions.some((other) => other.obligation === version.obligation && namesNationality(other)))
    reader.nationality = NO_RULE_NATIONALITY
  for (const criterion of version.criteria) {
    if (criterion.dimension === 'residenceStatus') reader.statuses = [criterion.value]
    if (criterion.dimension === 'situation') reader.situation = criterion.value
    if (criterion.dimension === 'nationality') reader.nationality = criterion.value
    if (criterion.dimension === 'residenceRegion') reader.regions = [criterion.value]
    if (criterion.dimension === 'workRegion') reader.workRegions = [criterion.value]
    if (criterion.dimension === 'nationalityGroup') {
      const member = rules.nationalityGroups.find((group) => group.code === criterion.value)?.members[0]?.nationality
      if (member) reader.nationality = member
    }
  }
  // A version with no place of a kind, whose obligation has a version naming one, is asked from a Land in which no rule
  // names a place of that kind: a Land holding a named city asks where in it the reader lives or works (SB-229, SB-249).
  const livesIn = unnamedLand(rules, version.obligation, 'residenceRegion')
  if (!reader.regions && livesIn) reader.regions = [livesIn]
  const worksIn = unnamedLand(rules, version.obligation, 'workRegion')
  if (!reader.workRegions && worksIn) reader.workRegions = [worksIn]
  return reader
}

/** A version's facts as the resolver holds them, each with the page, name and read date its source gives (SB-249). */
export const factsOf = (rules: ResearchRules, version: ResearchVersion): Fact[] =>
  version.facts.map((fact) => {
    const page = rules.sources[fact.source]
    return {
      key: fact.key,
      operator: fact.operator,
      numericValue: fact.numericValue === undefined ? null : String(fact.numericValue),
      textValue: fact.textValue ?? null,
      unit: fact.unit ?? null,
      currency: fact.currency ?? null,
      ruleVersionId: identity(version),
      sourceUrl: page?.url ?? '',
      sourceName: page?.name ?? '',
      verifiedAt: page?.read ?? '',
    }
  })

/** Whether a version holds on a day, YYYY-MM-DD: from its first day until the first day it no longer does. */
export const inForceOn = (version: ResearchVersion, day: string): boolean =>
  version.validFrom <= day && (version.validTo === undefined || day < version.validTo)

/** The file's places and statuses, each code to its parent, as the resolver builds its trees from the database. */
const treesOf = (rules: ResearchRules): Trees => ({
  places: new Map(rules.regions.map((region) => [region.code, region.parent])),
  statuses: new Map(rules.statuses.map((status) => [status.code, status.parent])),
})

/**
 * What the deployed resolver answers a reader a version is for: its facts completed from the versions in force on the day
 * that it narrows, by the resolver's own answerOf, so the read-back never holds a second copy of that rule (SB-249).
 */
export const expectedOf = (rules: ResearchRules, version: ResearchVersion, day: string): Answer => {
  const standing = rules.versions
    .filter((other) => other.obligation === version.obligation && inForceOn(other, day))
    .map((other) => ({ id: identity(other), criteria: other.criteria, facts: factsOf(rules, other), open: [] }))
  const candidate = standing.find((other) => other.id === identity(version))
  return candidate ? answerOf(candidate, standing, treesOf(rules)) : { facts: [], disputed: null }
}

export type Served = {
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

/** Whether the served facts hold this one, every field the API serves compared, the version it came from aside. */
export const shows = (served: readonly Served[], fact: Fact): boolean =>
  served.some(
    (shown) =>
      shown.key === fact.key &&
      shown.operator === fact.operator &&
      shown.numericValue === fact.numericValue &&
      shown.textValue === fact.textValue &&
      shown.unit === fact.unit &&
      shown.currency === fact.currency &&
      shown.sourceUrl === fact.sourceUrl &&
      shown.sourceName === fact.sourceName &&
      shown.verifiedAt === fact.verifiedAt,
  )

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

export const MOVE = `query Sweep($to: String!, $statuses: [String!], $nationality: String, $situation: String, $regions: [String!], $workRegions: [String!]) {
  move(from: "xx", to: $to, residenceStatuses: $statuses, nationality: $nationality, situation: $situation, toResidenceRegions: $regions, toWorkRegions: $workRegions) {
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
  // SB-338: the tip check above is two calls with a gap a push can land in, so it narrows this race and cannot
  // close it. The workflow refuses a sha that is not the commit GitHub recorded for the ref when it accepted the
  // dispatch, which has no gap. Only the publish sets this; a build of an older commit by hand leaves it off.
  '-f',
  'inputs[require_tip]=true',
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

/** Whether a skipped build may be started for a commit (SB-236). */
export type DispatchChoice = { dispatch: true } | { dispatch: false; reason: string }

/**
 * The build below is started for the publish's own commit, so it may only be started while that commit is still what
 * the branch points at. A newer push under `apps/api` carries this publish too and its build deploys newer code;
 * starting the older commit's build then deploys that older code over it, and nothing says it happened, because the
 * digest is of the research file, which both commits satisfy. A tip that cannot be read counts as moved: dispatching
 * on an unknown tip is the thing this refuses.
 */
export const dispatchChoice = (tip: string | null, commit: string): DispatchChoice =>
  tip === commit
    ? { dispatch: true }
    : {
        dispatch: false,
        reason:
          tip === null
            ? `the branch's tip on origin could not be read, so ${commit} may no longer be it`
            : `the branch has moved to ${tip}, whose build carries this publish`,
      }

/**
 * The sha a `git ls-remote origin <ref>` answer gives for that ref, or null.
 *
 * `ls-remote` exits successfully when a ref matches nothing, so an empty answer must not read as a tip: only a line
 * of forty hex characters against the ref that was asked for counts.
 */
export const tipIn = (output: string, branch: string): string | null => {
  const [line] = output.split('\n')
  const [sha, ref] = (line ?? '').split('\t')
  return sha !== undefined && ref === branch && /^[0-9a-f]{40}$/.test(sha) ? sha : null
}

/** What the branch points at on origin, or null where that cannot be read: this runs inside the wait and never throws. */
const tipOf = (branch: string): string | null => {
  const answer = run('git', ['ls-remote', 'origin', branch])
  return answer.status === 0 ? tipIn(answer.stdout, branch) : null
}

/** The web, where the label tests a research file can break live (SB-297). */
const WEB = resolve(API, '..', 'web')

/**
 * The web sources naming what a research file adds, as paths in the repository.
 *
 * A research file that adds a situation, or a fact to an obligation a guide links, needs a name here or the deployed
 * site shows the raw code and drops the unnamed fact's line. The publish carries neither file, so both have to be
 * committed before it runs: a gate passing against a working tree the publish will not carry reports a safety it has
 * not established.
 */
export const LABEL_SOURCES: readonly string[] = [
  'apps/web/src/shared/context-control/situationLabels.ts',
  'apps/web/src/shared/rule-answer/factLabels.ts',
]

/** Those label sources this publish would leave behind: changed or untracked, and so not in what it commits. */
export const uncommittedLabels = (changed: readonly string[]): string[] => LABEL_SOURCES.filter((path) => changed.includes(path))

/**
 * The web's label tests, run from the web so its own config, alias and lingui plugin are the ones in force.
 *
 * `--project=unit` and not the whole run: the web has four storybook projects beside it, which need a browser and
 * race over one pre-bundle here. Two named files and not the whole unit project: a publish must refuse for the thing
 * it is checking, and an unrelated web failure stopping a research publish is a worse kind of stop.
 */
export const labelTestArgs = (vitest: string): string[] => [
  vitest,
  'run',
  '--project=unit',
  'src/shared/context-control/situationLabels.test.ts',
  'src/shared/rule-answer/factLabels.test.ts',
]

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
  // SB-343: set where a take-down rewrites the data file, called if anything fails before the commit.
  let restore: (() => void) | null = null
  let committed = false
  if (down) {
    const last = lastUnreverted(publishLog(repo, the), the.name)
    if (!last) throw new PublishError(`${the.name} has no publish that changed its data file and has not been taken down.`)
    reverts = last.id
    const before = run('git', ['show', `${last.commit}^:${inRepo(the.dataFile)}`], { cwd: repo })
    restore = restorer(resolve(API, the.dataFile))
    writeFileSync(resolve(API, the.dataFile), before.status === 0 ? before.stdout : emptyCase(the.document))
  }

  try {
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

    // SB-297: the web is what names a situation or a fact this research adds, and the publish carries neither label
    // file, so both have to be committed already: a gate that passes against a tree the publish will not carry reports
    // a safety it has not established. BUILD_INPUTS never sees them, being the API's own, so they are read by name.
    const dirtyLabels = uncommittedLabels([
      ...listed(['diff', '--name-only', 'HEAD', '--', ...LABEL_SOURCES]),
      ...listed(['ls-files', '--others', '--exclude-standard', '--', ...LABEL_SOURCES]),
    ])
    if (dirtyLabels.length > 0) {
      throw new PublishError(
        `the web's names for what this research adds are not committed: ${dirtyLabels.join(', ')}. Commit them first, or this publish carries the research and the site keeps no name for it.`,
      )
    }
    const labels = run(process.execPath, labelTestArgs(vitest), { cwd: WEB, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' } })
    if (labels.status !== 0) {
      const plain = labels.stdout + labels.stderr
      const failing = plain.split('\n').filter((line) => /FAIL|AssertionError|Error:|Tests\s/.test(line))
      throw new PublishError(`the web has no name for what this research adds:\n${failing.slice(0, 20).join('\n')}`)
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
    // SB-343: the restore window closes HERE, not at the end of the run. The commit now holds the reverted bytes,
    // and resetNotice tells the operator the index still holds the pre-publish ones, so putting the old content
    // back after this would leave the working tree contradicting the commit that is about to be pushed.
    committed = true
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
    // Said once per reason rather than every twenty seconds, since the loop already prints a line each time round.
    let declined: string | null = null
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
          // Only while this commit is still the branch's tip (SB-236): a build started for it after a newer push would
          // deploy older code over the newer, and the digest would match either way.
          const choice = dispatchChoice(tipOf(branch), commit)
          if (choice.dispatch) {
            const runId = startBuild(branch.replace(/^refs\/heads\//, ''), commit)
            fallback = { runId, dispatchedAt: now, runningSince: null, built: false }
            console.log(
              `Northflank had not started building ${commit} three minutes after the push; started it through northflank-build.yml, run ${runId}`,
            )
          } else if (declined !== choice.reason) {
            declined = choice.reason
            console.log(`not starting a build of ${commit}: ${choice.reason}; waiting for that build's digest instead`)
          }
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
    // Only a version in force today is asked, since the deployed resolver answers nothing else today (SB-249).
    const today = new Date().toISOString().slice(0, 10)
    for (const version of (current.versions ?? []).filter((version) => inForceOn(version, today))) {
      const answer = expectedOf(rules, version, today)
      if (answer.disputed !== null) {
        problems.push(`${identity(version)}: the file's own versions dispute its answer: ${answer.disputed}`)
        continue
      }
      const { served, errors } = await servedFor(readerFor(rules, version), version.obligation)
      const missing = answer.facts.filter((fact) => !shows(served, fact)).map((fact) => fact.key)
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
      const still = factsOf({ ...rules, sources: oldSources }, version)
        .filter((fact) => shows(served, fact))
        .map((fact) => fact.key)
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
    console.log(resetNotice(snapshot.map((file) => inRepo(file.path))))
  } catch (error) {
    // SB-343: a take-down rewrote the case data file before any of this ran, so a failure here would otherwise
    // abandon an edit nobody made. After the commit there is nothing to undo, which is what committed says.
    if (!committed) restore?.()
    throw error
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof PublishError ? `research publish: ${error.message}` : error)
    // Not process.exit: on Windows it can abort while fetch's handles are closing.
    process.exitCode = 1
  })
}
