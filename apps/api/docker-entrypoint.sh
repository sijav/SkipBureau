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

# Countries. Compiled, so this needs no TypeScript loader at runtime.
echo "bootstrapping reference data"
node dist/bootstrap.js

# Researched rules, written from the agreed research with every fact tied to
# the page that states it (SB-190). Before the sample content, so a sample guide
# naming an obligation this adds can link to it. Every row a research file owns
# then says what that file says, added, rewritten or removed (SB-202).
echo "loading researched rules"
node dist/load-research-rules.js

# Sample content, so the screens can be seen: the owner's order of 2026-09-10,
# on a database the owner calls test-only. Fill-only, so it is safe on every
# start, except that it retires Turkey's sample rows, which the owner chose on
# 2026-09-15 to delete (SB-282). Remove this line before a real launch; see
# PHASE-NEXT.md. NOT the rules in prisma/seed.ts, whose history is append-only
# and would duplicate.
echo "filling in sample content, and retiring Turkey's"
node dist/sample-content.js

# Guides written from the agreed research, their areas and their links (SB-258).
# Not sample content: this stays when the line above comes out before a launch,
# and it makes sure of the goal it hangs its areas on itself.
echo "loading researched guides"
node dist/load-researched-guides.js

echo "starting the API on port ${PORT:-4000}"
exec node dist/main.js
