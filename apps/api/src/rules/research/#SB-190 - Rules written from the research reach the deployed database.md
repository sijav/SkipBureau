# SB-190, Rules written from the research reach the deployed database

**Exit:** on the deployed API, Turkey's limited company formation answers with
its minimum capital, payment period, formation fee exemption and levy, each fact
naming the page that states it, a second deploy adds nothing, and a fact whose
label is calculated or missing fails the test.

## Why

The owner's order of 2026-09-12, recorded in CLAUDE.md: every rule is
researched through GPT, "not written from memory", and "every fact carries an
official source URL and the date it was checked". Turkey's research is agreed
and SB-182 tied every figure in it to the page that states it, but none of it
reaches a reader. `docker-entrypoint.sh` runs `bootstrap` and `sample-content`
only. `seed.ts`, which holds rules, never runs on the deployed database, and its
rules are samples.

`bootstrap.ts` says obligations and rule versions stay out "until an editor has
approved them, which is what the moderation queue is for". That was written
before the research process existed. The agreed document, argued to a fixed
point and with every figure tied to a verified page, is the approval a
researched rule has; the moderation queue, SB-011, is for visitors' proposals
and is not built. So researched rows go onto the deployed database, and nothing
else does. `bootstrap.ts`'s comment is corrected to say so.

This card is the path, proven on the one document whose figures need nothing
else: forming a limited company applies to anyone who forms one, so it needs no
residence status (SB-189) and no place. SB-191 to SB-196 then add documents
through the same path.

## What stays exactly as it is

- **`bootstrap` stays countries only**, and `sample-content` stays as it is
  until SB-197 and SB-199 replace it.
- **`seed.ts` stays the tests' sample data**, and still never runs on the
  deployed database.
- **History stays append-only.** The loader never updates or deletes a version,
  a fact, a criterion or a text. A changed rule is a new version with a later
  `validFrom`, which the history triggers already require.
- **SB-188's per-fact source is how a fact names its page**, and SB-186's
  inheritance and SB-176's questions are untouched.

## The change

**The rows live in TypeScript, under `src/rules/research/`.** One module per
country, `turkey.ts`, holding the obligations its rules introduce (slug, kind,
titles), the sources they cite (research label, URL, a short name, the day it was
read) and the versions (obligation, criteria, `validFrom`, the version's own
source, facts each with its source, notes). The card said beside the migrations;
it is not, because the image carries `dist/` and `prisma/` and not `src/`,
`nest build` compiles only `src/`, and `.dockerignore` keeps every `.md` out of
the image, so the research itself cannot be read in production. A typed module is
compiled with the loader and checked against Prisma's enums.

**The loader, `src/rules/research/load.ts`, fill-only and append-only**, run on
every start by `src/load-research-rules.ts`, which the entrypoint calls after
`bootstrap` and before `sample-content`, so a sample guide naming an obligation
the loader created can link to it:

- an obligation that is missing is created, and its titles are filled in without
  overwriting an editor's;
- a version is identified by its country, obligation, criteria set and
  `validFrom`. Missing, it is created with its criteria, facts, each fact's own
  source, and its notes. Present and identical to the file, it is left alone.
  Present and different, the loader stops with a message naming the version and
  saying that a changed rule is a new version: the deployed database must never
  quietly hold something other than what the repository says;
- **the whole load is one transaction that takes a transaction-level advisory
  lock, `skipbureau_research_rules`, before it reads anything.** The clash
  trigger compares the rows it can see, which is not a lock: two containers
  starting together could each find a version missing and each create it, and
  two identical versions would later answer as a tie. With the lock the second
  waits, then finds every version present and identical, and leaves them. The
  key is an integer, `pg_advisory_xact_lock(hashtext('skipbureau_research_rules'))`,
  since PostgreSQL has no text key. The transaction gets an explicit timeout,
  where Prisma's interactive transactions default to five seconds, and Prisma's
  timeout counts the whole callback, the wait for the lock included. So the
  bound covers a start that waits behind one other container's full load and
  then does its own: 120 seconds, twice a full load's worst case plus a wide
  margin for a remote database, for Northflank's rollout of one new container at
  a time. A full load is a few seconds today, and the test logs how long one
  takes, so the bound is measured again as documents are added. An error from
  it says it was the startup load of researched rules that ran out of time. The
  work is a function taking the transaction's client, so the test can run it
  inside a transaction of its own and read the lock from `pg_locks` before it
  ends.

