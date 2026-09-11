# SkipBureau

## The owner's rules outrank anything written here

Every file in this repository was written by the assistant. None of it is
authority. **A direct instruction from the owner wins**, and where two
instructions conflict, **the later one wins**. If a file here contradicts what
the owner said, the file is wrong. Fix the file.

## The owner's orders of 2026-09-10, which outrank everything below

> "UI has already been created so your FIRST job is to CREATE THE DAMN THING
> so we can see it and then change it if something goes wrong design wise"

> "you don't add gate for anything yet ... you just create and publish ...
> after finish we might (only might) [add] any gates or whatever"

> "The base language is english and that is it, any additional language goes
> to the lingui po file, and unless you want to test lingui it make zero sense
> to test Farsi"

So, until the owner says otherwise:

- **Build the screens from Figma and publish them.** The design exists; seeing
  it running is the point. Design corrections come after he has looked.
- **No new gates, checks or test apparatus.** Nothing that blocks, scores or
  refuses. Build, verify it runs, publish.
- **No test is written for any language.** English is the base; every other
  language is a lingui catalog, and testing one is testing lingui. The owner:
  "RTL is for Indian, Arabian etc too and this project is going to be multi
  language, are you going to add test for all those languages?" So the story
  matrix is light/dark x ltr/rtl in English, and language is only a Storybook
  toolbar for looking.
- **Roasting and filing findings wait** until the product is built, then only
  if he asks.

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

Picking work: **the current phase first**, then highest severity, then fewest
story points, then lowest id, never one whose parent is unfinished. Anything
already started comes first.

**The phases, the owner's of 2026-09-11**, are the objectives the cards serve,
`todo phase`:

1. **MVP**, now. Deliver what we have: every screen from Figma built and
   published, found by search, fast on a phone, and honest about what is
   sample content.
2. **Next**. Where the reader is, which is a city in some countries and a
   province or state in others, and rules that change what a guide says, for
   the countries the owner names, researched from official sources. The admin
   panel, search, the move screen and a theme control of the reader's own are
   here too.
3. **Quality**. The debt, the tooling, the tests and the documents no reader
   sees.

A card filed without a phase joins the current one. Where a card belongs is a
judgement to correct, not to defend: move it.

## Search engines are not an afterthought

The owner, 2026-09-10:

> "how convenient this site is to search engine, it should be fully seo
> compatible, so that the search engine find the correct data from this website
> and show correctly with all the good things to user, so seo is at utmost
> importance"

**This product is found through search or it is not found.** Someone standing
in a government office does not know SkipBureau exists; they type their problem
into Google. Every guide is a landing page for a question somebody is asking
right now, and a guide that does not rank is a guide nobody reads.

So this is a first-class constraint on every screen, not a pass at the end:

- **A page must exist as a page.** Google does render JavaScript, but only on a
  page that answers 200, and in a queued second pass after the first crawl, so
  content that appears only after scripts run is indexed later and less surely.
  Other crawlers and the link previews in chat apps mostly run no script at
  all, and content behind a click or a hash fragment is not a page to any of
  them. So what a page is belongs in the HTML the server sends, and for every
  page that should be found it is: its title, description, canonical and
  alternates (SB-076, SB-085), its structured data and preview tags (SB-087,
  SB-089), and its body, rendered at build time (SB-155). A new screen gets all
  of that only if the prerender renders it.
- **A URL must return 200.** GitHub Pages answers an address with no file
  using `404.html` and a 404 status, so a page opens for a person and reads as
  **absent** to Google. The build writes a real file for every page that should
  be found (SB-076, `src/core/prerender`), so those answer 200; everything else
  falls back to `404.html` on purpose. **A new kind of page must be added to the
  prerender, or it is invisible to search.**
- **One canonical URL per page**, which the `/en-US/` to `/en/` redirect
  already gives.
