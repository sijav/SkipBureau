---
name: todo
description: The SkipBureau board, a real SQLite database at agent/todo.db. Use this INSTEAD of the built-in TodoWrite tool, every time: picking what to work on next, creating a task, changing a status, or recording something discovered mid-task. Read and write it through npm run todo, never by editing a file.
---

# The board

`agent/todo.db` is a SQLite database. It is the only record of what is to be
done on this project.

## Setup

**Node 24 or newer. That is the whole list.**

- **SQLite is not a separate install.** It ships inside Node as `node:sqlite`.
  Nothing to download, no `sqlite3` binary, no native build step.
- **No `npm install` is needed for the board.** `agent/todo.mjs` imports only
  Node built-ins, so it works in a repository with no `node_modules` at all.
- **The database creates itself** on first run, tables and all. There is no
  migration step and nothing to initialise.

On Node 22 or 23 `node:sqlite` exists but is behind `--experimental-sqlite`, and
on anything older it is absent. The script checks and says so plainly rather
than failing with a stack trace.

If `npm` is not available, or you are outside the repository root, call the
script directly. The two are the same thing:

```bash
node agent/todo.mjs next          # same as: npm run todo -- next
node agent/todo.mjs add --title ...
```

`npm run todo` exists only because `package.json` is where a person looks first.

## This replaces the built-in to-do tool

**Do not use TodoWrite here.** It is private scratch that vanishes with the
session, it carries none of the nine fields the owner requires, and `next` does
not read it. Anything tracked there is invisible to the owner and to the next
iteration, which is the same as not tracking it.

Everything goes in this board instead: what the owner asks for, what is
discovered mid-task, what a roast finds. Write it down while you are holding it,
then carry on with what you were doing.

## Before touching any file

```bash
npm run todo -- next
```

Prints the task to work on and why it was picked. The rule is the owner's and is
not to be overridden in your head: **highest severity, then fewest story points,
then lowest id, never one whose parent is unfinished.** Anything already
`in_progress` or `wait_for_roast` comes first, so work in flight gets finished
before anything new starts.

If the pick looks wrong, correct that task's severity, points or parents and run
it again. Do not simply pick something else.

Then:

```bash
npm run todo -- move SB-001 in_progress
```

## Creating a task

Nine fields, and `add` refuses without them.

```bash
npm run todo -- add \
  --title "Short imperative title" \
  --desc "What is actually to be built." \
  --why "The story: what breaks, or stays broken, without it, and for whom." \
  --severity high \
  --points 3 \
  --parent "SB-002,SB-003" \
  --exit "A condition someone else could check: a named test, or a scenario in a browser."
```

- `severity`: `critical`, `high`, `medium`, `low`
- `points`: 1, 2, 3, 5, 8, 13
- `parent`: comma separated ids that must be `done` first; omit if nothing blocks it
- `status`: a task stops at `wait_for_roast` when the work is finished. Only the
  loop moves it to `done`, after the roast has been judged and its findings filed
- `exit`: checkable by someone who did not do the work. "It works" is not an exit
  condition. "The header renders at the design height in fa-IR dark" is.

## Everything else

```bash
npm run todo                        the whole board, by column
npm run todo -- show SB-003         one task in full
npm run todo -- move SB-003 done    backlog, in_progress, wait_for_roast, done, dropped
```

## What this board does not do

It records work. It does not gate it. There is no passing score, no minimum, and
nothing that refuses to let a task close. A roast finding becomes a new task
here and the finished task closes; it is never a reason to reopen work.

If a gate seems necessary, tell the owner and let them decide. A previous
version of this repository had gates nobody asked for, and a full working day
went into satisfying them while the product stayed empty.
