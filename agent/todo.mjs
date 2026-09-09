#!/usr/bin/env node
// The board. A real database, at agent/todo.db.
//
//   npm run todo                      the whole board
//   npm run todo -- next              what to do next, and why it was picked
//   npm run todo -- add --title ...   create a task, all nine fields required
//   npm run todo -- move SB-003 done  change a status
//   npm run todo -- show SB-003       one task in full
//
// Selection rule, the owner's: highest severity, then fewest story points, then
// lowest id, and never a task whose parent is unfinished. Anything already in
// progress or review comes first, so work in flight gets finished.

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// SQLite is inside Node, so this script has no dependencies and works in a
// checkout with no node_modules. It is unflagged from Node 24; on 22 and 23 it
// needs --experimental-sqlite, and before that it does not exist. Saying which
// beats letting the import throw a stack trace at someone.
let DatabaseSync
try {
  ;({ DatabaseSync } = await import('node:sqlite'))
} catch {
  console.error(`This board needs node:sqlite, and this is Node ${process.version}.`)
  console.error('Node 24 or newer has it built in. On 22 or 23, run with --experimental-sqlite.')
  console.error('There is nothing to install: SQLite ships inside Node, and this script has no dependencies.')
  process.exit(1)
}

const AGENT = dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(join(AGENT, 'todo.db'))

const SEVERITIES = ['critical', 'high', 'medium', 'low']
const STATUSES = ['backlog', 'in_progress', 'wait_for_roast', 'done', 'dropped']
const POINTS = [1, 2, 3, 5, 8, 13]

db.exec(`
  CREATE TABLE IF NOT EXISTS task (
    id        TEXT PRIMARY KEY,
    title     TEXT NOT NULL,
    descr     TEXT NOT NULL,
    why       TEXT NOT NULL,
    severity  TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')),
    points    INTEGER NOT NULL CHECK (points IN (1,2,3,5,8,13)),
    status    TEXT NOT NULL CHECK (status IN ('backlog','in_progress','wait_for_roast','done','dropped')),
    exit_cond TEXT NOT NULL,
    created   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS blocked_by (
    task    TEXT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    parent  TEXT NOT NULL,
    PRIMARY KEY (task, parent)
  );
`)

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const parents = (id) => db.prepare('SELECT parent FROM blocked_by WHERE task = ?').all(id).map((row) => row.parent)

const withParents = (task) => ({ ...task, parents: parents(task.id) })

const all = () => db.prepare('SELECT * FROM task ORDER BY id').all().map(withParents)

const one = (id) => {
  const task = db.prepare('SELECT * FROM task WHERE id = ?').get(id)
  if (!task) fail(`No task ${id}.`)
  return withParents(task)
}

const nextId = () => {
  const highest = db.prepare("SELECT id FROM task ORDER BY CAST(substr(id, 4) AS INTEGER) DESC LIMIT 1").get()
  const number = highest ? Number(highest.id.slice(3)) + 1 : 1
  return `SB-${String(number).padStart(3, '0')}`
}

const flags = (args) => {
  const out = {}
  for (let i = 0; i < args.length; i += 2) out[args[i].replace(/^--/, '')] = args[i + 1]
  return out
}

const card = (task) =>
  [
    `${task.id}  [${task.severity}/${task.points}pt]  ${task.status}`,
    `  ${task.title}`,
    '',
    `  desc : ${task.descr}`,
    `  why  : ${task.why}`,
    `  exit : ${task.exit_cond}`,
    task.parents.length ? `  after: ${task.parents.join(', ')}` : '  after: nothing',
  ].join('\n')

const [command = 'list', ...args] = process.argv.slice(2)

if (command === 'list') {
  const tasks = all()
  if (!tasks.length) console.log('The board is empty.')
  for (const status of STATUSES) {
    const inColumn = tasks.filter((task) => task.status === status)
    if (!inColumn.length) continue
    console.log(`\n${status.toUpperCase().replace('_', ' ')} (${inColumn.length})`)
    for (const task of inColumn) {
      console.log(`  ${task.id}  [${task.severity}/${task.points}pt]  ${task.title}`)
    }
  }
  console.log('')
} else if (command === 'show') {
  console.log(card(one(args[0])))
} else if (command === 'next') {
  const tasks = all()
  const done = new Set(tasks.filter((task) => task.status === 'done').map((task) => task.id))
  const started = tasks.filter((task) => task.status === 'in_progress' || task.status === 'wait_for_roast')

  const eligible = tasks
    .filter((task) => task.status === 'backlog')
    .filter((task) => task.parents.every((parent) => done.has(parent)))
    .sort(
      (a, b) =>
        SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || a.points - b.points || a.id.localeCompare(b.id),
    )

  const pick = started[0] ?? eligible[0]
  if (!pick) {
    const waiting = tasks.filter((task) => task.status === 'backlog').length
    console.log(waiting ? `Nothing eligible. ${waiting} task(s) waiting on unfinished parents.` : 'Nothing left.')
    process.exit(0)
  }

  console.log(started[0] ? 'ALREADY STARTED, finish this first\n' : 'NEXT: highest severity, unblocked, fewest points\n')
  console.log(card(pick))
} else if (command === 'add') {
  const given = flags(args)
  const required = ['title', 'desc', 'why', 'severity', 'points', 'exit']
  const missing = required.filter((field) => !given[field])
  if (missing.length) fail(`A task needs every field. Missing: ${missing.join(', ')}`)
  if (!SEVERITIES.includes(given.severity)) fail(`severity must be one of ${SEVERITIES.join(', ')}`)
  if (!POINTS.includes(Number(given.points))) fail(`points must be one of ${POINTS.join(', ')}`)

  const id = given.id ?? nextId()
  db.prepare('INSERT INTO task (id, title, descr, why, severity, points, status, exit_cond) VALUES (?,?,?,?,?,?,?,?)').run(
    id,
    given.title,
    given.desc,
    given.why,
    given.severity,
    Number(given.points),
    given.status ?? 'backlog',
    given.exit,
  )
  for (const parent of (given.parent ?? '').split(',').map((p) => p.trim()).filter(Boolean)) {
    db.prepare('INSERT INTO blocked_by (task, parent) VALUES (?,?)').run(id, parent)
  }
  console.log(`Added ${id}: ${given.title}`)
} else if (command === 'move') {
  const [id, status] = args
  if (!STATUSES.includes(status)) fail(`status must be one of ${STATUSES.join(', ')}`)
  const task = one(id)
  db.prepare('UPDATE task SET status = ? WHERE id = ?').run(status, id)
  console.log(`${id}: ${task.status} -> ${status}`)
} else {
  fail(`Unknown command "${command}". Try: list, next, show, add, move.`)
}