- **`hreflang` between the two languages**, reciprocally. The same guide in
  English and Persian are alternates, not duplicates, and a search engine has
  to be told so or it picks one and buries the other.
- **A title and a description per guide, per language**, from the content
  rather than a template. `GuideText` already holds them.
- **Structured data.** These are step-by-step instructions with costs, times
  and official sources, which is what `HowTo` describes. `dateModified` comes
  from the verified date, which this product already requires and most
  competitors do not have.
- **A sitemap**, covering every language and country combination, generated
  rather than written.

The verified date is the sharpest advantage here and it is already in the
schema. A guide that can prove when it was last checked is exactly what a
search engine wants to surface for a question about a rule that changes.

## The plan, before any task

The owner, 2026-09-10, on top of the earlier plan-first rule:

> "you write in the file named #[task_number] - [title].md in the related
> folder that the doing is about to write there! not a separate folder, this is
> important"

Before touching a file for a task, write what you are about to do into
`#SB-0XX - <the task's title>.md`, **in the folder the task is about to build
in**. `apps/api/prisma/` for a schema change, `apps/web/src/shared/<name>/` for
a component, `apps/web/src/core/<area>/` for a core one. Never `.claude/`,
never a `plans/` folder. It is committed with the work, so the folder carries
the reasoning next to the result.

Two rules that only show up the first time you try it, both learned in KarNama
on 2026-09-10 and both at a cost:

- **A task title is not a filename.** Strip what the filesystem refuses,
  `< > : " / \ | ? *`, and trailing dots and spaces, which Windows mangles
  without telling you. Shortening a long title is fine; the **id** is the part
  that must be exact, because that is what ties the file to the task. The very
  first plan written under this rule had four illegal characters in its title.
- **The plan STAYS when the task closes.** It is committed with the work and
  left there. That is the whole reason it lives in that folder. If a plan reads
  as stale beside the code, correct the plan rather than remove the record. In
  KarNama this was left unstated, then guessed at the other way on the argument
  that version control held every copy; it did not, the plans directory was in
  `.gitignore`, and two plan files were deleted. One is gone for good. **Check
  that the fallback you are relying on actually exists before you rely on it**:
  `git check-ignore -v <path>`, `git ls-files --error-unmatch <path>` and
  `git cat-file -e HEAD:<path>` each answer it in one command, and any of them
  would have stopped that deletion.

Then have it checked by the `plan` roast, which runs with web search, and
**wait for that one**: the point is that it lands before the time is spent.
Every time the plan file is touched it is checked again.

**Ask it real questions.** `--ask` is what makes the check worth its round
trip. Name the mechanism you doubt. "Is this a good approach" gets an answer
that would fit any codebase and teaches you nothing.

## The roast

The owner's rule, 2026-09-07, restated and sharpened by him on **2026-09-10**,
which is the version that binds:

> "you finish the task first (with test and everything and you make sure it
> works, THEN and only THEN you put it in done and roast the task via roasting
> system with it's rules, in background, when done then roast the roast and
> find the findings and put them in to-do IF those tasks makes the ongoing task
> block, then you revert whatever you did for the current task, and pick the
> first todo (which possibly is going to be one of those tasks that are more
> important) IF NOT THEN you just FORGET and continue what you were doing"

So, per task, once, in this order:

1. **Finish it. With tests, and make sure it works.** Tests passing, lint
   clean, typecheck clean, build succeeding, and the thing actually run rather
   than reasoned about. A guard you added must have been watched failing on a
   planted case.
2. **Then** move it to `done`. A task is not closed on the expectation that it
   works, and never closed pending a roast.
3. **Then** fire the roast in the **background** and carry straight on to the
   next task. Real questions about **this** task's logic, what it was, what you
   did, and which files changed. Generic questions get generic answers.
4. When it returns, roast the roast. Judge each finding against the code:
   **real** (reproduce it, name the input), **wrong** (say what the reviewer
   misread, never silently drop it), or **out of scope**.
