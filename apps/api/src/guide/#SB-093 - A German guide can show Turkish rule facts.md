# SB-093: a German guide can show Turkish rule facts

**Exit condition.** The German guide returns the German version's facts and
never Turkey's, asserted in both directions, and a version dated in the future
is not treated as current.

## The bug, confirmed rather than taken on trust

`guide.service.ts` line 83:

```ts
versions: { where: { validTo: null }, include: { facts: true } },
```

and later `link.obligation.versions[0]`.

No `countryCode`. No `validFrom`. So a guide linked to an obligation that
several countries share returns whichever open version the database ordered
first. **The seed already contains the case**: `anmeldung` in Germany links to
`register-your-address`, which has an open Turkish version carrying a 20 day
deadline. A German reader can be shown Turkey's deadline.

`validTo: null` also means a version whose `validFrom` is next year counts as
current.

## The decision this turns on, which is not just a missing WHERE

Scoping by country is obvious. **Which version** is not.

`RulesService.resolve` picks one version per obligation for a **profile**:
nationality, situation, date. A guide has no profile. It is a general document,
and personalisation is what the context control and the process are for.

So a guide shows **the version with no eligibility criteria** for its country,
in force now: the one that applies to everyone. Where every version is scoped
to somebody, the guide has no general answer and must say the answer depends on
context rather than pick a stranger's.

That is a real product decision, not a query fix, and it is the part I want
checked. The alternative is showing every applicable version and letting the
page present them, which is more honest and much more page.

## What I will change

- `guide.service.ts`: scope the included versions by `countryCode`, by
  `validFrom <= today`, by `validTo` null or future, and by having no
  eligibility criteria. Take the one, not the first of many.
- `GuideObligationView` gains a way to say **there is no general answer**, so a
  guide whose obligation only has scoped versions does not silently show
  nothing and look like it has no requirements.
- Tests: the German guide's facts are German, the Turkish guide's are Turkish,
  a future-dated version is not current, and an obligation with only scoped
  versions reports that rather than an empty fact list.

## Files

`apps/api/src/guide/guide.service.ts`, `guide.model.ts`,
`apps/api/test/guide.e2e.spec.ts`, and the seed if a scoped-only obligation is
needed to test the last case.

## Where I am least sure, named

**Whether "no criteria means general" is the right rule.** It is what the data
says today, but an editor could reasonably write a country's only version with
a `situation` criterion and expect the guide to show it, because in that
country it is the only answer there is. Then a guide would go blank for a
reason nobody could see from the content. The alternative rule, "if there is
exactly one applicable version, show it, whatever its criteria", is friendlier
and quietly shows a student's answer to a worker.

**Second:** whether the guide should filter by date at all, given `verifiedAt`
is what the page prints. A guide edited today linking to a rule that changes
next month arguably should show the coming rule with its date, not the current
one. That is a bigger question than this fix and I am not answering it here,
but if the answer is yes then this fix builds the wrong shape.
