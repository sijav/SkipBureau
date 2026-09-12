# SB-010, Change proposals from anonymous visitors

**Exit, as the card states it:** an anonymous proposal is stored and appears in
the moderation queue, and the live guide is unchanged until an admin approves
it.

## What is already built

All of the path, and none of the proof.

- `Proposal` in the schema: guide, locale, change, optional source, optional
  email, `status` defaulting to `pending`, indexed by status and date.
- `ProposalResolver.suggestUpdate`: bounds each field, names the field that is
  wrong rather than refusing flatly, looks the guide up by country and slug,
  and writes one row. It reads nothing and edits nothing.
- The web's `SuggestUpdate` screen, its dialog, its mutation document, its
  stories, and a link to it from every guide that allows one.

What does not exist anywhere: a test that a proposal is stored, a test that the
guide is untouched, and any way to read proposals back.

## Half of the exit condition cannot be built in this phase, and should not be

"Appears in the moderation queue" is the admin panel, SB-011, which the owner's
phases put in **Next**. Building the queue's query now, with no login to put in
front of it, would publish every visitor's email address and every unreviewed
suggestion on a public endpoint. The guard is the login, and the login is the
next phase.

So this card delivers the half that stands on its own, proves it, and records
the other half as a decision in `PHASE-NEXT.md` rather than leaving the card
open against work that is deliberately later.

## The change

`apps/api/test/proposal.e2e.spec.ts`, on PGlite like the other API tests, each
case reading the row back rather than trusting the answer:

- A suggestion with nothing but the change is stored: against the right guide,
  in the locale the reader had, `pending`, with no email.
- One with a source and an email keeps both.
- **The guide is unchanged.** The full guide is queried before and after and
  compared whole, which is the assertion the card is actually about: a
  proposal that edited content would still return `received: true`.
- Every refusal, each attempted and then counted: an empty change, a change
  past its limit, a source past its limit, an address that is not one, and a
  guide that does not exist. Each names its field and stores nothing.
- Two suggestions for the same guide are two rows. Nothing about a proposal is
  unique, and a schema that silently collapsed them would lose the second
  reader's correction.

## Least sure of

- **Whether the web half needs its own case.** The dialog's stories prove the
  form against MSW, and `contract.test.ts` proves the document matches the real
  schema, so the chain from the form to the resolver is covered by two checks
  that already run. The dev Playwright suite would prove it end to end against
  a real API, but it is stale and does not run in CI (SB-115, SB-146); adding
  a case there would be writing a test nothing runs.
- **What the stored text is trusted to be.** A change is stored as typed and
  read back only by an editor, in a panel that does not exist yet. Where it is
  displayed is where it has to be escaped, so that belongs to SB-011 and is
  noted there rather than guessed at here.

## How it is checked

The new spec, the API's whole test run, and a suggestion actually sent from the
running app in a browser with the real API behind it, then the row read out of
the database by hand.

## What was checked, and what it showed

- `proposal.e2e.spec.ts`, 5 cases, and the API's whole run, 51 of 51.
- **The unchanged check was blind when first written, and is not now.** It
  suggested on the same guide the tests above it use, so the clobber a plant
  would cause had already happened and was stable by the time it read its
  `before`: planted against a resolver that renames every text of the guide it
  stores a suggestion for, all four other cases failed and this one passed.
  Given a guide nothing else in the file touches, and the seeded title named
  outright, the same plant fails it with `expected 'PLANTED' to be 'Register
  your address'`.
- End to end, in a browser, against a real API rather than a mock, the app on
  Vite and the NestJS server on Postgres: a suggestion typed into the dialog on
  the SIM card guide answers "Thank you", and the row read straight out
  of the database afterwards is one `pending` proposal, against `sim-card` in
  `tr`, in `en-US`, with no email and no source, while the guide's two titles
  are still "Get a SIM Card or eSIM" and its Persian.

The moderation queue is not built and is not meant to be in this phase. See
`PHASE-NEXT.md`, "A suggestion is stored, and nothing reads it back yet".
