# SB-314, `npm run test:storybook` matches no project and always fails

**Exit:** `npm run test:storybook` runs the four story projects and fails when a story's play
assertion fails.

## Why

`apps/web/package.json` has `"test:storybook": "vitest run --project storybook"`, and
`vitest.config.ts` names the four story projects `storybook:light-ltr`, `storybook:light-rtl`,
`storybook:dark-ltr` and `storybook:dark-rtl`. Nothing is called `storybook`, so the filter matches
nothing and the script exits with "No projects matched the filter". **It cannot ever have run.**

The one command a person reaches for to run the story tests is broken, so the stories are only run
by somebody who already knows the project names, or by CI. A check nobody can run is the same as
no check.

## What the filter alone would give, and why it is not enough

`--project` takes wildcards, which vitest's own help states (`--project=packages*`, and `!pattern`
to exclude), and `--project 'storybook*'` does match the four here. So the card's suggested fix
works as a filter.

**But the command it produces is unreliable on the machine it is for.** Measured today:

| run | result |
|---|---|
| `--project 'storybook*'`, all four together | 6 tests in 5 files failed, 106s |
| the same with `--maxWorkers=1` | 4 tests in 3 files failed, 101s |
| each project alone, four of them | **50 files, 167 tests, all passed**, four for four |
| `YourDetails.stories.tsx` alone, three times | **7 passed**, three for three |

Every failure was in `YourDetails.stories.tsx`, on Change Destination and Choose City, and the set
moved between runs. That file is green alone and green repeatedly alone, so this is **contention,
not a broken story**: four headless Chromium instances starve each other and a `findBy` wait passes
the local timeout. `--maxWorkers=1` does not help, because browser projects manage their own
instances rather than the node pool that flag sizes.

**The config already says so.** SB-284's note sets `STORYBOOK_TEST_TIMEOUT` to 30 seconds on CI and
15 locally, and gives the reason: "locally, uninstrumented and **one project at a time**, the
default still catches a story creeping towards it." The local timeout is calibrated for one project
at a time, so a script that runs four at once breaks the premise the number was chosen under, and
its failures mean the machine was busy rather than that a story is wrong. That is worse than a
script that never ran, because people learn to ignore it.

So `test:storybook` runs the four **one at a time**.

## What changes

`test:storybook` stops being a single filtered run and becomes the four projects in turn, failing
on the first that fails, so its failure names the project and the story rather than the load.

**The matrix moves to a module both sides read.** The check refused the two shapes that drift or
guess: parsing `vitest list` output, and typing the four names into `package.json`. So
`COMBINATIONS` leaves `vitest.config.ts` for a small matrix module which both the config and the
wrapper import, each generating `storybook:${mode}-${direction}` from it. A fifth combination then
reaches the script by existing, not by being remembered.

**Two corrections to this plan, from SB-314's roast.** It said the module sits at the web root: it
does not, it is `src/story-matrix.ts`, because eslint's `no-restricted-imports` refuses a relative
parent import from a test in `src` and the rule was obeyed rather than suppressed. And it said both
new files were added to `tsconfig.node.json`'s include: only `scripts/story-tests.ts` was, the
matrix being covered as a `src` file by the app project and pulled in by the runner's import. The
type coverage is real; the sentence describing it was not.

The roast also found the drift is only **partly** removed, which this plan claimed outright: the
matrix is shared, but the project NAME is still generated twice, once in the module and once in the
config. That is **SB-346**.

The wrapper is `scripts/story-tests.ts`, run by `tsx`, which this workspace already has and which
the API's own scripts already use. It must do three things the check named: run each project by its
exact name **in sequence**, **stop at the first failure**, and **pass the child's non-zero exit
status out**, since swallowing that is one of the two ways this lands broken. The other is matrix
drift, which the shared module removes.

Both new files join `tsconfig.node.json`'s `include`, which is an explicit list, so
`npm run typecheck` covers them. That is what the check meant by validating the module through the
existing typecheck: nothing else in this workspace would look at them.

**It runs from the web, not the repository root**, whose scripts are empty: `npm run test:storybook`
inside `apps/web`, or `npm run test:storybook -w @skipbureau/web` from anywhere.

**Nothing else uses this filter.** `test:unit` filters on `unit`, which is a real project name and
works. `test:coverage` and CI's web job run every project in one instrumented run with the 30 second
CI timeout and are green, and **CI is deliberately left alone**: the check found no evidence it is
merely lucky, and widening this card into CI without that evidence would be inventing work.

**`YourDetails.stories.tsx` gets no card**, on the same reasoning. It is the first file to break
under load because it mounts a router, MSW and portalled MUI and waits with `findBy`, but it passes
alone, repeatedly alone, and in every project run serially. The check's line is that it earns a card
only if it fails serially or alone, and it does not.

## The tests

This card has **no parent**, so it closes on the **full suite**: the API's, and the web's unit and
story projects, plus lint and `lint:tsc`.

The exit's own case: a play assertion in a story made to fail, and `npm run test:storybook` watched
failing on it, naming that story, then reverted and watched passing. That is what proves the script
runs the stories rather than merely exiting zero.

## The steps I am least sure of

**Deriving the four names.** Importing `COMBINATIONS` from a TypeScript config into a plain node
script needs a loader; parsing `vitest list` output is brittle; hard-coding drifts. One of the three
has to be chosen with its cost stated.

**Whether serial is the right answer rather than a longer local timeout.** Raising the local timeout
would let one run do it, at the price of the creep check SB-284 deliberately kept.
