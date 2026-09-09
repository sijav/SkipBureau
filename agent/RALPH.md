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

---

Five steps. In order, every iteration.

1. **Compact.** Rebuild from files; assume you remember nothing.
2. **Self-roast the last summary.** Yours, not the skill.
3. **One task, to `wait_for_roast`.** Finish what step 2 found unfinished; if
   there is nothing, take the next one.
4. **External roast, in the background.** Then roast the roast and file what
   survives as new tasks.
5. **Move it to `done`** and go back to 1.

## 1. Compact

The context is gone. Assume you remember nothing and rebuild from files:

1. `CLAUDE.md`, the working agreement and what the product is.
2. `DESIGN.md`, the design contract. Read the actual Figma node before building
   any component.
3. The board: `todo` (see the `/todo` skill).

## 2. Self-roast the last summary

**This one is yours. It is not the external skill.** Ask plainly of the previous
iteration's summary:

> **Is this implementation really done? Is something left over?**

Check the repository, not the summary. Run the thing. `git status`, `git diff`,
run the tests and read the output. A summary that says "done", "green",
"passing" or "fixed" is a claim, and claims get checked.

## 3. Do one task, and stop at `wait_for_roast`

**If step 2 found something left over**, that task goes back to `in_progress`
and you finish it. Nothing new is picked up until it is done.

**Otherwise take the next one:**

```bash
todo next
todo move SB-00X in_progress
```

Highest severity, then fewest points, then lowest id, never one whose parent is
unfinished. Use the `/todo` skill, never the built-in TodoWrite. Anything the
owner asks for, and anything you discover on the way, becomes a task with all
nine fields before it is begun.

Work until it actually meets its exit condition. For anything with a UI, open it
in a browser and look at it in `en-US` and `fa-IR`, light and dark.

Then:

```bash
todo move SB-00X wait_for_roast
```

**Every task stops here. You never move one to `done` yourself.**

## 4. Roast it, roast the roast, file what survives

A task sitting in `wait_for_roast` gets an external check. Use the `/roast`
skill and **run it in the background**. It is a round trip to another model and
blocking on it is the easiest way to spend an iteration on nothing.

While it runs, **do not edit files**. The reviewer is reading the worktree you
just finished, so changing it underneath produces findings about code that no
longer exists, and you cannot tell those from real ones. Reading is free: the
next card, `DESIGN.md`, the Figma node you will need next. If the wait is long,
say so in the reply instead of filling it with work that has to be undone.

```bash
python ~/.claude/skills/roast/roast.py task \
  --title "SB-00X ..." --exit-condition "..." \
  --did "what you actually did, honestly, including what you skipped" \
  --files "$(git diff --name-only HEAD)" \
  --ask "a real question about THIS task's logic" \
  --ask "a second one, aimed where you are least sure"
```

The reviewer answers in three passes: reach a conclusion, check that conclusion
as if someone else wrote it, then give only what survived.

When it comes back, **you roast the roast**. It is evidence, not a verdict. Take
each point and judge it against the code:

- **Real** — reproduce it, name the input or state that triggers it.
- **Wrong** — say what the reviewer misread. Never silently drop one.
- **Out of scope** — real, but not this task.

Then **everything that survives becomes a new task on the board**, all nine
fields filled. Then, and only then:

```bash
todo move SB-00X done
```

And back to step 1.

**One roast per task. Never re-roast.** This is the owner's rule, given directly:

> "the roasting needs to happen after a task is done, and then you roast the
> roast, then add to-do! and then go on and start from the next to-do"

A finding is work for later, not a reason to reopen what was just finished.
There is no passing score and no minimum. Re-roasting until a score improves has
no end: ask any reviewer the same question again and it will look harder for
something to say. That is what burned a whole day.

It is a **check**, not an attack. The question is whether the work does what it
was meant to do, and "it does" is a complete answer.

**Relay the roast to the owner** in your reply: what was found, what you
accepted, what you rejected and why. They never see `.claude/roast-result.md`.

---

## The skills this loop runs on

| skill | what it is for |
|---|---|
| `/todo` | global, at ~/.claude/skills/todo/. The board for this project, `.claude/todo.db`. Global skill, per-project board. Replaces the built-in TodoWrite. |
| `/roast` | global, at ~/.claude/skills/roast/. The external check. `task` after one task, `technical` after a run of them, `search` for a question. |

## Asking the owner

Ask when the decision is genuinely theirs and no amount of reading settles it.
Do not ask for permission to continue. Do tell them, without being asked, when
something is costing far more than it is worth.
