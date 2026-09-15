# SB-282, Turkey's sample rows deleted from the deployed database, and the filler no longer makes them

**Exit:** the live API returns no Turkish category, guide or question that is not written from
agreed/turkey, /en/TR/guides/sim-card is Not Found, Home shows no common questions for Turkey, and the
API tests and the web e2e suites pass on researched guides.

The owner, 2026-09-15, asked what happens to Turkey's sample rows on the live database, answered
**Delete all of them**: every Turkish sample guide, area, hub text and common question is deleted and
never refilled; goals with no researched guide show Coming soon; Home shows no common questions until
researched ones exist; Germany's sample gets the same in SB-198.

## What is Turkish sample content today

`apps/api/src/sample-content.ts`, which the entrypoint runs on every start, fills for Turkey:

- **Areas:** `first-week` (Getting Settled, with its start guide, reason, ask prompt, checklist and
  related goals) and the nine areas of Start a business (`choose-a-company-type` to
  `startup-and-tech-visa-programmes`).
- **Guides:** the six of Getting Settled (`sim-card` with the whole body of `sample-sim-card.ts`,
  `register-your-phone`, `home-internet`, `utilities`, `turkish-address`, `essential-apps`) and the six of
  Start a business (`company-types` to `accounting-basics`). `register-your-address` was one, and SB-281's
  researched loader has taken its row over.
- **Questions:** Home's four, `company-without-residence` to `residence-by-buying-a-house`.

The goals and their hub copy are global, not Turkish: they stay, as PHASE-NEXT.md already says of the
twelve goals.

## The change

1. **Production stops filling Turkey.** `COUNTRIES` in `src/sample-content.ts` keeps only Germany, and
   `seedContent(prisma, countries = COUNTRIES)` takes the countries to fill.
2. **Turkey's sample becomes a test fixture.** Its definition, with the SIM card's body, moves to
   `apps/api/prisma/sample-turkey.ts`, beside `prisma/seed.ts`, which production never runs and
   `nest build` never compiles. `prisma/seed.ts` fills it with Germany's, so the API tests, which seed
   through it, and the e2e and local databases keep the Persian guide text and the steps the tests assert,
   and the three API tests that call `seedContent` themselves pass it the same way. The seed's types are
   exported from `src/sample-content.ts`, and since `prisma/` is outside the API's TypeScript project, a
   small no-emit project type-checks `prisma/` in the API's `lint:tsc`, so the moved fixture is checked
   like the rest.
3. **The deployed rows are retired.** A function in `src/sample-content.ts`, run by its entry after the
   fill and so on every start, deletes Turkey's sample rows by an explicit list of their slugs: the twelve
   guides, the ten areas (their texts, checklist and related goals go with them) and the four questions.
   It runs as one interactive transaction: it first refuses if any slug on its lists is a researched
   guide's or area's slug in `RESEARCHED_GUIDES`, so it can never delete what the research wrote, then
   deletes the questions, then the guides, then the areas, all through the transaction, so a failed start
   leaves the database as it was. Every start after the first finds nothing to delete.
4. **A suggestion on a sample guide goes with it.** A proposal belongs to its guide with `onDelete:
   Cascade`, so deleting a guide deletes the visitors' suggestions on it, and nothing here can see whether
   the live database holds any. The owner, asked on 2026-09-15, answered **Delete them with the guides**:
   they are suggestions about sample text being removed as unchecked, so they go with it, and no sample
   guide stays live. A suggestion on any other guide is untouched.
5. **The web e2e specs prove the live site on researched guides.** In `e2e/pages.spec.ts` and
   `e2e/phone.spec.ts`, what the live site can show moves from the SIM card and Getting Settled to Turkey's
   short-term residence permit guide and its goal, which exist in both the e2e build and the live site: a
   guide's file answering 200, its head, canonical and body, its route, a hub and an area, and its Last
   verified. What only a guide with steps or with Persian text can prove, the HowTo block, `og:locale:alternate`
   fa_IR and the sitemap's Persian alternate, stays on the SIM card guide the e2e seed still fills, in tests
   that say they need that fixture and are skipped when the spec runs against the live site.
6. PHASE-NEXT.md's sample content section says Turkey's sample was retired on the owner's answer, and
   Germany's remains until SB-198.

## How it is checked

- An API test on a database with Turkey's sample, the research and the researched guides loaded, and a
  suggestion on a sample guide and on a researched one: the retirement leaves no Turkish sample guide, area
  or question and no suggestion on them, leaves every researched guide and area with its suggestion and
  Germany's sample, and deletes nothing on a second run. Watched failing with the retirement deleting
  Turkey's guides by country instead of by its lists.
- The retirement refuses a list naming a researched slug, watched failing with `register-your-address`
  added to it.
- The API's lint, type check and full suite; the web e2e run against its known dev failures (SB-268).
- Pushed: the live API's Turkish areas, guides and questions, read back in full, are exactly the
  researched set, so nothing outside the sample list survives either; /en/TR/guides/sim-card is Not Found;
  Home shows no common questions for Turkey; the pages spec passes against the live site.

Checked on 2026-09-15 and not approved as first written. The check found the fixture move sound at run
time and asked that `prisma/` be type-checked, the retirement be one transaction in the order questions,
guides, areas, the SIM card assertions that need steps or Persian stay on the test fixture rather than be
rewritten, and the live check read back every Turkish slug rather than only the listed ones; all taken. It
also found that keeping a sample guide because it holds a suggestion contradicts the exit, and that the
choice between deleting such suggestions and keeping them is the owner's. The owner answered Delete them
with the guides, and that choice, which the check itself named, is what the plan now says, so it is not
checked again.
