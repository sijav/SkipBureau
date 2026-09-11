# SB-136, Stop web-only pushes from restarting the only API replica

**Exit:** a push that touches only `apps/web` leaves the API answering
throughout, checked by polling the live GraphQL endpoint across that push; a
push touching `apps/api` still redeploys it.

## What happens now

Northflank builds and restarts the API on every push to `main`. At a tenth of a
CPU the new container takes a minute or two to listen, and the live API answered
**503** during exactly that window on 2026-09-11, right after a web-and-API push.
The published site shows Unreachable meanwhile, to a reader and to a crawler.

## Two fixes, and neither is only in this repository

**A build rule**, so a commit that changes nothing the API is built from is not
built. Northflank supports this in the service's build options, advanced build
settings, as path rules in `.gitignore` syntax, in allow-list mode ("trigger a
build only when the specified files or directories are changed"). The list,
from what `apps/api/Dockerfile` actually copies:

```
apps/api/
apps/web/package.json
package.json
package-lock.json
.dockerignore
```

`apps/web/package.json` is on it because the Dockerfile copies it for `npm ci`,
and a lockfile change can move an API dependency. A web-only dependency change
therefore still rebuilds the API, which is the safe direction to be wrong in.

**A readiness probe**, so a build that does happen does not take the API down:
Northflank sends traffic to a new container only once its readiness check
passes, and the old one serves until then. Whether that holds for a single
instance on the Sandbox tier is not stated in the docs, so the exit's polling
check is what answers it.

## The part that is this repository's, and was missing

The card says "the existing /health endpoint". **There is none.** Health is a
GraphQL query, and a probe makes a plain GET. Measured against the API:

| request | answer |
|---|---|
| `GET /graphql?query={health}` | **400**: Apollo refuses a GET without a preflight header as a possible cross-site request forgery |
| `GET /health` | **404** |

A readiness probe on either would fail for ever, and a deploy gated on it would
never become ready. So `HealthController` adds `GET /health`, answering `ok`
with 200 once Nest is listening, which in this container is after the
migrations have run. It checks nothing more, as the GraphQL query promises
nothing more.

## What the owner sets in Northflank

1. The API service, **Build options**, **Advanced build settings**, **Path
   rules**: allow-list mode, the five lines above.
2. The API service, **Health checks**, add a **Readiness** probe: HTTP, path
   `/health`, port `4000`, initial delay 30 s, interval 10 s, timeout 5 s, max
   failures 12, success threshold 1. Twelve failures ten seconds apart is two
   minutes, the cold start measured at this CPU.

## How it is checked

`GET /health` answers 200 in the API's e2e suite and on the live API after this
deploys. The exit itself needs the two settings: a web-only push with the live
endpoint polled every few seconds throughout, then an API push that still
deploys.
