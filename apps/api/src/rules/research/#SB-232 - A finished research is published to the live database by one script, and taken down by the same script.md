# SB-232, A finished research is published to the live database by one script, and taken down by the same script

**Exit:** the script's own test passes; with it, Munich's, Düsseldorf's, Wiesbaden's and Freiburg's
free registration (SB-229) is published, taken down and published again, each ending read back on
the deployed API as the files say, from commits that `git log --grep 'Research-Action: publish'` and
`--grep 'Research-Action: down'` find.

## Why

The owner's orders of 2026-09-15, in order: a research that passes is turned into data and pushed to
the live database before the next item starts; the assistant runs one command once it has written the
data file, passing that file; the command does the job or gives its error back clearly, and the error
gets fixed; there is a down; git keeps the trace, with commits that can be filtered; and there is no
guard, because mistaken data cannot be guarded and people report what is wrong. SB-202 made the load
follow the files. Nothing yet turns a passed research into a deploy, reads it back, or takes it down.

## One file per research case

`src/rules/research/turkey.ts` and `germany.ts` split into one file per agreed document, under
`src/rules/research/turkey/` and `germany/`: `provinces`, `address-registration`, `company-formation`,
`health-insurance`, `short-term-residence-permit`, `work-permit`; `states`, `cities`, `anmeldung`.
Each exports `CASE`, the part of `ResearchRules` its document supports: its places, statuses,
groups, obligations, sources and versions. A status, group or obligation several cases name lives in
the first case whose versions name it, in the order the country file now has.

`turkey.ts` and `germany.ts` stay, and compose their cases in order into `TURKEY` and `GERMANY`, so the
loader, the specs and `RESEARCHED` do not change. Composing refuses, with the case and the key named,
two cases listing the same place, status, group or version, or the same source or obligation
differently; the same source or obligation listed identically is written once. That is the SB-202 plan
check's point about one owner per row: owners stay per country, `turkey` and `germany`, because a
deploy always loads whole countries, so two cases of one country can only collide here, where it is
refused.

The split changes no row. A one-off comparison, run before anything else is built, holds the composed
`TURKEY` and `GERMANY` to the ones in `HEAD`: places and statuses deeply equal in their order, because
the load writes them parents first; versions, obligations and sources the same items in any order,
because the load reads those by their identity, their slug and their key. Composed in the order
provinces, company formation, health insurance, short-term residence permit, work permit and address
registration, and states, cities and Anmeldung, places and statuses come out in today's order. Turkey's
health insurance version, today between two company formation versions, moves after them, so the first
deploy after the split changes the digest and no row. The research specs pass unchanged.

## Knowing the database holds a file

`researchRows` counts cannot show that a corrected fact arrived, and a digest the running build
computes from the files it carries is no receipt either: during a rollout an older container that
starts again loads its older files while a new one still reports the new. So the load writes a
receipt in its own transaction. A new table, `ResearchLoad`, holds for each research file its digest,
the SHA-256 of the composed file as canonical JSON, object keys sorted at every depth and every array
in its order, refusing a value JSON would change or drop, an undefined inside an array, NaN, an
infinity or a BigInt, and when it was loaded; `researchRows` gains `digest`, read from that table. The script
computes the same digest from the files it commits, with the same function, and waits until the
deployed database's equals it. The migration adds the table inside one transaction with SB-202's lock
timeout.

## The command

`npm run research:publish -w @skipbureau/api -- <data file>`, and `-- --down <data file>`. The script
is `scripts/publish-research.ts`, run by `tsx`, inside the typechecked and linted `scripts` folder. Every
failure ends in one line saying what failed and what to do, and a non-zero exit.

**Publish** a case, `src/rules/research/<country>/<case>.ts`:

