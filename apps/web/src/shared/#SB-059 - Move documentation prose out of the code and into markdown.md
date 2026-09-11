# SB-059, Move documentation prose out of the code and into markdown

**Exit:** no .ts or .tsx file carries a paragraph that explains a component
rather than a line of code; the prose that was there is in markdown beside it.

## The line

The owner's, from the reference project: prop docs belong with the stories,
not in the `.tsx`, and prose goes in markdown, not in comments. The working
agreement draws it as: a comment that explains the code to whoever edits it
stays; prose that explains the component to whoever uses it moves.

So this moves:

- the docblock above an exported component, which says what the component
  is, which Figma node it draws, and how it behaves for whoever places it;
- the docblocks on its props, which say what each prop means.

And this stays: comments on lines of code, the reasoning in `src/core` about
why a mechanism works the way it does (the prerender, the router's policies,
the theme's variables), and the docblocks on helper functions, which are read
by whoever edits their callers.

## Where it goes

`<Component>.md` in the component's own folder, beside `<Component>.tsx`:
the component's prose, then a `## Props` list, one line per prop,
`` - `name`: what it means ``. English only: the owner's order of 2026-09-10
makes English the base and forbids a test per language.

## Where it is read

Storybook has no Docs pages today: autodocs is off and there is no MDX, so the
prose in the `.tsx` files is the only documentation the components have. The
preview turns autodocs on for every story file and gives it one page,
`.storybook/ComponentDocs.tsx`: the title, the component's markdown when it
has one (found by the component's name among the `.md` files beside the
components), the primary story, the controls and the stories. No story file
changes, and no test is added, per the owner's order of 2026-09-10.

## How

A script does the mechanical part for `src/shared` and `src/screens`: for each
component file, it lifts the docblock above the exported component and the
docblocks on its props type into the markdown file, and removes them from the
`.tsx`. Then every diff is read by hand, because the script cannot tell a
paragraph for the reader from one for the editor, and a block that turns out
to explain the code goes back.

## Least sure of

- **Blocks that do both.** Some component docblocks mix what the component is
  with why a line is written the way it is. Those split: the first part moves,
  the second stays beside the line it explains.
- **Storybook's docs page API in 10.6**: `@storybook/addon-docs/blocks`, as the
  reference project uses it, read from the installed version before writing.

## What building it turned up

- **69 markdown files**: 46 in `src/shared`, 15 in `src/screens`, and 8 in
  `src/core` for its components (the router's guard and shells, the
  providers, the theme), whose contracts are documentation like any other
  component's. The core's reasoning about how things work stayed.
- **Nine blocks were about the code after all** and went back beside the
  line each explains: AppShell's `100dvh`, why ContextPopper and LanguageMenu
  are files of their own, why StructuredData renders nothing until hydrated,
  why SuggestUpdate is two siblings, GraphQLProvider's `useMemo`, and
  AppTheme's `dir` effect and `CssBaseline`.
- **`<bdi>` written in markdown is markup**, an invisible element on the Docs
  page, so it is in backticks.
- **The plans are markdown under `src/` too**, and their `#` reads as the
  start of a URL fragment in an import, which failed the Storybook build; the
  Docs page's glob leaves them out.
- **Checked**: Storybook built with 48 Docs pages, GuideCard's showing its
  prose and its props list under the title; the extractor run again finds no
  docblock above a component or on a props type anywhere in `src`; typecheck,
  lint and the full suite, 585 of 585.

## How it is checked

Typecheck, lint and the full suite (stories must still render); Storybook
built and a Docs page opened to see a component's markdown on it; and a search
of the `.tsx` files under `src/shared` and `src/screens` for docblocks above
components and props, which should find none.
