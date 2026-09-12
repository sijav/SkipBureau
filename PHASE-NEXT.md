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

## Search runs in memory, over one country's content

**Decided 2026-09-10**, from the owner's order that Ask search on the server
and show what it finds on a page (SB-149).

`apps/api/src/guide/search.ts` folds both sides the same way (case, Persian
letters typed in their Arabic forms, half-spaces, marks, digits), stems English
plurals and endings, and weighs a title over a summary over the body. It reads
every guide of the country on each question. That is fine for tens of guides and
wrong for thousands: before content grows past a few hundred guides, move it to
Postgres full-text search with an index (SB-051).

## What is not built has a Coming soon page

**Decided 2026-09-10**, the owner's order: "instead of not built yet, just make
a coming soon page". The header's Guides link, Start guided setup and How it
works, and a guide a hub lists before anyone has written it, each land on one
Coming soon page that says what will be there and links back. In the context
panel, the four rows after Nationality say Coming soon rather than offering an
Add that does nothing.

## An obligation's name can be edited; its history cannot

**Decided 2026-09-11**, making rule history append-only throughout (SB-081).

A version, its facts, texts and criteria, and a group membership are history
once they have started, and the database refuses to change or delete them
(`20260911200000_rule_history_is_append_only_throughout`). `Obligation`,
`ObligationText` and a `NationalityGroup`'s name are not guarded that way: they
name an obligation or a group, which is editorial, and not what a rule said on
a date. The seed updates an obligation's titles by design. What would rewrite
the past is still refused: deleting an obligation, a country or a group that
has history cascades to rows whose triggers refuse it.

**Undo it** by guarding them too, the day an obligation's `kind` or slug comes
to change what a past answer says rather than how it is labelled.

## A suggestion is stored, and nothing reads it back yet

**Decided 2026-09-12**, finishing change proposals from anonymous visitors
(SB-010).

A visitor's suggestion is written to `Proposal`, `pending`, against the guide
they were reading and in the language they were reading it in, and the guide is
untouched. What does not exist is any way to read those rows through the API,
so the card's "appears in the moderation queue" is not met and is not meant to
be: the queue is the admin panel, SB-011, which the owner's phases put in
**Next**.

That is a decision rather than an omission. A `proposals` query now, with no
login in front of it, would publish every visitor's email address and every
unreviewed suggestion on a public endpoint. The guard is the login, and the
login is the next phase, so the query is written when the thing that protects
it exists. Until then an editor reads the table directly.

The same applies to what the text is trusted to be. A change is stored exactly
as typed, which is right for storage; escaping belongs where it is displayed,
and nothing displays it yet.
