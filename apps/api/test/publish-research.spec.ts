import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import {
  buildStateOf,
  caseOf,
  changedSince,
  commitBytes,
  dispatchArgs,
  dispatchChoice,
  emptyCase,
  expectedOf,
  inForceOn,
  labelTestArgs,
  lastUnreverted,
  messageOf,
  NO_RULE_NATIONALITY,
  otherInputs,
  PublishError,
  publishLog,
  readerFor,
  resetNotice,
  runVerdict,
  tipIn,
  uncommittedLabels,
} from '../scripts/publish-research.js'
import { compose } from '../src/rules/research/compose.js'
import { RESEARCHED } from '../src/rules/research/countries.js'
import { digestOf } from '../src/rules/research/digest.js'
import { GERMANY } from '../src/rules/research/germany.js'
import type { ResearchRules, ResearchVersion } from '../src/rules/research/rows.js'
import { withWorkPlaces } from './work-places.js'

// SB-232: the parts of the research publish script that need no database and no network, and its
// commit, built in a temporary repository.

test('a case is read from its path under src/rules/research/<country>/, and any other path is refused', () => {
  expect(caseOf('src/rules/research/germany/anmeldung.ts')).toEqual({
    country: 'germany',
    document: 'anmeldung',
    name: 'germany/anmeldung',
    dataFile: 'src/rules/research/germany/anmeldung.ts',
    countryFile: 'src/rules/research/germany.ts',
    agreed: 'prisma/research/agreed/germany/anmeldung.md',
    talk: 'prisma/research/talk/germany/anmeldung.md',
  })
  expect(caseOf('.\\src\\rules\\research\\turkey\\work-permit.ts').name).toBe('turkey/work-permit')
  expect(() => caseOf('src/rules/research/germany.ts')).toThrow(PublishError)
  expect(() => caseOf('src/rules/research/germany/cities/koeln.ts')).toThrow(PublishError)
})

test('a publish and a down carry the trailers git log --grep finds, and the down names the publish it reverts', () => {
  const publish = messageOf('publish', 'germany/anmeldung', 'id-1')
  expect(publish.split('\n')[0]).toBe('Research publish: germany/anmeldung')
  expect(publish).toMatch(/^Research-Case: germany\/anmeldung$/m)
  expect(publish).toMatch(/^Research-Action: publish$/m)
  expect(publish).toMatch(/^Research-Publish-Id: id-1$/m)

  const down = messageOf('down', 'germany/anmeldung', 'id-1')
  expect(down.split('\n')[0]).toBe('Research down: germany/anmeldung')
  expect(down).toMatch(/^Research-Action: down$/m)
  expect(down).toMatch(/^Research-Reverts: id-1$/m)
})

// SB-235: the commit is built in a temporary index and the branch moved with update-ref, so the
// repository's own index still holds the bytes from before the publish for exactly these paths. Until
// the reset runs, a bare commit commits those old entries as a revert, and checkout or restore writes
// them back into the working tree so the next commit does. The report is where somebody meets that, so
// its wording is held here rather than trusted: the guide had said what to do without saying why, and
// nothing would have failed if the why had never been written.
test('the report names the reset, its paths, and the commands that take a publish back before it runs', () => {
  const notice = resetNotice(['apps/api/src/rules/research/turkey/company-formation.ts', 'apps/api/prisma/research/README.md'])

  expect(notice).toContain(
    'git reset -q -- "apps/api/src/rules/research/turkey/company-formation.ts" "apps/api/prisma/research/README.md"',
  )
  for (const command of ['commit', 'checkout', 'restore']) expect(notice, `the report names ${command}`).toContain(command)
  expect(notice, 'the report says what ignoring it costs').toMatch(/take this publish back/)
})

/** `git log --format=%H%x00%B%x1e` output, newest first. */
const logOf = (...commits: [string, string][]) => commits.map(([sha, body]) => `${sha}\x00${body}\x1e`).join('\n')

