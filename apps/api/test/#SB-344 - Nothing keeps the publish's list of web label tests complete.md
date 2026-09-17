# SB-344, nothing keeps the publish's list of web label tests complete

**Exit, as the card words it:** a new web unit test importing from `api/` fails a
test until it is named in the publish's list, watched failing by adding one.

This plan lives in `apps/api/test/` because the guard lands in
`publish-research.spec.ts`.

## What is there, measured

- **The list.** `publish-research.ts` line 510, `labelTestArgs`, returns
  `[vitest, 'run', '--project=unit', 'src/shared/context-control/situationLabels.test.ts',
  'src/shared/rule-answer/factLabels.test.ts']`, run with `cwd: WEB`, so those two
  paths are relative to `apps/web`.
- **It is complete today, so this is drift prevention and not a live hole.** Exactly
  two files under `apps/web/src` import through the `api/` alias, and they are those
  two. Renaming one already fails loudly, because vitest is handed a path that no
  longer exists. Adding a third is what nothing notices.
- **What "web unit test" means, exactly.** `vitest.config.ts` line 44: the unit
  project's `include` is `['src/**/*.test.ts']`. Not `.tsx`. There are 18 matching
  files today and no `.test.tsx` at all. The scan has to use that same pattern, or
  the guard and the thing it guards would disagree about what they are counting.
- **The alias.** `apps/web/tsconfig.app.json` line 9,
  `"api/*": ["../api/src/*"]`, so `api/` reaches the API's `src` and nothing else.
- **`API` and `WEB` in the script are `const`, not exported**, so the spec cannot
  import the web's root and has to resolve it itself.

## A broad scan gives a false positive, which decides the matcher

Searching `apps/web/src` for `api/` in any form finds **three** files, not two. The
third is a comment in `TaskHub.stories.tsx` mentioning
`apps/api/test/hub-sample.e2e.spec.ts`.

So a substring scan would report a stories file as an unnamed importer, and the guard
would fail for a sentence somebody wrote. The matcher has to look at **import
specifiers**: `from 'api/...'` or `from "api/..."`, and `import('api/...')`. It is
worth saying out loud that this is a regex over source text and not a parse, which is
the weaker half of this card and is recorded below rather than glossed.

## Where the test goes, and why not the web

The web cannot see the list it would be checking: its alias maps `api/*` into
`apps/api/src`, and `publish-research.ts` lives in `apps/api/scripts`, which no alias
reaches. From `apps/api/test` both sides are in reach, `labelTestArgs` as an ordinary
import and the web tree as a path. So the guard goes beside `publish-research.spec.ts`,
which already imports that function for the pinned argument test.

## The idiom is the house's, not a new one

`apps/web/src/core/theme/tokens.test.ts` already scans a tree for an inventory: a root
from `join(dirname(fileURLToPath(import.meta.url)), '..', '..')`, a recursive
`readdirSync` walk with `statSync` for directories, and

```ts
relative(SRC, file).split('\\').join('/')
```

before comparing. **That normalisation is load bearing here rather than cosmetic.**
`labelTestArgs` names its files with forward slashes, and on this machine `relative`
returns backslashes, so without it every test would read as unnamed and the guard
would fail on a correct repository.

**The guard departs from that idiom in one place, for the better.** `tokens.test.ts`
hardcodes a backslash as the separator to split on. This uses `sep` from `node:path`
instead, which is the platform's own separator, so the guard does not assume Windows
and needs no escaping at all.

That second point is not theoretical. The first attempt at this line did hardcode the
backslash, and it reached the file as a single one rather than an escaped pair,
because the tool layer decodes one level of escaping before the shell sees it and
Python decodes another. The spec then failed to parse with Unterminated string
constant and collected no tests at all. Using `sep` removes the class of mistake
rather than getting the escaping right once.

## The approach

1. In `publish-research.spec.ts`, resolve the web's `src` from the spec's own
   location and walk it for files matching the unit project's pattern,
   `src/**/*.test.ts`.
2. Keep the ones whose source contains an import specifier beginning `api/`.
3. Compare that set with the paths `labelTestArgs` names, both as web relative paths
   with forward slashes, sorted.
4. Fail with a message that says what to do: name it in `labelTestArgs`, or say why
   it should not run in a publish.

## Files

- `apps/api/test/publish-research.spec.ts`, the guard.
- this plan.

## How it is proved

Exactly as the exit words it. A third web unit test that imports from `api/` is added
by hand; the new guard must fail, naming that file. It is then named in
`labelTestArgs` and the guard must pass. Both are then removed and the suite is green
again. The failing half is the point: a guard that has only been seen passing has not
been seen working.

## Equality, not "every importer is named", and the cost of that

The card says the two sets must be **equal**, and that is right: equality also catches
the opposite drift, a file named in `labelTestArgs` that no longer imports `api/` and
so is run by every publish for no reason.

It has a cost worth stating. Equality refuses a deliberate exclusion, so somebody who
writes an `api/` importing test they do NOT want a publish to run has to change the
guard rather than just not list it. The failure message should say that, so the next
person meets a decision rather than a puzzle.

## The twin is filed, not folded in

`LABEL_SOURCES` at line 495 is the same shape: two web paths, hand written, feeding
the guard that refuses a publish whose label files are uncommitted. Adding a third
label source is unnoticed in exactly the same way. It is **SB-437** rather than part
of this card, because this exit names the test list specifically and the two lists
guard different things. The note there records a coupling worth using: each file
`labelTestArgs` names imports the label source it tests, so that list could be
derived from these rather than written out again.

