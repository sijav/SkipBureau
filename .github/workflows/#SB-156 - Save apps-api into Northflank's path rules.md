# SB-156, Save apps/api/** into Northflank's path rules once the form accepts a save

(The title's `/` and `*` are not allowed in a filename, hence `apps-api` above.)

**Exit:** the saved path rules include `apps/api/**`, and a push that changes
only `apps/api/src` deploys without a version bump.

## Why through the API

Northflank's **Update build options** refuses every save with "Match failed",
whatever is in the form (SB-136). Its API takes the same change as
`PATCH /v1/projects/{project}/services/{service}` with
`buildConfiguration.pathIgnoreRules` and `isAllowList`, and an API error says
which field it rejects, which the toast does not.

## The token is the owner's, and I never hold it

On 2026-09-11 the owner stored a Northflank API token as the repository secret
`NORTHFLANK_TOKEN` themselves. `northflank-path-rules.yml` references it by
name and GitHub supplies it at run time. It is never written, printed or
passed anywhere else.

## The workflow

By hand only (`workflow_dispatch`), with `permissions: {}`, because it needs
nothing from GitHub.

1. Find the API's service by its id, `buildfromgithub` (the id in its public
   address), across the team's projects. If it is not found, list every
   project's services, ids, names and types only, and stop.
2. Read the service and print **named build fields only**: service type, CI
   state, build settings, build configuration. Never the whole response: it
   carries `runtimeEnvironment`, and a public repository's logs are public.
3. With `apply` ticked, PATCH the five rules in allow mode, then print the
   saved `buildConfiguration`. On an error, print Northflank's error object
   and nothing else.

Run once read-only, to see what is stored and whether something there
explains the toast; then once with `apply`.

## How it is checked

The read-back shows the five rules and `isAllowList: true`. Then a push that
changes only `apps/api/src`, no version bump, with the live `/health` polled:
it has to build and deploy by itself.

## What happened, 2026-09-11

- Read-only run: the service is `buildfromgithub` in project `skipbureau`,
  combined, CI on. Stored: the dockerfile settings, a 16384 MB build storage,
  and the nine rules in allow mode. Nothing there says why the form fails; the
  storage size is the only stored value the form did not show.
- First write: `PATCH .../services/buildfromgithub` answered **405**. The
  combined-service path, `PATCH .../services/combined/buildfromgithub`,
  accepted the five rules and returned them saved.
- The check: 7fc8413 changed one file inside `apps/api/src` and no version.
  Northflank's build list shows it built, **SUCCESS**, and shows no build for
  any of the pushes before it that touched nothing the API is built from. The
  live `/health`, polled every two seconds for six minutes, answered 160 times
  and failed once, at the container switch.