test('a down finds the last publish of its case that no down has reverted, by its publish id', () => {
  const name = 'germany/anmeldung'
  const publishA = messageOf('publish', name, 'A')
  const publishB = messageOf('publish', name, 'B')

  expect(lastUnreverted(logOf(['c2', publishB], ['c1', publishA]), name)).toEqual({ id: 'B', commit: 'c2' })
  expect(lastUnreverted(logOf(['c3', messageOf('down', name, 'B')], ['c2', publishB], ['c1', publishA]), name)).toEqual({
    id: 'A',
    commit: 'c1',
  })
  expect(lastUnreverted(logOf(['c3', publishB], ['c2', messageOf('down', name, 'A')], ['c1', publishA]), name)).toEqual({
    id: 'B',
    commit: 'c3',
  })
  expect(lastUnreverted(logOf(['c2', messageOf('down', name, 'A')], ['c1', publishA]), name)).toBeNull()
  // A rebase gives a publish a new commit id and keeps its publish id, so its down still names it.
  expect(lastUnreverted(logOf(['rewritten-down', messageOf('down', name, 'A')], ['rewritten-publish', publishA]), name)).toBeNull()
  expect(lastUnreverted(logOf(['c1', messageOf('publish', 'germany/cities', 'C')]), name)).toBeNull()
})

test('a case taken down before it was ever published names only its document and composes to nothing', () => {
  expect(emptyCase('anmeldung')).toContain("export const CASE: ResearchCase = { document: 'anmeldung' }")
  const without = compose('de', 'germany', [])
  const withEmpty = compose('de', 'germany', [{ document: 'anmeldung' }])
  expect(withEmpty).toEqual(without)
  expect(digestOf(withEmpty)).toBe(digestOf(without))
})

test("a country's digest ignores the order of keys, changes with one fact, and refuses a number JSON would change", () => {
  const { versions, country, ...rest } = GERMANY
  expect(digestOf({ versions, ...rest, country })).toBe(digestOf(GERMANY))

  const [first, ...others] = versions
  const [fact, ...facts] = first?.facts ?? []
  if (!first || !fact) throw new Error("Germany's file has no version with a fact")
  expect(digestOf({ ...GERMANY, versions: [{ ...first, facts: [{ ...fact, numericValue: 3 }, ...facts] }, ...others] })).not.toBe(
    digestOf(GERMANY),
  )
  expect(() =>
    digestOf({ ...GERMANY, versions: [{ ...first, facts: [{ ...fact, numericValue: Number.NaN }, ...facts] }, ...others] }),
  ).toThrow(/NaN/)
})

test("a change the deployed build is made from and the publish would not carry is named, and the case's own files and Markdown are not", () => {
  const selected = ['apps/api/src/rules/research/germany/anmeldung.ts', 'apps/api/src/rules/research/germany.ts']
  const changed = [
    'apps/api/src/rules/research/germany/anmeldung.ts',
    'apps/api/src/rules/research/load.ts',
    'apps/api/src/rules/research/#SB-240 - A plan.md',
    'apps/api/prisma/migrations/20260916000000_example/migration.sql',
    'apps/api/Dockerfile',
    'apps/api/scripts/publish-research.ts',
    'package-lock.json',
    'apps/api/src/rules/research/load.ts',
  ]
  expect(otherInputs(changed, selected)).toEqual([
    'apps/api/src/rules/research/load.ts',
    'apps/api/prisma/migrations/20260916000000_example/migration.sql',
    'apps/api/Dockerfile',
    'apps/api/scripts/publish-research.ts',
    'package-lock.json',
  ])
})

test('a reader is built from a version, and a version with no place is asked from a Land in which no rule names a place', () => {
  const munich = GERMANY.versions.find((version) => version.criteria.some((criterion) => criterion.value === 'DE-BY.muenchen'))
  const federal = GERMANY.versions.find(
    (version) =>
      version.obligation === 'report-your-address' && !version.criteria.some((criterion) => criterion.dimension === 'residenceRegion'),
  )
  const [first] = GERMANY.regions.filter((region) => region.parent === null)
  if (!munich || !federal || !first) throw new Error("Germany's file has no Munich version, no federal Anmeldung version or no Land")
  expect(readerFor(GERMANY, munich)).toEqual({ to: GERMANY.country, regions: ['DE-BY.muenchen'] })

  // A city rule inside the first Land listed, so a federal reader asked from there would be asked where in it instead.
  const withCity: ResearchRules = {
    ...GERMANY,
    versions: [...GERMANY.versions, { ...munich, criteria: [{ dimension: 'residenceRegion', value: `${first.code}.spec-city` }] }],
  }
  const asked = readerFor(withCity, federal).regions?.[0]
  expect(asked).toBeDefined()
  expect(asked).not.toBe(first.code)
  expect(
    withCity.versions.some((version) =>
      version.criteria.some((criterion) => criterion.value === asked || criterion.value.startsWith(`${asked}.`)),
    ),
  ).toBe(false)
})

