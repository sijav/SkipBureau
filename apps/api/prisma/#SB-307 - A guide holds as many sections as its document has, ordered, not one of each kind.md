# SB-307, A guide holds as many sections as its document has, ordered, not one of each kind

**Exit:** a researched guide keeps a section for every bold lead of its document, in order, including repeated kinds,
proven by loading a guide with two sections of one kind and reading it back, and every existing guide is unchanged.

`GuideSection` is unique on `(guideId, kind)`, and there are eight kinds of which a researched guide may not use
`yourOptions`, so a guide holds seven sections at most. Germany's business registration document has ten bold leads
and its health insurance nine, and SB-299 cannot write them without losing headings. Its plan check refused the merge
that would have hidden the loss, since the guides spec tests containment and would still have passed.

## What changes

- **The schema.** `@@unique([guideId, kind])` becomes `@@unique([guideId, position])`, and the comment beside it says
  what a section now is: a guide's sections are an ordered list, and a document that says something twice keeps both
  of its headings.
- **The migration**, hand written as the others in this folder are: one transaction, a bounded `lock_timeout`, the old
  unique index dropped and the new one created. Nothing is backfilled: both writers already set `position` from the
  section's place in the file, so every row has one and no guide has two sections at the same position. The index
  creation is the check of that, and it fails loudly rather than quietly if a database somewhere disagrees.
- **The three writers look up by position, and only one of them may rewrite a row.** All three use
  `guideId_position`. The researched loader owns its guides' rows, so it rewrites the kind, the English text and the
  position's contents, deletes the steps, clears the outgoing link, and deletes the positions beyond the file's count
  in place of its old cleanup by kind. It also deletes **every** section text that is not `en-US`, where today it
  clears only the locales it writes: a third language's row would otherwise survive a reorder and describe the section
  that used to sit there. The fill-only writers, `guide-fill.ts` and `sample-content.ts`, fill what is missing in a row
  that exists and never change its kind: where the stored kind at a position is not the seed's, they leave the row
  alone and say so, since attaching one section's text to another's presentation is worse than an unfilled row.
- **The page keys sections by position**, `Guide.tsx`, where it keys them by kind today. The query already asks for
  each section's position, and the API already returns them in that order, so nothing else on the page changes.

## How it is checked

- `test/researched-guides.e2e.spec.ts` gains three cases: a guide whose file holds two sections of one kind loads and
  reads back with both, in the file's order, and a second load changes nothing; a file that reorders its sections is
  followed, the row at each position carrying the file's kind and text; and a section text in a language the file does
  not write is gone after a load, so no stale language describes a section that moved. On today's schema the first
  collides, which is the planted case, watched before the migration.
- `test/guide.e2e.spec.ts`: its ordering test, which writes a section at position 9, still passes; the test that finds
  the first `howToDoIt` section selects by position instead, and anything asserting that a second section of a kind is
  refused goes, since that is the rule being replaced.
- The API suite whole, its lint and its types; the web's typecheck, lint, unit and the four Storybook projects for the
  page's key; and the pages e2e, whose German guide is a sample row written by the filler.
- The migration runs on a fresh database in the e2e run and on the deployed one from the entrypoint, which migrates
  before it serves. The recovery gate is untouched: it acts only where no migration has ever finished.

## What I am least sure of

- Whether anything reads a guide's sections by kind expecting one of each. The page uses the kind only to let
  `yourOptions` break the reading measure, and the API orders by position.
- `fillGuideDetail` keyed by position: it fills what is missing in a row that exists, so for a sample guide whose rows
  were written by an older image the kind at a position could differ from the seed's. Germany's sample guide is the
  only one left, and SB-301 deletes it.
- The migration's lock: dropping and creating a unique index takes an exclusive lock on `GuideSection`, which is a
  small table, inside the entrypoint's migrate step.

Checked on 2026-09-16 and approved with three corrections, all taken. The positional key is necessary, not merely
convenient: without it a concurrent writer could tie two sections at one position, which the API's ordering and the
page's new key would both trip over. The loader may reuse the row at a position, since a section's id is not public
identity, but it must clear every non-English section text, which the plan now says. The fill-only writers use the
same lookup and never rewrite a kind. On two containers starting together, `migrate deploy` takes an advisory lock and
waits ten seconds; the second container exits under `set -e` rather than waiting, and the platform restarts it, and a
migration that times out on the table lock records a failed migration, which is the recovery path the entrypoint
already has. The consumer scan found nothing in production code that drops a repeated section: the API maps them all
in order, the page renders each, and the structured data flattens every `howToDoIt` and `whatYouNeed`. Cost and time
still goes before the first section of the kinds it precedes, which the page's comment will say.
