# AppTheme

Puts the theme in place and keeps the document's `dir` in step with it.

## Props

- `mode`: `system` follows the reader's operating system and is the default, so a caller that says nothing gets the mode the reader asked their machine for, from CSS alone. A named mode overrides it, which is what Storybook's toolbar does, through an attribute on `<html>`.
