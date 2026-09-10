# SB-080: countries come from the API, not from a hardcoded table

Revised after the plan check, which found that the proof I described was
impossible. Re-pointed from 2 to 5 because of what it exposed. Not
re-checking: every change is an adoption of what it prescribed.

**Exit condition.** Inserting a country row and nothing else makes `/en/<code>`
render, and removing the row makes it Not Found again, with no file edited.

## What the check changed

**`network-only`, not `cache-and-network`.** urql defaults to `cache-first`,
and `cache-and-network` would still paint a cached, deleted country before the
network answer replaced it with Not Found. `network-only` costs one small
request when `CountryRoute` mounts or its country changes, not on every child
navigation while the parent stays mounted.

**A network error is an error, never Not Found.** The same distinction SB-100
is open for on `CountryName`, applied here before the mistake is repeated: "we
could not reach the API" and "we do not cover this country" are different facts
and a reader acts differently on each.

**The proof I described cannot be run.** The API exposes `country` and
`countries` queries and no mutation, so nothing can "insert through the API".
Insert and delete go through the test database, and the browse goes through a
running API and a real browser. The web's Playwright config starts Vite and
**not** the API, so this task has to build that harness. SB-052 will want the
same one.

**Keep some type safety.** `Country` stops being a literal union, but not by
becoming bare `string`: a branded `CountryCode`, minted only where
`CountryRoute` receives a non-null API result. URL params and GraphQL variables
stay strings; route context and path builders take the branded value. That
stops a locale or a slug being passed where a validated country belongs,
without pretending the set is known at build time.

**`defaultCountry` stays, as an explicit product default rather than a
registry**, and `/` has to cope with that row being gone.

**Prerendering is fine** provided SB-076's renderer resolves the guard query
before emitting HTML, or uses `ssrExchange`.

## The test, stated the way the check sharpened it

The trap is testing deletion after a reload, or only against MSW. That proves a
fresh client sees the deletion, not that the guard avoids stale memory. So:
**one browser, kept alive.** Browse the country, delete the row from the
database, navigate away and back, and assert Not Found without a reload.

## What I will build

1. `apps/web/e2e/api-server.mjs`: PGlite, migrations, seed, and the built API,
   started for Playwright. Modelled on the script already used by hand.
2. `playwright.config.ts`: a project whose `webServer` runs it, with the web
   app built against that API's URL.
3. `countries.ts`: the table gone; a branded `CountryCode`, a `defaultCountry`,
   and a mint function.
4. `CountryQuery` in `documents.ts`, MSW handlers for it.
5. `CountryRoute`: the guard query, `network-only`, with pending, error and
   null states each distinct.
6. `CountryName` reads the one country instead of the whole list.
7. Stories for pending, unknown and failed; the Playwright test above.

## Where I am least sure now

Whether the Playwright harness belongs in this card at all. It is
infrastructure two other cards need, and building it here means this card
carries the cost while SB-052 gets it free. The argument for doing it here is
that the exit condition is not provable without it and I would otherwise be
closing the card on a weaker proof, which is the thing the last several
iterations keep catching.
