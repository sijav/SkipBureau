# SB-403, a deleted country is still served from the client cache

**Exit:** in `e2e/countries.spec.ts:56`, after the country row is deleted and the
reader navigates back within the same document, the page reads as Not Found
rather than rendering the deleted country.

## The defect, watched rather than reasoned about

```
Error: a deleted country was served from cache
Expected pattern: /does not exist/i
Received string:  "What do you need to do in Portugal?"
```

Create Portugal, browse `/en/pt`, delete the row, navigate back **in the same
document**: the page still renders Portugal's home.

## The mechanism, every part read from the code

- `addressCountry.ts` runs `CountryQuery` with `requestPolicy: 'cache-first'`,
  paused only on `!reader || !code || moved`.
- `client.ts` uses `cacheExchange`, **a document cache, not a normalised one**,
  and says why: the product is read heavy, nothing in the app edits content, and
  every context-dependent query already carries its context in its variables.
- So a second render with identical variables replays the stored Portugal
  document. No request leaves the browser.
- **The guard itself is correct.** `CountryRoute.tsx` line 39 is
  `if (!data?.country) return <NotFound />`, and the API resolves
  `row ? named(row, locale) : null`, so a miss is observable as `null`. The
  guard would do the right thing; it is never told.
- The test's `navigate` helper uses `pushState` and a `popstate` event on
  purpose, and its own comment already named this bug: `page.goto` builds a
  fresh client and an empty cache, so "a test that used it to navigate away and
  back proved only that a new client sees the change... the first version of
  this test passed with `cache-first`, which is precisely the bug it exists to
  catch."

So the coverage was designed for this defect and was let through by one broken
assertion (SB-400), not by an absence of thought.

## The fix: `network-only` on the guard's query

Settled by the plan check against urql 5.0.4 and `@urql/core` 6.0.3.

**`cache-and-network` is rejected, and the reason matters.** On a cache hit urql
returns the cached result immediately and revalidates in the background;
suspense throws only when there is **no** result. So the deleted country would
render for a frame before the guard turned it into Not Found. That converts a
permanent quiet wrong answer into a visible one, and in Playwright it is a flake,
because the assertion may catch either frame. A guard whose whole purpose is that
a reader never sees a country we do not cover cannot show one, even briefly.

**Entity invalidation is not available**, so an earlier draft of this plan and
the first version of SB-403's card were both wrong to offer it: with
`cacheExchange` there are no entities, only whole documents keyed by query and
variables. The card has been corrected.

## What this costs, stated properly

An earlier draft said "a request on every page load". That understates it, as the
plan check caught. **`useAddressCountry` has two callers**, `AddressShell.tsx`
line 16 and `CountryRoute.tsx` line 25, and both render on a normal route. Under
`cache-first` the second is answered from the document cache. Under
`network-only` it is not, so a normal route render can make **two** country
requests rather than one.

And the SSR trade-off is real with no clever escape: `ssrExchange` seeds the
client from the prerendered file (SB-155) so a cold load draws without a request,
and `network-only` bypasses that seed too. There is no policy that both keeps the
first render request-free and guarantees the country has not been deleted since
the file was built. Trusting the seeded first render and revalidating afterwards
is possible, but it needs explicit hydration state and its own tests: it is not a
request-policy change and it still relaxes "never stale" for the first page.

**The doubled request is measured before it is accepted, not after.** If a normal
route really issues two, that is a cost on a product whose stated constraint is
being fast on a phone, and it belongs in its own card to share the one query
between the shell and the route, rather than being absorbed silently into a bug
fix.

## Files

- `apps/web/src/core/router/addressCountry.ts`, the guard's request policy, with
  the reasoning recorded beside it so the rejected option is not reopened.
- this plan.

The test already exists and is failing now; nothing new is added to it.

## How it is proved

