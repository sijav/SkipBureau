# SB-354, the database and the API disagree about what blank means

**Exit, as the card words it:** a criterion whose value is a tab, a newline or a
non-breaking space is refused by the database, `checkProfile` refuses the same set,
and a test in `region.e2e.spec.ts` covers all three rather than only ordinary spaces.

This plan lives in `apps/api/prisma/` because the change is a migration. It also
touches `apps/api/test/region.e2e.spec.ts`.

## What is there, measured

- **The CHECK.** `20260916140000_one_value_per_single_valued_detail_and_no_blank_value`
  line 33: `CHECK (btrim(value) <> '')`. Single argument `btrim` strips `U+0020` and
  nothing else.
- **The comment above it is not true.** Line 28 says "A criterion whose value is empty
  or only whitespace can never match anything". The constraint does not enforce that.
- **The other side.** `rules.service.ts` line 99:
  `profile[detail]?.trim() === ''`, over `nationality` and `situation` only. Regions
  and statuses are validated by existence lookups instead, so they cannot be blank by
  a different route.
- **The disagreeing set is 24 characters, not the three the card names.** Every code
  point JavaScript's `trim()` strips and single argument `btrim` does not:

  ```
  U+0009 U+000A U+000B U+000C U+000D U+00A0 U+1680
  U+2000 U+2001 U+2002 U+2003 U+2004 U+2005 U+2006 U+2007 U+2008 U+2009 U+200A
  U+2028 U+2029 U+202F U+205F U+3000 U+FEFF
  ```

  So a value made of any one of those is stored by the database and can never be
  supplied by a reader. The card's tab, newline and non-breaking space are three
  examples of twenty four.

  **And one of them got into this plan.** The code point scan that runs over a plan
  file before it is committed found a single non-ASCII character in the paragraph
  below about the E string candidate: U+00A0, a no-break space, sitting where an
  ordinary space belonged. It is invisible in an editor and indistinguishable from
  the space beside it. Nothing but scanning code points would have found it, and
  reading the line certainly did not.

  That is this card's reason demonstrated rather than argued. The card says an editor
  pasting from a spreadsheet or a translated document gets a non-breaking space
  without seeing it, and the rule they wrote then applies to nobody while the database
  reports it stored. It happened here, in the file explaining why it matters, within
  an hour of writing that sentence. The character was replaced by code point rather
  than retyped, so the fix could not reintroduce what it removed.
- **The defect is contained.** `btrim` appears exactly once in the whole schema, so
  there is no sibling constraint with the same hole to file.
- **Two places, not three.** Nothing outside the migration expresses this constraint:
  `schema.prisma` carries no CHECK, and the only other mention is the test's regex at
  `region.e2e.spec.ts` line 208.
- **The existing test is exactly the gap.** Line 205 uses `value: '  '`, two ordinary
  spaces, which the current constraint does catch.

## Nothing here has been done in this repository before

No migration has ever used `DROP CONSTRAINT`, an `E'...'` escape string, `chr()`, or a
Unicode escape of any kind. This migration needs the first of those and one of the
others, so there is no house form to copy and the choice has to be argued rather than
matched.

The house shape it does follow: a comment header naming the card and its plan, then
one explicit transaction with `SET LOCAL lock_timeout = '30s'`.

## The contract

**A value is blank when it is empty or consists only of whitespace, where whitespace
means what JavaScript's `trim()` means**: the twenty four above plus `U+0020`.

That direction rather than the other: the TypeScript side already implements this
correctly, and by specification rather than by a list someone maintains. The SQL is
what is behind. Rewriting `trim()` into a hand enumerated character class would be
more code for identical behaviour and a new place to drift, which is the defect this
card is about, moved rather than removed.

So the card's "write it identically in the SQL and in TypeScript" is read as **one
contract, expressed once per language in the idiom each provides, with a test that
proves they agree on every character rather than on a sample**. That is a reading,
not the card's words, and the check should rule on it.

## The expression, with three candidates

1. **`btrim(value, E' \t\n... ...') <> ''`.** Compact, but bets on `E` string
   escape syntax being accepted identically by PostgreSQL and by PGlite, which the e2e
   suite runs, and there is no precedent here for either.
2. **`btrim(value, ' ' || chr(9) || chr(10) || ...) <> ''`.** No escape syntax at all,
   every character named by its code point in the clear, and `chr` is immutable so it
   is legal in a CHECK. Verbose, and that verbosity is the documentation.