**The first document, `agreed/turkey/company-formation.md`**: one national
version of a new obligation, `form-a-limited-company`, of kind `registration`,
in force from 2026-09-14, the day its footnotes were read. That is the care
insurance rule's precedent in `seed.ts`: a version dated earlier would answer a
question about an earlier year with a figure nobody checked.

| key | operator | value | the fact's page, by research label |
|---|---|---|---|
| `minimumCapital` | atLeast | 50,000 TRY | `ticaret-limited-50000` |
| `cashCapitalPaidWithin` | within | 24 months after registration | `ttk-585-1-limited` with `ttk-344-1-twenty-four-months` |
| `formationFee` | none | | `law492-123-formation-exempt` |
| `competitionLevy` | equals | 0.04 percent of the subscribed capital | `law4054-39-c-levy` |

The version's own source is the Turkish Commercial Code, `ttk-585-1-limited`'s
page, since what the version itself states is that forming a limited company
is this obligation, nationally. The chambers' own charges stay out: they follow
where a company registers, not where its founder lives, which is SB-177.

**How a fact's page is chosen**, SB-169's rule for one fact, in order:

1. a definition in the same agreed document, verified, never calculated, and
   never a superseded edition;
2. a page whose own scope covers the fact's: a national fact is cited to a
   national page, never to one city's chamber, which is the defect SB-174's
   review filed as SB-184 and SB-185, a page narrower than its sentence;
3. a page whose evidence states the whole fact on that one page, and among
   those, the one that states the fact itself rather than a change to it or a
   clause of a longer list;

never by marker order, and never by which page looks more official. Applied:
the minimum capital is the Ministry of Trade's page, which states the current
50,000 for a limited company, where Article 580 states 10,000 with a note raising
it and decision 7887 states the raise; the twenty-four months are the Commercial
Code, whose one PDF states it across Articles 585 and 344, so both labels share
one URL and one source, where İstanbul's chamber is narrower than the national
fact; the formation fee's exemption is Law 492, Article 123, and the levy is Law
4054, Article 39(c), each national where İstanbul's chamber is not.

**The research README gains a short section**: agreed figures reach the
database through `src/rules/research`, with the selection rule above.

## Files

`src/rules/research/turkey.ts`, `src/rules/research/load.ts`, both new;
`src/load-research-rules.ts`, new; `docker-entrypoint.sh`; `src/bootstrap.ts`,
its comment; a new `test/research-rules.e2e.spec.ts`; and
`prisma/research/README.md`. No schema change and no migration.

## What this card does not do

It writes no other document's rules, which are SB-191 to SB-196. It does not
close a superseded version, since nothing is superseded yet. The first changed
rule will need the loader to close its predecessor from its successor's date,
and until then any correction to a deployed rule stops every later deploy, so
that path is its own card, filed with this plan.
It shows nothing new on a screen, and it does not remove sample content.

## The step I am least sure of

**The page-scope rule.** SB-169 forbids choosing by marker order or by how
official a page looks, and says nothing about a fact that two correct pages
state. Ruling out a city chamber's page for a national fact follows SB-174's own
finding, but it sets aside İstanbul's chamber pages where they state a fact most
plainly, and a reader is sent to a statute PDF instead.

And **stopping the start on a changed version.** The entrypoint runs with
`set -e`, so a data file that contradicts a deployed version fails that deploy,
and the previous container keeps serving. That is loud on purpose, since the
alternative is a deployed database that silently differs from the repository,
but it means a careless edit to a started version blocks every later deploy
until it becomes a new version.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`:

- every source in `turkey.ts` is a definition in `agreed/turkey/<document>.md`
  with `status` verified, the same URL and the same read date, and every version
  and fact names one, so a calculated, unverified or missing label fails;
- after loading, `move` from Germany to Turkey answers `form-a-limited-company`
  with its four facts, each with its own page's URL, name and read date;
- loading a second time adds no obligation, version, fact, criterion or text;
- a stored version that differs from the file stops the loader, and nothing is
  written;
- the load, run inside a transaction the test holds open, holds the
  `skipbureau_research_rules` advisory lock when it returns, read from
  `pg_locks`. PGlite runs one session, so this shows the lock taken, not two
  starts waiting on each other;
- the seed and the loader run together without a clash.

Then planted faults: a calculated label and a missing label, each watched failing
the label test, the identity check removed, watched failing the second load, and
the lock removed, watched failing the lock test.
Then the full API suite, lint and `lint:tsc`, and the build. After the push, the
deployed API answers the four facts with their pages, and the next deploy that
touches the API answers them from the same version id.
