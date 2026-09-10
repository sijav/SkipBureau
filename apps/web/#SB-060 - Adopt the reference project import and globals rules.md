# SB-060, adopt the reference project import and globals rules

**Exit condition:** the rules are enforced by lint, and the repository passes
them.

## What is actually there

Counted, not guessed:

| rule | violations today |
|---|---|
| MUI from the top level barrel only | **34** deep imports |
| no relative parent imports | **6** |
| browser globals through `window.*` | **7** |
| every folder with more than one file has `index.ts` | **0** |

The last row is worth stating: every feature folder already has a barrel. Only
`src` itself does not, and it is the application root holding `main.tsx`,
`AppRoot.tsx` and a type declaration, which is not a module anyone imports
from. So that half of the card is already satisfied and the lint rule is there
to keep it that way.

## What the rules are for, since two of them look like taste

**`window.*` is not style.** The reference project's reason, carried over: a
global reached through `window` is mockable and greppable. `systemMode.test.ts`
already depends on exactly that, stubbing `window.matchMedia` in a node
environment where no `window` exists. A bare `matchMedia` would have been
untestable without jsdom.

**The barrel rule is about one import path per thing**, so that a component
cannot be imported two ways and end up in the bundle twice, and so that moving
a file inside a module is not a change to everyone who uses it.

## The approach

`eslint.config.mjs` gains two rules:

- **`no-restricted-imports`** with patterns for `@mui/material/*`, for `../*`
  and `..`, and for `.`. Each with a message saying what to do instead, because
  a rule that only says "restricted" gets suppressed rather than obeyed.
- **`no-restricted-globals`** for `document`, `localStorage`, `navigator`,
  `fetch` and `crypto`.

Then the 47 call sites move. All mechanical, and the type checker catches
anything I get wrong.

### `@mui/material/styles` is not an exception

I expected to need one. Checked against the installed package instead of
assuming: `createTheme`, `ThemeProvider` and `useTheme` are **all exported from
the top level barrel** in 9.4, alongside the components. So the rule can be
flat, `@mui/material/*` is restricted with no carve out, and `theme.ts`,
`AppTheme.tsx` and `Tokens.stories.tsx` move with everything else.

### Cross-module imports go to the barrel, not the file

`src/core/router/paths.ts` reaches `../country/countries` and
`../i18n/locales`. Those become `src/core/country` and `src/core/i18n`. The one
to watch is `src/core/graphql/mocks/handlers.ts`, which reaches `../client`:
both live inside `core/graphql`, and importing that module's own barrel from a
folder the barrel does not export would be a cycle. It becomes
`src/core/graphql/client`, an absolute path within the same module, which is
what the no-parent-import rule is actually asking for.

## Files

| file | change |
|---|---|
| `apps/web/eslint.config.mjs` | the two rules |
| 34 files with deep MUI imports | top level barrel |
| 6 files with `../` imports | absolute, at the barrel |
| 7 files with bare globals | through `window.*` |

## How it meets the exit condition

`npm run lint` with `--max-warnings 0` passes, which it cannot do unless every
violation is gone, and the rules are what make the violations visible. Watched
failing on a planted case: reintroduce one deep MUI import and one bare
`document`, confirm lint names both and says what to do instead, then revert.

`npm run typecheck` and the tests are what prove the rewrites did not change
behaviour, since every one of them is a moved import or a `window.` prefix.

This is a **child** of SB-029, so it closes on the tests for the files it
touches plus lint and the type checker. In practice that is the whole web suite,
because the files it touches are spread across every folder.

## The plan check said do the opposite, and it is overruled

It found that MUI's own 9.4 guidance still recommends `@mui/material/Button`
style paths, warns that barrel imports slow development startup and rebuilds,
and ships an eslint rule that prohibits the barrel. That is the inverse of this
card.

**Rejected, and here is the evidence rather than an assertion.** The rule came
from the owner's reference project, so I looked at what that project does:

```
D:\Kar\Gandom\daramadname
  top-level barrel: 63
  deep paths:        0
  AGENTS.md:209  MUI from the top-level barrel only: `import { Button } from '@mui/material'`.
```

The owner set this convention, wrote it down, and has lived with it across 63
call sites. The owner outranks a vendor guide, and a reviewer's general advice
does not get to quietly reverse a decision that was made deliberately.

**The cost is real and belongs on the record**, which is the useful half of the
finding: the price is development server startup and rebuild time, not
production bundle size, since tree shaking handles either form. If cold start
becomes painful, that is a measurement to bring to the owner, not a reason to
break the rule now.

## What it was right about

**The patterns do not enforce what the card claims.** Blocking `../` stops
parent-relative imports and does nothing about `src/core/country/countries`
from another module, which reaches past the barrel by an absolute path. Nor can
`no-restricted-imports` require that a multi-file folder has an `index.ts`.

So the rule is written to allow a module to reach its own internals and to stop
another module reaching them: each `src/core/<module>` and `src/shared/<module>`
is restricted from outside itself, by path pattern, with the barrel as the
permitted entry. Where that cannot be expressed, the plan says so rather than
claiming enforcement it does not have.

**`globalThis.document` escapes `no-restricted-globals`.** The rule catches bare
`document`, including `const { documentElement } = document`, and TypeScript's
DOM declarations do not change that. But `globalThis.document` and
`self.document` slip through, and the `checkGlobalObject` option that would
catch them also rejects `window.document`, which is the form this project wants.
So those two get their own narrow restriction instead.

## The step I am least sure of

**Whether the barrel import costs anything in the dev server.** Deep MUI
imports exist historically because a barrel import of a large library made Vite
pre-bundle or re-parse far more than the component needed, and cold start
suffered. If 9.4 with Vite 8 still has that problem, this rule trades a real
daily cost for a consistency I am asserting is worth it, and I would rather
know before changing 34 files than after.

The related unknown is whether `no-restricted-globals` even fires for
`document.documentElement`. It restricts references to global *identifiers*, and
I believe `document` qualifies, but if TypeScript's DOM lib makes it resolve
differently the rule silently protects nothing, which is the failure mode this
project keeps finding.
