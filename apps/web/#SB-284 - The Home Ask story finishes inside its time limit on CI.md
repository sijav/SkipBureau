# SB-284, The Home Ask story finishes inside its time limit on CI

**Exit:** CI passes on a push that carries the change, the Home Ask story passes in all four Storybook
projects there, and SB-279's guides are prerendered on the live site.

## What fails

CI's `test:coverage` runs the unit project and the four Storybook projects in one Vitest run, with V8
coverage. Vitest 4.1.11 gives a browser test fifteen seconds when nothing sets a limit
(`resolved.testTimeout ??= resolved.browser.enabled ? 15e3 : 5e3`, read in its installed source), and
neither `apps/web/vitest.config.ts` nor @storybook/addon-vitest 10.6.0 sets one.

The story Screens/Home > Ask failed at that limit in run 34964972674 (11:45 on 2026-09-15, light-ltr)
and twice in run 35005583976 (18:10 in light-ltr, and on its rerun at 18:18 in dark-ltr), each at about
15.1 seconds, with every other test passing. In that rerun it passed in two other projects at 11.2 and
13.3 seconds. The next slowest stories there are Home's Default at 8 to 9 seconds and RoadmapStep's
Default at about 7. The pages job needs the check job, so SB-279's commit, green in every local check,
was never deployed.

The story already preloads only the Ask panel's code: its own comment records that preloading every lazy
part fixed it on this machine and broke CI, where fetching every chunk took it past fifteen seconds. What
is left is waiting through the page's first render, the panel, and a typed search, under instrumentation,
with five projects sharing the runner.

## The change

- The four Storybook projects in `apps/web/vitest.config.ts` set `testTimeout` from one constant,
  thirty seconds when `CI` is set and fifteen otherwise, with a comment giving the measured CI times: an
  instrumented run of the five projects takes a screen story to thirteen seconds and more, which leaves
  the fifteen second default no margin. Twice the default covers the slowest measured story with room to
  spare, and a story that hangs still fails. Locally, uninstrumented and one project at a time, a story
  creeping towards fifteen seconds still fails where it is noticed.
- The unit project keeps Vitest's five seconds. Nothing in the app or in any story changes.

## Why the limit and not the story

Making Ask faster means changing what it proves, fewer typed characters or no lazy panel, and the stories
after it are already past half the limit under instrumentation, so the next screen story would meet the
same wall. The limit belongs to the run, so it goes where the run is configured.

## How it is checked

- Watched failing and passing: the Ask story given a twenty second wait inside its play, run alone in one
  Storybook project, fails at fifteen seconds with `CI` set before the change, passes with `CI` set after
  it, and still fails at fifteen seconds without `CI` after it, which shows the project's limit is the one
  its stories get, and only on CI. The wait is taken out again, byte for byte.
- The four Storybook projects, one at a time, all passing; lint and `tsc -b`, which covers the config.
- Pushed: CI's check job passes and the pages job deploys, and then SB-279's four guides are looked at on
  the live site.

Checked on 2026-09-15 and approved with one change, taken: the longer limit only when `CI` is set, so a
local run keeps fifteen seconds. The check read the story and Ask and found the extra seconds are browser,
coverage and render work, with no delay in the mocked query and no defect in Ask; confirmed that the
plugin turns stories into ordinary Vitest tests that take the project's limit; and noted that the planted
wait proves the wiring, while only the CI run proves the real story is stable.