test('a version with no nationality, beside one for a nationality group, is asked as a reader of no group, and a version whose obligation names no nationality is asked with none', () => {
  const slug = 'get-a-residence-permit-as-a-skilled-worker-with-a-degree'
  const names = (version: ResearchVersion, value: string) => version.criteria.some((criterion) => criterion.value === value)
  const federal = GERMANY.versions.find(
    (version) =>
      version.obligation === slug &&
      names(version, 'de.national-visa') &&
      !version.criteria.some((criterion) => criterion.dimension === 'residenceRegion'),
  )
  const munich = GERMANY.versions.find(
    (version) => version.obligation === slug && names(version, 'de.national-visa') && names(version, 'DE-BY.muenchen'),
  )
  const address = GERMANY.versions.find((version) => version.obligation === 'report-your-address')
  if (!federal || !munich || !address) throw new Error("Germany's file has no D visa version of the permit, no Munich one, or no Anmeldung")

  const grouped: ResearchVersion = { ...federal, criteria: [...federal.criteria, { dimension: 'nationalityGroup', value: 'spec.group' }] }
  const withGroup: ResearchRules = {
    ...GERMANY,
    nationalityGroups: [
      ...GERMANY.nationalityGroups,
      { code: 'spec.group', name: 'A group no rule names', members: [{ nationality: 'au', from: federal.validFrom }] },
    ],
    versions: [...GERMANY.versions, grouped],
  }
  expect(readerFor(withGroup, federal).nationality).toBe(NO_RULE_NATIONALITY)
  expect(readerFor(withGroup, munich)).toEqual({
    to: GERMANY.country,
    statuses: ['de.national-visa'],
    regions: ['DE-BY.muenchen'],
    nationality: NO_RULE_NATIONALITY,
  })
  expect(readerFor(withGroup, grouped).nationality).toBe('au')
  expect(readerFor(withGroup, address).nationality).toBeUndefined()

  // The reader stands for no nationality rule only while no rule or group names its nationality.
  for (const rules of RESEARCHED) {
    const named = [
      ...rules.versions.flatMap((version) =>
        version.criteria.filter((criterion) => criterion.dimension === 'nationality').map((criterion) => criterion.value),
      ),
      ...rules.nationalityGroups.flatMap((group) => group.members.map((member) => member.nationality)),
    ]
    expect(named, rules.research).not.toContain(NO_RULE_NATIONALITY)
  }
})

test('a version for where a reader works is asked with its work region, and a version naming none, beside it, from a Land in which no rule names a work region', () => {
  const { rules, federal, hamburg, work, mixed } = withWorkPlaces()
  const worksNamed = rules.versions.flatMap((version) =>
    version.criteria.filter((criterion) => criterion.dimension === 'workRegion').map((criterion) => criterion.value),
  )

  const asWorker = readerFor(rules, work)
  expect(asWorker.workRegions).toEqual(['DE-SN'])
  expect(asWorker.regions).toHaveLength(1)
  expect(readerFor(rules, mixed)).toMatchObject({ regions: ['DE-HH'], workRegions: ['DE-SN'] })
  for (const version of [federal, hamburg]) {
    const [worksIn, ...more] = readerFor(rules, version).workRegions ?? []
    expect(more).toEqual([])
    expect(worksIn, 'a work region for a version naming none').toBeDefined()
    expect(worksNamed.some((code) => code === worksIn || code.startsWith(`${worksIn}.`))).toBe(false)
  }
  expect(readerFor(rules, hamburg).regions).toEqual(['DE-HH'])
  expect(readerFor(GERMANY, federal).workRegions).toBeUndefined()
})

