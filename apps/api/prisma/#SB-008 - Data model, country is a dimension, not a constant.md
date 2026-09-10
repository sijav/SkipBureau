# SB-008: data model, country is a dimension, not a constant

Revised after the plan check. Not re-checking: every change below is an
adoption of what the reviewer prescribed, and re-running a check on its own
prescription is the score-grinding the loop forbids.

**Exit condition**, narrowed because the plan check caught it overclaiming:

> Two countries seeded, and a GraphQL query for each returns only that
> country's guides, categories and sources, with one task shared between them
> rather than duplicated. Proved in both directions.

The original said "a second country can be added by inserting rows only", which
is a claim about the whole product. It is false today for a reason outside this
task: `apps/web/src/core/country/countries.ts` is a hardcoded map of one
country and the router refuses an unknown code before it reaches a resolver.
That is now **SB-080**, parented on the web getting a GraphQL client. Narrowing
this task's exit condition is honesty, not scope-dodging: the gap is written
down and owned somewhere.

## What already exists, so this does not duplicate it

SB-073 built the **rules** side: `Country`, `Obligation`, `RuleVersion`,
`RuleFact`, `EligibilityCriterion`, `NationalityGroup`. That answers *what is
required of this person, and how does it differ elsewhere*.

This is the **content** side: the guides a person reads.

## What is global and what is country-specific

The plan check named this as the step most likely to go wrong, and it is right:
the failure is duplicating something global because its children differ.

| global | country-specific |
|---|---|
| `Task`, the twelve goals. "Get a residence permit" is the same intention in every country | `Category`, `Guide`, `GuideSource`. What getting one actually involves |
| `Obligation`, the shared identity that makes two countries comparable | `RuleVersion`, one country's version of it |

So `Task` carries **no** `countryCode`, and the two-country seed deliberately
shares one task between Turkey and Germany while giving each its own guides and
sources. A test that only checks two rows exist would pass a schema that
duplicated the task, which is the mistake being guarded against.

## Language: `Guide` is structural, `GuideText` is everything a reader sees

The first draft had `title`, `description` and `quickAnswer` on `Guide` **and**
mentioned a `GuideText`. That is a contradiction, and it destroys the one
distinction this has to preserve:

- **A missing translation is an absent `(guideId, locale)` row.**
- **A deliberately empty field is a present row with a null column.**

If the title lives on `Guide`, those two are indistinguishable and SB-049
cannot tell a reader "this exists in English only" rather than showing a blank.
So `Guide` keeps only structure, country and dates. Everything language
dependent moves to `GuideText`, and the same for sections, steps and options.

`verifiedAt` stays on `Guide` and stays **required**: the design prints it in
the header, the sources section and the footer note, and it is a fact about the
content rather than about a language.

## Sections are a fixed enum

The design draws seven, in a fixed order. They are presentation semantics, not
labels an editor writes: the template has to know where each one goes. A new
section is a design change and deserves a migration. **At most one of each kind
per guide**, enforced by a unique constraint, and steps are ordered within a
section rather than the template being reorderable.

Optional rows are the flexibility. `Your options` with zero rows is the design's
"removed entirely where there is no meaningful choice", which is removal rather
than an empty heading.

## Relations are explicit, not implicit

`GuideObligation` and `RelatedGuide` are real join tables with a `position`.
Both need ordering, and both will want presentation metadata. An implicit
many-to-many hides the join table and makes adding either a migration.

## The link to rules, which policy alone will not hold

The plan check is right that editors will retype a deadline into prose unless
the response gives them somewhere better for it to live. So the guide query
**returns the linked obligations' current facts as structured data**, and the
prose explains the rule rather than restating its numbers. Rejecting literal
volatile values in prose is editorial and belongs to SB-011; giving them
nowhere they need to be typed is this task.

## Files

- `apps/api/prisma/schema.prisma`, appended to
- `apps/api/prisma/migrations/<ts>_guides/migration.sql`
- `apps/api/prisma/seed.ts`, Germany's guides added beside Turkey's
- `apps/api/src/guide/` model, resolver, module
- `apps/api/test/guide.e2e.spec.ts`

## What I am not doing

- No admin editing (SB-011), no proposals (SB-010), no search (SB-051).
- No screens, and no web app changes. It cannot read this yet: SB-047, SB-048.

## Where I am least sure now

Whether `Category` should be country-specific, as above, or global like `Task`.
"Getting Settled" reads as global. I am making it country-specific because the
design's category hub is a checklist of that country's actual steps, and a
global category with country-specific children is the same duplication trap one
level down. If that is wrong it is one table to move, which is why it is worth
being wrong cheaply rather than deferring the decision.
