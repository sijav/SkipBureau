#!/usr/bin/env node
// Which task to do next.
//
// Reads TODO.md and applies the owner's rule: highest severity, then fewest
// story points, then lowest id, and never a task whose parent is unfinished.
//
// It only reads and prints. Moving a task between columns is an edit to
// TODO.md, made by hand, because the board is a file and not a database.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BOARD = join(dirname(fileURLToPath(import.meta.url)), '..', 'TODO.md')
const SEVERITY = ['critical', 'high', 'medium', 'low']

const parse = (text) => {
  const tasks = []

  for (const section of text.split(/^## /m).slice(1)) {
    const column = section.split('\n', 1)[0].trim().toLowerCase()

    for (const block of section.split(/^### /m).slice(1)) {
      const [heading, ...rest] = block.split('\n')
      const [id, ...titleParts] = heading.split('—')
      const fields = {}

      for (const line of rest) {
        const field = line.match(/^- \*\*(\w+):\*\* (.+)$/)
        if (field) fields[field[1]] = field[2].trim()
      }

      tasks.push({
        id: id.trim(),
        title: titleParts.join('—').trim(),
        column,
        severity: fields.severity ?? 'low',
        points: Number(fields.points ?? 99),
        parents: (fields.parent ?? 'none').toLowerCase() === 'none' ? [] : fields.parent.split(',').map((p) => p.trim()),
        exit: fields.exit ?? '',
        why: fields.why ?? '',
      })
    }
  }

  return tasks
}

const tasks = parse(readFileSync(BOARD, 'utf8'))
const done = new Set(tasks.filter((task) => task.column === 'done').map((task) => task.id))

// Anything already started comes before anything new, so the loop finishes what
// it began rather than collecting half-built tasks.
const started = tasks.filter((task) => task.column === 'in progress' || task.column === 'review')

const eligible = tasks
  .filter((task) => task.column === 'backlog')
  .filter((task) => task.parents.every((parent) => done.has(parent)))
  .sort(
    (a, b) => SEVERITY.indexOf(a.severity) - SEVERITY.indexOf(b.severity) || a.points - b.points || a.id.localeCompare(b.id),
  )

const pick = started[0] ?? eligible[0]

if (!pick) {
  const blocked = tasks.filter((task) => task.column === 'backlog')
  console.log(blocked.length ? `Nothing is eligible. ${blocked.length} task(s) are waiting on unfinished parents.` : 'The board is empty.')
  process.exit(0)
}

console.log(
  [
    started[0] ? 'ALREADY STARTED, finish this before taking anything new' : 'NEXT: highest severity, unblocked, fewest points',
    '',
    `${pick.id}  [${pick.severity}/${pick.points}pt]  ${pick.column}`,
    `  ${pick.title}`,
    '',
    `  why  : ${pick.why}`,
    `  exit : ${pick.exit}`,
    pick.parents.length ? `  after: ${pick.parents.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n'),
)
