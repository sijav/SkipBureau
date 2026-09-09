# SB-008: data model, country is a dimension, not a constant

**Exit condition.** A second country can be added by inserting rows only,
proved by a test that seeds two countries and browses both.

**Why.** This is a global expat guide. Turkey is the first country, not the
subject. Adding a second must need no code change, and that is only true if
country is in the schema from the start.

## What already exists, so this does not duplicate it

SB-073 built the **rules** side: `Country`, `Obligation`, `RuleVersion`,
`RuleFact`, `EligibilityCriterion`, `NationalityGroup`. That answers *what is
required of this person, and how does it differ elsewhere*.

This task is the **content** side: the guides a person reads. The board's
description mentions deadlines and required documents, and those are already
rule facts. **They are not modelled twice.** A guide references the obligations
it explains; it does not restate their deadlines, which is the rule DESIGN.md
already states about prose referencing rules rather than repeating them.

## The shape, from the design rather than invented

DESIGN.md quotes the content model off node `151:995`, and the binding sentence
with it:

> "Every field below is content, not layout: the template must stay coherent
> when any optional one is empty."

So nearly every field is nullable, and one is not. `Guide`:

| field | column | null? |
|---|---|---|
| Guide title | `title` | no |
| Guide description | `description` | yes |
| Quick answer | `quickAnswer` | yes |
| Cost and time | `cost`, `time` | yes |
| **Last verified date** | `verifiedAt` | **no** |
| Disclaimer visibility | `showDisclaimer` | no, defaults false |
| Suggest-update visibility | `showSuggestUpdate` | no, defaults true |

`verifiedAt` is required because the design prints it in three places: the
header, the sources section and the footer note. A guide that cannot say when it
was checked has nothing to print there.

The variable-length parts are rows, not columns, because the design says
"variable in length" and "variable count, or omitted entirely":

- `GuideSection` — ordered, typed by which section it is (what you need, your
  options, how to do it, where to do it, important to know, what to check,
  common problems).
- `GuideStep` — ordered, belongs to a section or to the guide.
- `GuideOption` — the `Your options` block, **removed entirely** where there is
  no meaningful choice, which the design states explicitly. Zero rows is that.
- `GuideSource` — official sources, each with its own url, name and verified
  date, because the design gives the citation card its own date.
- `RelatedGuide` — a self-relation.

## Country, which is the actual exit condition

Every browsable row carries `countryCode`, and nothing carries a hardcoded
`'tr'`. The test that proves it seeds **two** countries with their own guides
and tasks, browses both through GraphQL, and asserts each returns only its own
content, with no code path naming a country.

`Task` and `Category` are the navigation layer above guides: the twelve goals
on Home are tasks, the category hub sits between a task and a guide.

## Language

`GuideText`, `SectionText`, `StepText`, `OptionText`, keyed by `(parentId,
locale)`, the same shape SB-073 used for `ObligationText`. A guide can exist in
English and not in Persian; what a Persian reader is told about that is SB-049
and is not decided here. **This task must not make that impossible**, which
means a missing translation has to be distinguishable from an empty one.

## Files

- `apps/api/prisma/schema.prisma`, appended to
- `apps/api/prisma/migrations/<ts>_guides/migration.sql`
- `apps/api/prisma/seed.ts`, a second country added
- `apps/api/src/guide/` model, resolver, module
- `apps/api/test/guide.e2e.spec.ts`

## What I am not doing

- No admin editing (SB-011), no proposals (SB-010), no search (SB-051).
- No screens. The web app does not read this yet; that is SB-047 and SB-048.

## Where I am least sure, named

**Whether `GuideSection` should be typed by an enum or free-form.** The design
lists seven named sections in a fixed order, which argues for an enum and a
coherent template. But it also says sections are "each optional, each variable
in length", and a country's process may genuinely need a section the Figma file
never drew. An enum makes the template guaranteed and the content constrained;
a free-form key makes it flexible and makes the guide template unable to know
where anything goes.

**Second:** whether `Task` and `Category` are two tables or one self-referencing
tree. The design draws them as distinct screens with different layouts, which
suggests two, but a tree is what actually stops "add a third level" from being
a migration.
