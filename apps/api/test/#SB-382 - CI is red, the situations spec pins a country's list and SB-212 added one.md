# SB-382, CI is red, the situations spec pins a country's list and SB-212 added one

**Exit:** `cd apps/api && npx vitest run test/situations.e2e.spec.ts` passes with
`existing-company-owner` in Turkey's list, and CI's `check` job is green on main.

## What broke, and why the data is not the thing that is wrong

`situations.e2e.spec.ts:57` ends on a written-out set:

```ts
expect(response.body.data).toEqual({ tr: ['company-founder', 'worker'], de: ['company-founder'], pt: [] })
```

SB-212 gave Turkey a second `get-a-tax-certificate` version scoped to `existing-company-owner`, so the
API now answers `tr: ['company-founder', 'existing-company-owner', 'worker']`.

`country.resolver.ts:62` returns the distinct `situation` values of a country's researched criteria,
sorted, and its own GraphQL description says that is what it is for. A new situation appearing the
moment a researched version names one is the design working, not a regression. **So the assertion is
what has to follow, and the data stays.**

## The decision the card asks for: derive it, do not write it out

The card asks whether the set should keep being named, which is what makes it a guard, or be derived
from `RESEARCHED` the way `factLabels.test.ts` does. Derived, for three reasons.

**A written-out set turns the intended path red.** It goes red exactly when the product gains a
situation, which is the one thing this resolver exists to do. That is a false alarm with a
maintenance cost, and it is the third of this shape in one day: SB-369 and SB-370 were the same, and
SB-371 exists to catch the class. This card fixes one spec; SB-371 remains the general answer.

**Deriving is not a tautology here, because the two sides travel different roads.** The expectation
would be computed from the source constants in `src/rules/research/`. The answer it is compared with
comes from those same constants *through* `loadResearchRules`, which writes `EligibilityCriterion`
rows, *through* the resolver's three filters, `dimension: 'situation'`, `ruleVersion.countryCode`, and
`research: { not: null }`, and out through GraphQL. A criterion the loader drops, or files under the
wrong country, or writes with a null `research`, still fails here. That is the same shape as
`factLabels.test.ts`, which derives a fact set from `RESEARCHED` and checks it against a different
artefact.

**It keeps SB-286's actual guard, and states it better than a written-out set does.** SB-286 is that a
situation only the seed names, such as `student`, must never reach a reader's Role. `toEqual` against
the derived set says exactly that: `student` is not in `RESEARCHED`, so it is not in the expectation,
so its arrival fails. It is also more correct than an explicit `not.toContain('student')` would be,
because if research ever legitimately names `student` the derived set follows and a written-out
exclusion would fail for no reason.

The `seeded` precondition at the top stays. It proves there really is a seed-only situation that could
leak, so the assertion is not passing vacuously.

## What changes

`test/situations.e2e.spec.ts`, and nothing else. No source change, no schema change, no research
change: the API's answer is already right and already deployed.

A helper beside the test, mirroring the resolver's filter:

```ts
const situationsOf = (country: string): string[] =>
  [
    ...new Set(
      RESEARCHED.filter((rules) => rules.country === country)
        .flatMap((rules) => rules.versions)
        .flatMap((version) => version.criteria)
        .filter((criterion) => criterion.dimension === 'situation')
        .map((criterion) => criterion.value),
    ),
  ].sort()
```

`RESEARCHED` is already imported. `ResearchVersion.criteria` is required, not optional
(`rows.ts:111`), so there is no undefined to guard. `pt` needs no special case: no entry of
`RESEARCHED` carries that country, so it derives to `[]`, which is what the resolver returns and what
the test already expects.

Then, following `factLabels.test.ts`, one assertion that the derivation found something real, so a
derivation broken to empty cannot agree with an API broken to empty:

```ts
expect(situationsOf('tr').length, 'the research names no situation for Turkey at all').toBeGreaterThan(0)
expect(response.body.data).toEqual({ tr: situationsOf('tr'), de: situationsOf('de'), pt: situationsOf('pt') })
```

The comment above the helper records the decision, which the card asks for by name.

## One risk, written down rather than hidden

JavaScript's `.sort()` compares UTF-16 code units; Postgres orders by its collation, and the two can
disagree about where a hyphen sorts. Today's values, `company-founder`, `existing-company-owner`,
`worker`, differ at the first letter, so the question cannot arise. If a future pair ever differs only
across a hyphen, this test goes red and somebody looks, which is the right outcome rather than a
silent one.

## How it is checked

The exit names the run: `npx vitest run test/situations.e2e.spec.ts`, which must be watched failing
first, since it is red right now, and then passing. The planted case is the other direction: with a
situation added to the derivation by hand that no research names, the assertion must fail, proving the
derived expectation is really being compared and not quietly empty.

Lint and the type checker over the changed file. SB-382 came out of SB-196's roast, so it is a child
and closes on the tests covering what it changed; its exit then adds CI's `check` on main, which is
the full suite anyway.

## Why this is being done before SB-260 finishes

SB-260 is in progress and its remaining half is a live page reading. `ci.yml` declares
`pages: needs: [check, secrets]`, so while `check` is red on main the Pages job is skipped and no
rebuild can reach the site. SB-260's work is committed, pushed, green and verified on the live API; it
is not reverted, it is waiting on this card. This is the blocker, so it goes first.

Proven rather than reasoned: the dispatched run 35120722443 ended `check` failed, **`pages` skipped**.

## What the plan check said

It agreed the derived expectation is a real end to end test, and named what it checks independently:
that the loader creates the criteria and keeps their country and research ownership, and that the
resolver filters, deduplicates, orders and exposes them.

It named the trade precisely, and it is worth writing down: the written-out list would force a review
if the research itself gained a situation by mistake, and the derived one accepts it. It called that
the right trade here, because the resolver's documented contract is whatever the researched rules
name, **and because `situationLabels.test.ts` already fails any situation with no name for a reader**.
That is checked, not taken on trust: that test derives the same set from `RESEARCHED` and requires a
label for each. The comment in the spec now cites it, so whoever reads the trade can see what covers
it.

It said to keep the array comparison rather than compare sets, since the test's own name promises an
order, and warned that the likeliest mistake here is weakening "sorted" into "same members". Taken:
the arrays stay.

It said the `seeded` precondition is sufficient on its own and a separate `not.toContain('student')`
would only duplicate what the equality already proves. Taken, and that is what the plan already said.

**One thing it got wrong.** It wrote that this checkout has no lockfile. `package-lock.json` is here,
589 KB, and tracked. Its underlying point survives in a smaller form and is worth keeping: the exact
PGlite version is not established by `apps/api/package.json`, which carries the range `^0.4.3`, so any
claim about the running PostgreSQL version has to come from the lockfile. Nothing in this plan or in
the test depends on that version, and neither now names one.