## The plan check was asked twice and ruled nothing

**The first attempt failed outright.** codex/gpt-5.6 broke off part way through its
own output, codex/gpt-5.6-terra was skipped as out of its usage window, and the
claude/sonnet fallback produced no output.

**The second attempt is the one worth recording carefully, because it did not fail.**
It returned text, and the text reviews nothing: sonnet answered as though it were the
loop agent in a different session, reporting that Bash was blocked and that it could
not run the todo script, git, the tests or the roast. It is a reply about somebody
else's situation, not a check of this plan.

That distinction matters more than the outage itself. A check that fails is obviously
a check that did not happen; a check that returns a confident paragraph about
something else can be skimmed and recorded as a review. So it is written here as what
it was: asked twice, ruled nothing, built anyway, with the reasoning for every choice
set out above rather than resting on a reviewer's agreement.

If terra returns before this card closes, the questions are still worth asking and
any ruling will be recorded here, including one that contradicts what was built.

## Planted, and what the middle run taught

A third web unit test importing through the alias was added by hand, named, then both
were removed, in one scripted sequence so the tree never carried it between steps.

**1. Unnamed, the guard fails and names the file:**

```
AssertionError: a web unit test that imports through the api alias must be named in
labelTestArgs, or a publish checks less than it claims ...
+   src/shared/rule-answer/planted-sb344.test.ts
Tests  1 failed | 26 passed (27)
```

**2. Named, the guard passes, and something else fails.** The run still reported one
failure, but a different assertion: the pinned argument test, with
`expected [ '/x/vitest.mjs', 'run', ...(4) ] to deeply equal [ ...(3) ]`. That test is
the record of exactly what a publish runs, so adding a path to `labelTestArgs`
correctly breaks it until it is updated too.

**That is a real finding and the guard was changed because of it.** Naming a new
importer changes TWO places, the function and its pinned test, and the second failure
is a bare array diff that says nothing about why. Somebody doing exactly what the
first message told them would land in it and be puzzled. The message now says to
expect it and to update that test as well, which is the difference between a guard
that refuses and a guard that helps.

It also matters for reading this record: runs 1 and 2 both say 1 failed of 27, and
they are not the same failure.

**3. Both removed, green again**, 27 passed, with the script and the planted file both
clean against HEAD, the script restored from a copy rather than from git since the
spec beside it held this card's uncommitted work.

**And the other direction, which this plan claimed and had not tested.** The equality
section above says the guard also catches a file named in `labelTestArgs` that no
longer imports the alias, and nothing had shown that. Naming
`src/shared/layout.test.ts`, a real web unit test that does not read the API:

```
Failed Tests 2
AssertionError: a web unit test that imports through the api alias must be named in
labelTestArgs ... expected [ ...(2) ] to deeply equal [ ...(3) ]
-   src/shared/layout.test.ts        the guard: listed, but not found
+   src/shared/layout.test.ts        the pinned argument test, as the message warns
Tests  2 failed | 25 passed (27)
```

Reverted, green again at 27, the script clean against HEAD. So equality is proved in
both directions rather than asserted in one: an unnamed importer fails, and a named
non-importer fails. Only the first is in the card's exit; the second was this plan's
own claim, and finding it untested is the reason to reread what you wrote before
closing rather than after.

**The closing gate**, SB-344 being a child of SB-286 and so closing on the tests for
what it changed:

```
API suite   21 files, 219 tests passed, where it was 218   exit 0
API lint                                                   exit 0
API typecheck                                              exit 0
```

## The step I am least sure of

**The matcher is a regex over text, not a parse.** It will miss an import written in
a way I have not thought of, and the failure mode is the quiet one: a third importer
that the pattern does not match is a test the publish never runs while the guard says
everything is named. A real parse is available, since TypeScript is already a
dependency, but running the compiler over 18 files inside a unit test to catch a case
that has never occurred is machinery this card does not warrant.

The honest mitigation is that the planted proof uses an ordinary import, the same form
both real importers use, so the guard is shown working on the shape that actually
occurs. That is a smaller claim than "no import can escape it", and the plan says so
rather than implying the stronger one.

**And then I stopped shrugging and tried the forms.** Saying a regex "will miss something I have not thought of" is honest the first time and lazy the
second, because the shapes an import can take are enumerable. Run against the matcher:

```
match   import { RESEARCHED } from 'api/rules/research/countries'
match   import { X } from "api/guide/researched-guides"        double quoted
match   const x = await import('api/rules/research/countries')  dynamic
match   export { X } from 'api/guide/researched-guides'         re-export
match   import 'api/side-effect'                                side effect only
match   } from 'api/guide/researched-guides'                    multi-line continuation
ignore  // The pair apps/api/test/hub-sample.e2e.spec.ts ...    the real comment
ignore  import { X } from 'src/api/thing'                       a different api
ignore  import { X } from './api/thing'                         relative
ignore  import { X } from '../api/thing'                        relative
ignore  const note = "see api/rules for the shape"              prose in a string
```

So the claim is now narrower and stronger than the disclaimer above: every import
form that occurs in this repository is matched, the relative and differently rooted
paths that would be false positives are not, and the one comment that actually exists
and would have fooled a substring scan is ignored. What remains unproved is an exotic
form nobody has written, which is a much smaller admission than the one this section
opened with.
