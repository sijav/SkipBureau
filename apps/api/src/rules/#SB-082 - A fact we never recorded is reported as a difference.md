# SB-082, A fact we never recorded is reported as a difference

**Exit:** a country with a fact the other has never had checked returns a
distinguishable verdict rather than `changed`, and a country that genuinely
does not require it still returns `changed`.

## What is wrong

`compare()` lists every fact key either side has. A key present on one side and
absent on the other becomes a difference, so the obligation reads `changed`.
But absent means two things the model cannot tell apart: *checked, and this
country has none of it*, and *nobody has looked*. Documenting one country more
thoroughly then makes every move to or from it report changes nobody verified.

## The two ways out, and the one taken

The card offers two:

- **A rule version declares its fact set exhaustive**, with a column and an
  editorial step that sets it. Coarse: an editor would have to assert that
  every possible key was checked, which is rarely true, and one unchecked key
  makes the whole flag false.
- **A third state per fact key.** Taken. A new operator, `none`, records
  *checked, and there is none*: no deadline, no fee, no such document. A key
  with no row at all is then honestly *never recorded*.

## The change

- `FactOperator` gains `none`, by migration (`ALTER TYPE ... ADD VALUE`). A
  `none` fact carries no value.
- `FactDifference` gains `known`: false where one side has no row for the key.
  Both sides present and different, a `none` against a value included, is
  known.
- `Verdict` gains `unknown`: nothing known differs, but a fact is recorded on
  one side only, so whether it differs is not something this can say. A known
  difference still makes the obligation `changed`, and the unrecorded keys are
  listed beside it with `known: false`, so a reader is never told a gap is a
  change or a change is a gap.
- The seed's Turkish address registration records `requiredDocument` as `none`.
  The move test already claims Germany wants a document Turkey does not; that
  claim now rests on a recorded fact instead of an absence.

GraphQL carries both additions, so `schema.gql` and the web's generated types
move with it. Nothing in the web reads `move` yet (SB-074 is not built).

## How it is checked

`test/move.e2e.spec.ts`, against the migrated PGlite database:

- the existing TR to DE move still reads `changed` for the address
  registration, and its document difference is now `known`, from `none`
- a new case: two versions of one obligation where the later records a key the
  earlier never did, and nothing else differs, reads `unknown`; recorded as
  `none` on the earlier one instead, the same pair reads `changed`