3. **A POSIX class, `value !~ '^[[:space:]]*$'`.** Disqualified, but for a narrower
   reason than this plan first claimed. Measured against PGlite rather than guessed,
   `[[:space:]]` matches twenty of the twenty five and misses exactly five:

   ```
   misses: U+00A0  U+1680  U+2007  U+202F  U+FEFF
   ```

   which are the non-breaking spaces, the Ogham space mark and the byte order mark.
   It DOES match most of the `U+2000` block, `U+205F` and `U+3000`, all of which this
   plan originally listed as missed, and it misses `U+2007`, which this plan never
   listed at all. The plan check read that list and called it right; we were both
   wrong, and the probe settled it.

   Missing `U+00A0` alone is fatal, since a non-breaking space is the card's own
   example and the likeliest one to arrive by paste. So the conclusion stands and the
   reasoning behind it is now a measurement.

**Measured, not reasoned: 1 and 2 both work, and 2 works inside a real CHECK.** A
throwaway probe against PGlite confirmed the card's premise and settled the choice:

```
btrim(space) is empty                 true     the premise: it strips U+0020
btrim(tab | newline | nbsp | U+2003 | U+FEFF) is empty   false, every one
E escape parses and equals chr(160)   true     candidate 1 is viable after all
btrim(tab, chr built set) is empty    true     candidate 2 works
CHECK with a chr built set            accepted
  a tab is refused                    by name, probe_not_blank
  a no-break space is refused         by name, probe_not_blank
  ordinary text is accepted
```

So candidate 1 is not the gamble this plan assumed. 2 is still the choice, now on
readability rather than on doubt: `chr` names every code point in the clear, and the
whole expression was watched refusing a tab and a no-break space by constraint name
before a line of the migration was written.

## Files

- `apps/api/prisma/migrations/<timestamp>_blank_means_the_same_in_both/migration.sql`.
- `apps/api/test/region.e2e.spec.ts`, the extended case.
- this plan.

## How it is proved

- **Every character, not a sample.** The test extends the existing blank case to all
  twenty five, each refused by the database with `value_is_not_blank`. A test that
  covered the card's three would leave twenty one holes and report success.
- **Both sides agree.** A case asserting that `checkProfile` refuses the same set, so
  the two are shown to match rather than asserted to.
- **Planted.** With the constraint put back to single argument `btrim`, the new cases
  must be accepted and stored, which is the defect itself. Watched, not assumed.

## Run, and what the green run did not prove

`region.e2e.spec.ts` passes at 9 tests, and the migration applied to a fresh PGlite,
which a malformed one would not have: `migrate deploy` runs in `beforeAll`, so a
broken migration errors the whole file rather than letting tests pass.

**But 9 was 9 before.** The new coverage extends an existing test rather than adding
one, so the count is identical whether the loop over twenty five characters ran or
never executed. A green run here is consistent with both, and quoting it as evidence
would have been quoting a number that cannot distinguish them.

**Planted, and now it is evidence.** The migration's CHECK was put back to single
argument `btrim`, so the fresh database is built with the old constraint:

```
1 failed | 8 passed (9)
  235|       `${named} alone is not a value the database keeps`,
```

restored from a copy, green again at 9, with the full character set back in the
migration. So the loop runs, and what refuses those twenty four characters is this
card's constraint rather than something else that happened to be in the way.

## The deploy risk, which is real and has a precedent

`ADD CONSTRAINT ... CHECK` validates existing rows, so a deployed criterion whose
value is whitespace only would fail the deploy rather than be quietly ignored. Every
criterion value in this product comes from a research file or a seed, so none should
be, but "should" is not a check.

**So it was made one.** Every criterion the loader writes comes from a research
file's version criteria, and the sample seeds create no criteria at all, so scanning
those two sources covers everything that can be in the table:

```
criterion values checked: 63
whitespace only: none
with leading or trailing whitespace: none
```

The constraint therefore has nothing to fail on when it validates on deploy.
Inheriting SB-181's stance is the right policy for whatever is written next; it is
not a reason to decline to look at what is written now, and the two are easy to
confuse when the precedent is quotable.

SB-181's own migration took exactly this risk and said so: "Validated as it is added,
so this migration is itself the proof that the existing rows conform, and it fails
loudly on deploy if they do not." The same sentence applies here, and failing loudly
on deploy is the correct behaviour rather than a hazard to design around.

## The step I am least sure of

**This was two unknowns and it is one.** The plan treated PGlite and PostgreSQL as
separate risks. The plan check pointed out that this repository already holds the
answer, and it was verified here rather than taken: migration
`20260916180000_the_upward_tree_walk_carries_its_path` line 33 records that "PGlite
0.4.3 embeds 17.5", and `apps/api/package.json` line 22 pins `^0.4.3`. PGlite is
PostgreSQL compiled to WebAssembly, not a reimplementation, so `chr`, multi argument
`btrim` and the lexer's escape handling are the same code.

What is left is version skew against the deployed managed PostgreSQL, which nothing
in this repository pins. For functions this old that risk is small, and the probe has
already run the exact expression rather than something like it. So the residual doubt
is real, single, and smaller than this plan first implied, which is worth correcting
because overstating a doubt is its own kind of inaccuracy.
