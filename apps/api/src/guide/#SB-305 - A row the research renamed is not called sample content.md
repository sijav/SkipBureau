# SB-305, a row the research renamed is not called sample content

**Exit:** a researched guide or area whose slug the research changes leaves no row
behind, or is not reported as sample, proven by a test that loads the guides
twice with a renamed slug.

This plan lives in `apps/api/src/guide/` because the loader and the service
receive most of the work. It also touches `apps/api/prisma/` (schema and one
migration) and `apps/api/test/`.

## What was there before this card

Past tense throughout, and the line numbers are the ones this card changed: the key sets and the
`RESEARCHED_GUIDES` import are gone from `guide.service.ts` now, so the citations below point at what those
lines held when the card was picked up, not at what is there today.

- **`loadResearchedGuides`, `researched-guides.ts` lines 1112 to 1149, only ever
  writes.** It iterates the guides it is handed, upserts the goal and its texts,
  runs `writeGuide` in a transaction per guide, and returns the keys it wrote.
  Nothing reads the database to find rows the list no longer names.
- **Its own doc comment says otherwise, and that is probably why this survived.**
  It opens: "owned as a research module's rules are (SB-202, SB-261): every start
  writes the guide, its area and its links to exactly what the file says and
  removes what the file does not list". That is **true within a guide**, where
  lines 1184 to 1245 reconcile texts, sections, steps, options, related guides,
  sources and obligations, and **false across guides**. A guide whose key left
  `RESEARCHED_GUIDES` is never visited, so nothing removes it. The comment claims
  set level ownership and delivers row level ownership.
- **`sample` is derived by absence.** `guide.service.ts` lines 61 to 64 build
  `RESEARCHED_GUIDE_KEYS` and `RESEARCHED_AREA_KEYS` from `RESEARCHED_GUIDES`, and
  `sampleGuide`/`sampleArea` are `!KEYS.has(...)`. So the moment a slug leaves the
  research, the row it left behind starts being reported as sample content, which
  is stale research being labelled design filler.
- **The precedent the card names exists and cannot be copied as it stands.**
  `rules/research/load.ts` line 164 builds `owners` from the research files, and
  line 326 is
  `deleteMany({ where: { research: { in: [...owners] }, code: { notIn: [...listedGroups] } } })`.
  That is exactly the right shape, and it works **because `NationalityGroup` has a
  `research` column**. `Guide` (schema lines 298 to 320) and `Category` (lines 256
  to 274) have no such column.
- **So the naive version is data loss, not a fix.** Without an owner column, the
  only available filter is the country, and
  `deleteMany({ countryCode, slug: { notIn: researchedSlugs } })` would delete
  every sample filler row and every admin written row in that country.
- **The two writers already know they can collide, in code only.**
  `sample-content.ts` lines 389 to 394: `retireSample` computes the researched
  slug set for the country and **throws** rather than delete if the retirement
  list names one of them. That knowledge lives in a function, never in the data.

## Two routes, and why this takes the column

**The cheap route exists.** `TURKEY_SAMPLE_SLUGS` (line 346) and
`GERMANY_SAMPLE_SLUGS` (line 377) are static exported constants, already curated
against the loader: Turkey's comment says "less register-your-address, whose row
the researched loader owns (SB-281)", Germany's says "the area only, since the
researched loader owns the anmeldung guide's row". So `sample` could be derived
from **presence in the filler's list** instead of **absence from the research**,
the row left behind would stop being called sample, and the exit's second clause
would be met with no migration at all.

**It is the wrong route, because of which way it fails.** Today an unrecognised
row is reported as **sample**, which understates what the product knows. Inverted,
an unrecognised row would be reported as **researched**, which overstates it. A
filler row added and not listed, or a row an admin creates, would carry the
verified claim without having been verified. CLAUDE.md makes the verified date
and its source the sharpest advantage this product has over what a search engine
already finds, so a provenance derivation that fails towards "trust me" is worse
than the mislabelling being fixed. The current derivation at least fails safe.

**So: `research String?` on `Guide` and on `Category`**, written by the loader,
and the derivation reads the row rather than a key set. That is the card's second
option, "provenance stops being derived", and it also lets the loader reconcile
the way the rules loader does, which is the first option. Both halves of the exit
come from the same change rather than one being chosen over the other.

The column is not invented for this. The schema already carries exactly this
field four times, with the same doc sentence each time: `RuleVersion.research`
(line 89), `NationalityGroup.research` (line 185), `Region.research` (line 560),
`ResidenceStatus.research` (line 595), each "The research file that lists this X
and keeps it as that file says, or null (SB-202)".

## The approach

