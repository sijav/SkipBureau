import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { caseOf, changedSince, commitBytes, emptyCase, lastUnreverted, messageOf, otherCode, PublishError } from '../scripts/publish-research.js'
import { compose } from '../src/rules/research/compose.js'
import { digestOf } from '../src/rules/research/digest.js'
import { GERMANY } from '../src/rules/research/germany.js'

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

/** `git log --format=%H%x00%B%x1e` output, newest first. */
const logOf = (...commits: [string, string][]) => commits.map(([sha, body]) => `${sha}\x00${body}\x1e`).join('\n')

test('a down finds the last publish of its case that no down has reverted, by its publish id', () => {
  const name = 'germany/anmeldung'
  const publishA = messageOf('publish', name, 'A')
  const publishB = messageOf('publish', name, 'B')

  expect(lastUnreverted(logOf(['c2', publishB], ['c1', publishA]), name)).toEqual({ id: 'B', commit: 'c2' })
  expect(lastUnreverted(logOf(['c3', messageOf('down', name, 'B')], ['c2', publishB], ['c1', publishA]), name)).toEqual({ id: 'A', commit: 'c1' })
  expect(lastUnreverted(logOf(['c3', publishB], ['c2', messageOf('down', name, 'A')], ['c1', publishA]), name)).toEqual({ id: 'B', commit: 'c3' })
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
  expect(digestOf({ ...GERMANY, versions: [{ ...first, facts: [{ ...fact, numericValue: 3 }, ...facts] }, ...others] })).not.toBe(digestOf(GERMANY))
  expect(() => digestOf({ ...GERMANY, versions: [{ ...first, facts: [{ ...fact, numericValue: Number.NaN }, ...facts] }, ...others] })).toThrow(/NaN/)
})

test("code a publish would not carry is named, and the case's own files and notes such as a plan file are not", () => {
  const selected = ['apps/api/src/rules/research/germany/anmeldung.ts', 'apps/api/src/rules/research/germany.ts']
  const changed = [
    'apps/api/src/rules/research/germany/anmeldung.ts',
    'apps/api/src/rules/research/load.ts',
    'apps/api/src/rules/research/#SB-240 - A plan.md',
    'apps/api/prisma/schema.prisma',
    'apps/api/prisma/migrations/20260916000000_example/migration.sql',
    'apps/api/src/rules/research/load.ts',
  ]
  expect(otherCode(changed, selected)).toEqual([
    'apps/api/src/rules/research/load.ts',
    'apps/api/prisma/schema.prisma',
    'apps/api/prisma/migrations/20260916000000_example/migration.sql',
  ])
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
  expect(() => compose('de', 'germany', [{ document: 'one', regions: [place] }, { document: 'two', regions: [place] }])).toThrow(
    /place DE-XX is listed by both one and two/,
  )
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

test('a commit goes ahead while the main index is locked, and is refused once the branch has moved on', () => {
  const { folder, git, remove } = repository()
  try {
    const start = git('rev-parse', 'HEAD')
    const branch = git('symbolic-ref', 'HEAD')
    writeFileSync(join(folder, '.git', 'index.lock'), '')

    const commit = commitBytes(folder, start, branch, [{ path: 'b.txt', bytes: Buffer.from('2\n') }], 'Research publish: spec\n')
    expect(git('rev-parse', 'HEAD')).toBe(commit)

    rmSync(join(folder, '.git', 'index.lock'))
    expect(() => commitBytes(folder, start, branch, [{ path: 'b.txt', bytes: Buffer.from('3\n') }], 'Research publish: spec\n')).toThrow(PublishError)
    expect(git('rev-parse', 'HEAD')).toBe(commit)
  } finally {
    remove()
  }
})
