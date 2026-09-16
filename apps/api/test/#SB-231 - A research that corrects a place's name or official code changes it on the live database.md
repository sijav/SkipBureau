# SB-231, A research that corrects a place's name or official code changes it on the live database

**Exit:** on PGlite, a place deployed with a missing or different official code or name is corrected by
the next publish of its research, the publish records the change, and publishing again changes
nothing.

## The behaviour exists. Only the proof is missing

The card's own note suspected this and it is confirmed at `load.ts:274`. A place already stored is
compared field by field against what its file says, and `officialCode` is one of the fields:

```ts
const wanted = { countryCode: rules.country, parentCode: region.parent, name: region.name,
                 officialCode: region.officialCode ?? null, research: rules.research }
...
} else if (stored.countryCode !== wanted.countryCode || stored.parentCode !== wanted.parentCode ||
           stored.name !== wanted.name || stored.officialCode !== wanted.officialCode ||
           stored.research !== wanted.research) {
  await tx.region.update({ where: { code: region.code }, data: wanted })
  report.regionsChanged += 1
}
```

So a missing or wrong official code IS corrected and IS counted, and SB-202 built that. This card
writes the test that would notice if it stopped being true.

## It has to be a GERMAN place, which the existing test cannot give

The spec already has "a name an editor changed is set back to the file's", at line 1405, and the
obvious move would be to extend it. **It cannot be**: that test is `TR-16`, and **no Turkish region
states an official code at all**. Only Germany's `cities.ts` does, with `09162000` for München and
four more. So the new case is its own test, on a German city, and the name half of the exit is already
covered for Turkey by the existing one.

## Loading Germany alone is safe, which I checked rather than assumed

A load deletes only rows it owns, and ownership is scoped to the files it was handed:

```ts
const owners = new Set(files.map((rules) => rules.research))
const ownedByLoad = (research) => research !== null && owners.has(research)
```

So `loadResearchRules(prisma, [GERMANY])` can correct and remove German rows and **cannot touch
Turkey's**, whose `research` marker is not in `owners`. That is why the existing single-file tests are
safe, and it is what makes this test safe to write.

## What the test does

One test, in `research-rules.e2e.spec.ts`, mirroring the shape of the editor-name case:

1. take a German city from `GERMANY.regions` that states an official code, and snapshot
   `ownedBy('germany')`;
2. break it on the database three ways, which are the exit's cases: the official code set to `null`,
   the official code set to a different value, and the name changed;
3. load `[GERMANY]` after each and assert the report is `{ ...NOTHING_CHANGED, regionsChanged: 1 }`
   and the row reads back as its file states;
4. load `[GERMANY]` once more and assert `NOTHING_CHANGED`, and that `ownedBy('germany')` equals the
   snapshot taken at the start.

Step 4 is the exit's third clause, "publishing again changes nothing", and step 3's report is its
second, "the publish records the change".

## What the check corrected

**A publish does not load.** I wrote as though `research:publish` applied the correction. It does not:
the publisher runs the research specs, commits, pushes, and then waits for the DEPLOYED loader's
digest receipt. The load happens at deployment startup. So the behaviour under test lives in
`loadResearchRules`, the test is at the right level, and a publisher-level test would add git, GitHub
and deployment machinery without better evidence. The exit now says the next LOAD rather than the next
publish.

**"Changes nothing" was not literally true**, and the card's exit said it. A second load leaves every
researched row untouched and reports zero counters, but it always writes `ResearchLoad.loadedAt`, and
`regionsChanged` is an in-memory report rather than a persisted record of the individual correction.
The exit is narrowed to what actually holds: no researched row changes and the report is zero.

**Only the test and this plan change.** My file list named `load.ts` and `cities.ts`, which contradicts
this plan's own finding that the implementation already exists. Neither is touched.

## What I am least sure of

**Whether one test or three.** The exit names three corruptions and they share a setup, so one test
asserting each in turn reads well and fails clearly, because each assertion names which corruption it
is. Three tests would repeat the snapshot and the load for no extra information. I have written it as
one and would rather be told if that hides a failure.

**Whether the name case is redundant here.** Turkey's `TR-16` test already proves a name is set back.
Including the name for a German city costs one line and proves the same mechanism on the country that
actually carries official codes, so the two corruptions are never proved apart. I think it earns its
line; it is the kind of thing worth disagreeing with.

## How it is checked

`research-rules.e2e.spec.ts` whole, which is the only file this touches, plus lint and the type
checker. SB-231 is a child, so that is its gate. No schema, no research data and no web change, so
nothing is published: the exit is written against PGlite, not the deployed API.
