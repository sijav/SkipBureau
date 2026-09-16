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

/** The name vitest gives each combination's project, generated the one way, here. */
export const STORY_PROJECTS: readonly string[] = COMBINATIONS.map(({ mode, direction }) => `storybook:${mode}-${direction}`)
