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
