# SB-202, The research load makes the live database follow the research files

**Exit:** on PGlite, loading research files that end a version and add its successor, drop a
version, a membership and a place, reopen an ended version and rename a place leaves the database
exactly as the files say, and a second load changes nothing.

## Why

The owner's order of 2026-09-15: a research that passes is turned into data and pushed to the live
database before the next item starts; a down puts the database back exactly as it was before that
publish; git keeps the trace; and there is no guard, because mistaken data cannot be guarded, the
research corrects itself, and people report what is wrong later.

Today's loader only adds. It stops a deploy when a researched version, status, place or membership
differs from the deployed one, and it leaves in force whatever the file no longer lists. So the first
correction to any rule blocks every later deploy, and nothing published can be taken back. SB-232's
script will publish and take down by committing files; this card makes the deploy's load do what
the files say.

## The rule

After a load, every row a research file owns says exactly what that file says. A load adds what is
missing, rewrites what differs and removes what the file no longer lists. A down is a load of the
earlier file, so it needs nothing of its own here.

A change in the law is still history, because the file says so: it ends the old version from the day
the law changed and adds the successor from that day, and both stay. A correction of a mistake, and a
down, rewrite the rows, and git holds what they said before.

## Which rows a file owns

- **`RuleVersion`, `Region`, `ResidenceStatus` and `NationalityGroup` gain a nullable column,
  `research`**: the `research` value of the file that wrote the row, `turkey` or `germany` today, the
  case once SB-232 gives each case its own file. Null for a row research did not write: the seed's, a
  test's, an editor's.
- **A load claims every row its file lists.** A listed row with no owner, or another, becomes this
  file's. On the first deploy that is every researched row already on the database: all of them were
  written by research, and none carries an owner yet.
- **A load removes only rows a file of the load owns and no file of the load lists.** A row of a file
  not in the load, or of no file, is never removed, so loading Turkey alone never touches Germany's
  rows, and the seed's rows and a test's status stay.
- **A group's memberships belong to its group**: the memberships of a group the file lists are
  exactly the file's, as SB-192 has it now.
- **Obligations stay add-only**, titles included. They are shared between countries and linked from
  guides, and one left with no version answers nothing.

## What a load writes, and in which order

One transaction under the research lock, as now, over every file of the load together, so a row one
file gives up and another now lists is handed over rather than removed. In this order:

1. **versions step aside.** Every version a file of the load owns is removed where no file of the load
   lists it as it stands, and so is every such version that names a place or a status, or one inside
   it in the tree as the database holds it before the load, that the files together move to another
   parent or no longer list. The place and status triggers refuse to move or remove a row a rule names,
   itself or through one inside it, and they keep that refusal, so nothing a load moves or removes may
   still be named when the load reaches it. A version removed here that a file still lists is written
   again at step 6, which fails if what it names is gone;
2. **statuses**, in each file's order, so a status is written before its kinds: a missing one is
   created; a listed one gets the file's parent, name and both texts, and is claimed. Then each status
   a file of the load owns and none lists is removed, kinds first;
3. **places**, the same way, with the file's parent, name and official code (SB-231), the most deeply
   nested removed first;
4. **groups**: a missing one is created; a listed one gets the file's name and is claimed; a
   membership its file lists and the group lacks is created, one whose end differs is removed and
   written again, and one its file does not list is removed. Then each group a file of the load owns
   and none lists is removed;
5. **obligations**: added when missing, as now;
6. **versions**, identified as now by country, obligation, criteria and `validFrom`: each one a file
   lists and the database lacks, which now includes every version step 1 removed, is written as the
   file says, and an identical one is claimed.

A version no file of the load owns, the seed's or a test's, is never removed. So a place or a status
such a version names cannot be moved or removed by a load: the trigger refuses, and the load ends in
that error, which is how a mistaken file reports itself.

`ResearchVersion` gains `validTo`, the first day it no longer holds, left out while it holds.

## The history triggers let the research load through

