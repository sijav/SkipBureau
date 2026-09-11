# SB-151, Short dates write Sep, as the design does, not Sept

**Exit:** the DeadlineItem States story shows 20 Sep 2026 and 07 Sep 2026, and
the source card's Last checked line reads Sep for a September date.

## What is wrong

English dates are formatted as `en-GB`, for the day-first order the design
draws, "24 Aug 2026". Current ICU abbreviates September as **Sept** in en-GB,
so every September date reads "20 Sept 2026" where Figma writes "20 Sep 2026".
Measured here: `en-GB` gives `20 Sept 2026`, `en-US` gives `Sep 20, 2026`. The
order and the month name have to come from different locales, and en-IE and
en-AU write Sept as well, so there is no third locale to switch to.

## The change

`locales.ts` gains a `months` tag beside `dates`: the order comes from
`dates`, the month name from `months`. For English that is `en-GB` and
`en-US`; for Persian both are `fa-IR`, so nothing changes there.

The formatting walks `formatToParts` from the `dates` formatter and replaces
the `month` part with the name from the `months` formatter, only when the two
tags differ. Both formatters are the cached ones from SB-161, so this still
builds one `Intl` object per language and form.

## Least sure of

Whether any other part reads a month name and would now disagree. `formatDay`
and `formatMonth` are the only date formatting in the app, and the long form
is "September" in both tags, so only the short English name moves.

## How it is checked

The States story asserts both September dates, the source card's story asserts
its Last checked line for a September date, and the i18n unit test covers the
formatting directly. The stories run in all four combinations, so the Persian
side is covered by the same run.