test("what a version's reader must be served is the resolver's own answer: each key from the most specific wider version, equal facts from the page that sorts first, and a key two of them state differently disputed", () => {
  const today = '2026-09-15'
  const { rules, federal, hamburg, work, mixed } = withWorkPlaces()
  const pageOf = (version: ResearchVersion) => rules.sources[version.source]?.url ?? ''
  // The test's premise: the work version's page sorts before Hamburg's, and its id would not, so page order and id order
  // pick different facts.
  expect(pageOf(work) < pageOf(hamburg)).toBe(true)

  const answer = expectedOf(rules, mixed, today)
  expect(answer.disputed).toBeNull()
  const from = new Map(answer.facts.map((fact) => [fact.key, fact.sourceUrl]))
  expect(from.get('specMixedOnly')).toBe(pageOf(hamburg))
  expect(from.get('registrationFee')).toBe(pageOf(hamburg))
  expect(from.get('specTie')).toBe(pageOf(work))
  for (const key of federal.facts.map((fact) => fact.key)) expect(from.has(key), key).toBe(true)

  expect(expectedOf(withWorkPlaces(true).rules, mixed, today).disputed).not.toBeNull()
})

test('a version is asked only on the days it holds, from its first day until the first day it no longer does', () => {
  const [version] = GERMANY.versions
  if (!version) throw new Error("Germany's file has no version")
  const held = { ...version, validFrom: '2026-09-15', validTo: '2026-10-01' }
  expect(inForceOn(held, '2026-09-14')).toBe(false)
  expect(inForceOn(held, '2026-09-15')).toBe(true)
  expect(inForceOn(held, '2026-09-30')).toBe(true)
  expect(inForceOn(held, '2026-10-01')).toBe(false)
  expect(inForceOn({ ...version, validFrom: '2026-09-15' }, '2099-01-01')).toBe(true)
})

test("Northflank's state of a commit is its newest status in Northflank's own context, another context's passed over, and none where it posted none", () => {
  const context = 'northflank/sijavs-team/skipbureau/buildfromgithub'
  const statuses = [
    { context: 'ci/other', state: 'failure', description: 'another check' },
    { context, state: 'success', description: 'Commit was built successfully' },
    { context, state: 'pending', description: 'Building' },
  ]
  expect(buildStateOf(statuses)).toEqual({ state: 'success', description: 'Commit was built successfully' })
  expect(buildStateOf(statuses.slice(0, 1))).toBeNull()
  expect(buildStateOf([])).toBeNull()
  expect(buildStateOf({ message: 'Not Found' })).toBeNull()
})

test('the dispatch that starts a skipped build names the branch, passes the commit as the workflow input and asks GitHub to name the run', () => {
  const commit = 'c5b8b25d2304e71d0529474c0b4ff62c74fcbd85'
  expect(dispatchArgs('main', commit)).toEqual([
    'api',
    '-X',
    'POST',
    'repos/sijav/SkipBureau/actions/workflows/northflank-build.yml/dispatches',
    '-f',
    'ref=main',
    '-f',
    `inputs[sha]=${commit}`,
    '-F',
    'return_run_details=true',
  ])
})

// SB-236: that dispatch is for the publish's own commit, so it may only be made while the branch still points at it.
// A newer push under apps/api carries the publish too, and starting the older commit's build deploys older code over
// the newer one with the digest matching either way.
test("a skipped build is started only while the publish's commit is still the branch's tip", () => {
  const commit = 'ab4966fcc8bbfd57d8bd843c6b5b6ff89d3a61a2'
  const newer = '3c45927a0f1b4d2e8c7a6b5d4e3f2a1b0c9d8e7f'

  expect(dispatchChoice(commit, commit)).toEqual({ dispatch: true })

  const moved = dispatchChoice(newer, commit)
  expect(moved.dispatch).toBe(false)
  expect(moved.dispatch === false && moved.reason).toContain(newer)

  const unknown = dispatchChoice(null, commit)
  expect(unknown.dispatch).toBe(false)
  expect(unknown.dispatch === false && unknown.reason).toContain('could not be read')
})

// git ls-remote exits successfully when a ref matches nothing, so an empty answer must not read as a tip: that is the
// one way a dispatch could still be made blind.
// SB-297: the publish writes research to the live database and checked nothing web-side, so a situation or a fact
// with no name went live and the deployed site showed a raw code or dropped the line. The web's two label tests read
// the research itself, through the api alias, so running them here catches it before anything is written.
test("the web's label tests are run from the web, by project, as two named files", () => {
  expect(labelTestArgs('/x/vitest.mjs')).toEqual([
    '/x/vitest.mjs',
    'run',
    '--project=unit',
    'src/shared/context-control/situationLabels.test.ts',
    'src/shared/rule-answer/factLabels.test.ts',
  ])
})