1. **Find its files**: the data file, its country's composing file, `prisma/research/agreed/<country>/<case>.md`
   and `talk/<country>/<case>.md`, `sessions.json`, and the research README, and hash each. A missing
   agreed document is an error. So is a change `HEAD` does not hold to anything else Northflank builds
   the API from, each named in the error: a file under `apps/api` that is not Markdown, which
   `.dockerignore` keeps out of the image, or `package.json`, `package-lock.json`, `apps/web/package.json`
   or `.dockerignore`, the other paths its build rules name. The publish would deploy data without a
   change it may need, and the next build would deploy that change unchecked. The fence is wider than
   the image on purpose: the checks read the specs, the scripts and the configuration from the working
   tree, so an uncommitted change to one of them would let a publish pass on checks the commit does not
   hold.
2. **Check**: `lint:tsc` and the two research specs, whose failures are printed.
3. **Commit** exactly the bytes that were checked, even when nothing changed, as
   `Research publish: <case>`, ending with `Research-Case: <case>`, `Research-Action: publish` and
   `Research-Publish-Id: <a new UUID>`. After the checks each file is hashed again, and one that changed
   while they ran ends the publish with an error naming it. The commit is then built from the bytes read
   at the start, never from the working tree: a temporary index read from `HEAD`, each file written with
   `git hash-object -w --path`, so its attributes apply as `git add` would apply them, set with
   `git update-index --cacheinfo`, then `git write-tree`, `git commit-tree`, and `git update-ref` from the
   `HEAD` it started on, which fails if anything was committed meanwhile. The main index is never
   touched: git has no compare-and-swap for one index entry, so a write there from the background could
   overwrite a change the next task staged. The report ends with the committed paths and the one
   command, `git reset -q -- <paths>`, that brings the main index level with the new commit, run in the
   foreground once the publish has reported; until then every commit names its paths,
   `git commit -- <paths>`, which never carries those entries.
4. **Push.** A rejected push is an error.
5. **Wait** until the deployed database's digest for the country, read through `researchRows`, equals
   the one computed from the committed files, polling every 20 seconds for 15 minutes, or, where the fallback below runs, for 15 minutes from the
   moment its build succeeds; a digest already
   equal needs no build and ends the wait at once. While it differs, the script watches Northflank's
   build of the publish commit itself. Northflank posts a `pending` status on a commit it builds and a
   final one after; `gh api repos/sijav/SkipBureau/commits/<commit>/statuses` reads them, newest first,
   with the machine's GitHub login and no Northflank token, and only the context
   `northflank/sijavs-team/skipbureau/buildfromgithub` counts. A failed or errored build is the error,
   naming the commit and the status's description.

   No status within three minutes means Northflank did not build the commit. A push that lands while
   another build runs can go unbuilt: the first publish of SB-229, `c5b8b25`, pushed while `d83eb68` was
   building, has no status at all. Pushing again sends nothing, since the commit is already on `origin`.
   So the script starts that build itself, once, by dispatching a new hand-run workflow,
   `.github/workflows/northflank-build.yml`, through
   `gh api -X POST repos/sijav/SkipBureau/actions/workflows/northflank-build.yml/dispatches`, sending
   `ref`, the branch the publish pushed, which holds the workflow; `inputs[sha]`, the commit; and
   `return_run_details: true`. Under API version 2022-11-28, which `gh api` selects, the endpoint
   answers 204 with no body unless that flag is sent, and 200 naming `workflow_run_id` when it is, as a
   read-only run of the path rules workflow showed on 2026-09-15. The script then polls that run,
   `gh api repos/sijav/SkipBureau/actions/runs/<id>`, beside the digest. A refused dispatch or an answer
   naming no run is the error. Only a `completed` status ends the run, and then any conclusion but
   `success`, a missing one included, is the error, naming the run; a run still queued, waiting or in
   progress keeps the publish waiting, within two limits of the script's own. A run still `queued`,
   `requested`, `waiting` or `pending` thirty minutes after the dispatch is the error. A run first seen
   `in_progress` has twenty-two minutes from then: the workflow's one job carries `timeout-minutes: 15`,
   which covers its twelve-minute wait for the build, and GitHub can take up to five more minutes to
   cancel a job, so a run not completed by then is stuck and is the error. The workflow refuses an
   input that is not a 40-character commit
   id, then asks Northflank's API for the build, `POST /v1/projects/skipbureau/services/buildfromgithub/build`
   with that `sha`, using the owner's repository secret `NORTHFLANK_TOKEN` as the path rules workflow
   does. That answer only says the build was accepted, so the workflow reads the build every 15 seconds
   for up to twelve minutes, `GET /v1/projects/skipbureau/services/buildfromgithub/build/<id>`, until
   `concluded` is true, and fails unless `success` is, with the build's `status`, as it does for a build
   still unconcluded at twelve minutes. It prints only the build's id, commit and status, never the
   token, the service's environment or Northflank's `message`, which its API documents only as a status
   description, not as fit for a public log. A successful run ends nothing on its own:
   only the digest shows that the service deployed the build, started and loaded the files.
