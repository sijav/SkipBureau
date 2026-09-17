# SB-315, which details a reader can give is decided in two places that cannot disagree loudly

**Exit:** adding a row to the context panel makes the matching rule card offer
Tell us with no change in the guide screen, proved by a test that adds a detail
to the registry.

This plan lives in `apps/web/src/shared/context-control/` because the registry
belongs beside the rows it has to agree with. It also touches
`apps/web/src/screens/guide/Guide.tsx`, which loses a literal and gains an import.

## What the card says, and what is actually there

The card describes a defect that is half gone, and measuring first changed what
this builds.

- **`canBeGiven` does not exist.** A repository wide grep across `apps/web/src`
  finds nothing. The guide now holds `detailWords` at `Guide.tsx` line 143 and
  reads it at line 176, `const asks = need ? detailWords[need] : undefined`.
- **The guide is already bound to the API's enum, by the compiler.** `needs` is
  typed `Array<Detail>`, and `Detail` is a generated union of exactly five
  members: `nationality`, `residenceRegion`, `residenceStatus`, `situation`,
  `workRegion`. `detailWords` is a literal with exactly those five keys and there
  is no cast, no `as`, no suppression anywhere near it. Planting a sixth member
  fails the build:

  ```
  src/screens/guide/Guide.tsx(176,25): error TS7053: Element implicitly has an 'any'
  type because expression of type 'Detail' can't be used to index type
  '{ residenceRegion: string; residenceStatus: string; nationality: string;
    situation: string; workRegion: string; }'
  ```

  Watched, then restored from a copy. So the card's "nothing fails meanwhile" is
  **false for the guide**: the build fails.
- **SB-313's row has already landed.** `ContextPanel.tsx` line 285 draws
  `Where you work`, line 318 folds `work` into the clear button under SB-318, and
  the comment at `Guide.tsx` line 151 records that the panel has a row for every
  one of these. So the reader facing gap the card predicted is closed. This is no
  longer a live bug.
- **What is genuinely unbound is the panel.** Its six rows, `Nationality`,
  `Currently in`, `City in {country}`, `Residence status`, `Role` and
  `Where you work`, are hand written JSX driven by individual props. Nothing
  derives them from `Detail`, so a `Detail` with no row, or a row with no
  `Detail`, goes unnoticed.
- **And the exit cannot be met as things stand, for a reason the card does not
  give.** "With no change in the guide screen" is impossible while the labels
  live inside `Guide.tsx`: adding a detail forces an edit there to name it. That,
  not `canBeGiven`, is the thing to fix.

## What the plan check corrected, and what it is called

Three corrections taken, and the first replaces an argument with a precedent.

- **The home was not a judgement call. It was already decided here.**
  `situationLabels.ts` sits in this very folder holding
  `Record<string, MessageDescriptor>` built with `msg` from `@lingui/core/macro`,
  with `situationLabels.test.ts` beside it that "fails for a situation the
  research names with no name here". Same folder, same shape, same kind of guard.
  I reasoned about layering while the answer was in a file I had listed and not
  opened.

  One difference worth keeping: that registry is keyed by `string`, because its
  keys are values the API sends as data, so only a test can catch an omission.
  Mine is keyed by `Detail`, a generated union, so **the compiler does what its
  test does**.

- **It is a PROMPT registry, not a row registry.** Calling it the registry of the
  panel's rows would claim something the code cannot enforce: it binds the words a
  rule card asks with, not the rows that collect them. The name is the claim, and
  the wrong name is how the next reader believes the panel is covered.

- **The exit was unreachable and is narrowed.** "Adding a row to the context panel
  makes the matching rule card offer Tell us" cannot follow from moving prompts:
  adding a row does not add a registry entry, and a registry entry does not add a
  row. The card's exit now says what this work guarantees, and the residual
  guarantee is **SB-430**, filed rather than absorbed, because deriving six rows
  from data would restructure a component matched to Figma 47:686.

- **No lint coverage is claimed.** `apps/web/eslint.config.mjs` line 151 scopes
  the block holding `lingui/no-unlocalized-strings` to `src/**/*.tsx`, so a `.ts`
  registry is outside it, exactly as `situationLabels.ts` already is. Extraction
  still finds `msg` because the catalog covers `src` and lingui recognises the
  macro import, which is a different mechanism from the lint rule.

## The approach

**1. Move the prompts to where the rows are.** `detailWords` leaves `Guide.tsx`
and becomes `Readonly<Record<Detail, MessageDescriptor>>` in `context-control`,
built with `msg`. The guide imports it and renders `i18n._(...)`, which it already
does at line 131 for a fact's label, so nothing new is introduced at the use site.

**2. `msg`, not `t`, and the reason is not style.** `detailWords` is inside the
component today, so `t` re-evaluates per render and follows the language toolbar.
A module level constant is evaluated once at import, and `t` there would fix the
locale at whatever it was when the module loaded. `SITUATION_LABELS` already
demonstrates the descriptor form switching language in Storybook.