1. `e2e/countries.spec.ts:56`, currently failing on exactly this, must pass.
2. **All nine `CountryRoute` stories**, counted rather than assumed: `Found`,
   `FoundPlace`, `UnknownPlace`, `UnknownStatus`, `FoundSituation`,
   `UnknownSituation`, `NotCovered`, `ApiIsDown`, `Recovers`. An earlier draft
   said four. Each mounts a fresh app with its own MSW handlers, so their first
   country read already goes to the network and none should move; if one does, I
   have changed more than I meant to.
3. **The country requests on a normal route, counted in the network panel**, to
   see the doubling with my own eyes before presenting this as acceptable.
4. A cold load of a prerendered page still draws, with its extra request
   acknowledged rather than hidden.

## What the first attempt proved, and why `network-only` alone is wrong

Run 2026-09-16, the full gate. `network-only` **meets this card's exit**:

```
ok 1 [dev] countries.spec.ts:56 a country added to the database becomes browsable, and removing it takes it away
```

Typecheck, lint, unit (18 files, 92 tests) and all four Storybook projects (51
files, 178 tests each) stayed green, so the nine `CountryRoute` stories are
untouched, as predicted.

**And it broke a different guarantee.** `pages.spec.ts:77`, "the file carries the
page itself, and the page asks for none of it again", asserts
`expect(asked.filter((body) => !body.includes('GuideAnswers'))).toEqual([])` and
received **three `Country` requests**.

That is the `ssrExchange` trade-off this plan already described, now measured
rather than predicted, and it is worse than the two the plan check estimated.
The important part is what it means: **the product already had a test asserting
which side of that trade-off matters**, and I chose a policy without looking for
it. The plan called the trade-off unavoidable. It is not unavoidable; it is
already decided, by a test, in favour of the prerendered file.

So this test is the measurement I said I would take with a network panel. It is a
better one: it runs against the real artefact and states the rule as a guarantee.
The planned manual count is dropped as redundant.

**`pages.spec.ts:77` is not to be weakened.** It guards what SB-155 built and
what the owner's first-class SEO constraint rests on. Relaxing it to let this fix
pass would trade a real guarantee for a green tick.

## The approach, second attempt: a one-way latch on the seeded address

Trust the seeded first render; revalidate once the reader has navigated. The
second plan check corrected the obvious version of this and the correction is the
whole point:

**Comparing `location.pathname` to the initial pathname is wrong.** The failing
case navigates away from `/en/pt` and **back** to it, so on return the comparison
says "initial address" again, selects `cache-first`, and serves the cached
Portugal. It would fail the very test it was written for. The discriminator has
to be a **one-way latch**: trust the seed only while hydrating **and** still on
the first address; the moment the pathname differs, switch to `network-only` and
**stay there**, including after coming back.

**The signal exists; the latch does not.** `LocaleShell` already takes a
`hydrating` prop documented as "The page is being hydrated from its prerendered
file (SB-256)" and already passes it to `AddressShell`, which already sits above
`CountryRoute`. I first wrote that this meant the state was already there. It is
not: `hydrating` is a **static prop**, so it can say "this document was
hydrated" and never "the reader has since navigated". A one-way latch needs real
state on top of it.

The rule, in full:

- `cache-first` only while **hydrating**, **still at the initial pathname**, and
  **no navigation has yet committed**;
- `network-only` the moment the pathname first differs, caught by comparing
  during render so the first away-navigation is not served from cache;
- the latch then set in an effect and kept, so returning to the initial address
  stays `network-only`.

**Where it lives, and the trap in the obvious placement.** `AddressShell` owns
it, but it **cannot read the value back out of the `ShellProvider` it has not
rendered yet**. So it computes `requiresFreshCountry` locally, passes it straight
to its own `useAddressCountry`, and publishes the same boolean through
`ShellProvider` for `CountryRoute` to read and pass to its call. One shared
decision, not two latches that can drift.

