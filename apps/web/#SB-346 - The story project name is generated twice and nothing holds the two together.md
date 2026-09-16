# SB-346, The story project name is generated twice and nothing holds the two together

**Exit:** the config and the runner take every project name from one function, and changing the
naming in that function alone moves both; proved by changing it and watching
`npm run test:storybook` still run four projects.

## Why

SB-314 moved `COMBINATIONS` into `src/story-matrix.ts` so the config and the runner could not
drift, and over the **matrix** they no longer do. Its roast found the drift was only half removed:
the **name** is still built twice.

- `src/story-matrix.ts:18` builds `` `storybook:${mode}-${direction}` `` for `STORY_PROJECTS`,
  which `scripts/story-tests.ts` runs.
- `vitest.config.ts:81` builds the same string again for each project's `test.name`.

Change the prefix or the separator in the config and the runner asks for projects that do not
exist. `src/story-matrix.test.ts` never reads the config, so nothing there fails.

**What that costs is smaller than this plan first said**, and the check corrected it: the command
would not silently run nothing, as SB-314's did. `scripts/story-tests.ts` passes the child's
non-zero status out, and vitest throws when a requested project does not exist, so a mismatch is a
loud local failure. The fault is duplication that can send the runner somewhere real code never
goes, not a return to the false green.

## What changes

One exported `storyProjectName` in the matrix module, used by both.

It takes the **exact `StoryCombination` union**, exported from the matrix, so no caller can name a
project for a combination the matrix does not hold. The first draft took
`{ mode: string; direction: string }` structurally, to sidestep a reconstructed object not being
assignable to a union of four literal shapes; the check refused that as losing a real guarantee for
no benefit, and it is right. The config's map therefore takes the whole combination and
destructures `mode` and `direction` **inside** the callback, where `initialGlobals` needs them, and
passes the value itself to `storyProjectName`.

`STORY_PROJECTS` becomes `COMBINATIONS.map(storyProjectName)`, so the runner and the config read
the same function rather than the same template.

## What this does not do, said plainly

**Nothing asserts at runtime that the config uses it.** The drift is removed *by construction*: one
function, two call sites. A test cannot check it without importing `vitest.config.ts`, which brings
its plugins and a browser provider into a unit run, and that is a worse thing to own than the
guarantee is worth. If the config is later changed to build the string again by hand, this card's
guard is a person reading it, not a test.

That is the honest limit of a one point card here, and it is why the exit asks for the rename proof
rather than for an assertion.

## The tests

`src/story-matrix.test.ts` keeps asserting the four literal names. That is the human-visible
contract: what somebody writing a filter, a CI job or a bug report would type. A test asserting
`STORY_PROJECTS` equals `COMBINATIONS.map(storyProjectName)` would restate the implementation and
prove nothing.

**The exit's proof, and what it costs.** The naming inside `storyProjectName` is changed, and
`npm run test:storybook` is watched **still running four projects**, because the config follows the
same function. The unit test **fails during that plant**, by design, since its literal names are
exactly the decision point a rename should stop at; that is recorded rather than worked around, and
the plant is reverted after.

## How it is checked

SB-346 came out of SB-314's roast, so it is a child: the tests covering the files it changes, which
are the web's unit project, for `story-matrix.test.ts`, and the four story projects, since
`vitest.config.ts` is what names them, plus the web's lint and `typecheck`. No deployment reads
this: it changes what a developer command targets, not anything served.

## The steps I am least sure of

**Whether the structural parameter is right**, or whether the union should be exported as a type
and the config's map restructured to pass the whole combination. The second is tidier and touches
more of a config whose comments record two separate hard-won fixes.
