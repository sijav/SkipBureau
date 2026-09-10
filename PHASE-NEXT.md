# Phase next

Deliberate scope decisions, recorded so they are undone on purpose rather than
forgotten. Debt, meaning things that are wrong, goes in `TECH-DEBT.md`.

## Sample content is published on the test deployment

**Decided 2026-09-10**, from the owner's order to build the screens and publish
them so they can be seen, on a database the owner calls test-only.

`apps/api/docker-entrypoint.sh` runs `node dist/sample-content.js` on every
start. It fills in the twelve goals, Turkey's categories, one guide per
country and Home's four common questions, all illustrative and unverified.
Home prints the design's own caveat that this is sample content.

**Before a real launch:** remove that line from the entrypoint, and delete the
sample rows an editor has not replaced. The twelve goals can stay, they are
names and not advice.

## Task tile availability comes from content

A goal is Coming soon in a country until that country has a category under it.
The design's Home shows seven goals available in Turkey; the sample content has
categories for two, Getting Settled and Start a business, so the other ten show
Coming soon. That is the data being honest, not the tile being wrong, and it
changes the moment an editor adds a category.

## Suggestions are stored, and nothing yet reads or limits them

**Decided 2026-09-10**, building Suggest an update (SB-045).

`suggestUpdate` stores a visitor's suggestion as a `Proposal`, pending, and
never edits a guide. Two things are deliberately not built yet, each on the
board: there is no moderation screen to read and act on proposals (SB-011),
and the endpoint has no rate limit or spam check (SB-050), only length bounds.
Until SB-050 lands, anyone can fill the table.

The design's email field carries no "(optional)", but the product brief says
visitors propose changes anonymously, so the email is optional in the API and
in the form. The design's Privacy Notice link is left out: there is no privacy
notice page to link to.