**`readsQuery` is NOT the latch, despite looking like one.** `AddressShell` holds
`useState(!hydrating)` with an effect that flips it once and never back, which is
latch-shaped, but it governs whether the **query string** is read for status,
role and work place (SB-256, SB-286). It also flips in an effect immediately
after mount, which is precisely the wrong moment for a request policy: the guard
would go `network-only` on the first hydrated render and re-break
`pages.spec.ts:77`. It is a different concern that happens to share a shape.

So: `AddressShell` owns a latch derived from `hydrating` and the location, and
both callers of `useAddressCountry` read the same value rather than each deriving
its own.

## The third case the check demanded, and why it matters more than the two exits

Both current tests can pass while this card's promise fails. An implementation
that stays `cache-first` forever for a hydrated client satisfies
`pages.spec.ts:77` (asks for nothing) and `countries.spec.ts:56` as currently
written, and still shows a deleted country to a reader who arrived from a search
result. So the proof needs a case neither test covers:

**Start on a seeded prerendered page, navigate away within the document, delete
the country, navigate back, and require Not Found.** That is the reader this card
exists for, and it is the only case that separates a real fix from one that
merely satisfies the two assertions.

### Where that case can actually run, and the one part of it that cannot

A seed exists only where a prerendered file carried one: `main.tsx` line 62 is
`hydrating={Boolean(seed)}`, so `hydrating` means "this document was given an
ssrExchange seed", not "this build has files". That places the case in the
**`pages` project**, because the `dev` project runs against Vite, whose SPA
fallback carries no seed, so every `dev` test already has `hydrating` false and
`network-only` unconditionally. `countries.spec.ts` is a `dev` file and cannot
host it.

**The delete cannot be carried over into the `pages` project.** That project is
`fullyParallel` against one shared database, and `pages.spec.ts` line 241 already
records the rule from its own fixtures: a row is "never removed, because one test
removing it would pull it from under another". Deleting TR or DE there would
break whatever sibling test is mid-flight, and a newly created country is no
substitute, because it has no prerendered file and therefore no seed, which is
the whole precondition.

**So the case splits, and neither half is the weaker for it.** What makes the
deleted country visible is a single mechanism, "the guard asks the network again
after the reader has navigated", and the two halves prove its two ends:

- **That asking produces Not Found** is `countries.spec.ts:56`, already written,
  in the project that can delete rows.
- **That a seeded document asks at all, once the reader has moved**, is the new
  case, in `pages.spec.ts`, counted rather than deleted: open the seeded page and
  see **zero** `Country` requests, navigate to another country within the same
  document and see one, then navigate **back to the opening address** and require
  another. That last assertion is the latch itself, and it is the one a
  permanently-`cache-first` implementation fails: it would answer the return from
  the document cache and ask for nothing.

This is a substitution of form, not of strength. The check's reason for demanding
a third case was that both existing tests pass under an implementation that stays
`cache-first` for ever; the return-navigation count fails that implementation
outright, which is what was being asked for. It buys that without destroying a
fixture other tests are reading.

**The doubled request is measured here too.** Both callers of
`useAddressCountry` ask, so the count after a navigation says whether it is one
or two, and that number goes on the card for sharing the query rather than a
prediction.

## What the fourth check settled, including one thing this plan claimed wrongly

Run 2026-09-16, against urql 5.0.4 and React 19. It confirmed the latch and
corrected the plan twice.

1. **`useQuery` does not blank a page when the policy changes under it.**
   `computeNextState` keeps the previous `data` whenever an incoming result has
   `data: undefined`, and only then sets `fetching: true`. So `CountryRoute`'s
   `fetching && !data` does not fire for a page already on screen, and the
   in-document navigations in `pages.spec.ts`, choosing Hamburg and choosing a
   nationality, keep their content.
