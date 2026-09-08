# SkipBureau board

Kanban. Every task carries all nine fields, filled at creation, never left blank:
**id, title, desc, why, severity, points, parent, status, exit**.

Statuses: `backlog` → `in progress` → `review` → `done` (or `dropped`).
Severity: `critical` > `high` > `medium` > `low`. Points: 1, 2, 3, 5, 8, 13.

**Picking the next task:** highest severity first, then fewest points, then lowest
id, and never one whose parent is not done. `npm run next` prints it.

---

## In progress

_(nothing)_

## Review

_(nothing)_

## Backlog

### SB-001 — Transcribe the Figma design into DESIGN.md

- **desc:** Read every page of Figma `Xk7m6KtxdfGtZb6CO32K74` and write the colour, type and spacing tokens, the component families with their states, and the screen layouts into `DESIGN.md`. Record node ids so any component can be checked against its source.
- **why:** The instruction is to match the design exactly, every component. Without the measurements written down, "exactly" becomes eyeballing, and every component built before this has to be redone.
- **severity:** critical
- **points:** 5
- **parent:** none
- **status:** backlog
- **exit:** `DESIGN.md` lists every token with its value, every component family with its states, and the node id for each screen, with nothing marked "approximately".

### SB-002 — Web app scaffold

- **desc:** `apps/web` with Vite, React, TypeScript, MUI, Storybook, Vitest (unit plus a Storybook project in headless Chromium), Playwright, ESLint and Prettier. Scripts: `dev`, `build`, `lint`, `test`, `storybook`, `test:e2e`.
- **why:** Nothing can be built until the app exists. Every later task assumes these commands work.
- **severity:** critical
- **points:** 5
- **parent:** none
- **status:** backlog
- **exit:** `npm run dev -w apps/web` serves a page, `npm run storybook -w apps/web` opens, `npm test -w apps/web` and `npm run build -w apps/web` both pass on a clean checkout.

### SB-003 — Design tokens as an MUI theme

- **desc:** Turn the tokens from `DESIGN.md` into an MUI theme: palette, typography, spacing, radii, shadows. Light and dark. No raw hex anywhere but the token file.
- **why:** Components reference tokens, not values. Without this every component hard-codes colour and the dark mode has to be retrofitted.
- **severity:** high
- **points:** 3
- **parent:** SB-001, SB-002
- **status:** backlog
- **exit:** A story renders every token as a swatch with its name, in light and dark, and no component file contains a hex literal.

### SB-004 — i18n with lingui, English and Persian

- **desc:** lingui set up with English as source and Persian as translation, RTL handled at the theme direction level. Every user-visible string goes through lingui.
- **why:** Persian is a first-class language here, not an afterthought, and RTL changes layout. Retrofitting either is far more expensive than starting with them.
- **severity:** high
- **points:** 5
- **parent:** SB-002
- **status:** backlog
- **exit:** The app renders in `en-US` and `fa-IR`, the document direction flips with the locale, and a lint rule or test fails on a bare user-visible string.

### SB-005 — Language control in the topbar

- **desc:** A language switcher in the header, placed where the design allows for it, that does not change the header height or break the layout in either direction.
- **why:** Explicit instruction: add a language button on the topbar somewhere that does not destroy the design.
- **severity:** high
- **points:** 3
- **parent:** SB-003, SB-004
- **status:** backlog
- **exit:** The control appears in the header in all four combinations of `en-US`/`fa-IR` and light/dark, header height is unchanged from the design measurement, and switching locale re-renders the page in place.

### SB-006 — Component library, with stories before components

- **desc:** Build the component families named in `DESIGN.md`, each with its Storybook story written first, covering every state the design shows. No screen work starts until this is done.
- **why:** Explicit instruction: components with their Storybook first, then screens. A screen assembled from components that do not yet match the design has to be rebuilt when they do.
- **severity:** high
- **points:** 13
- **parent:** SB-003
- **status:** backlog
- **exit:** Every component family in `DESIGN.md` has a story for every state, the Storybook test project passes, and each component has been visually compared against its Figma node.