SB-081's triggers refuse to change or delete a version that has started, its facts, texts and
criteria, or a membership that has taken effect. A new migration makes
`skipbureau_rule_version_is_history`, `skipbureau_rule_part_may_change` and
`skipbureau_group_membership_is_history` allow the write when the transaction-local setting
`skipbureau.research_load` is `on`, which the load sets as its first statement, beside the lock.
Nothing else in them changes, and without the setting every refusal `history.e2e.spec.ts` attempts
is still refused. The overlap check, deferred to commit, and the refusal to truncate are unchanged.
The place and status triggers get no exception: the load removes the versions that name what it moves
or removes before it gets there, step 1 above, and their refusal still stands for everything else.
The migration is a new one, and no existing migration is edited,
`20260911200000_rule_history_is_append_only_throughout` included.

## The deploy, and what is done if its migration fails

Prisma gives Postgres no transaction per migration. On PGlite, through Prisma 7's `migrate deploy`, a
migration that failed on its second statement left its first one, an added column, standing, and was
recorded as failed. So this migration writes its statements inside one explicit `BEGIN` and `COMMIT`:
the same experiment wrapped that way left nothing standing when it failed, and applied and was
recorded as finished when it passed.

Its first statement inside that transaction is `SET LOCAL lock_timeout = '30s'`. Adding a column takes
an `ACCESS EXCLUSIVE` lock, and while the migration waits for one every later read of that table
queues behind it, so a stuck session on the deployed database would freeze the API rather than leave
the old container serving. This API's queries take milliseconds and the research load runs only as a
container starts, so only a stuck session holds a lock for 30 seconds, and then the migration fails,
which is the case below, instead of the API freezing.

If it fails on the deployed database anyway, the new container exits before it serves and the previous
one keeps serving. The failure is recorded, so every later deploy stops at P3009, and
`recover-migrations.ts` stands aside on a database with history, as it was written to. Clearing it
takes `prisma migrate resolve --rolled-back` with the migration's name, run against the deployed
database by someone who can reach it, which I cannot, so the owner gets that command in a card.
Because the migration is one transaction, "rolled back" is then simply true.

Unchanged answers cannot tell a deploy that arrived from one that failed while the old container
serves, because this card changes no answer. So the API gains one read-only query, `researchRows`:
for each research file, how many versions, places, statuses and groups of this database it owns. It
does not exist until the new build serves, and after the first load it reads `turkey` with 19
versions, 81 places, 6 statuses and 1 group, and `germany` with 4 versions and 21 places. That shows
the new build serving and its first load having claimed the rows, and nothing more: that each row says
what its file says is shown by the tests on PGlite and by the readers asked after the push. SB-232's
script reads the same query after a publish.

## The report

`LoadReport` counts what was added, changed and removed, for statuses, places, groups, memberships
and versions, and what was added, for obligations. A claim counts as a change. The startup line prints
all of it.

## What becomes false, and is corrected

- `load.ts`: its comments, and `ResearchRulesMismatch`, which nothing throws any more.
- `load-research-rules.ts`'s header and `docker-entrypoint.sh`'s comment, which say a differing
  version stops the start.
- `prisma/research/README.md`: "fill-only and append-only".
- `DESIGN.md`, "Time is the same machinery", and `PHASE-NEXT.md`, "An obligation's name can be
  edited; its history cannot": the research load writes what its file says, a change in the law is
  still a new version beside an ended one, and a correction or a down rewrites rows, with git the
  trace (the owner, 2026-09-15).
- The research spec's header.

`CLAUDE.md` is not touched.

## Files

`prisma/schema.prisma`; a migration, `prisma/migrations/<timestamp>_research_load_follows_its_files/`,
adding the four columns and replacing the three trigger functions inside one transaction;
`src/rules/research/rows.ts`, `src/rules/research/load.ts`, `src/load-research-rules.ts`,
`docker-entrypoint.sh`; `src/rules/rules.resolver.ts`, `rules.model.ts` and `rules.service.ts` for
`researchRows`, with `schema.gql` and the web's generated GraphQL types emitted again;
`test/research-rules.e2e.spec.ts`, `test/research-regions.e2e.spec.ts`; `prisma/research/README.md`,
`DESIGN.md` and `PHASE-NEXT.md`.

