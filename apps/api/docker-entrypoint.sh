#!/bin/sh
# Migrate, bootstrap, then serve. Any of the three failing must stop the
# container rather than leaving it answering from a half-built database.
set -e

cd /repo/apps/api

echo "applying migrations"
npx prisma migrate deploy

# Countries only. NOT prisma/seed.ts, which says in its own first line that it
# is illustrative and unverified and must not reach a reader. Compiled, so this
# needs no TypeScript loader at runtime.
echo "bootstrapping reference data"
node dist/bootstrap.js

echo "starting the API on port ${PORT:-4000}"
exec node dist/main.js
