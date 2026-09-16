# SB-318, the shell forgot the work place, so the panel shows it unset and Clear all goes dead

**Exit:** choosing a work place, closing the panel and reopening it shows the chosen place in the row, and Clear all is
offered to a reader whose only detail is a work place, proved by a panel test.

SB-313 gave the reader a work place and said it was carried through the shell. It is not, and its roast found both
halves:

- `AddressShell.tsx` reads `place`, `status` and `situation` from `useAddressCountry`, confirms each against the
  country's own lists and passes them into `ShellProvider`. It never reads `work`, so `useShell().work` is null for
  every page. The guide still answers correctly, because `CountryRoute` puts the work place into the **country**
  context and the journey reads it from there, so this is invisible until the reader **reopens the panel** and finds
  the row they filled empty.
- `ContextPanel.tsx` enables Clear all only when there is an origin, a place, a status or a situation. A reader whose
  only detail is a work place is offered nothing to press, and with the shell defect above the panel shows them no
  detail at all while the address still carries one.

## The change

1. **One helper confirms a reader's details, and both callers use it.** The shell sits above the route and cannot read
   the route's context, so both have to check what the address says against the country's own lists; today they do it
   twice by hand, which is how they came apart. A pure function in `addressCountry.ts` takes the country's places,
   statuses and situations and what the address said, and answers with the confirmed values, the names of any the
   country does not have, and whether a list it needs has not arrived yet. `CountryRoute` draws nothing while it is
   waiting and answers Not Found for anything unknown, exactly as it does now; `AddressShell` takes the confirmed
   values and ignores the rest.
2. **`AddressShell` carries the work place** through that helper, into `ShellProvider`, as the code. `ShellPlace`
   already has the field, from SB-313, and `YourDetails` looks its name up in the same places list.
3. **Clear all counts it**: `disabled={!origin && !place && !status && !situation && !work}`. Those five are every
   detail a reader can give today, and the predicate has to stay level with `samePageCleared`, which clears the same
   five.
4. `AddressShell.md` lists what the shell carries, which it does not today: the country, and each detail the reader
   has given once confirmed.

## How it is checked

`YourDetails.stories.tsx` is the right place and already has the machinery: it renders the real `AddressShell` over a
`MemoryRouter` at an address a story names, with the mocked API behind it, and prints the address back through a
`Where` output. So one story proves both halves of the exit end to end:

- open `/en/TR`, open the panel, **choose İstanbul in the Where you work row**, and wait for the address to become
  `/en/TR?work=TR-34`;
- **close the panel and open it again**: the row reads İstanbul, which fails today, because the shell never learned it
  and the row reads the shell rather than the address;
- press **Clear all**, which must be pressable with that as the only detail, and the address becomes `/en/TR`.

Starting the story with `?work=` in the address would prove restoring and clearing but not the reader's own path,
which is what the exit says, so it chooses.

Watched failing on two plants: the shell's new lines removed, where the row shows Add; and the predicate's `&& !work`
removed, where the button is disabled and the address keeps its query.

Then the panel's own stories, the web's lint and type checker, and the two story projects that cover these files. It
is a child card, so the full suite is not run again; the files it touches are covered by those stories.

Live afterwards: on the deployed site, choose a work place on a German guide, close the panel, reopen it, and the row
says what was chosen.

## Checked on 2026-09-16

Approved with two corrections, both taken. The story must **choose** the place rather than start with it in the
address, or it proves restoring and not the path the exit describes. And the two hand-written validations must become
one shared helper: the shell is above the route and cannot read its context, so both must check, and a fourth
hand-written branch is how this defect happened in the first place.

It confirmed the rest: the confirmed work place stays a code, since the panel resolves its name from the places list;
the five details are every one a reader can give, and the destination country is not one; `AddressShell.md` is the
right home for that list under the project's rule that a component's documentation is markdown beside it. It also
noted that SB-320's unskipped e2e is a different test from this one unless it gains the reopen and clear assertions.

## What I am least sure of

- Whether the confirmed work place should be a code or a `{ code, name }` like the place row, since `YourDetails`
  looks its name up in the same list either way. The code keeps `ShellPlace` as SB-313 left it.
- Whether Clear all should be pressable when the reader has said nothing at all, which it is not today and this does
  not change.
