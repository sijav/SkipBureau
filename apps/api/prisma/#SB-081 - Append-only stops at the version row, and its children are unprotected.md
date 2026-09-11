# SB-081, Append-only stops at the version row, and its children are unprotected

**Exit:** changing or deleting a criterion or a text on a closed version is
refused, changing a past group membership is refused, and editing criteria
into an overlapping scope is refused, each proved by attempting it and reading
the row back unchanged.

## What the triggers cover today

`20260909232307_rule_history_is_append_only`: a CLOSED version row cannot be
updated or deleted, a closed version's facts cannot be updated or deleted, and
two versions with the same country, obligation and criteria cannot overlap in
time, checked when a version row is written. So: an open version is not
protected at all, although an open version that started in 2020 is most of
the history; criteria and texts are not protected on any version; a fact can
be added to a closed version, and moved off one (the fact trigger reads only
the new row's version, which is SB-102); group memberships are not protected;
editing criteria never runs the overlap check; and TRUNCATE skips row triggers.

## The rule

**A version is history once it has started**, `validFrom <= today`, not only
once it has closed: the reader of a version in force since 2020 was told what
it says. So once started:

- the version row cannot change, except to be closed, `validTo` from nothing
  to a date no earlier than today, with every other column as it was. Closing
  retroactively would say it stopped being in force at a time a reader was
  told it was;
- it cannot be deleted;
- its facts, texts and criteria cannot be inserted, changed or deleted, nor
  moved to or from it.

**What stays possible.** A version that has not started yet is a draft and can
change freely, as long as it does not start in the past. And a version being
recorded, inserted in the current transaction, can be given its facts, texts
and criteria in that same transaction, which is how a version that closed
years ago gets recorded at all (the reason the fact trigger allowed inserts).
"Inserted in this transaction" is noted by an AFTER INSERT trigger in a
transaction-local setting, `skipbureau.new_versions`, rather than read from
`xmin`, which also moves when a row is updated in the same transaction.

**Group membership is history too.** A membership that has taken effect,
`validFrom <= today`, cannot be changed or deleted, except to close an open
one no earlier than today. A future one can change, as long as it stays in the
future. Deleting a group cascades to its members, and so is refused for a
group with a past.

**Criteria keep versions apart.** The overlap check becomes a function of a
version id, run both by the version's deferred trigger and by a new deferred
trigger on `EligibilityCriterion`, so a criterion added to or removed from a
draft cannot give it another version's exact scope over the same period.

**TRUNCATE** of any of these tables is refused by a statement trigger; it
fires for tables reached by `TRUNCATE ... CASCADE` too.

Not here: `Obligation`, `ObligationText` and `NationalityGroup`'s name. They
name an obligation or a group; they are not what a rule said on a date, and
the seed updates obligation titles by design.

## Where

A new migration, `20260911200000_rule_history_is_append_only_throughout`:
applied migrations are never edited. It replaces the two row functions,
recreates the fact trigger to cover INSERT, and adds the rest. It changes no
data, so it applies to the live database as it stands.

## Least sure of

- **PGlite**, which the tests run against: plpgsql, deferred constraint
  triggers, TRUNCATE triggers and transaction-local `set_config` all have to
  behave as in Postgres. The tests say.
- **Cascades.** Deleting a draft version cascades to its children after the
  version row is gone, so a child's trigger allows a delete whose version no
  longer exists: the version's own trigger already allowed it.

## What building it turned up

- **PGlite behaves as Postgres here**: plpgsql, the deferred constraint
  trigger on criteria, the TRUNCATE triggers, including through
  `TRUNCATE "Country" CASCADE`, and the transaction-local setting all work as
  planned, and the six tests passed on the first run.
- **So they were watched failing**: with the new migration moved aside, all
  six fail; put back, all six pass.
- **Nothing that runs on start writes a rule table.** The entrypoint applies
  migrations, then writes countries and the sample content; neither touches a
  version, its parts or a membership, so these triggers cannot stop the API
  starting. The seed, which does, only inserts, and only by hand or in tests.
- **The seed's group memberships have no key**, so `skipDuplicates` never
  skips them and each run adds three more; now that a past membership cannot
  be deleted, a duplicate would stay. Filed as its own card.
- `TECH-DEBT.md`'s entry for this is removed: its own condition was a test
  proving each gap refused, and five of its six are. The sixth, obligations,
  is a decision rather than a gap, recorded in `PHASE-NEXT.md`; deleting an
  obligation that has history is refused, and the tests say so.

## How it is checked

`test/history.e2e.spec.ts`, against PGlite as the others: for each refusal in
the exit, and for the open-version and draft cases, the write is attempted,
refused, and the row read back unchanged; and the allowed paths, recording a
closed version with its children, closing an open one today, editing a draft,
deleting a draft, still work. The existing move tests still pass.