2. **And that kills a sentence this plan wrote above.** It said a guard that must
   never show a country we do not cover "cannot show one, even briefly", as
   though `network-only` guaranteed no stale frame. It does not guarantee that,
   because urql's React result cache can still hold the country. What
   `network-only` actually refuses is the stored document being *the answer*;
   `cache-and-network` serves it as the answer and corrects afterwards. The exit
   asks for the eventual Not Found, and Playwright's locator retries until it
   arrives, so the exit is met either way, but the claim was overstated and is
   corrected here rather than left to read as settled.
3. **`AddressShell` is not remounted by navigation.** It sits under
   `LocaleShell`, outside `AppRoutes`, and the suspense boundaries are below it.
   A root remount, a reload or HMR, builds a new client and a new document
   anyway, so a latch that resets with it is resetting correctly.
4. **The new test asserts at least one request per navigation, never exactly
   one.** Both callers ask, so a count pinned to today's number would turn the
   query-sharing card into a breaking change.

**Where the check and the linter disagreed, and who won.** It proposed
`useRef(pathname)` read during render with the latch set in an effect.
`react-hooks/refs` and `react-hooks/set-state-in-effect` both refuse that, and
lint clean is the standing gate, so the mechanism changed and the semantics did
not: `useState(pathname)` for the opening address, a boolean state for the latch,
and a guarded set during render. React re-runs the component before its children
on a set during render, so the route below sees the latch on the same navigation
that tripped it, which is the property the check asked for. An effect would have
run one render too late, which is the thing both of us were avoiding.

## The step I am least sure of

**Whether the doubled request should block this fix.** The correctness argument
is one-sided: a guard that shows a country we do not cover is the quiet wrong
answer this product cannot afford, and it is live today. But doubling a request
on every route render is a real regression, and "it was only a bug fix" is
exactly how performance debt arrives unannounced. I intend to take the fix and
file the sharing of the query separately, on the measurement rather than the
prediction. It is filed as SB-405, and the measurement came in below: it is
three requests, not the two predicted here.

## What the planted run proved, and the number it produced

Run 2026-09-17, the full suite with the latch deliberately removed and replaced
by the comparison this plan names as the trap:

```ts
const [openedAt] = useState(location.pathname)
const requiresFreshCountry = !hydrating || location.pathname !== openedAt
```

It typechecks, so the pages build produced a real artefact and the suite tested a
working wrong implementation rather than dying on a compile error. That matters:
a plant that fails to build proves nothing about a test.

**48 passed, 1 failed**, and the one failure is the new case:

```
1) [pages] e2e\pages.spec.ts:114 a seeded page trusts its file only while the reader stays on it
   Error: returning to the seeded address asks again rather than replaying the seed
   expect(received).toBeGreaterThan(expected)
   Received: 3
```

The shape of it matters more than the colour:

- the seeded first render asked for **nothing**, so that assertion passed;
- **leaving** the seeded address asked, so that assertion passed too. This is what
  makes this the sharp plant rather than the obvious one: an implementation that
  still looks right on the way out;
- **returning** asked nothing further, and the count stayed exactly where leaving
  had left it. That is the deleted country served back to the reader, and this is
  the only assertion in the suite that fires on it.

The other plant, staying `cache-first` for ever once hydrated, was tried first
and discarded as the weaker proof: it asks for nothing at all, so it fails at the
leaving assertion and never exercises the return one, which is the assertion the
latch exists for.

So the return assertion is load-bearing rather than decorative, and all 48 other
tests pass under an implementation that shows readers a country SkipBureau does
not cover. That is exactly the claim this case was added to make, now made
against the running product instead of argued.

**And the failure carried the measurement SB-405 was waiting for.** One
in-document navigation to a country page issued **three** `Country` requests, not
two. This plan said "doubled" throughout, on the plan check's estimate; three is
what the network actually carried, and it matches the three that blanket
`network-only` put through `pages.spec.ts:79`. SB-405 carries the measured
number, so the card that shares the query starts from what happened rather than
from what was expected.