**1. Schema.** `research String?` on `Guide` and on `Category`, carrying the doc
sentence the other four already carry. No file path in it, and the reason first given here was wrong. This plan said no
`research/` directory exists in the working tree; it does, at
`apps/api/prisma/research/agreed`, and the claim came from a search run only three
levels deep from the repository root. The decision stands on its own ground
instead: the four columns this one copies name no path either, and a schema
comment that hardcodes a directory would go stale the first time the research
files move.

**2. The owner is named `turkey` or `germany`, not `tr` or `de`.** That
vocabulary is in use: `research-rules.e2e.spec.ts` line 437 writes
`research: 'germany'`, line 1378 reads `ruleVersion: { research: 'turkey' }`, and
`rules.service.ts` lines 48 to 58 aggregate every owned table by that value.
`ResearchedGuide` has `country` and no owner at all, which the plan check named
as the gap, so the type gains `research: string` and each of the ten entries
states it. Deriving it from the country code would invent a second vocabulary for
the same idea and silently diverge the first time a country has two research
files.

**3. Migration.** One timestamp prefixed directory under
`apps/api/prisma/migrations/` holding `migration.sql` only, wrapped the way
`20260915110000_research_load_receipt/migration.sql` is: `BEGIN;`,
`SET LOCAL lock_timeout = '30s';`, `COMMIT;`. Two nullable
`ADD COLUMN "research" TEXT`. **No backfill**, for the reason established below.

**4. The loader stamps.** `research` joins `areaRow` and `guideRow` in
`writeGuide`. Both are spread into the `update:` and the `create:` of their
upserts, so the first load after this ships stamps every row the research
currently names, not only rows it creates.

**5. Reconciliation is opt in, and only the production path opts in.** This is
the plan check's first correction and it is a data loss bug caught before it was
written. `loadResearchedGuides(prisma, guides)` is deliberately called with one
guide subsets: `researched-guides.e2e.spec.ts` lines 341, 349, 365 and 371 pass
`[twice]`, `[one]` and `[other]`, each inside a `try` whose `finally` reloads the
full set. A cleanup that ran "per country it wrote" would read a one guide subset
as that country's whole manifest and delete the other five Turkish rows. So the
signature gains an explicit option, off by default, and the only caller that
passes it is `load-researched-guides.ts`, the production entry point that already
calls with no subset. Partial loads stay write only, by construction rather than
by convention.

**6. Delete guides before categories, and never rely on "untouched".** The plan
check's third correction, and it corrects a false claim this plan made. An earlier
draft said rows with a null `research` are untouched by construction. They are
not: `Guide.categoryId` is `onDelete: SetNull` (schema line 312), so deleting an
owned `Category` does not skip an unowned guide inside it, it silently
uncategorises it. So the reconcile deletes owned guides first, then owned
categories, and an unowned guide found inside an owned category is a refusal with
a named row rather than a silent orphaning.

**7. The derivation reads the row.** `sampleGuide` and `sampleArea` stop
consulting `RESEARCHED_GUIDE_KEYS` and `RESEARCHED_AREA_KEYS` and report on the
row's own `research` being null. The two key sets then have no reader and go.

## What production says, rather than what I assumed

The check said to query production before deciding anything about existing rows.
Both queries were run against the live API and both came back clean.

- **Stale rows: zero.** The research names six Turkish and four German guides and
  areas; the live API serves exactly those sets, with no slug live that the
  research does not name and none named that is not live. Every retired sample
  slug is gone, `sim-card` and `first-week` included. So there is nothing to
  backfill and nothing to clean up, and the migration adds no data step.
- **Unowned guides inside researched areas: zero.** Each of the ten researched
  areas holds exactly one guide, its own. So step 6's ordering is not repairing
  anything that exists today. It stays because the shape is reachable: the sample
  filler wrote guides into categories, and SB-011's admin panel will let a person
  do the same.

Both are snapshots of the deployed database, not proofs about every database. The
queries are two GraphQL requests and can be rerun.

## How it is proved

The exit asks for a test that loads the guides twice with a renamed slug. Per the
check, it asserts four things rather than one: the old guide row is gone, the old
area row is gone, the renamed replacements exist with the owner stamped, and the
researched rows the rename did not touch are still there. That last one is what
separates a working reconcile from a destructive one.

The rename test loads a **full** copy of the manifest with one slug changed, with
reconciliation on, because a subset with reconciliation on is exactly the data
loss case step 5 exists to prevent.

## The step I am least sure of, now

**The rename test is the one caller besides production that turns reconciliation
on, so it is the one place a mistake deletes real rows.** If its renamed copy is
built by editing a clone of `RESEARCHED_GUIDES` and anything drops an entry, the
reconcile deletes whatever the copy no longer names, and the failure looks like a
passing test plus a quieter database. It needs to build the copy by mapping over
the full manifest rather than by listing entries, and to assert the untouched
rows survive, which is the fourth assertion above and the reason it is there.

The legacy question this section used to hold is answered: production has no stale
row, so no backfill and no one off cleanup are in scope.
