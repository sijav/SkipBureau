#!/bin/sh
# Recover, migrate, bootstrap, then serve. Any of them failing must stop the
# container rather than leaving it answering from a half-built database.
set -e

cd /repo/apps/api

# A failed migration from an earlier deploy blocks every later one with P3009,
# and the documented fix is a command run against the database by hand. That
# cannot be done here: this runs before the server, so a failure means the
# container exits and restarts, and there is no running container to get a
# shell into. So the recovery runs first, and clears a failed migration only
# when it can prove the database is untouched. See recover-migrations.ts.
echo "checking for a failed migration"
node dist/recover-migrations.js

echo "applying migrations"
npx prisma migrate deploy

# Countries only. NOT prisma/seed.ts, which says in its own first line that it
# is illustrative and unverified and must not reach a reader. Compiled, so this
# needs no TypeScript loader at runtime.
echo "bootstrapping reference data"
node dist/bootstrap.js

echo "starting the API on port ${PORT:-4000}"
exec node dist/main.js
