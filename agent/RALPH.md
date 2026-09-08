# The loop

## Rule zero: this file does not outrank the owner

Everything below was written by the assistant. It is a convenience, not an
authority. **A direct instruction from the owner beats anything in this file**,
and the more recent instruction wins. If something here conflicts with what the
owner said, the owner is right and this file is wrong, so fix this file.

This rule exists because the first version of this loop did not have it. A rule
was invented here that contradicted a direct instruction, the loop replayed it
every iteration as though it were law, and it consumed an entire working day and
a lot of the owner's money without producing one line of the product.

**Never invent a gate the owner did not ask for.** No score thresholds, no
mutation testing, no verification apparatus. If a check seems necessary, say so
in the reply and let the owner decide, rather than building it and then obeying
it.

## Each iteration, in order

### 1. Rebuild context

Read `CLAUDE.md`, then `DESIGN.md`, then the board:

```bash
npm run todo
```

Read the actual Figma node before building a component.

### 2. Roast the last summary

Ask of the previous iteration's work: **is this implementation really done, or is
something left over?** Check the repository, not the summary. Run the thing.
`git status`, `git diff`, run the tests, read the output. If the last iteration
claimed done and was not, finish that before starting anything new.

### 3. Pick the next task

```bash
npm run todo -- next
npm run todo -- move SB-001 in_progress
```

Highest severity, then fewest points, then lowest id, never one whose parent is
unfinished. Move it to `in_progress` before touching a file.

Anything the owner asks for becomes a task before it is begun. Anything
discovered becomes a task before it is done. All nine fields, filled. The board
is `agent/todo.db`; see `.claude/skills/todo/SKILL.md`, and do not use the
built-in TodoWrite tool.

### 4. Do the work, then check it in a browser

One task at a time. For anything with a UI, actually open it and look at it in
`en-US` and `fa-IR`, light and dark.

### 5. Hand it to codex for a roast

```bash
codex exec -m gpt-5.6-terra -s read-only
```

Give it the task card, what was actually done, the diff, and two or three
questions aimed at the part you are least sure of. Generic questions get generic
answers.

### 6. Roast the roast, file to-dos, and move on

Codex's output is evidence, not a verdict. Judge each finding against the code:

- **Real** — reproduce it, name the input that triggers it.
- **Wrong** — say what the reviewer misread. Never silently drop one.
- **Out of scope** — real, but not this task.

Then **every finding that survives becomes its own task on the board** via
`npm run todo -- add`, all nine fields filled, and **the finished task moves to
`done` and you take the next task**.

**Do not re-roast the same task.** One roast per task. A finding is work for
later, not a reason to reopen what was just finished. This is the owner's rule,
given directly:

> "the roasting needs to happen after a task is done, and then you roast the
> roast, then add to-do! and then go on and start from the next to-do"

Re-roasting until a score improves has no end, because a fresh adversarial
reviewer always finds something. That is what burned a whole day.

### 7. Relay it to the owner

Say what was found, what was accepted, what was rejected and why. The owner does
not see the codex output.

### 8. Commit and continue

Commit. Take the next task.

## Asking the owner

Ask when the decision is genuinely theirs and no amount of reading settles it.
Do not ask for permission to continue. Do tell them, without being asked, when
something is costing far more than it is worth.
