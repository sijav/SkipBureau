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

`.claude/todo.db`, a real SQLite database, driven by the global `/todo` skill.
It is the only record of what is to be done on this project.

**Use it instead of the built-in TodoWrite tool.** The built-in list is private
scratch that disappears; this board is the project's memory, carries the nine
fields the owner requires, and is what `next` reads. See
`~/.claude/skills/todo/SKILL.md`.

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
minimum. Re-roasting until a number improves has no end: ask any reviewer the
same question again and it will look harder for something to say.

And it is a **check**, not an attack. The question is whether the work does what
it was meant to do. "It does, here is what I checked" is a complete answer.

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

## What is taken from `D:\Kar\Gandom\daramadname`

The owner named that repository as the model for this one. Its working agreement
is `AGENTS.md` there, 502 lines, written from rules he gave during that build.
Rules he stated once do not need stating again, so they apply here.

### Rules of his, carried over unchanged

- **Every user-facing string goes through lingui, written in English.** Message
  ids are English; Persian is a translation. `` t`…` `` or `<Trans>` inside a
  component, `` msg`…` `` outside one. Enforced by
  `lingui/no-unlocalized-strings`, which fails a bare English label exactly as
  it fails a Persian one.
- **Documentation does not live in the code.** His words there, twice: _"putting
  the doc of the props inside tsx files! it should be inside stories, there's
  the place for docs"_, then _"stop adding too much comments in the code instead
  of writing in the md files"_. The line: if it explains the code to whoever
  edits it, it stays as a comment. If it explains the component to whoever uses
  it, it goes in markdown. Prose belongs in `story-docs/{en,fa}/<slug>.md`, one
  file per language, with a test that fails until both exist.
  **This one is not true here yet.** Every file written before 2026-09-09 opens
  with an essay. The rule binds new code from now; the existing files are
  SB-059.
- **Prose in code files is English.** Persian belongs in the catalog or in
  `story-docs/fa`.
- **No em dashes in markdown, use commas.** His words: _"remove these AI
  generated dashes from the docs use comma"_. Persian text takes `،`.
- **Never hardcode a colour.** Everything comes from the token file. The Figma
  file defines light values only; the dark palette is derived and labelled as
  derived, to be replaced wholesale if real dark tokens ever ship.
- **Verify versions and docs from source, never from memory.** `npm view <pkg>
  version` before writing against anything. His words: _"forget your own
  training and do what I say, read the new docs."_ His global `~/.npmrc` sets
  `min-release-age=7`, so npm refuses packages published in the last week. That
  is deliberate; do not override it.
- **No TypeScript escape hatches without asking.** No `as X` to paper over a
  mismatch, no `@ts-ignore`, no `@ts-expect-error`, no `unknown` casts.
- **Nothing is silenced without a record.** Every suppression gets an entry in
  `TECH-DEBT.md`: what is suppressed, what causes it, what would fix it, and the
  check that says it can be removed. Deliberate scope cuts go in
  `PHASE-NEXT.md`, because those are decisions rather than debt.
- **Finish the work.** _"not a single task should be TODO or ask me if you
  should do it."_

### Conventions carried over

- **Structure.** `src/core` for singletons, `src/pages` one folder per route,
  `src/shared` for components and utilities, `src/locales` for catalogs. Only
  these. `e2e/` sits at the app root, outside `src/`.
- **Barrels.** Every folder with more than one file has `index.ts`. Cross-module
  imports target the barrel, never a file inside it. No relative parent imports,
  absolute `src/...` always. Never import from `'.'`.
- **MUI from the top-level barrel only**, `import { Button } from '@mui/material'`.
- **Browser globals through `window.*`**, so they stay mockable and greppable.
- **Prettier**: single quotes, no semicolons, width 140, organize-imports.
- **Story first, then the component.** His note there: _"that was supposed to be
  there before you create component"_.
- **Stories render from their args.** Spread args and fall back per field, so
  the Controls panel actually drives what is on screen and the sample copy still
  follows the language toolbar. Every callback prop gets an `fn()`. A panel that
  looks alive and moves nothing is the anti-pattern this replaced.
- **Pages hold no styling.** They call components with props. If a component
  needs an `sx` to match the design, ask whether the theme should carry it.
- **Build on MUI primitives.** Do not hand-roll what a MUI component already
  does correctly, keyboard and a11y included.
- **Before saying it is done**: lint with zero warnings, `lint:tsc` clean, tests
  passing, build succeeding, and then **actually look at it running**, in all
  four combinations of language and colour scheme. A computed style is not
  proof.
- **Do not verify by inference.** Test the thing in front of you, not a thing
  like it. And when a check comes back empty, confirm it can find a case you
  plant by hand: two scripted sweeps on that project reported clean while
  being broken.

### What this project deliberately does differently

Each of these is a departure with a reason, not an oversight.

| there | here | why |
|---|---|---|
| One package at the repo root | A workspace, `apps/web` and `apps/api` | There is a server. A single package cannot hold a Vite app and a NestJS app. |
| Dexie over IndexedDB, no backend | A NestJS server with GraphQL | The owner asked for it. Content is shared and moderated, so it cannot live in one reader's browser. |
| `*.query.ts` / `*.mutation.ts` with React Query | GraphQL documents and codegen | One schema, typed on both sides from the same source. Hand-written client types would leave the coupling with none of the safety. |
| Defaults to Persian | Defaults to English | That product is an Iranian freelancer's tool. This one is a guide to bureaucracy abroad for travellers and expats of any nationality, and the owner's brief named English first. Persian is a full peer, not an afterthought: the whole UI, the RTL layout and the guide content all exist in it. |
| All text through lingui | UI text through lingui, **guide content through the database** | See the boundary below. |
| No mobile question, it is a desktop tool | Unresolved | There is no mobile design and the Figma pages for it are empty. See SB-019. |

### The line between interface text and content

This is the one departure that can be misread as contradicting the lingui rule,
so it is drawn explicitly.

**Interface text goes through lingui, with no exceptions.** Every label, button,
heading, section title, error, empty state, notice and piece of template copy in
this app is a message id in English with a Persian translation, and the lint
rule fails a bare literal either way. `Quick answer`, `What you need`,
`We review submissions before updating the guide`: all lingui.

**Guide content is data.** A guide's title, description, quick answer, steps,
options, sources and costs are rows an admin edits and a contributor proposes
changes to. They cannot go through extract and compile, because the people
writing them do not run a build.

So: the template is translated at build time and the content is translated in
the database. A guide can therefore exist in English and not in Persian, and the
product has to say so to the reader rather than silently showing the wrong
language or nothing at all. That is SB-049.

## Asking

When a decision is genuinely the owner's, ask through the question tool so the
work stops and they answer. They do not read everything written to them. Do not
ask for permission to continue. Do tell them, unprompted, when something is
costing far more than it is worth.
