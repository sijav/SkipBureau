# SB-176, Resolve says which unanswered detail would change an answer

**Exit:** for Germany, a profile living in Saxony with no work region gets, for
the care insurance split, that the answer depends on where they work rather
than the national split; with the work region given it gets the Saxon or the
national split; and an obligation no missing detail could change resolves
exactly as before, each checked through the `move` query on PGlite.

## The gap

`matchesProfile` answers yes or no, and a criterion about a detail the reader
has not given answers no. So a version for EU nationals is treated, for a reader
who has not given a nationality, exactly like a version for people the reader is
not. They are told Germany's general residence permit rule, which is right only
if they are not European. A Dresden resident who works in Dresden and has only
said where they live is told the national 1.8 and 1.8 care split, which is wrong
for them. Both read as answers.

DESIGN.md's second rule is that context is asked for only when it changes the
answer. Nothing today can tell a screen when that is, which is why SB-154, the
questions, waits for this card.

## The change

**A version fits a profile in one of three ways, not two.**

- **matches**: every criterion is satisfied;
- **contradicted**: some criterion is about a detail the reader gave, and it
  says something else;
- **open**: nothing contradicts it, and at least one criterion is about a detail
  the reader has not given.

What counts as given, per dimension:

- `nationality` and `nationalityGroup`: the profile's nationality. A group
  criterion with no nationality is open on `nationality`, because that is what
  the reader would be asked, never the group.
- `situation`: the profile's situation.
- `residenceRegion` and `workRegion`: per country. A criterion naming `DE-SN` is
  answered when the list holds any German region, contradicted when that region
  is another one, and open when the list holds none for Germany. A mover who said
  they live in `TR-34` has not said where they will live in Germany.

`fitToProfile(criteria, profile, groups)` in `eligibility.ts` returns that, with
the open details. `matchesProfile` becomes "fits, and nothing open", so nothing
that calls it changes meaning.

**Which open versions matter.** Per obligation, after `mostSpecific` has run over
the matching versions:

- **With no winner, every open version matters.** Answered, it would be the
  only rule.
- **With one winner, an open version matters unless its facts are the winner's
  facts.** Answered, it would win by covering the winner or tie with it. Where
  its facts are the same, by the diff's own `sameFact` over every key and no key
  on one side only, that changes which row applies and nothing the reader is
  told, so it is not a question worth asking. The first plan check pointed this
  out: a regional version repeating the national figures would otherwise ask
  every reader where they live for nothing. An open version can never be
  covered by a matching one, because the matching one would have to carry the
  unanswered criterion too, and then it would not match.
- **With two or more tied winners, an open version matters only if it strictly
  covers every winner.** Only then could an answer break the tie. Otherwise it
  could add another tied rule at most, and the outcome stays that a person has
  to decide.

**The third outcome.** A side gains `needs`, the sorted set of details the
mattering open versions leave open, drawn from `nationality`, `situation`,
`residenceRegion` and `workRegion`, and it is independent of the other two
fields. When `needs` is not empty, `resolved` is null: nothing provisional is
returned beside it, because the national split with a footnote is exactly the
answer this card exists to stop. `ambiguous` stays as `mostSpecific` found it, so
a side can be tied now and also say which answer could break the tie.

**In the diff.** An entry where either side is ambiguous stays `needsReview`,
with its `reason`, and carries `needs` as well. Only an entry with no ambiguity
on either side and details needed on either gets the new verdict `needsDetail`.
The first plan check was right that putting `needsDetail` first would hide a
real ambiguity from a caller that reads only the verdict; `needs` is a field of
its own, so SB-154 reads its questions from it whatever the verdict is. The
entry's `needs` is the union of both sides. `Verdict` gains `needsDetail`. A `Detail` enum lives in `eligibility.ts`, beside the dimensions
it names, and `rules.model.ts` registers it for GraphQL as it registers
`Verdict`. `DiffEntry` gains `needs: [Detail!]!`, empty when nothing is needed.
No screen calls `move` or `changes`, so the web changes only by regenerating.

## Two tests whose meaning changes, on purpose

- **`move.e2e.spec.ts`, "moving from Turkey to Germany answers in the four
  kinds".** Its comment says the Turkish student health rule does not apply
  "and this person is not one", but the profile only gives a nationality and
  never says so. Under this card that is `needsDetail` on `situation`, which is
  the card's point. The profile gains `situation: 'worker'`, which makes the
  comment true, and the assertion stays as it is.
- **`region.e2e.spec.ts`, SB-168's first test**, expected a reader with no region
  to get the same national split as a reader working in Brandenburg. That is the
  false answer this card removes. The no-region case leaves that test and becomes
  this card's first one.

## What it relies on

**A region code names its country by its prefix.** SB-168's review found that
nothing yet makes a `Region` row's prefix agree with its `countryCode`, or stops
a draft version changing country under its region criteria. That is SB-180.
Until then a malformed row would put a need on the wrong country. None exists:
the seed writes eight correct rows, and nothing else writes regions.

## Files

`src/rules/eligibility.ts`, `src/rules/rules.service.ts`, `src/rules/diff.ts`
(which exports a `sameFacts` built from its `sameFact`, so the guard and the diff
agree on what "the same" means), `src/rules/rules.model.ts`, the two tests
above, a new `test/needs.e2e.spec.ts`, the "Who a rule applies to" section of
DESIGN.md, and the regenerated `schema.gql`.

## The step I am least sure of

**What "the same facts" leaves out.** The guard compares facts, which is what the
diff compares and what a reader acts on. But a version also carries notes and a
source, and a regional version with the national figures may still say
something different in its notes, such as which office to go to. Under this plan
that reader is not asked, and is shown the national version's notes. I think
facts are the right line, because notes are not what the product claims to
compare, but it is the one place where "nothing the reader is told changes" is
not quite literally true.

## How it is checked

On PGlite, through the `move` query, in `needs.e2e.spec.ts`:

- a Saxony resident with no work region: `pay-care-insurance` is
  `needsDetail`, `needs` is `[workRegion]`, and `to` is null rather than the
  national split;
- with `workRegions: [DE-SN]` the Saxon split, and with `[DE-BB]` the national
  one;
- `register-your-address`, for a profile with only a nationality, is `changed`
  with the same differences as before and an empty `needs`;
- a reader with no nationality: `get-a-residence-permit` needs `[nationality]`,
  because Germany's EU rule is open for them;
- two tied matching versions and an open version covering only one of them stay
  `needsReview` with no `needs`; an open version covering both keeps
  `needsReview` and adds that version's detail to `needs`;
- one side ambiguous and the other needing a detail is `needsReview`, with the
  reason and the `needs` both present;
- an open version whose facts repeat the one winner's asks nothing, and one whose
  facts differ asks for its detail;
- the two changed expectations pass with their new profiles, and every other
  move and region test passes unchanged.
