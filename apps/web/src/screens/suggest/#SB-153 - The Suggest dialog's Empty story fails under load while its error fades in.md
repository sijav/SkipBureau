# SB-153, The Suggest dialog's Empty story fails under load while its error fades in

**Exit:** the Empty story waits for the error text to be visible, and five
full-suite runs in a row pass it.

## What fails

`SuggestUpdate.stories.tsx` Empty clicks Send, then asserts the field's error
with `expect(dialog.getByText(...)).toBeVisible()`. `getByText` finds the node
at once and `toBeVisible` is checked once. Under the full suite the dialog is
still fading in at that moment, its opacity is not yet 1, and the check fails.
Alone it passes, because by then the transition is over.

It matters more than a flaky test usually does: a red CI run skips the Pages
deploy, so this story has already held back a publish once, on the SB-077
board commit.

## The change

Wait for the state instead of sampling it: `waitFor` around the visibility
check, the way the neighbouring stories already `findBy` before they assert.
Nothing else in the story changes, and the component does not change.

## How it is checked

The story file alone, then the full suite five times in a row, which is what
the exit asks for.
