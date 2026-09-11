# Unreachable

We could not reach our own API. Distinct from Not Found on purpose: one is
our fault and worth retrying, the other is a place we do not cover. Telling
a reader the second when the first happened sends them away for good.

The retry is the caller's to supply. This used to reload the document, which
throws away the whole app to ask one question again; `CountryRoute` now
re-executes the query in place, which is both better and, unlike a reload,
something a story can click.

## Props

- `onRetry`: How to try again. Required, because a screen that says "trying again usually works" and has no way to try again is worse than one that does not offer.
