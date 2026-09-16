# SB-178, Currently in says it is loading, and no list says No options in English

**Exit:** with the countries response held back in a story, tapping `Currently in` shows a loading
text rather than No options and choosing works once it arrives; a typed name that matches nothing
shows a lingui message; and in the browser in Persian both read in Persian.

## Why

`YourDetails` pauses the countries query until the panel opens: `pause: !open && !origin`. So on a
first open with no origin the request starts as the panel appears, and `ContextPanel` is handed
`countries={data?.countries ?? []}` until it returns. A reader on a slow connection taps
`Currently in` and MUI's Autocomplete says **No options**, which is a dead end at the moment the
product is meant to help.

That text is MUI's English default, and so is its loading text. Nothing in `apps/web` sets
`noOptionsText`, `loadingText` or an MUI locale, which was checked rather than assumed, so a
Persian reader reads English inside a Persian interface.

## What the card did not know, and what it changes

**The component is `Choice` in `ContextPanel.tsx`, not `CountryChoice`.** No file of that name
exists. `Choice` is one shared row rendered six times, so the two texts are **one** change covering
every row rather than the two the card names.

**Nationality is not affected.** Its options come from `REGIONS.map(...)` with `regionName(code,
locale)` as the name where the API has not answered, so that list is full the moment the panel
opens. The rows that can be empty while a request is in flight are **Currently in**, fed by the
countries query, and **City, Residence status, Role and Where you work**, fed by the details query,
which is paused the same way. The card names only the first; the fix covers all five, because the
same prop does it.

## What changes

- `Choice` takes `loading?: boolean` and passes it to the Autocomplete with `loadingText` and
  `noOptionsText`.
- **Both texts come from lingui inside `Choice`**, through `useLingui()`, rather than being
  threaded as two more props through six call sites. They are the same sentence in every row, and
  the panel already imports the macro.
- `YourDetails` destructures `fetching` from both queries and passes it down: the countries query's
  to the `Currently in` row, the details query's to the four rows it feeds.
- The comment at `ContextPanel.tsx:107` is reworded. It reads "Autocomplete selects it on a click
  in the field, not on autoFocus", which parses as though selection never happens; it means MUI
  selects the text when you click the field but not when focus arrives on its own, which is why
  `onFocus` selects it by hand.

## The tests

`ContextPanel` and `YourDetails` both have stories, and the stories run in all four combinations of
mode and direction, which is this project's matrix.

- A story with the **countries response held back**, asserting the row says it is loading rather
  than No options, and that choosing works once the response arrives.
- A story typing a name that **matches nothing**, asserting the lingui message rather than MUI's
  default.

**Nothing is asserted in Persian.** The owner's rule of 2026-09-10 is that no test is written for
any language, since testing Persian is testing lingui. What the stories prove is that the strings
come **from the catalog** rather than from MUI, which is the actual fault. The exit's Persian half
is met by looking at it in the browser, which is what the rule asks for and what this plan does.

## How it is checked

SB-178 came out of SB-172's roast, so it is a child: the tests covering the files it changes, which
are the web's unit project and the four story projects, plus the web's lint and `typecheck`. Then
the browser, in Persian and English, light and dark, because a text that only exists in a catalog
is exactly the kind of thing a story can pass and a reader still never see.

## How the response is held back, which the check decided

Not a timed delay, and **not `delay('infinite')`**: in the installed msw 2.15 that is a
maximum-duration timer with no release handle, so a play function cannot let it go.

A **deferred promise** in the `Countries` handler instead. The story asserts the loading text,
resolves the promise, then awaits the country becoming selectable, and **releases it in `finally`**
so a failed assertion does not leave the request pending for the rest of the run.

Two further corrections the check made:

- `loading` must be the query's **fetching** flag, not "the list is empty". MUI shows `loadingText`
  only while `loading` is true and there are no options, so a **completed** empty response has to
  fall through to the no-match text rather than saying it is still loading.
- **Two query-level flags**, the countries query's and the details query's, fanned out to the five
  rows they feed. Simpler and truer than one panel-wide flag, because the two finish at different
  times. Both are optional and default false, so the standalone `ContextPanel` stories keep working.

## What the tests can and cannot prove

The stories can honestly assert that MUI's defaults are **absent**, `No options` in particular, and
that the option is selectable once the response arrives. They **cannot** prove from the DOM that a
string came from lingui rather than from a hard-coded English equivalent.

So the Persian half stays a browser check, and the check was explicit that it has to actually be
made, in Storybook with Persian selected, rather than asserted into existence here.

## What looking in Persian actually showed

Both read in Persian: «در حال بارگذاری…» for the held-back list and «چیزی پیدا نشد» for a name that
matches nothing, in dark RTL and light RTL, and `Loading…` in English in both modes.

**Read the story's own frame, not the manager.** A page-text read of
`localhost:6016/?path=/story/...` returns "Main preview area" and nothing else, and a text search
finds no Persian, because the story renders inside the preview iframe. That looks exactly like the
strings being missing and is not. The address that answers is
`iframe.html?id=shared-contextpanel--still-loading&globals=locale:fa-IR;mode:dark;direction:rtl`,
where `locale`, `mode` and `direction` are the toolbar globals `.storybook/preview.tsx` declares.

**Storybook says Component test failed under the Persian toolbar, and that is not these stories.**
`Default`, which this task never touched, fails the same way, because stories find a row by its
label and the labels are translated. The matrix is English by the owner's order of 2026-09-10, the
toolbar is for looking, and the assertions stay in English.
