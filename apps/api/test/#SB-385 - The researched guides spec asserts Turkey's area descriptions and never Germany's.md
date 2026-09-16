# SB-385, The researched guides spec asserts Turkey's area descriptions and never Germany's

**Exit:** `researched-guides.e2e.spec.ts` asserts slug, taskSlug and description for the areas of every
country `RESEARCHED_GUIDES` names, and removing Germany's area description from the loader by hand
fails it.

## What the spec does now

The Areas block sends its query with `{ country: 'tr' }` and filters the expectation to
`researched.country === 'tr'`. Turkey's six areas are asserted; Germany's four are not. SB-260's exit
claimed the spec asserts each area's description, and it asserts Turkey's, which is what this card
corrects.

## What `RESEARCHED_GUIDES` actually holds, read rather than assumed

Countries `tr` and `de`. Turkey: `short-term-residence-permit`, `register-your-address`, `tax-number`,
`health-insurance`, `work-permit`, `company-formation`. Germany: `residence-permit`, `anmeldung`,
`business-registration`, `health-insurance`. Every entry carries an English guide description.

`health-insurance` is an area slug in **both** countries. That is why the comparison stays scoped to
one country and sorted within it, rather than becoming one flat list across countries where two rows
would share a sort key.

## Why a whole-list equality is legitimate here

`beforeAll` creates only the two country rows and runs `loadResearchRules`. It never runs the sample
seed, so `categories(country:)` returns only what the researched loader wrote. If the fixture carried
sample categories this card would have to become a subset check instead, and it does not.

## What changes

`test/researched-guides.e2e.spec.ts` only. No source change, no schema change: the loader already
writes every country's area description, which is why the live reading found Germany correct.

The query moves to a module-level constant beside `GUIDE`, matching how this file already holds its
queries, and the assertion loops the distinct countries, following the file's own
`for (const researched of RESEARCHED_GUIDES)` idiom and its habit of naming the case in the
assertion's message:

```ts
const AREAS = `
  query Areas($country: String!) {
    categories(country: $country) {
      slug
      taskSlug
      description
    }
  }
`
```

```ts
for (const country of [...new Set(RESEARCHED_GUIDES.map((researched) => researched.country))]) {
  const areas = await graphql(AREAS, { country })
  expect([...areas.body.data.categories].sort(byArea), country).toEqual(
    RESEARCHED_GUIDES.filter((researched) => researched.country === country)
      .map((researched) => ({ slug: researched.area.slug, taskSlug: researched.task, description: researched.guide.en.description }))
      .sort(byArea),
  )
}
```

The country goes in as the assertion's message so a failure says which country, rather than printing
two sorted arrays and leaving the reader to spot the difference. That is the same reason SB-297 gives
for the named messages in `factLabels.test.ts` and `situationLabels.test.ts`.

## How it is checked

The whole file, never a `-t` filter: this suite loads its data inside an earlier test, so a filtered
run reaches the Areas block with nothing loaded and proves nothing. That is a recorded trap on this
repository, not a guess.

Then the planted case the exit names. Germany's area description is removed by hand in
`src/guide/researched-guides.ts`, by writing `null` for the German guides only, and the run must fail
on `de` while `tr` still passes, which is the precise proof that the loop reaches Germany. The file is
copied before the edit and restored from that copy in the same command, never with `git checkout --`,
because that has already destroyed uncommitted work once today.

Lint and the type checker over the changed file. SB-385 came out of SB-260's roast, so it is a child
and closes on the tests covering what it changed.

## What the plan check said

It settled the step I was least sure of. The file uses ordinary `test(...)` calls, with no concurrent
option and no shuffling enabled in the Vitest config, and `concurrent` is false by default, so
declaration order holds and the Areas block sees the clean load. Moving it to its own test would add
another load without improving the guard, so it stays where it is.

It argued the whole list equality is right, and turned my reservation around. Equality catches three
things at once: a missing description, a researched area the loader omitted, and a category nobody
expected. If somebody later seeds sample content into this suite, that is a change to the fixture's
contract, and it *should* fail this test and be reconsidered rather than be quietly accommodated now by
a weaker assertion. Given this card exists because a narrower assertion hid a gap, that is the right
way round.

It confirmed the loader is the right seam for the planted case, and named a trap I had not seen:
planting it in the research constant would move **both** sides of the comparison together, since the
expectation is derived from `RESEARCHED_GUIDES` too, and would prove nothing. Nulling only Germany's
English `CategoryText.description` in the loader keeps the expectation intact while the served result
loses it, so `de` fails and `tr` passes. It also warns the edit must not touch both locales, and that
the failure has to be labelled `de`.

## The step I am least sure of

Test order. The Areas block sits above tests that deliberately mutate the researched data, one
substituting a changed guide into the list and another deleting rows. Vitest runs a file's tests in
order, so the Areas block runs before those and sees clean data. If that ever stopped being true the
loop would fail for reasons that have nothing to do with this card, and the failure would look like a
Germany regression. Worth stating here so the next reader is not misled by it.
