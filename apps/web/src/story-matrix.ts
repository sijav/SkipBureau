// The story matrix, read by both vitest.config.ts, which makes a project per combination, and scripts/story-tests.ts,
// which runs them (SB-314). One place, so the projects a run covers and the projects a script runs cannot drift: a
// fifth combination reaches the script by existing rather than by being remembered.
//
// It sits in src so the test beside it can import it the way this project requires, absolutely rather than through a
// relative parent path. The config and the script reach it by relative path, which that rule does not cover.
//
// Mode x direction, in the base language. Direction is not a language: RTL is shared by many, and the product is
// multi-language, so nothing is tested per language. The owner, 2026-09-10.
export const COMBINATIONS = [
  { mode: 'light', direction: 'ltr' },
  { mode: 'light', direction: 'rtl' },
  { mode: 'dark', direction: 'ltr' },
  { mode: 'dark', direction: 'rtl' },
] as const

/** One of the combinations above, so nothing can name a project for a combination this matrix does not hold. */
export type StoryCombination = (typeof COMBINATIONS)[number]

/**
 * The name vitest gives a combination's project, built here and nowhere else (SB-346).
 *
 * vitest.config.ts named its projects with the same template this module used, so the two agreed by coincidence:
 * changing the prefix or the separator in the config would have sent scripts/story-tests.ts after projects that do
 * not exist. It would have failed loudly, since vitest throws on a project it cannot find and the runner passes that
 * status out, but loudly wrong is still wrong. One function, both callers.
 */
export const storyProjectName = ({ mode, direction }: StoryCombination): string => `storybook:${mode}-${direction}`

/** Every project the matrix makes, in its order. */
export const STORY_PROJECTS: readonly string[] = COMBINATIONS.map(storyProjectName)
