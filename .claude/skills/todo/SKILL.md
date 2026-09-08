---
name: todo
description: The SkipBureau board. Use whenever picking what to work on next, creating a task, or changing a task's status. The board is a real SQLite database at agent/todo.db, not a document, so read and write it through these commands rather than editing files.
---

# The board

`agent/todo.db` is a SQLite database. It is the only record of what is to be
done. Do not keep a second copy in a markdown file, and do not track work in a
reply that is not also in the board.

## Before touching any file

```bash
npm run todo -- next
```

Prints the task to work on and why it was picked. The rule, which is the owner's
and is not to be overridden in your head: **highest severity, then fewest story
points, then lowest id, never one whose parent is unfinished.** Anything already
`in_progress` or `review` comes first, so work in flight gets finished before
anything new is started.

If the pick looks wrong, the fix is to correct that task's severity, points or
parents in the board and run it again. Not to pick something else.

Then, before editing anything:

```bash
npm run todo -- move SB-001 in_progress
```

## Creating a task

Every task carries nine fields and `add` refuses without them: `title`, `desc`,
`why`, `severity`, `points`, `exit`, plus `parent` and `status`, with `id`
assigned automatically.

```bash
npm run todo -- add \
  --title "Short imperative title" \
  --desc "What is actually to be built." \
  --why "The story: what breaks or stays broken without it, for whom." \
  --severity high \
  --points 3 \
  --parent "SB-002,SB-003" \
  --exit "A condition someone else could check: a named test, or a scenario in a browser."
```

- `severity`: `critical`, `high`, `medium`, `low`.
- `points`: 1, 2, 3, 5, 8, 13.
- `parent`: comma separated ids that must be `done` first. Omit if nothing blocks it.
- `exit`: checkable by someone who did not do the work. "It works" is not an exit
  condition. "The header renders at the design height in fa-IR dark" is.

**Everything becomes a task before it is done.** Something the owner asks for,
something discovered mid-task, something a roast found. Write it down while you
are holding it, then carry on with what you were doing.

## The other commands

```bash
npm run todo                        the whole board, by column
npm run todo -- show SB-003         one task in full
npm run todo -- move SB-003 done    backlog, in_progress, review, done, dropped
```

## What this board does not do

It records work. It does not gate it. There is no score threshold, no passing
mark, nothing that refuses to let a task close. If a check like that seems
necessary, say so to the owner and let them decide, rather than building it.

A previous version of this repository had gates nobody asked for, and a full
working day went into satisfying them while the product stayed empty.
