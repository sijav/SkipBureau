# Tech debt

Nothing gets silenced, worked around or pinned without an entry here: what it
is, what causes it, what would fix it, and the check that says it can go. A
suppressed warning with no record is a decision nobody can revisit, and the
reason is the first thing lost.

**And an invariant the code relies on that the database does not enforce.**
That is not a suppression, and the board is where the work to close it lives,
but this file is what someone reading the code opens, and a promise the system
does not keep has to be findable there. Every such entry names the card that
owns it.

Deliberate scope cuts are not debt. They go in the board with their reason.

---

## `prisma dev` cannot run on this machine

**What.** `apps/api` runs its local Postgres through
`scripts/pglite-server.mjs`, which puts PGlite behind the Postgres wire
protocol, rather than through Prisma's own `prisma dev`.

**Why.** `prisma dev` loads a dynamic subcommand by shelling out to
`npm install @prisma/cli-dev --allow-scripts` at run time. npm 12 refuses that
on this machine: `--allow-scripts is not allowed in project-scoped installs`,
because the owner runs an `allowScripts` policy deliberately, alongside
`min-release-age=7`. Turning it off is a security decision and it is his, not
one to make on his behalf for a convenience.

**What it costs.** Little. Migrations are applied with the ordinary
`prisma migrate deploy` against a real Postgres wire endpoint, so the test
database is built by the same SQL a deployment receives, which was the whole
requirement. What is lost is Prisma's managed lifecycle and Studio.

**The check that says it can go.** `npx prisma dev --help` inside `apps/api`
prints usage instead of `EALLOWSCRIPTS`.

---

## `sslmode=disable` on the local database URL

**What.** `scripts/pglite-server.mjs` returns a URL ending `?sslmode=disable`.

**Why.** Prisma's migrate engine opens a connection with an `SSLRequest`.
PGlite's socket server does not answer one and closes, and Prisma reports that
as `P1001: Can't reach database server`, pointing at a server that is running
and accepting connections. The error names the wrong problem, which cost
several rounds to find.

**What it costs.** Nothing in production: this URL is only ever the local
in-process database. The deployed `DATABASE_URL` is set by the host and keeps
whatever SSL mode that host requires.

**The check that says it can go.** `@electric-sql/pglite-socket` handles an
`SSLRequest`, at which point removing the parameter still lets
`prisma migrate deploy` succeed.

---

## The web app's `lingui/no-unlocalized-strings` ignores a single lowercase token

**What.** `apps/web/eslint.config.mjs` ignores strings matching
`^[a-z0-9_.:/#-]+$`.

**Why.** Identifiers, storage keys and prop union defaults are strings the rule
cannot distinguish from prose without more type information than it has at
every site. The same pattern is used in the reference project.

**What it costs.** A genuine one word lowercase label would pass unnoticed. The
design has none: every visible string in the Figma file is a capitalised phrase
or a sentence.

**The check that says it can go.** A rule option, or a typed-lint improvement,
that skips prop union values without a shape-based pattern.

---


## Rule history is not append-only, and the triggers cover less than they read as

**Owner: SB-081.**

**What is enforced.** `20260909232307_rule_history_is_append_only` creates three
triggers. Two of them, on `RuleVersion` and `RuleFact`, raise on UPDATE and
DELETE **only when `validTo` is not null**. The third refuses two versions of
the same obligation, country and scope overlapping in time.

So the guarantee is exactly this and no more: **a closed version row, and a fact
already on a closed version, cannot be updated or deleted by ordinary DML.**

**What is not enforced.** Every one of these changes what a query about a past
date returns.

- **An OPEN version is not protected at all.** The trigger only fires once
  `validTo` is set, so until a version is closed a writer can edit or delete
  it, change its facts, rewrite its source, move its `verifiedAt`, or backdate
  `validTo`. An open version covering 2020 to now is most of the history. This
  is the largest gap and it is the one the first version of this entry missed.
- **`EligibilityCriterion` on a closed version**, insert, update or delete.
  Editing one rewrites who the rule applied to; deleting one widens it to
  everybody; inserting one narrows a formerly general rule. The overlap trigger
  fires on the version row and has already run, so editing criteria afterwards
  can leave two versions with identical scope in force at once.
- **`RuleText` on a closed version**, insert, update or delete. Inserting a
  locale changes what a past reader in that locale would have been shown.
- **Inserting a `RuleFact`** onto a closed version. Recording history has to
  stay possible, and telling "written while creating it" from "added later"
  needs a transaction check that `createdAt` cannot provide, because Prisma 7
  generates that default on the client rather than in the database.
- **`NationalityGroupMember` and `NationalityGroup`**, entirely. When a country
  joined or left a group can be changed, so a question about 2020 answers
  differently afterwards.
- **`Obligation` and `ObligationText`**, entirely, for the same reason at one
  remove.
- **`TRUNCATE ... CASCADE`**, which does not fire ON DELETE triggers at all.
  Ordinary foreign-key cascade is *not* a bypass, because PostgreSQL runs it as
  normal child-table UPDATE and DELETE and the triggers fire. TRUNCATE is
  different, and there is no role or privilege setup here to put it out of
  reach, so it is listed rather than assumed away.

**What it costs.** The product tells a reader what a rule said on a date, and
every verified date it prints rests on that being true. Today it is true for
one row type in one state.

**The check that says it can go.** SB-081 closes the gaps and this entry is
removed only when a mutation test proves each one refused: an open version, a
criterion, a text, a fact insert, a group membership, and an obligation.

---
