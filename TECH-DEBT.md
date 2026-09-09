# Tech debt

Nothing gets silenced, worked around or pinned without an entry here: what it
is, what causes it, what would fix it, and the check that says it can go. A
suppressed warning with no record is a decision nobody can revisit, and the
reason is the first thing lost.

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

## A fact can still be added to a rule version that was already closed

**What.** `rule_fact_history_is_immutable` fires on UPDATE and DELETE only.
Nothing already written to a closed `RuleVersion` can be changed or removed,
and the version row itself is fully immutable once closed, but a NEW `RuleFact`
can be inserted against one.

**Why.** Recording history has to stay possible. A version imported already
closed, a past rule someone is backfilling, writes its facts after the version
row, so a blanket INSERT rule made the past unrecordable rather than immutable.
The first version of the trigger did exactly that and the boundary test caught
it. Telling "written while creating it" from "added later" needs a transaction
check, and `createdAt` cannot serve as one: Prisma 7 generates that default on
the client, so it never equals `transaction_timestamp()`.

**What it costs.** Someone with write access to the database could add a fact to
a historical version and change what the past appears to have said. Nothing
already recorded can be altered, which is the property the verified dates rest
on.

**The check that says it can go.** An editorial publish workflow, SB-011, that
owns writes and refuses to touch a closed version, or a database-generated
`createdAt` that a trigger can compare against `transaction_timestamp()`.
