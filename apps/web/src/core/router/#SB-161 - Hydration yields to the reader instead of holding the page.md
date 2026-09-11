# SB-161, Hydration yields to the reader instead of holding the page

**Exit:** on the live guide with the phone profile, the long tasks and total
blocking time measured the same way as SB-159 fall measurably, the
prerendered header links to the country's own pages, the pages e2e still
passes with the heading node kept from the file, and every page in the live
sitemap loads in light and dark with no console error.

## Measured before

Live guide after SB-159, phone profile, light: long tasks of 185, 400, 474 and
144 ms after the scripts arrive, 0.85 to 1.0 s of blocking time, the main
thread free at 3.1 s. The trace: a 375 ms React task, then 427 ms of
microtasks straight after it.

## What the second pass is

The shell learns things after mount that the page's first render could have
known, so the file is drawn without them and the app renders again once they
arrive:

- **The country.** ShellProvider starts with none and CountryRoute publishes
  the confirmed one from an effect. Every prerendered header therefore links
  its logo and navigation to the site root, which a crawler follows to a
  redirect, and after hydration the whole shell renders again with the
  country.
- **Who owns Ask.** Home claims it in a layout effect, which the prerender
  never runs, so the home's file carries two Ask fields, the header's and the
  hero's, where the design allows one; hydration then takes the header's away.

## The change

1. `useAddressCountry()` in `src/core/router`: the reader and country the
   address names, and the database's answer for that country (the same
   `CountryQuery`, cache-first). CountryRoute's guard uses it, and so does the
   shell. Both ask with the same variables, so urql asks once; on the server
   the answer is in the prerender's data, and on the client in the seed, so
   both first renders have it.
2. `AddressShell` in `src/core/router`: the shell for an address. It passes
   ShellProvider the confirmed country, its name and the reader's origin, and
   whether the page at that address owns Ask when it opens, read from the
   route table (a `handle` on the home and search routes, the two whose screens
   claim Ask at the start). LocaleShell uses it, and so do the screen stories,
   which got their country from CountryRoute's effect until now.
3. ShellProvider takes those as props: the place is derived, not state, and
   `setCountry` goes; `pageOwnsAsk` stays state, starting from the route's
   answer, for the scroll handoff.
4. `main.tsx` hydrates inside `startTransition`, and renders inside it for a
   reader in dark: a transition lane is one React time-slices, yielding every
   few milliseconds, where the default hydration lane is rendered in one go.

Touches `src/core/shell` and the six screen stories besides `src/core/router`
and `main.tsx`.

## Least sure of

- **Time-sliced hydration and an update during it.** A state update that lands
  before hydration finishes makes React give up hydrating and render the root
  from scratch, replacing the file. Nothing updates state before the first
  commit today, since effects run after it, but the e2e's heading-node check is
  what says so.
- **Whether the 427 ms really is the shell.** The trace after the change says.

## What building it turned up

- **The 427 ms was not the shell.** With the country read from the address
  and hydration in a transition, the local trace still had a 416 ms task of
  microtasks after hydration. A CPU profile of an unminified build said what
  it was: the whole guide rendered again, at sync priority, straight after
  `activateCatalog`. I18nProvider's effect activated the catalog on every
  mount, including the one main.tsx had already activated before the first
  render (SB-155); lingui then tells every translated component its language
  changed, they all render again, and because the routes' Suspense boundary
  was still hydrating, React had to finish it at once. The effect now leaves
  a catalog that is already live alone.
- **Rebuilding `Intl` objects on every call.** `regionName` built a new
  `Intl.DisplayNames` per call, and YourDetails called it for all 250 regions
  and sorted them with `localeCompare` on every render of the header, for a
  panel that is closed: 96 ms of a phone's CPU on every page. `formatDay` and
  `formatMonth` built a `DateTimeFormat` per date. Each is now built once per
  language (and form), and the region list only when the panel opens.
- **Measured locally**, the same unminified build, 4x CPU: the time spent at
  sync priority after hydration went from about 500 ms to 1 ms, and the guide
  renders inside the scheduler's slices instead. On the minified build the
  long tasks are module evaluation, 243 ms, and two React tasks of 172 and
  130 ms, where the live trace before had 400, 474 and the 427 ms microtask.
- **The e2e checks were watched failing first**: against the live site, which
  still had the old shell, the header's links read `/SkipBureau/`.

## Measured after

Live guide, the same profile and script, light, three runs:

- long tasks of about 190, 120, 110 and 90 ms, the longest now module
  evaluation; blocking time 0.30 to 0.31 s, was 0.85 to 1.0 s after SB-159
  and about 1.5 s before it; the main thread free at 2.7 s, was 3.1 s;
- first paint and LCP 1.06 to 1.27 s, the heading still the file's node;
- the trace has no microtask pass left: the React work is two scheduler tasks
  of 115 and 82 ms. The 0.45 s first layout before first paint is SB-162.

The pages e2e passes live, 10 of 10; all 33 pages in the live sitemap load in
light and dark with no console error; the home's file has one Ask field, and
the Persian guide's header links to `/fa/TR` and `/fa/TR/guides`.

## How it is checked

The phone measurement and the trace, before and after. The pages e2e, with
two new expectations on the files: the header links to the country's home,
and the home carries one Ask field. The screen stories, and every page in the
live sitemap in light and dark.
