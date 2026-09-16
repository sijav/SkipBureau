# SB-313, a reader can say where they work, which is not where they live

**Exit:** on the live site, a reader who chooses their work place in the context panel sees the Berlin trade
registration fee on the business registration guide when they choose Berlin, and Saxony's care insurance split on the
health insurance guide when they choose Saxony, in en and fa, with the choice made through the panel rather than typed
into the address.

Germany's research keys two rules to where the reader **works**: the trade registration fee follows where the business
is established, and Saxony's care insurance split follows the place of employment, which its own note says plainly is
not the home address. The API already answers them. Asked with nothing given it says `needsDetail: ["workRegion"]`;
asked with `workRegions: ["DE-SN"]` it answers in full. The product has no way to be told, so both cards say **Where
you work** and, since SB-300, that the detail cannot be taken yet.

## What exists

- `Journey` in `src/core/router/paths.ts` is `{ country, place, status, situation }` plus the reader's nationality.
  The **place is a path segment**, `DE-HH`, because it is where the reader is going; **status and situation are query
  parameters**, written by `searchWith(search, key, value)` and read by their own `…FromSearch` readers (SB-256,
  SB-286).
- The context panel has rows a reader can answer: Nationality, Currently in, City in {country}, Residence status and
  Role. Its options come from `ReaderDetailsQuery`, whose `places` list is the country's regions, nested.
- `Guide.tsx` builds the reader it asks with, sends `residenceRegions`, `residenceStatuses`, `situation` and
  `nationality`, and never `workRegions`, though the generated `ReaderInput` has it.
- `canBeGiven` in `Guide.tsx` names `workRegion` as the one detail the panel cannot take, so those cards show no
  **Tell us** button (SB-300). That exception is what this card removes.

## The change

1. **The journey carries a work place.** `Journey` gains `work: string | null`, read from `?work=` by
   `workFromSearch`, written by `searchWith(search, 'work', value)` and `samePageAtWork(address, code)`, exactly as
   SB-286 did for the role. It is a **query parameter, not a path segment**: the path says where the reader is going,
   and where they work is a detail about them, like their status. The prerender and the sitemap keep only the plain
   guide address and the canonical omits `work`, which is what the check confirmed is right for a search engine.
2. **It is a country-scoped detail like the others, everywhere.** This is the part that is easy to half-do, and the
   check named every place it has to reach: parsed after hydration, counted in `ReaderDetailsQuery`'s pause condition,
   **validated in `CountryRoute`** so an unknown code is Not Found as an unknown status already is, carried through
   `AddressShell`, the country provider and `useJourney`, written into every generated link, and **dropped when the
   reader clears their details or changes country**, so `?work=DE-BE` cannot survive a move to Turkey.
3. **The panel gains a row.** `Where you work` sits under City in {country}, drawing the same nested `places` options:
   a city answers a rule keyed to its state, and Berlin, Hamburg, Saxony and `DE-NW.koeln` all come from that one
   list, so no matching logic of its own is needed. The shell carries `work` and `onWork` beside `place`.
4. **The guide asks with it.** `Guide.tsx` sends `workRegions: [journey.work]` where the reader has one, and
   `canBeGiven` goes, so a card needing `workRegion` offers **Tell us** like any other.
5. **The words.** The row's label is the question's own words, `Where you work`, as SB-286 made Role match. Persian
   goes into `fa.po` by hand, as SB-300's thirty did.

## How it is checked

- `paths.test.ts`: `?work=` is read into the journey, written into a link, kept beside a status and a role, dropped by
  Clear all and by a change of country, and stripped by the canonical address, with a planted failure for each.
- `CountryRoute`'s test: a work place the country does not have is Not Found, as an unknown status is.
- The context panel's story shows the row and chooses a place in it, and `YourDetails`'s story shows it filled.
- **The web e2e chooses it through the panel**, which the check insisted on: open the business registration guide,
  press Tell us on the trade fee card, choose Berlin in Where you work, and find the address carrying `?work=DE-BE`
  and the card showing €26. A deep link would prove the resolver and hide a broken picker.
- Live, in en and fa: the same two journeys, and the Saxon 2.3% employee share where the national page shows 1.8%.

## Checked on 2026-09-16, and revised

The check called the shape right and refused the exit as written, for a reason worth keeping: **Dresden is not a place
the picker can offer.** Germany's stored places are its states and the few cities the research names, so the Saxon
rule is answered by choosing **Saxony**, and the exit now says that rather than a city the reader cannot pick. Adding
Dresden would be research data nobody needs for a state-wide rule.

It also refused the plan's silence on propagation: `work` must go everywhere the other country-scoped details go,
listed above, or a link carrying it survives a change of country and an unknown code reaches the API instead of Not
Found. And it moved the live proof into the panel: choosing through the row is what proves the picker, the journey and
Clear all, where a deep link proves only the resolver.

One correction to the plan's own facts: the `Detail` enum is in `apps/api/src/rules/eligibility.ts`, not `diff.ts`.
After this card every detail the API can ask for has a row; a sixth would fail the type check of the guide's label
map, which is a compile error rather than a silent gap, but it would still not create a row by itself.

## What I am least sure of

- Whether a reader who says only where they work, and not where they live, is a state the panel reads as sensible, or
  whether the two rows should be visibly related.
- Whether `work` is the right query name beside `status` and `situation`, or whether it should be `workplace`, which
  is longer but cannot be read as a yes or no.
- Whether six rows is where the panel stops being a panel and starts being a form.
