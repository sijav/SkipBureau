# SB-256, The reader's place and residence status are kept in the link, and the context panel reads them from real data

**Exit:** in the built site in a browser, choosing Hamburg in the panel on
`/en-IR/DE/guides/anmeldung` moves to `/en-IR/DE-HH/guides/anmeldung` with the control naming
the nationality and Hamburg, and a chosen residence status stays in the link;
`/en/DE-ZZ/guides/anmeldung` is Not Found; the prerender writes no file for a place address and
its canonical names the plain page; in en and fa, light and dark; router unit tests, stories and
the pages spec prove it and were watched failing.

## Why

The owner, 2026-09-15, chose "In the link": the city a reader chooses is kept in the link,
narrowing the country, as in `/en-IR/TR-35/guides/register-your-address`. Today the panel's City
and Residence status rows say Coming soon, so a reader has nowhere to say where they live or what
they hold, no answer that depends on either can reach them (SB-257), and a shared link cannot
carry it.

## The address

- **A place stands where the country was, spelled as the API codes it:**
  `/en-IR/TR-35/guides/register-your-address`, `/en/DE-HH/guides/anmeldung`,
  `/en/DE-BY.muenchen`. The segment is the country's two letters, a hyphen and the subdivision,
  then a dot and a city's key where there is one, as `Region.code` is written. Any casing reads;
  the one address is the API's spelling, country and subdivision in capitals and the key in lower
  case, and any other spelling is redirected to it, as a lowercase country is now.
- **A residence status is a query parameter holding the API's code:**
  `?status=tr.residence-permit`. Not in the path, which has no place for it without a separator
  nobody could read.
- **Either is Not Found where the country does not have it.** The route guard asks the API for the
  country's places and statuses, cache-first as it asks for the country, only when the address
  names one: `/en/DE-ZZ/guides/anmeldung` and `?status=tr.nothing` are Not Found, the stale link
  DESIGN.md already refuses for a country.
- **Every link keeps them.** `Journey` gains `place` and `status`, both required, so the type
  checker names every place that builds one; `paths` writes the place into the country segment
  and the status after the page's own query, `?q=…&status=…`. The router's `Place` type, a
  pathname with its search and hash, is renamed `Address`, so `place` means one thing.
- **Changing them.** `samePageWhere(address, place)` swaps the segment and keeps the reader, the
  page, the query and the hash; `samePageAs(address, status)` sets or removes `status` and keeps
  the rest. `samePageAt`, changing country, drops both, since a place and a status belong to one
  country. Clear all drops the nationality, the place and the status, and keeps the country and
  the page.
- **Search engines never see them.** A page's head is built from a journey with no origin, place
  or status, so a place or status address names the plain page as canonical and in its
  alternates. The prerender writes files only for plain addresses, so a place address opens from
  `404.html` with a 404, like a nationality address.
- **A status on a prerendered page arrives just after hydration.** Pages serves `sim-card.html`
  for `/en/TR/guides/sim-card?status=tr.residence-permit` with a 200. The file was rendered
  without the status, React does not promise to correct an attribute that differs when it
  hydrates, and `createRoot` would clear the page the reader already sees. So the first render of
  a page hydrated from its file reads the address without its status, exactly as the file was
  rendered, and the shell applies the status in an effect straight after, in a transition: the
  links gain it, and the guard asks for the country's statuses without suspending the page,
  answering Not Found if the status is not one. A page with no file, a place address included,
  reads its status in its first render.

## The shell and the panel

- `CountryProvider` and the shell carry the `place` and `status` codes, and the shell the place's
  name for the control, confirmed as the country is.
- A `ReaderDetails($country, $locale)` query, `places` and `residenceStatuses`, is asked by
  `useAddressCountry` when the address names a place or a status, and by `YourDetails` when the
  panel opens, `overThePage`, so both read one cache entry. It does not suspend: a place address
  opened cold draws nothing below the header until its places are in, as the guard already does
  while a country loads, and a status applied after hydration leaves the page as it is until its
  statuses are in.
- **ContextControl**, Figma 44:542: Partial `44:527` and Complete `44:532` draw two parts, each
  Archivo SemiBold 12/16 within the control's 5 gap, the second "· Add city" in `text-secondary`
  or "· İzmir" in `text-primary`. The first part stays "From Iran", as built. New props `place`
  and `missing` for the second part.
- **ContextPanel**, Figma 47:686, Partial `47:640`, Complete `47:663`: City in {country} and
  Residence status become rows like Nationality, the value as text or Add in the accent, and
  tapped, an Autocomplete over the country's places or statuses, a place inside another listed
  after it and indented. Role stays Coming soon. New strings Add city, Type a place and Type a
  status, extracted with `npm run i18n:extract` and translated in `fa.po`.

## Documentation

DESIGN.md's address section, and `ContextControl.md`, `ContextPanel.md` and `YourDetails.md`.

## How it is checked

- `paths.test.ts`: a place segment read in any casing and written the API's way; canonical paths;
  every path with a place and a status; `samePageWhere`, `samePageAs`, `samePageAt` and Clear all.
- Stories, with msw handlers for `ReaderDetails` keyed on country and locale: CountryRoute at
  `/en/DE-ZZ` Not Found and `/en/DE-HH` found; ContextControl's Partial and Complete;
  ContextPanel's City and Residence status rows; YourDetails choosing Hamburg, a status, and
  Clear all.
- `e2e/pages.spec.ts` on the built site served as Pages serves it, with the e2e API, whose seed
  has Germany's `anmeldung` guide and Hamburg: `en-IR/DE-HH/guides/anmeldung` answers 404, shows
  the guide, names Hamburg in the control and has the canonical `/en/DE/guides/anmeldung`;
  `en/DE-ZZ/guides/anmeldung` is Not Found; `en/TR/guides/sim-card?status=tr.residence-permit`
  answers 200, hydrates with no error logged, and once the page is up its links carry the status.
  The seed writes no residence status, so the test writes that row through the database the API
  uses, as `countries.spec.ts` does, skipping a duplicate and leaving it, because the file's tests
  run in parallel and one removing it would pull it from under another; the e2e database is fresh
  for each run.
- Planted: `canonicalPath` dropping the place; the guard not checking it; the status read in the
  hydrated first render, whose links then keep the file's addresses; `samePageAt` keeping the
  status.

Checked once on 2026-09-15: the address, the guard, the cache and the tests approved; it asked
that a status on a prerendered page not be rendered with `createRoot` over the file but applied
after hydration, which this plan now does, and that a cold place address's wait be stated.

Checked again the same day: sound. Taken from it, as it asked: whether the page was hydrated
from a file is a one-shot input `main.tsx` passes down, from the seed's presence, to
`AddressShell`, whose applied status starts empty in that case and takes the address's in the
effect; stories and a page with no file start from the address's status, and so does every
navigation after the first render; every link is built from the applied status, never from the
query directly. The pages spec also opens `en/TR/guides/sim-card?status=tr.nothing` and sees Not
Found, and, on a page already up, navigates to a status address without reloading and sees its
links carry the status. The check that no error is logged is a smoke test; the proof is the links
and the planted first render.
- The full web suite, lint, `lint:tsc` and build, one Storybook project at a time; then pushed and
  looked at on the live site in en and fa, light and dark.
