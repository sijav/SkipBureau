# SB-100, nothing asserts the difference between we failed and we do not cover it

**Exit condition:** a country the server does not list says so; a failed
request says we could not load it and offers a retry; each story asserts its
own message.

## What the card said, and what is actually true

The card was written against `CountryName` fetching its own data and
collapsing both failures into `Unknown country`. That is no longer the code.
SB-080 moved the question to `CountryRoute`, which now reads:

```
if (error) return <Unreachable />
if (!data?.country) return <NotFound />
```

So clauses one and two of the exit condition are already met, by work done for
a different card. `Unreachable` says "SkipBureau could not load this" and
offers a "Try again". `NotFound` says the address may point at a country
SkipBureau does not cover yet. `CountryName` no longer fetches, and its
`Unnamed country` branch is a third fact rather than a collapse of the other
two: a country we do cover, with no name in this language, which is SB-091.

**Clause three is not met, and it is the one that matters.** Neither screen has
a story. Coverage, measured today, says both are at zero statements:

```
src/screens
  NotFound.tsx     0 %   11-12
  Unreachable.tsx  0 %   13-26
```

`Unreachable` is rendered **by no test in either runner**. The e2e suite proves
Not Found because a missing country is easy to arrange; nothing anywhere kills
the API and looks at what the reader is shown. So the distinction the card
exists to protect is real in the code and unprotected by anything.

## The approach

Two story files, `NotFound.stories.tsx` and `Unreachable.stories.tsx`, beside
the components.

Each `play` asserts **the words**, not that an element exists. That is the
whole complaint in the card: the old `ServerDown` story asserted visibility,
which is why the collapse survived review. Asserted through a role query so it
is the heading a reader would land on, with the Persian alternation the
existing `Unnamed` story uses, because the toolbar can run either language.

A comparison story renders **both** and asserts their `<h1>` texts differ from
each other. Two screens that each pass their own test can still be identical,
and only a cross check catches the day someone unifies them. The plan check
corrected the first version of this, which asserted each screen does not
contain the other's fixed wording: that fails every time either message is
reworded, which trains people to delete it. Comparing the two headings to each
other survives rewording and still catches literal unification.

### The retry becomes a prop, and the route fills it in NOW

`Unreachable` hardcodes `onClick={() => window.location.reload()}`. A story
cannot click that: a full page reload inside the Storybook iframe is not an
assertion, it is a crash.

So the retry becomes a prop, `onRetry`. The plan check was sharp about the
condition on that: a prop added only to dodge `location.reload` in a test is
test-shaping, and it earns its keep **only if the route passes a real one
now**. So it does. `useQuery` returns `reexecuteQuery` as its second tuple
element, and `CountryRoute` passes
`() => reexecuteQuery({ requestPolicy: 'network-only' })`.

That is also the better behaviour. Reloading the document throws away the whole
app to retry one query; re-executing asks again in place. The reload stays as
the default for any caller that has nothing better.

### The wiring, which the first draft of this plan did not prove

The check's main finding, and it was right: two story files prove two
components render, and say nothing about whether an errored query reaches
`Unreachable` rather than `NotFound`. That distinction is the entire card.

`CountryRoute` gets its own stories, driven by the MSW handlers that already
exist in `src/core/graphql/mocks` and that no story has ever used, which is why
`handlers.ts` also sits at zero coverage:

| story | handlers | proves |
|---|---|---|
| `Found` | `handlers` | the country resolves and the child route renders |
| `NotCovered` | `emptyHandlers` | a null answer reaches `NotFound` |
| `Unreachable` | `failingHandlers` | an errored request reaches `Unreachable` |
| `Recovers` | a story-local handler that fails **once**, then the real ones | clicking Try again re-executes and the country appears |

`Recovers` is the one that ties it together: it proves the error path, the
retry seam and the recovery in a single run, in a real browser, without killing
an API.

## Files

| file | change |
|---|---|
| `src/screens/Unreachable.tsx` | `onRetry` prop, defaulting to the reload |
| `src/screens/Unreachable.stories.tsx` | new |
| `src/screens/NotFound.stories.tsx` | new |
| `src/screens/index.ts` | new barrel, since the folder now has more than one export |
| `src/core/router/CountryRoute.tsx` | passes `onRetry`, imports through the barrel |
| `src/core/router/AppRoutes.tsx` | imports through the barrel |
| `src/core/router/CountryRoute.stories.tsx` | new, the wiring |

The barrel is not cosmetic: the convention is that cross-module imports target
one, and `CountryRoute` and `AppRoutes` currently reach past it into the files.
Adding the barrel without moving them would leave it unused, which the check
flagged.

## How it meets the exit condition

Clauses one and two are met by the code as it stands and I will show that by
pointing at `CountryRoute`, not by rewriting it. Clause three is met when both
stories pass asserting their own message, which the Storybook project runs in a
real browser.

The guard has to be watched failing: I will make `Unreachable` render
`NotFound`'s heading, confirm both the `Unreachable` story and the cross
assertion go red, and put it back. That is the exact regression, two screens
saying the same thing, that this card is about.

Coverage for both files should go from 0 to covered, which is the second,
measurable half of the proof.
