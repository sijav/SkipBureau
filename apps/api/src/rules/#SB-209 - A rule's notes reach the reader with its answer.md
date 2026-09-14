# SB-209, A rule's notes reach the reader with its answer

**Exit:** on the deployed API, the move answer for a residence permit holder in
Turkey carries join-general-health-insurance's notes, opening with "not insured
under a foreign country's law", and a reader asking in Persian is told the notes
exist only in English.

## Why

`RuleText` holds each rule version's notes, one row per language, and researched
rules put there what no criterion can hold: SB-194's "not insured under a foreign
country's law", and the conditions SB-192, SB-193 and SB-196 are waiting to write.
No GraphQL field serves a note, so the move answer and a guide's obligations
carry facts without the condition that decides whether they bind. Three Turkey
cards wait on this.

## What stays exactly as it is

- **Which rule answers, its facts and their pages.** Resolution, inheritance,
  `needs` and the verdicts are unchanged, and a note never changes one: two answers
  with the same facts and different notes are still `identical`.
- **A guide's own text**, and SB-049's rule for it.
- **The schema of the database.** `RuleText` already exists; no migration.

## The change

**One place picks a text by language.** `pick`, which the guide service uses to
take a row in the asked-for language or else the English one and say so, and the
`locale` argument that both the guide and the country resolvers declare, move to
`src/locale.ts`, used by guides, countries and rules. Where a row has neither the
asked-for language nor English, `pick` now takes the one whose locale sorts
first, where it took whichever the database happened to return, so the same
question always gets the same text. That rare case is the only change to what a
guide or a country answers.

**A note says what language it is in.** A new type, `RuleNote`: `ruleVersionId`,
the version it belongs to; `text`; `locale`, the language the text is actually in;
and `translationMissing`, true where the reader asked for a language the version
has no note in and is given another. That is what SB-049 gives a guide, given per
note, because one answer can draw on a national rule translated into Persian and a
city rule that is not. A version with no note in any language gives none.

**The move and changes answers carry the notes of the rules their facts come
from.** `move` and `changes` take `locale`, English when left out, as the guide
queries do. `ResolvedRule` gains `notes`: the note of the rule that answers, and
of each wider place's rule the answer takes a fact from, each once. Which versions
those are is read from the finished answer, from the `ruleVersionId` on each fact
it returns, never gathered while walking the wider rules: where two wider rules
state the same value for a key, `answerOf` keeps one fact, the one from the lowest
version id, and only that version gives a note for it. A key the wider rules state
differently leaves the answer `needsReview`, with no resolved side and no notes.

The notes come widest place first, so a reader in Bursa whose deadline is national
reads the national note before Bursa's. A wider rule the answer takes no fact from
gives no note: a narrower rule that states every fact of a wider one replaces it
there, and free text cannot say which of its sentences still hold, so a condition
that still binds in the narrower place is written again in the narrower rule's
note. Among the versions that give notes, one comes after every other it strictly
covers, and two that neither covers, a rule for where the reader lives and one for
where they work, are ordered by id, so the answer is the same every time.

**A guide's obligations carry their rule's notes.** `GuideObligationView` gains
`notes`, from the general version it already takes its facts from, in the guide's
language. An obligation whose resolution is `contextRequired` has none, as it has
no facts.

**DESIGN.md** says, where it describes the answer and where it describes a guide
read in another language, that a rule's notes come with its answer, follow the
facts they come with, and say what language they are in.

## What this card does not do

It writes no note, which SB-192, SB-193 and SB-196 do, and translates none of the
researched notes into Persian. It shows notes on no page: no screen reads the move
answer yet (SB-074), and the guide page shows no obligation facts, so the screen
that first shows a rule's answer is the one that shows its notes.

## Files

- `src/locale.ts`, new; `src/guide/guide.service.ts`, `src/guide/guide.resolver.ts`,
  `src/guide/guide.model.ts`, `src/country/country.resolver.ts`
- `src/rules/diff.ts`, `src/rules/rules.model.ts`, `src/rules/rules.service.ts`,
  `src/rules/rules.resolver.ts`
- `test/research-rules.e2e.spec.ts`, `test/place.e2e.spec.ts`,
  `test/move.e2e.spec.ts`, `test/guide.e2e.spec.ts`
- `schema.gql` and the web's generated types, regenerated; `DESIGN.md`

## The step I am least sure of

**A wider condition a narrower rule does not repeat.** Notes follow the facts: an
answer carries the note of each version it takes a fact from. A city rule that
restates every figure and does not restate a national condition leaves it out.
The plan check chose that over giving every wider rule's note, which would put
beside a city rule a condition it meant to replace, and it is how SB-188 already
ties each fact to its own page. No rule stored today has a narrower version that
restates a wider one.

**No note beside a question.** An answer that is `needsDetail` or `needsReview`
has no `resolved` side, so it carries no note: a note there would be the
provisional answer SB-176 refused.

## How it is checked

On PGlite:

- `test/research-rules.e2e.spec.ts`: the permit holder's health insurance answer
  carries its version's English notes, whose first sentence names "not insured
  under a foreign country's law", with `translationMissing` false; asked in
  Persian, the same text, with `locale` en-US and `translationMissing` true.
- `test/place.e2e.spec.ts`: a reader in a city whose rule takes a fact from the
  country's is given the country's note and then the city's; a reader in a city
  whose rule states every fact the country's does is given only the city's; a
  reader elsewhere only the country's; and a reader whose rule for where they live
  and work inherits one key that a rule for their province of residence and a rule
  for their province of work both state with the same value is given the note of
  the version whose fact the answer kept, and not the other's.
- `test/move.e2e.spec.ts`, where `changes` is already queried: `changes`, asked
  in Persian through its own `locale` argument, carries a version's notes in the
  language they have, saying so.
- `test/guide.e2e.spec.ts`: the Turkish address guide's obligation carries its
  rule's note in English, and in Persian the Persian note with
  `translationMissing` false.

Then planted faults, each watched failing: notes gathered from every wider rule
rather than from the versions the returned facts name, the order reversed,
`translationMissing` forced false, and a guide obligation's notes left empty.
Then the full API and web suites, lint and typecheck on both with the regenerated
contract, and both builds. After the push, the deployed API answers the exit's two
questions.