**3. The country row stays out.** The panel draws six rows and `Detail` has five
members: `Currently in` is the country, which is not a detail a rule asks for. The
registry covers the five rather than stretching the type to make the count match.

## Naming the type the registry is keyed by

`Record<Detail, ...>` needs `Detail`, and it is not reachable. The generated
barrel is `export * from "./fragment-masking"` and `"./gql"` only, so it never
re-exports `graphql.ts` where `Detail` is declared, and nothing in the app imports
`Detail` today: `detailWords[need]` compiles because `need` is **inferred** from
the query's shape, with the type never named.

Reaching into `src/core/graphql/generated/graphql` from another module would
break the rule that a cross module import targets a barrel. And `readers.ts`
already shows what this project does instead, under a comment worth keeping:
"Real reads of generated result types. Without one of these the contract is
theatre: a field could vanish from the schema and nothing in the app would stop
compiling, because nothing was looking at it." It derives `Countries` and `Guide`
from their documents with `ResultOf`.

So `Detail` is derived the same way, from `GuideAnswersQuery`, and exported from
the graphql barrel beside them. That keeps the property the comment defends: if
`needs` changes shape, this breaks rather than drifting.

## Files

- `apps/web/src/core/graphql/readers.ts`, deriving `Detail` from its document.
- `apps/web/src/core/graphql/index.ts`, exporting the type.
- `apps/web/src/shared/context-control/`, the prompt registry, **and its barrel**.
  Not exported the way `situationLabels.ts` is: that one is never exported from
  `index.ts` at all, because its only consumer is `YourDetails.tsx`, a sibling in
  the same folder, which CLAUDE.md allows. This registry's consumer is
  `Guide.tsx`, a different module, and the rule there is that a cross module
  import targets the barrel and never a file inside it. So the precedent settles
  the shape and the folder, not the export.
- `apps/web/src/screens/guide/Guide.tsx`, which loses the literal and gains an
  import.
- this plan.

## How it meets the narrowed exit

Two proofs, and neither is the test the first draft proposed.

**Compile time.** With the registry typed `Record<Detail, MessageDescriptor>`, a
sixth member planted in the generated `Detail` union must fail the build **in
`context-control`**, not in `Guide.tsx`. That is the whole point of moving it, and
it is watched failing and then restored, as SB-308's guard was.

**Run, and it moved.** Before the change, planting `employer` gave

```
src/screens/guide/Guide.tsx(176,25): error TS7053: Element implicitly has an 'any' type
because expression of type 'Detail' can't be used to index type '{ residenceRegion: string; ... }'
```

and after it gives

```
src/shared/context-control/detailPrompts.ts(20,14): error TS2741: Property 'employer' is missing
in type '{ residenceRegion: MessageDescriptor; ... }' but required in type
'Readonly<Record<Detail, MessageDescriptor>>'
```

Restored from a copy both times, typecheck back to clean. Two things beyond the
relocation are worth keeping. The error is now **better**: TS7053 complained about
indexing and named nothing, TS2741 names the missing detail, so whoever adds one
is told which prompt to write. And the derivation held: `Detail` reaches the
registry through `ResultOf` and two `NonNullable` unwraps, and the risk was that
it widened to `string` somewhere along that path, which would have left
`Record<Detail, ...>` looking exhaustive while enforcing nothing. It did not.

**Behaviour.** `Guide.stories.tsx` line 226 already has
`ReviewAsksForTheDetail`, a story whose answer is `needsReview`. It must still
render Tell us with `Guide.tsx` carrying no prompt of its own, which is the exit's
"with no change in the guide screen" in the only form this work can deliver.

**What was removed.** The first draft proposed a test that "adds a detail to a
copy of the registry". It cannot add a member to the generated `Detail` union, it
cannot show a panel row exists, and it cannot show the guide was unchanged. It
would have proved nothing while reading as proof, which is worse than no test.

## The step I was least sure of, answered before building

**Whether the guide should resolve the descriptor, or hand it onward.** Answered
by looking: `RuleAnswer.tsx` line 30 types `asks` as `ReactNode`, and line 94
renders it inside `<Trans>{asks} can change this</Trans>`. A `MessageDescriptor`
does not satisfy `ReactNode`, so the guide must resolve it, and `Guide.tsx` line
44 already destructures `i18n` from `useLingui`. The change stops at the guide and
`RuleAnswer` is untouched.

## The step I am least sure of now

**Whether moving these five strings out of a `.tsx` quietly drops them from a lint
rule that was doing real work.** `lingui/no-unlocalized-strings` covers
`src/**/*.tsx` only, so today a bare English label added beside `detailWords` in
the guide would be caught, and tomorrow the same mistake in the registry would
not. Extraction still finds `msg`, so the catalog stays complete, and
`situationLabels.ts` has lived with exactly this for a while. But the honest
statement is that this trades a lint guard for a compiler guard rather than
gaining one outright, and the two catch different mistakes.