### SB-007 — API scaffold, NestJS and GraphQL

- **desc:** `apps/api` with NestJS, a GraphQL schema, and Prisma against Postgres. Code-first schema, generated types shared with the web app.
- **why:** The data layer is GraphQL against NestJS rather than local data, so the schema shape decides the component props. Building screens before it means guessing at the shape.
- **severity:** high
- **points:** 8
- **parent:** none
- **status:** backlog
- **exit:** `npm run dev -w apps/api` serves a GraphQL endpoint, the schema builds, and a resolver test passes against a real Postgres schema.

### SB-008 — Data model: country is a dimension, not a constant

- **desc:** Prisma schema for countries, guides, tasks, steps, required documents, institutions and deadlines, with country as a first-class column on everything a user can browse.
- **why:** This is a global expat guide. Turkey is the first country, not the subject. Adding a second country must need no code change, and that is only true if country is in the schema from the start.
- **severity:** high
- **points:** 5
- **parent:** SB-007
- **status:** backlog
- **exit:** A second country can be added by inserting rows only, proved by a test that seeds two countries and browses both.

### SB-009 — Seed content from a repo file

- **desc:** A seed file in the repository holding the first country's guides, and a command that loads it into the database.
- **why:** Owner decision: content is seeded from the repo, then edited through the admin panel. Without a seed there is nothing to render or test against.
- **severity:** medium
- **points:** 3
- **parent:** SB-008
- **status:** backlog
- **exit:** A clean database plus the seed command produces a browsable guide, and running the seed twice does not duplicate rows.

### SB-010 — Change proposals from anonymous visitors

- **desc:** A visitor can propose a change to any guide or step. The proposal is stored for evaluation and never edits the live content.
- **why:** The product depends on readers correcting it, and there are no end-user accounts, so proposals must work without a login.
- **severity:** medium
- **points:** 5
- **parent:** SB-008
- **status:** backlog
- **exit:** An anonymous proposal is stored and appears in the moderation queue, and the live guide is unchanged until an admin approves it.

### SB-011 — Admin login and moderation panel

- **desc:** Admin-only authentication, and a panel that lists pending proposals and lets an admin approve, reject or edit them.
- **why:** Proposals are worthless unless someone can act on them, and the owner decided on admin-only login with no end-user accounts.
- **severity:** medium
- **points:** 8
- **parent:** SB-010
- **status:** backlog
- **exit:** An admin signs in, approves a proposal, and the change appears in the live guide; an anonymous visitor cannot reach the panel.

### SB-012 — Screens

- **desc:** Home and explore, country hub, category hub, guide detail, task hub. Assembled from the component library, matching the design.
- **why:** The screens are the product. They come after the components because that is the order instructed, and because a screen built on unfinished components gets built twice.
- **severity:** medium
- **points:** 13
- **parent:** SB-006, SB-008
- **status:** backlog
- **exit:** Every screen in `DESIGN.md` renders with real data from the API, in `en-US` and `fa-IR`, light and dark, checked in a browser.

### SB-013 — Deploy the web app to GitHub Pages

- **desc:** Build and publish `apps/web` to GitHub Pages from CI.
- **why:** Instructed hosting, and it must be free.
- **severity:** low
- **points:** 3
- **parent:** SB-012
- **status:** backlog
- **exit:** A push to `main` publishes the site and the published URL loads the home screen.

### SB-014 — Deploy the API on free hosting

- **desc:** Host the NestJS API and its Postgres on free tiers, and point the web app at it. Neon for the database; a free host for the API.
- **why:** Instructed hosting, free only. Fly.io has no free tier, so it is out.
- **severity:** low
- **points:** 5
- **parent:** SB-011
- **status:** backlog
- **exit:** The deployed web app loads real data from the deployed API, and nothing in the stack requires a paid plan.

## Done

_(nothing yet)_