// The publish carries only the API's research files, so a label added but not committed would let the gate pass while
// the live site stayed unnamed: passing against a tree the publish will not carry is worse than not checking.
test('a label source the publish would leave behind is named, and a committed one is not', () => {
  const situations = 'apps/web/src/shared/context-control/situationLabels.ts'
  const facts = 'apps/web/src/shared/rule-answer/factLabels.ts'

  expect(uncommittedLabels([])).toEqual([])
  expect(uncommittedLabels(['apps/api/src/rules/research/turkey/work-permit.ts'])).toEqual([])
  expect(uncommittedLabels([facts])).toEqual([facts])
  expect(uncommittedLabels([facts, situations, 'apps/api/src/tasks.ts'])).toEqual([situations, facts])
})

test('a tip is read only from a well formed line for the ref that was asked for', () => {
  const sha = 'ab4966fcc8bbfd57d8bd843c6b5b6ff89d3a61a2'
  const branch = 'refs/heads/main'

  expect(tipIn(`${sha}\t${branch}\n`, branch)).toBe(sha)
  expect(tipIn('', branch), 'a ref matching nothing still exits zero').toBeNull()
  expect(tipIn(`${sha.slice(0, 20)}\t${branch}\n`, branch), 'not forty hex characters').toBeNull()
  expect(tipIn(`${sha}\trefs/heads/other\n`, branch), 'another ref').toBeNull()
})

test('a file changed after the publish read it is named, so what is committed is what was checked', () => {
  const snapshot = [
    { path: 'src/rules/research/germany/anmeldung.ts', bytes: Buffer.from('as checked') },
    { path: 'src/rules/research/germany.ts', bytes: Buffer.from('as checked') },
  ]
  const disk = new Map([
    ['src/rules/research/germany/anmeldung.ts', Buffer.from('edited by the next task')],
    ['src/rules/research/germany.ts', Buffer.from('as checked')],
  ])
  expect(changedSince(snapshot, (path) => disk.get(path) ?? Buffer.alloc(0))).toEqual(['src/rules/research/germany/anmeldung.ts'])
})

test('composing refuses a place two cases list, naming both', () => {
  const place = { code: 'DE-XX', parent: null, name: 'Listed twice' }
  expect(() =>
    compose('de', 'germany', [
      { document: 'one', regions: [place] },
      { document: 'two', regions: [place] },
    ]),
  ).toThrow(/place DE-XX is listed by both one and two/)
})

