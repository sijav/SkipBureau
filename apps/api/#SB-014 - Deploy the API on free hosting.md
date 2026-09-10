# SB-014, deploy the API on free hosting

**Exit condition:** the deployed API answers a GraphQL query over HTTPS, and
`https://sijav.github.io/SkipBureau/` renders a country instead of "SkipBureau
could not load this".

## Where this is going

**Northflank Sandbox**, chosen by the owner on 2026-09-10 after research: two
free always-on services, one free database, advertised as never sleeping. It
keeps NestJS, Prisma and Postgres exactly as they are, and nothing sleeps in
front of a crawler.

Ruled out for a search-first product: **Render** sleeps after 15 minutes and
serves a **disallow-all `robots.txt` while asleep**, Koyeb sleeps after an hour
and wants a card, Supabase pauses a quiet project after seven days. The owner
has since confirmed the project is non-commercial, which removes Vercel Hobby's
personal-use restriction; Northflank is still preferred, because Vercel
Functions is serverless with no published cold start and no included Postgres.

## What the API actually needs

Read from the source rather than assumed:

- `PORT`, defaulting to 4000
- `DATABASE_URL`
- `CORS_ORIGINS`, a comma separated allow-list, which must carry
  `https://sijav.github.io`
- the committed migrations, applied before it serves
- **no Prisma query engine binary.** The generator is `prisma-client` with a
  driver adapter, and `nest build` compiles the generated client into
  `dist/generated/prisma/client.js`. That is what makes a small runtime image
  possible, and it is the thing I am least certain of.

## The approach

A **multi-stage Dockerfile with the repository root as its context**, because
this is an npm workspace and the lockfile lives at the root.

- **build stage**: `npm ci`, `db:generate`, `nest build`
- **runtime stage**: `dist`, the pruned `node_modules`, and `prisma/` for the
  migrations and `prisma.config.ts`
- **entrypoint**: `prisma migrate deploy`, then `node dist/main.js`

Migrations on start rather than as a separate release step, because the Sandbox
runs one instance and a second one racing the first is not a situation that
exists here. If it ever does, this becomes a release command.

## What the owner has to do, and what I cannot

I cannot create an account, accept terms, or enter payment details. So:

1. create the Northflank account and a project
2. add a **Postgres addon** to it
3. link this GitHub repository, or give me a deploy token
4. tell me the service's public URL

Everything else, the Dockerfile, the migration step, the CORS origin and the
`GRAPHQL_URL` repository variable that points the site at it, is mine.

## Files

| file | change |
|---|---|
| `apps/api/Dockerfile` | new, multi-stage, root context |
| `.dockerignore` | new, at the root |
| `apps/api/docker-entrypoint.sh` | migrate, then serve |
| `apps/api/src/main.ts` | `https://sijav.github.io` in the default origins |

## How it meets the exit condition

Locally first, because Docker is installed here: build the image, run it against
a throwaway Postgres, and `curl` a real query. Then on Northflank, and then the
published site rendering "Turkey" instead of the Unreachable screen, seen in a
browser rather than inferred.

## The step I am least sure of

**Whether the image needs a Prisma query engine at all.** Prisma 7 with a driver
adapter is supposed to remove it, which is what would let this be a small Alpine
image. If it does still need one, Alpine's musl is the classic way to get a
binary that exists and will not run, and the failure arrives at the first query
rather than at build time. That is worth knowing before the image is written,
not after Northflank reports a container that starts and then 500s.

## What actually broke, and why the fix is in the entrypoint

The first deploy failed on `CREATE SCHEMA IF NOT EXISTS "public"`, which Prisma
generates and which needs CREATE on the DATABASE. A managed add-on user does
not have it, and `IF NOT EXISTS` does not help: Postgres checks the privilege
before it decides the statement is a no-op. That is error 42501, wrapped as
P3018.

Removing the line fixed the migration but not the deployment, because the
failed attempt stays in `_prisma_migrations` and every later run stops at
P3009 without retrying. The documented fix, `prisma migrate resolve`, has to
be run against the database by a person.

**On this host that fix is unreachable.** Migrations run in the entrypoint,
before the server, so a failed migration means the container exits and the
platform restarts it. Northflank's shell attaches to a *running* container, and
there never is one for more than a couple of seconds. The one command that
clears the blockage requires the thing the blockage prevents. Three attempts to
run it by hand changed nothing: the failed row's timestamp never moved.

So `src/recover-migrations.ts` runs first and clears it, but only where
"rolled back" is demonstrably true. Prisma does **not** wrap a migration in a
transaction on Postgres, so a migration can fail halfway and leave objects
standing, and marking that rolled back would be a lie that the next deploy pays
for. It therefore refuses unless no migration has ever finished **and** the
schema holds no tables or enums, and otherwise prints what it found and lets
`migrate deploy` fail with its own P3009.

### The second bug, found before it could bite

`sslmode=require` means different things to the two halves of this stack. To
libpq, and so to Prisma's migration engine, it means encrypt without verifying
the server. `pg-connection-string` only reads it that way under
`uselibpqcompat`; otherwise it leaves `rejectUnauthorized` at Node's default of
true and demands a publicly trusted chain, which a managed add-on signed by a
private CA does not have. Migrations would have started passing and then
`bootstrap.js` would have died on the certificate instead. `src/database-url.ts`
makes the node-postgres side read `sslmode` the way the rest of the stack
already does.

### Proven, not reasoned about

A local Postgres with a role holding CONNECT but not CREATE reproduced 42501
and P3009 exactly, including `applied_steps_count = 0`. The built image, run
against a database in that state, recovered itself, applied all three
migrations, bootstrapped the countries and answered
`{ countries { code name } }` with Turkey and Germany, with
`Access-Control-Allow-Origin: https://sijav.github.io` on the preflight. A
restart was a no-op. Both refusal paths were checked by planting a case: a
failed migration on a database with history, and one that left an enum behind.
