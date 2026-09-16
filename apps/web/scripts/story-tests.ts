import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STORY_PROJECTS } from '../src/story-matrix'

// SB-314: the four story projects, run one at a time.
//
// `vitest run --project storybook` matched nothing, because the projects are named storybook:light-ltr and its three
// siblings, so this command exited with "No projects matched the filter" and can never have run. A wildcard filter
// does match them, but running the four together fails on a developer machine: measured here, six tests in five files,
// then four in three, always inside YourDetails.stories.tsx and never the same set, while each project alone passes
// 167 of 167. Four headless browsers starve each other and a findBy wait passes the timeout.
//
// That timeout is the reason this is serial rather than one filtered run. vitest.config.ts gives stories 30 seconds on
// CI and 15 locally, and says why: locally, uninstrumented and ONE PROJECT AT A TIME, the default still catches a
// story creeping towards it. A script running four at once breaks the premise that number was chosen under, and its
// failures then say the machine was busy rather than that a story is wrong, which is worse than never running.
//
// CI is deliberately untouched: it runs every project in one instrumented pass with the 30 second timeout, and is green.
const require = createRequire(import.meta.url)
const vitest = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs')
const web = join(dirname(fileURLToPath(import.meta.url)), '..')

for (const project of STORY_PROJECTS) {
  console.log(`\n=== ${project} ===`)
  const run = spawnSync(process.execPath, [vitest, 'run', '--project', project], { cwd: web, stdio: 'inherit' })
  // Stop at the first failure, and carry its status out: a wrapper that swallows a child's exit reports a green run
  // over a red one, which is the one way this lands worse than the command it replaces.
  if (run.status !== 0) process.exit(run.status ?? 1)
}