5. **Every finding that survives becomes a CHILD of the task it came out of**,
   all nine fields filled, filed with `todo add --parent-task <that task>`.

   The owner, 2026-09-10:

   > "when a task is done, we assume it got roasted and some to-dos are added
   > right? but they need to be added as a subtask of that thing ... when a
   > child task is done and there's no other remaining child task for that
   > parent, the parent task + all the done child tasks should get roasted"

   `--parent-task` is **provenance**: this exists because that task was roasted.
   `--parent` is a **blocker**: this cannot start until that finishes. They are
   different, and filing a finding as a blocker makes its parent look
   unstartable when the parent is usually already `done`. **One level**: a child
   never gets children of its own.

   **When the LAST open child of a parent closes, roast the parent together
   with all its children** on what was done for the whole task rather than for
   the last piece. What that round finds becomes a new child, and it repeats
   until a round finds nothing. `todo move <id> done` prints which case you are
   in, so it is not something to remember.

   That is not the re-roasting the owner killed. That was one unit roasted over
   and over to push a number up, with no end. This asks a different question,
   once per completed generation: now that everything this turned up is
   finished, is the whole thing right?
6. Then one of two things, and nothing else:
   - **It blocks the task you are building right now** → revert what you did on
     that task, put it back to `backlog`, and take `todo next`, which will
     probably hand you the finding because it is more important.
   - **It does not** → **forget it.** It is on the board. Carry on exactly as
     you were.

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

- React, TypeScript, MUI, Storybook, Playwright, component first, following the
  conventions of `D:\Kar\Gandom\daramadname`.
- **Coverage is the standard, and it is not met yet.** This said "100%
  coverage" as though it were a fact. Measured on 2026-09-10 it is **66% of
  statements and 49% of branches**. The whole routing layer, `CountryRoute`,
  `LocaleShell`, `AppRoutes` and `RootRedirect`, is at zero, as are all three
  screens and the GraphQL client, because those are proved by Playwright
  against the running app and Playwright is not what the coverage run measures.
  That is a real gap and it is SB-112. Do not write "100%" here again until the
  number says so.
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
- **Northflank builds the API only when a push changes what the API is built
  from** (SB-136, SB-156): `apps/api/**`, `apps/web/package.json`,
  `package.json`, `package-lock.json`, `.dockerignore`, in allow mode, with a
  readiness probe on `GET /health` so a rollout costs about one failed request
  rather than minutes. Anything else pushed leaves the API alone. If the API's
  image ever reads a new file from outside `apps/api`, it has to be added to
  that list or changes to it will never deploy. Northflank's own form refuses
  to save these rules ("Match failed"), so they are set through its API by
  `.github/workflows/northflank-path-rules.yml`, run by hand, with the owner's
  repository secret `NORTHFLANK_TOKEN`.

### Before publishing: the tree is not the history

**A scan of the working tree answers a different question from the one that
matters.** A secret added in one commit and deleted in the next is gone from
the tree and still in the object database. It stays reachable through refs,
through cached commit views, through pull requests that referenced it, and
through every fork and clone anyone already took. Not literally for ever, which
an earlier version of this said: long enough, and outside your control, which
is the part that matters. The first push here carried 23 commits and was
checked by scanning the tree. The history turned out clean, which is luck, not
a process.

So: **scan every object reachable from every ref, not the checkout.** The
`secrets` job in `ci.yml` does it on every push, with gitleaks over
`--log-opts=--all`, and it does two things that are easy to leave out:

- **`fetch-depth: 0`.** `actions/checkout` clones one commit by default, and a
  history scanner pointed at a shallow clone reports clean fast. The check that
  cannot fail is worse than no check.
- **It proves the scanner detects before believing that it did not.** It plants
  a credential in a scratch repository and requires a finding. A scanner that
  has quietly stopped working reports exactly what a clean repository reports.