/** A throwaway repository with one commit, git's file monitor off so no watcher outlives it. */
const repository = () => {
  const folder = mkdtempSync(join(tmpdir(), 'publish-research-spec-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: folder, encoding: 'utf8' }).trim()
  git('-c', 'core.fsmonitor=false', 'init', '-q', '.')
  for (const [key, value] of [
    ['core.fsmonitor', 'false'],
    ['user.email', 'spec@example.invalid'],
    ['user.name', 'spec'],
    ['commit.gpgsign', 'false'],
  ] as const) {
    git('config', key, value)
  }
  writeFileSync(join(folder, 'a.txt'), '1\n')
  writeFileSync(join(folder, 'b.txt'), '1\n')
  git('add', 'a.txt', 'b.txt')
  git('commit', '-qm', 'base')
  const remove = () => {
    try {
      execFileSync('git', ['fsmonitor--daemon', 'stop'], { cwd: folder, stdio: 'ignore' })
    } catch {
      // No watcher was started, which is the point of turning it off.
    }
    rmSync(folder, { recursive: true, force: true })
  }
  return { folder, git, remove }
}

test('a commit built from checked bytes moves the branch and leaves the main index exactly as it was, a change another process staged included', () => {
  const { folder, git, remove } = repository()
  try {
    const start = git('rev-parse', 'HEAD')
    const branch = git('symbolic-ref', 'HEAD')
    writeFileSync(join(folder, 'a.txt'), 'staged by the next task\n')
    git('add', 'a.txt')
    const index = git('ls-files', '-s')

    const commit = commitBytes(folder, start, branch, [{ path: 'b.txt', bytes: Buffer.from('2\n') }], 'Research publish: spec\n')

    expect(git('rev-parse', 'HEAD')).toBe(commit)
    expect(git('show', 'HEAD:b.txt')).toBe('2')
    expect(git('show', 'HEAD:a.txt')).toBe('1')
    expect(git('ls-files', '-s')).toBe(index)
    expect(git('diff', '--cached', '--name-only').split('\n')).toContain('a.txt')
  } finally {
    remove()
  }
})

test('a dispatched run passes only once completed with success, and is stuck unstarted after thirty minutes or running after twenty-two', () => {
  const minute = 60_000
  const dispatchedAt = 1_000_000
  const at = (minutes: number) => dispatchedAt + minutes * minute
  expect(runVerdict({ status: 'completed', conclusion: 'success' }, dispatchedAt, null, at(5))).toEqual({ outcome: 'succeeded' })
  expect(runVerdict({ status: 'completed', conclusion: 'timed_out' }, dispatchedAt, null, at(5))).toEqual({
    outcome: 'failed',
    reason: 'ended timed_out',
  })
  expect(runVerdict({ status: 'completed', conclusion: null }, dispatchedAt, null, at(5))).toEqual({
    outcome: 'failed',
    reason: 'ended with no conclusion',
  })

  expect(runVerdict({ status: 'queued', conclusion: null }, dispatchedAt, null, at(29))).toEqual({ outcome: 'waiting', runningSince: null })
  expect(runVerdict({ status: 'pending', conclusion: null }, dispatchedAt, null, at(31))).toMatchObject({ outcome: 'failed' })

  // Started at minute twenty-nine: past the thirty minutes a run has to start, and still waited for until twenty-two minutes after it started.
  expect(runVerdict({ status: 'in_progress', conclusion: null }, dispatchedAt, null, at(29))).toEqual({
    outcome: 'waiting',
    runningSince: at(29),
  })
  expect(runVerdict({ status: 'in_progress', conclusion: null }, dispatchedAt, at(29), at(45))).toEqual({
    outcome: 'waiting',
    runningSince: at(29),
  })
  expect(runVerdict({ status: 'in_progress', conclusion: null }, dispatchedAt, at(29), at(52))).toMatchObject({ outcome: 'failed' })
})

test('a down reads only the publishes that changed its data file, so a publish run again with nothing changed is passed over', () => {
  const { folder, git, remove } = repository()
  try {
    const the = caseOf('src/rules/research/germany/anmeldung.ts')
    const path = `apps/api/${the.dataFile}`
    const branch = git('symbolic-ref', 'HEAD')
    const created = commitBytes(
      folder,
      git('rev-parse', 'HEAD'),
      branch,
      [{ path, bytes: Buffer.from('as split\n') }],
      'SB-232: the case file\n',
    )
    const published = commitBytes(
      folder,
      created,
      branch,
      [{ path, bytes: Buffer.from('as published\n') }],
      messageOf('publish', the.name, 'A'),
    )
    commitBytes(folder, published, branch, [{ path, bytes: Buffer.from('as published\n') }], messageOf('publish', the.name, 'B'))

    expect(lastUnreverted(publishLog(folder, the), the.name)).toEqual({ id: 'A', commit: published })
  } finally {
    remove()
  }
})

test('a commit goes ahead while the main index is locked, and is refused once the branch has moved on', () => {
  const { folder, git, remove } = repository()
  try {
    const start = git('rev-parse', 'HEAD')
    const branch = git('symbolic-ref', 'HEAD')
    writeFileSync(join(folder, '.git', 'index.lock'), '')

    const commit = commitBytes(folder, start, branch, [{ path: 'b.txt', bytes: Buffer.from('2\n') }], 'Research publish: spec\n')
    expect(git('rev-parse', 'HEAD')).toBe(commit)

    rmSync(join(folder, '.git', 'index.lock'))
    expect(() => commitBytes(folder, start, branch, [{ path: 'b.txt', bytes: Buffer.from('3\n') }], 'Research publish: spec\n')).toThrow(
      PublishError,
    )
    expect(git('rev-parse', 'HEAD')).toBe(commit)
  } finally {
    remove()
  }
})
