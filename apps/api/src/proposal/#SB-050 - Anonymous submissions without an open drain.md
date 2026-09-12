# SB-050, Anonymous submissions without an open drain

**Exit:** a script posting a hundred submissions in a minute is refused, and a
genuine one immediately afterwards still succeeds.

That second half is the hard half. A limiter that refuses the flood and then
refuses the next reader has turned a spam problem into an outage, so every case
below is written as a pair: the flood is stopped, and the person is not.

## What is open now

`suggestUpdate` is the only write in the API and it takes no credential. It
bounds each field and writes one row. Nothing limits how often, so one loop
fills the table, the free tier's storage, and the moderation queue that has to
be read by a person. The table is also the only thing standing between a bot
and the database, which is the wrong place for the first line.

## The change

**One: a submission costs a wait.** At most one submission per client every
thirty seconds, and at most five in an hour. The second is what stops a
hundred in a minute; the first is what stops a hundred in a second before the
hour's count can even be read.

**Two: a guide cannot be buried.** At most twenty submissions for one guide in
an hour, counted from the table rather than from memory, so it holds across a
restart and across several instances. This is the one an attacker with many
addresses runs into, and it protects the queue rather than the server.

**Three: who a client is, without keeping it.** Behind Northflank the socket
address is the ingress, the same for everyone, so the address comes from the
**last** entry of `X-Forwarded-For`, which is the one the edge appended. The
leftmost entries are whatever the caller wrote, and a limiter keyed on those is
a limiter keyed on nothing. What is kept is a **hash**, in memory, for the
window: this product stores no accounts and no reading history, and a list of
readers' addresses in a heap dump would be exactly that.

**Four: nothing large is parsed.** A body limit at the HTTP layer, so an
enormous request is refused before any resolver sees it, which is what "at the
edge rather than stored" asks for. Express has a default here already; the test
says what it is rather than trusting it.

**Five: a cheap bot check that is not a captcha.** An optional `website` field
that must be empty. A form-filling bot in a real browser fills every field it
finds, including one that is hidden, and is refused. **It stops that and
nothing else**: a caller posting to the API directly simply omits it, which is
what the limits above are for. It is worth its two lines and should never be
described as more.

A refusal names itself, like the field refusals already do: `problem: 'tooMany'`
for a limit and `'bot'` for the honeypot, and the dialog says to try again
later rather than showing the generic failure.

## What this does not do

A distributed flood, a thousand addresses once each, passes every limit here
except the per-guide one. That is the correct trade: the alternative is a
captcha, which the card rules out, or an account, which the product rules out.
The per-guide cap is what keeps the queue readable when that happens.

## Least sure of

- **Whether `req` is reachable from the resolver.** Nest's Apollo driver puts
  `req` in the context by default, and nothing here overrides `context`. If it
  is not there the limiter would silently key every caller the same, so the
  test asserts two different addresses are counted separately rather than
  assuming the plumbing.
- **The numbers.** Five an hour is generous for a person who found two
  mistakes on one page and mean for an editor testing the form. They are
  constants in one place, and the card that builds the admin panel can exempt
  a signed-in editor.

## How it is checked

A spec that posts a hundred submissions in a minute and shows they are refused,
then posts a genuine one from another address and shows it is stored; the
guide cap reached and the guide beside it unaffected; a body over the limit
refused without a row; the honeypot refused; and the whole API suite. Each
limit is watched failing a case planted by hand before it is believed.

## What was checked, and what it showed

- `submissionLimit.spec.ts`, 10 cases on the limiter alone, where a clock can
  be handed in: the pause, the hour's count and its expiry, two clients kept
  apart, a forged `X-Forwarded-For` prefix making no difference, asking not
  spending a slot, and the ceiling on what is remembered, including that a
  busy client is not evicted by its own traffic.
- `proposal.e2e.spec.ts`, over real HTTP: a hundred submissions in a minute
  from one address store **one** row and answer `tooMany` ninety-nine times,
  and a person from another address immediately afterwards is stored. Twenty
  for one guide, then the twenty-first refused while the guide beside it still
  accepts. The honeypot refused. A million-character body answered **413** by
  the HTTP layer with no row, which is what "at the edge" means here.
- **Each guard watched failing.** With the honeypot, the client limit and the
  guide cap all removed, exactly three cases failed, one per guard, each with
  its own message. Nothing else moved.
- The dialog: a story for `tooMany`, and one that proves the hidden field is
  not reachable, three textboxes and a trap that is `aria-hidden` and
  `tabindex="-1"`. Planted by removing `aria-hidden`, that story fails **and
  so does the accessibility check on three others**, which is the reason a
  hidden input is acceptable at all.
- An index on `(guideId, createdAt)`. The per-guide count runs on every
  submission and Postgres does not index a foreign key on its own, so without
  it the query that exists to survive a flood is a sequential scan of the
  table the flood is filling.
- Both suites: the API 65 of 65, the web 610 of 610, lint and the type checker
  clean on both.

**Not checked against the deployed API, on purpose.** Proving the rate limit
there means storing at least one real submission, because a slot is only spent
by a row that is stored; that would put junk in the moderation queue nobody can
delete until SB-011 exists. What is checked live is the honeypot, which is
refused before anything is written, and that the deployed schema carries the
field.

