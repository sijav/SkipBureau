# SkipBureau

## The owner's rules outrank anything written here

Every file in this repository was written by the assistant. None of it is
authority. **A direct instruction from the owner wins**, and where two
instructions conflict, **the later one wins**. If a file here contradicts what
the owner said, the file is wrong. Fix the file.

**Never invent a gate the owner did not ask for.** No score thresholds, no
mutation testing, no verification apparatus, no rule that refuses to let work
close. If a check seems necessary, say so in the reply and let the owner decide.

## The to-do board

`agent/todo.db`, a real SQLite database, driven by `npm run todo`. It is the
only record of what is to be done.

**Use it instead of the built-in TodoWrite tool.** The built-in list is private
scratch that disappears; this board is the project's memory, carries the nine
fields the owner requires, and is what `next` reads. See
`.claude/skills/todo/SKILL.md`.

Every task carries all nine fields, filled at creation, never blank:
**id, title, desc, why (the story), severity, points, parent, status, exit**.

Picking work: **highest severity, then fewest story points, then lowest id,
never one whose parent is unfinished.** Anything already started comes first.

## The roast

The owner's rule, given directly on 2026-09-07, which overrides anything earlier:

> "the roasting needs to happen after a task is done, and then you roast the
> roast, then add to-do! and then go on and start from the next to-do"

So, per task, once:

1. Finish the task.
2. Hand it to codex with terra for a roast, with real questions about **this**
   task's logic, the context of what it was, what you did, and which files
   changed. Generic questions get generic answers.
3. Roast the roast. Judge each finding against the code: **real** (reproduce it,
   name the input), **wrong** (say what the reviewer misread, never silently
   drop it), or **out of scope**.
4. **Every finding that survives becomes a new task on the board**, all nine
   fields filled.
5. Move the finished task to `done` and **take the next task**.

**One roast per task. Never re-roast.** A finding is work for later, not a
reason to reopen what was just finished. There is no passing score and no
minimum. Re-roasting until a number improves has no end, because a fresh
adversarial reviewer always finds something.

Relay the roast to the owner in the reply: what was found, what was accepted,
what was rejected and why. The owner does not see the codex output.

## The product

A step-by-step guide to bureaucracy abroad, for travellers and expats. Instead
of scattered information the user sees exactly what to do, when, where, with
which documents, in what order. Like allaboutberlin.com in spirit.

It solves: bureaucratic complexity, scattered and outdated sources, the language
barrier, unfamiliarity with administrative processes, not knowing which
documents are required, confusion between institutions, missed deadlines. Per
task: a step-by-step checklist, translated terms, useful local phrases, links to
official sources, reminders.

**Global, not Turkey.** Turkey is the first country, not the subject. Country is
a dimension in the schema, the routes and the search. Adding a second country
must need no code change.

Visitors propose changes anonymously; proposals are stored for evaluation and
never edit live content. An admin panel moderates them. No end-user accounts.

## How it is built

- React, TypeScript, MUI, Storybook, Playwright, 100% coverage, component first,
  following the conventions of `D:\Kar\Gandom\daramadname`.
- **GraphQL against a NestJS server**, not React Query against local data.
- **Components with their Storybook first, then screens.**
- **Match the Figma design exactly**, every component, measured from the node
  rather than eyeballed. File `Xk7m6KtxdfGtZb6CO32K74`, pages listed in
  `DESIGN.md`.
- A **language control in the topbar**, placed so it does not destroy the design.
- English and Persian through lingui, English source, Persian RTL.
- Content seeded from a repo file, then edited through the admin panel.
- Ships to `https://github.com/sijav/SkipBureau` with `gh`. Web on GitHub Pages,
  API and database on free tiers only. Fly.io has no free tier.

## Asking

When a decision is genuinely the owner's, ask through the question tool so the
work stops and they answer. They do not read everything written to them. Do not
ask for permission to continue. Do tell them, unprompted, when something is
costing far more than it is worth.