6. **Read back** each version the file lists, as the reader it reaches, its facts and the wider facts it
   inherits on their pages, and each place accepted; and each version and place the commit before
   listed and this one does not, gone: the place refused, the version's own facts not served. A version
   with no place, where another version of its obligation names one, is asked from a Land in which no
   rule names a place, since a Land holding a named city asks where in it the reader will live.
7. **Report** the commit, the digest and the read-back.

Line endings follow the repository's own rule: it has no `.gitattributes`, and git here runs with
`core.autocrlf=input`. `git hash-object --path` applies that rule as `git add` does: `sessions.json`,
CRLF on disk, hashes that way to exactly the blob `HEAD` holds, and without `--path` to another.

**Down** a case finds its last publish that changed its data file and that no down has reverted, by
`Research-Publish-Id`, which a rebase keeps where it changes the commit's id: `git log` given the data
file as its path lists only the commits that changed it, in a history without merges, as this one is. A publish that changed nothing in the data
file, such as one run again once a late deploy arrived, has nothing to take back, and a down that chose
it would restore the very bytes it published and report them taken down. The down takes the data file's
bytes from that commit's parent, or, where the file did not exist there, a case naming only its
document, which composes to nothing and the country's file can still import: a deleted file would break
that import, and restoring the country's file would take back every case added since. That one buffer is
written to disk for the checks, hashed there again after them, and given to `git hash-object`, and the
result is published as `Research down: <case>` with `Research-Action: down` and
`Research-Reverts: <that publish id>`. The research documents stay: a down takes back the data, and git
keeps the rest.

## Its own test

`test/publish-research.spec.ts`, with no database and no network: a case read from its path, and a
path outside `src/rules/research/<country>/` refused; the commit message and its trailers; the publish
a down reverts, found by its publish id from `git log` output, including one already reverted and one
whose commit was rewritten; a digest unchanged by key order and changed by one fact; composing refusing
a place two cases list; a reader built from a version, a version with no place asked from a Land where
no rule names a place; the changes a publish refuses, a Dockerfile, a script and the lockfile named and
Markdown not; and Northflank's state of a commit read from the statuses GitHub answers with, the newest
first, another context's status passed over and no status read as none; the dispatch's arguments,
the branch, the commit as the workflow's input and `return_run_details`; and a dispatched run read as
still going, succeeded or failed from its status and conclusion, a completed run with no conclusion
failed, a `timed_out` conclusion among them; and, against a clock the test sets, a run not started
thirty minutes after its dispatch failed, one that started at minute twenty-nine still waited for, and
one still in progress twenty-two minutes after it was first seen so failed. In a temporary repository with
git's file monitor off: a commit built from checked bytes that leaves the main index exactly as it was,
a change another process staged included, and goes ahead while that index is locked; and the log a down
reads, which passes over a publish that changed nothing in the data file. The live run above is the rest.

## Specs that follow the data

A spec that pins today's data fails the next research published, and the publish's own checks then
refuse it. So the research specs read Germany's expectations from the file: which Land is told the
federal facts alone, and how many versions step aside when a Land moves. SB-229's data showed the need,
by failing three tests that pinned the data before it. That a reader in a Land where a city has its own
rule is asked where in the Land they will live is checked on a copy of Germany's file with a rule of
Köln's own added, which no research has written, loaded and then replaced by the real file, which puts
every row back: the check holds whatever the file holds, instead of passing unchecked when no Land has
a city rule.

