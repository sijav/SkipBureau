import { expect, test } from 'vitest'
import { COMBINATIONS, STORY_PROJECTS } from 'src/story-matrix'

// SB-314: vitest.config.ts makes a project per combination and scripts/story-tests.ts runs them, both from this one
// module, so the set cannot drift. This holds the generated names to the shape the config's project names have, which
// is what a filter or a script would be written against, and fails if a combination is added without deciding here.
test('each combination names one story project, and the names are the four the config makes', () => {
  expect(STORY_PROJECTS).toEqual(['storybook:light-ltr', 'storybook:light-rtl', 'storybook:dark-ltr', 'storybook:dark-rtl'])
  expect(STORY_PROJECTS).toHaveLength(COMBINATIONS.length)
  expect(new Set(STORY_PROJECTS).size, 'two combinations naming one project would run it twice and skip one').toBe(COMBINATIONS.length)
})