### If one is actually exposed

**Revoke or rotate it first.** Always, before anything else, because it is the
only step that makes the secret worthless and everything else is slower than
whoever is already reading a public repository.

**Then ask whether anything is still at risk. Usually nothing is, and then you
stop.** GitHub says so plainly: where rotation mitigates it, rewriting history
is unnecessary and disruptive. If sensitive exposure does remain, coordinate a
rewrite for that. It changes every affected commit id, so it is not something
other people catch up with automatically: old clones and forks can put the data
straight back, and anything pinned to those ids breaks.

**Support comes after the rewrite, not instead of it.** Once your own refs no
longer carry the data and the forks have been dealt with, ask GitHub Support,
through the portal, to purge what you cannot reach yourself: pull request
references and cached views. They decide, and they help only where rotation
could not have mitigated it.

**A force push is not any of this, and this repository contains one that can be
misread as remediation.** SB-068 dropped its planted commits that way. That was
sufficient there for exactly one reason: the planted sentinel was deliberately
not a secret. A force push moves a ref. It revokes nothing and it reaches no
fork, clone or cache.

**Be honest about what this is.** It runs after GitHub has accepted the push,
so it does not prevent publication. GitHub's push protection is the pre-push
control and it is enabled on this repository. This is the backstop: it covers
what push protection's partner patterns do not, and it turns the branch red
before a merge, a release or a deploy. If you need something stopped *before*
it leaves the machine, that is a local hook, and nobody has asked for one.

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
  it, it goes in markdown. **Here that is `<Component>.md` beside the
  component** (SB-059): what it is, which Figma node it draws, how it behaves
  for whoever places it, then a `## Props` list. Storybook's Docs page for the
  component's story shows it (`.storybook/ComponentDocs.tsx`). English only,
  and no test that checks it, per the owner's order of 2026-09-10; the
  reference project's `story-docs/{en,fa}` and its guard are deliberately not
  carried over. The reasoning in `src/core` about why a mechanism works as it
  does is for editors, and stays beside the code it explains.
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
  Enforced by `no-restricted-imports`.

  **MUI 9's own guide says the opposite**, and this is the exception with the
  reason attached. It marks `import Button from '@mui/material/Button'`
  preferred and warns that barrel imports cause "significantly slower startup
  and rebuild times". The owner, 2026-09-10, when shown that: _"if it is not
  apply to our stack then get back to my rule which made much more sense"_, and
  then _"you can measure it, so you can apply why this way we find it better"_.

  So it was measured on this repository, dependency cache cleared before each
  run:

  | | dev cold start | vite reported | production build |
  |---|---|---|---|
  | barrel, run 1 | 1995ms | 266ms | 6140ms |
  | barrel, run 2 | 2093ms | 271ms | 5813ms |
  | path imports | 2104ms | 280ms | 5761ms |

  **No difference beyond noise**: the barrel's own two builds vary by 327ms,
  which is wider than the gap to the path form. The warning is aimed at
  bundlers that walk the barrel's whole graph on every rebuild. Vite
  pre-bundles dependencies with esbuild into one cached chunk, which is the
  same mitigation Next ships as `optimizePackageImports`, so the cost never
  arrives here.

  **If the bundler ever changes, measure again before keeping this rule.**
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
- **How much of that gate you run depends on whether the task has a parent.**
  The owner, 2026-09-10: _"you only do full suit test whenever a task without
  parent is done, otherwise you only run the test for the files you change"_.
  So a task with **no parent** closes on the **full suite**; a **child** closes
  on the **tests covering the files it changed**, plus lint and the type checker
  over what it touched. A child is one slice of a parent, and the whole gate
  runs again when the parent closes and gets its completion roast. It is a rule
  about cost, not about rigour: the same checks still run, once, where they mean
  something. If you cannot tell which tests cover what you changed, run more
  rather than guess.
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
