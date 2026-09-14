# SB-172, Changing where you are, the Currently in row

**Exit:** on the live site, opening Add your details on a Turkish page and
choosing Germany under Currently in takes the reader to the German page, in
English and in Persian, and the row names the country the address is in.

The owner, 2026-09-14: "how can I change my destination?" Today the only way is
to edit the address.

## What the design says

The context panel `47:686` draws five rows. Its Empty state `47:617` shows
**Add** on every one of them. Its Complete state `47:663` reads **Nationality**
Iranian, **Currently in** Turkey, **City in Turkey** İzmir, **Residence status**
Student residence permit, **Role** Student. The header `45:523` has no
destination control of its own. So the destination is the **Currently in** row,
and it is built today as Coming soon. Only Nationality works.

## The change

Most of it is in this folder; it also touches `src/core/router/paths.ts` and its
test.

- **`ContextPanel`** gets `country` (the code and name the address is in),
  `countries` (the ones the API covers) and `onCountry`. The row shows the
  current country's name and opens the same Autocomplete the Nationality row
  uses, limited to covered countries. It never says Add: a page is always in a
  country, so the Empty state's Add cannot apply to this row on a real page.
- **`YourDetails`** passes `country` from the shell and `countries` from the
  countries query it already runs, and navigates with `samePageAt`.
- **`samePageAt(place, country)`** in `paths.ts`, beside `samePageIn` and
  `samePageFrom`. It swaps the country segment and keeps the reader. **A page
  survives the move only if it exists in every country:**
  - home, the guides index and a search keep their page, the search keeping its
    question, because none of them can be Not Found in a country we cover;
  - **everything else goes to the new country's home**: task hubs, category
    hubs, guided setup, guides and their suggest page.

  The first version of this plan kept `tasks/:goal` on the grounds that a goal
  is global. The plan check said that was wrong, and it was: `taskHub` returns
  null when a country has no categories for the goal, and `TaskHub` renders that
  as Not Found. On the live API, Germany has `getting-settled` and not
  `start-a-business`, so the first version would have sent a reader from
  Turkey's start-a-business hub straight to a Not Found page. Keeping the goal
  when the other country has it needs a lookup at the moment of choosing, which
  is SB-173 rather than this card.
- **Clear all** keeps clearing only what the reader told us. The destination is
  not something to clear.
- **Strings:** the row label `Currently in` and the placeholder `Type a country`
  already exist, so this should need no new catalog entry. If it does, the
  Persian is added in the same change.

## Least sure of

- **Where a guide should land.** Home loses the reader's topic. The better
  landing is the task hub the guide belongs to, but that needs the guide's
  place, which the page has and the header does not. Home is honest now; a
  better landing is its own card if the owner finds it matters.
- **Addresses the header can see.** A trailing slash is matched by the router
  and kept by `canonicalPath`, so `samePageAt` reads `/guides/` and `/search/`
  as the pages they are, and the tests say so. It does not canonicalise
  otherwise: an uppercase country or an old `/t/` or `/g/` marker is redirected
  by the route guard before the header has a confirmed country to change, so
  the panel cannot be opened on one. (The second plan check pointed out both.)

## How it is checked

- `paths.test.ts`: every page kind above, with the reader, the search and the
  hash.
- A `ContextPanel` story for the row, where choosing Germany calls `onCountry`
  with `de`.
- On the live site, in English and Persian, light and dark: from a Turkish task
  hub to the German one, and from a Turkish guide to Germany's home.
