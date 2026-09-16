# SB-301, Germany's sample rows are deleted from the deployed database, and the filler no longer makes them

**Exit:** no German sample area or guide remains on the deployed database, the entrypoint creates none, and every test
that used them runs on the fixture.

The owner, 2026-09-15, asked what happens to Turkey's sample rows and answered **Delete all of them**, adding that
Germany's sample gets the same. SB-282 did Turkey. This does Germany, and it is the last of it: after this the filler
fills nothing on the deployed database.

## What Germany's sample is today

`apps/api/src/sample-content.ts` fills two rows for Germany on every start:

- the area **`first-week`**, Getting Settled, with the old title `WAS_FIRST_WEEK` for a database that still holds it;
- the guide **`anmeldung`**, Register your address, with a quick answer, a cost, a time, two sections, an option and a
  source, English only on purpose (SB-049).

**The guide's row is not sample content any more.** SB-299's researched loader owns it: it rewrites that row in place,
nulls the sample quick answer, cost and time, and moves it into the researched `anmeldung` area. So Germany's retired
list names **the area only**. Naming the guide would delete a researched guide, and `retireSample` refuses a list that
names one, which is the guard SB-282 built for exactly this.

## The change

1. **The fixture moves.** `apps/api/prisma/sample-germany.ts` exports `GERMANY_SAMPLE`, the `CountrySeed` moved
   verbatim, importing `WAS_FIRST_WEEK`, `ADDRESS_GUIDE` and the types from `src/`, as `prisma/sample-turkey.ts` does.
   `prisma/` is outside the API's build, so production never compiles it.
2. **Production creates no sample country content.** `COUNTRIES` in `src/sample-content.ts` becomes empty, with the
   comment saying both countries' samples are fixtures now and what the file is still for. `seedContent` is not a
   no-op even so, and the check caught this being said wrongly: it still writes the global goals and their text
   from `TASKS`, which bootstrap does not, so the call stays and the entrypoint's line, which says it retires
   Turkey's, is corrected to say what it now does for both countries. `seedContent` keeps its parameter, so the
   tests and the seed pass their fixtures in.
3. **The deployed rows are retired.** `GERMANY_SAMPLE_SLUGS = { guides: [], areas: ['first-week'], questions: [] }`,
   and `main()` retires `de` after `tr`, in the same shape, so every start after the first finds nothing to delete.
4. **The seed fills both fixtures.** `prisma/seed.ts` seeds `[TURKEY_SAMPLE, GERMANY_SAMPLE]`, and the two tests that
   call `seedContent` themselves, `guide.e2e.spec.ts` and `research-rules.e2e.spec.ts`, pass the same pair. Those
   tests keep what they assert: `guide.e2e` reads Germany's sample quick answer and its missing Persian, which only the
   fixture has.
5. **PHASE-NEXT.md** says Germany's sample was retired here, in place of saying it waits for SB-198, which stays the
   proof card.

## What the web keeps

The web e2e's German tests are the **researched** guide's, not the sample's: `/en/DE/guides/anmeldung` carries the
rules that apply, two weeks, the €1,000 fine, § 17 and Hamburg's €16 fee, all from the research. Nothing there reads
the sample row, and no e2e opens the `first-week` area. The web's mocks name `first-week` for **Turkey**, in fixtures
of their own, untouched.

## How it is checked

- `test/retire-sample.e2e.spec.ts` gains Germany beside Turkey: the list is the fixture's areas, and its guides are
  empty because the loader owns the one guide; a list naming `anmeldung` is refused and deletes nothing; the
  retirement deletes the `first-week` area and leaves the researched `anmeldung` guide, its area and the other two
  German areas standing; a second run deletes nothing. Watched failing with `anmeldung` in the guides list, and with
  the retirement deleting by country rather than by the list.
- **The order a deployed database actually goes through**, which the check asked for and the test above does not
  prove, since it starts after the loader has moved the row: seed the old German sample, retire `first-week`, and
  only then load the researched guides. The same `anmeldung` row survives, carries no sample quick answer, cost or
  time, and sits in the researched area. `Guide.categoryId` is `onDelete: SetNull`, so the guide is briefly
  uncategorised rather than deleted, and `set -e` in the entrypoint means nothing is served until the loader has
  run.
- The API's lint, type checker and full suite.
- Pushed: the live API's German areas and guides, read back in full, are exactly the three researched areas and their
  guides, `/en/DE/tasks/getting-settled` shows the researched area and no Getting Settled sample area, and
  `/en/DE/guides/anmeldung` still answers 200 with its rules.

## Checked on 2026-09-16

Approved, with two corrections, both taken. The plan said production would fill nothing, which is wrong:
`seedContent` still writes the global goals from `TASKS`, so the call stays and the wording above says what it
does. And the retirement test as planned starts after the researched loader has already moved the Anmeldung row,
so it cannot prove the ordering most likely to regress; the legacy sequence is now its own case above. The check
also established what the plan only assumed: `Guide.categoryId` is `onDelete: SetNull`, so deleting the area
cannot take the guide with it, and no browser e2e opens Germany's `first-week`. This round is not re-run, since
both changes are the round's own instructions.

## What I am least sure of

- Whether `sample-content.ts` is still the right name for a module that fills the global goals and retires two
  countries' sample rows. The check called renaming it unrelated churn, and it is, but the name now describes the
  smaller half of what the file does.
- Whether Germany's Getting Settled goal reads well once `first-week` goes: it keeps the researched `anmeldung` area,
  so the goal is not empty, but its hub copy was written when a sample area sat beside it.
- Whether any live address points at `/DE/tasks/getting-settled/first-week`, which will become Not Found. Nothing in
  the repository links it, and the sitemap is generated from the API, so it stops listing it on the next build.