## What this card does not do

No script, no file per case and no commit format: SB-232. No rule says anything new: on the deployed
database every researched row already equals its file, so the first load there only claims rows, and
every answer stays as it is.

## The steps I am least sure of

1. **A rewritten version gets a new id.** Only its facts, texts and criteria reference a version, and
   they are rewritten with it; the API hands a version's id out per answer and stores it nowhere.
2. **The setting is a door any SQL can open**, like SB-081's own `skipbureau.new_versions`. The schema
   grants no privileges, so the triggers guard against mistakes in code, not against a holder of the
   database's password, and the owner's order is no guard.
3. **Prisma's interactive transaction must run every statement on one connection** for a
   transaction-local setting to hold, on PGlite and on Postgres through the pg adapter; the research
   lock already relies on the same.
4. **A mistake in a file now changes readers' answers on the next deploy** instead of stopping it. That
   is the order: the research corrects itself, and people report what is wrong.
5. **In the seeded spec, the seed's eight Länder are claimed and renamed** to the names Destatis
   prints, so the seed's "Bavaria" reads "Bayern" there. The deployed database never runs the seed.
6. **A migration that fails on the deployed database blocks every later deploy** until someone who can
   reach that database marks it rolled back, as above. It is one transaction, so nothing of it stands.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`:

- **the exit, in one test**: Turkey's file changed five ways at once, the national address duty for a
  residence permit holder ended on a date with its successor from that date, one of Bursa's versions
  dropped, a nationality dropped from the exempt group, Düzce dropped and Bursa renamed, is loaded; the
  rows Turkey owns are read back as that file says. Then Turkey's real file is loaded, which reopens
  the ended version, removes the successor and writes back what was dropped, and the rows are read
  back exactly as before the first load, apart from ids. A second load changes nothing;
- **a place whose child a rule names, moved**: Germany's file with a version that names Köln is
  loaded, then the same file with North Rhine-Westphalia put inside Bavaria, which only a step 1 that
  reads the tree below a moved place lets through, then Germany's real file, and the rows read back
  exactly as before;
- **the four tests that say a load stops** become the file followed and then undone: a membership
  dropped, ended or duplicated; `minimumCapital` changed to 60,000 and back; a status put inside
  another and back; Bursa put inside Kocaeli, renamed by an editor, and both back from the file. The
  misordered kind stays an error;
- **the first load's report** counts adds, and changes for the eight Länder the seed wrote; the Länder
  test reads Destatis's names; a second load and the seed run beside it change nothing;
- the Länder claimed: each of the sixteen is owned by `germany`, and a seeded region no file lists
  still has no owner;
- **the lock test** also reads `skipbureau.research_load` as `on` inside the load's transaction, and
  not `on` on the same connection once it has committed, so the exception ends with the transaction;
- **`researchRows`**, after the first load, reads each file's own counts of versions, places, statuses
  and groups, and a seeded region no file lists is in none of them.

In `test/research-regions.e2e.spec.ts`, on a database the seed never touched, the second load changes
nothing.

Then planted faults, each watched failing: the load not setting `skipbureau.research_load`, the
removal skipping places, the claim left out, versions compared without their end, and the versions
left standing until after statuses and places are written, which the move of Bursa under Kocaeli and
of the residence permit status inside another, each named by the address duty's versions, then
refuse, and a step 1 that reads only the places moved themselves and not what is inside them, which
the move of North Rhine-Westphalia then refuses. Then the full
API suite outside 23:00 to 00:00 UTC (SB-219), lint and `lint:tsc`, the build, `schema:emit` leaving
`schema.gql` as it is, and the compiled loader run twice on a fresh database through the entrypoint's
steps, the second run changing nothing. After the push, the deployed API's `researchRows`
reads Turkey's and Germany's counts, which only the new build can answer and only after its first
load, and the deployed API answers every researched rule as before: each of Turkey's 19 versions as
the reader it reaches, with its facts on their pages, Germany's four, and every place accepted. If
`researchRows` never arrives, the migration is the first thing looked at, and the owner gets the
command above.