## The research guide

`prisma/research/README.md` gains the rule: a research is finished once the command has read it back
live, and the next item starts after that; the assistant runs it in the background and fixes what it
reports; while it runs every commit names its paths, and when it reports, its `git reset` line is run;
the commands for publish, down and finding the trace; and that the script starts a build Northflank
skipped through `northflank-build.yml`, which can be run by hand for any commit. `CLAUDE.md` is not
touched.

## Files

`src/rules/research/turkey.ts`, `germany.ts` and the nine case files; `src/rules/research/compose.ts`
and `digest.ts`; `prisma/schema.prisma` and a migration for `ResearchLoad`, which
`src/rules/research/load.ts` writes; `src/rules/rules.model.ts`, `rules.service.ts`, `schema.gql`; `scripts/publish-research.ts`;
`package.json`; `test/publish-research.spec.ts` and `test/research-rules.e2e.spec.ts`;
`prisma/research/README.md`; `.github/workflows/northflank-build.yml`; for the live run,
`germany/anmeldung.ts`, with SB-229's four versions.

## SB-229, as the test

Its four versions come from `agreed/germany/anmeldung.md`: `registrationFee` none, each on its city's
page, `munich-registration-free`, `duesseldorf-registration-free`, `wiesbaden-registration-free` and
`freiburg-registration-free`, read 2026-09-14, under `DE-BY.muenchen`, `DE-NW.duesseldorf`,
`DE-HE.wiesbaden` and `DE-BW.freiburg`, with the agreed sentences as notes, and each page's name read
from the page. SB-229 closes with this card.

## The steps I am least sure of

1. **An older build starting again reverts the database** to the files it carries, because SB-202's
   load follows whatever files it has. The receipt shows it, as the digest going back, and nothing here
   prevents it: no guard.
2. **A down that restores a data file older than its agreed document** can name a label the document no
   longer has; the specs then fail and the down reports it, which is the order's error back.
3. **The push racing another push** is reported and not retried.
4. **An empty publish of a case already deployed** changes no digest and succeeds at once, as it
   should; only a publish that changes data proves a deploy, which is why the test uses SB-229.
5. **The main index stays behind the moved branch** for the committed paths until the report's
   `git reset` runs. A commit of the whole index before then, such as `git add` of the board followed by
   a bare `git commit`, would take the publish back, which is why commits name their paths while one runs.
6. **Northflank's commit status is the script's only early view of a build.** Read through `gh`, it
   needs the machine's GitHub login. A build started through the workflow may post no status, and
   Northflank does not say whether its path rules apply to one; the workflow's run then says whether the
   build succeeded, and only the digest that it was deployed and loaded.
7. **The build the script starts is the publish commit's**, so a push landing after it could be built
   first and then deployed over by the older commit. Nothing else pushes while a publish runs, since the
   next item waits for it; if something does, the digest says which files the database holds.

## How it is checked

The one-off comparison of the composed files with `HEAD`; the new spec; the research specs; lint,
`lint:tsc`, the build and the full API suite. Planted faults, each watched failing: composing that
lets a duplicate place through, a digest that ignores a fact, a down that finds an already reverted
publish, a down that chooses a publish that changed no data, a load that writes no receipt, a publish
that commits a file changed after its checks, a publish that writes to the main index, a publish that
lets a changed Dockerfile through, and a status read that takes another context's status. Before the
live run, the script's own dispatch and run polling start a build of `c5b8b25`, the commit Northflank
never built, whose image is the one deployed now, since the two differ only in a plan file
`.dockerignore` keeps out; recorded are the run id the dispatch returned, the run's `success`, the commit
Northflank's answer names and the build's final status, that commit's statuses, and the digest staying
as it is. Then, live and in order: publish
`germany/anmeldung` with SB-229's versions, read back Munich free; take it down, read back Munich with no
fee fact and the four versions gone; publish it again; and the three commits found by their trailers.
