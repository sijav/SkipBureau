# SB-406, a seeded page keeps its cached country when the reader changes only a query detail

**Exit:** in the pages project, a seeded prerendered page that navigates by
changing only the query (`?status`, `?situation` or `?work`) issues at least one
`Country` request, proven by a case in `e2e/pages.spec.ts` that fails when the
latch is keyed on pathname alone, with `pages.spec.ts`'s "asks for none of it
again" and the existing seeded-page case both still passing.

A child of SB-403, found by its roast. By the owner's rule of 2026-09-10 a child
closes on the tests covering the files it changes, plus lint and the type checker,
rather than the full suite.

## The defect, verified at the line rather than inferred

SB-403's latch in `AddressShell.tsx`:

```ts
const [openedAt] = useState(location.pathname)
const [latched, setLatched] = useState(false)
const wentAway = latched || location.pathname !== openedAt
```

Only a navigation that changes the **path** turns it on. Three of this app's
navigations change only the query, and all three were read at the line:

| helper | line | what it returns |
|---|---|---|
| `samePageAs` | `paths.ts:195` | `` `${pathname}${searchWith(search, 'status', status)}${hash}` `` |
| `samePageInRole` | `paths.ts:202` | `` `${pathname}${searchWith(search, 'situation', situation)}${hash}` `` |
| `samePageAtWork` | `paths.ts:~215` | `` `${pathname}${searchWith(search, 'work', work)}${hash}` `` |

The pathname is returned verbatim in every one. `paths.test.ts:230` shows it
concretely: `/en/TR/guides/sim-card?status=tr.short-stay` becomes
`/en/TR/guides/sim-card?status=tr.residence-permit`, an identical path.

So a reader opens a prerendered page, picks a residence status, a role or a
workplace in the details panel, and the country query is still answered from the
seed the file carried. If that country was deleted since the build, they are
shown it. That is the precise case SB-403 exists to refuse, surviving in the
navigation readers make most.

**Choosing a place is not affected** and is worth saying, because it looks like a
counterexample: a place goes into the path, `/en/DE-HH/guides/anmeldung`, so it
already trips the latch. It is the three query details that do not.

## The fix: key the latch on the whole address, not the path

```ts
const [openedAt] = useState(location.pathname + location.search)
const wentAway = latched || location.pathname + location.search !== openedAt
```

### Why not `location.key`, which is the obvious answer

React Router gives every history entry a key, and comparing keys would catch any
navigation including ones that change nothing about the address. That is exactly
why it is rejected: **a `replace` during the first render would trip it**, and
tripping the latch on the seeded first render destroys SB-155's guarantee that a
prerendered page asks for nothing it was given, which `pages.spec.ts:79` asserts
and which a blanket `network-only` already broke once tonight.

`CountryRoute` does `<Navigate replace to={canonical}>` when an address is not
canonical. A prerendered file is always written at the canonical address, so that
redirect should not fire on a seeded page, but "should not" is the wrong footing
for a guarantee that is already covered by a passing test. Pathname plus search
cannot be tripped by a replace that does not alter the address, so it fails safe.

**The hash is deliberately excluded.** `samePageAs` and its siblings preserve the
hash unchanged, and a fragment is not a different page to this guard; including
it would mean a jump to `#sources` starts asking the API for the country.

## What this cannot break, checked rather than assumed

The risk is the mirror of the defect: making query navigations ask could break a
test that asserts a seeded page asks for nothing. Every request-counting
assertion in `pages.spec.ts` was read:

- `:110` `expect(asked.filter(...)).toEqual([])` sits in "the file carries the
  page itself", which **never navigates**. Untouched.
- `:130` `expect(countries).toEqual([])` is the opening assertion of the seeded
  page case, **before any navigation**. Untouched.
- `:148` and `:155` are `toBeGreaterThan` assertions after **path**
  navigations. Untouched, and they only get easier to satisfy.
- `:334` and `:380` count hydration mismatches, not requests.

The suite's only query-only navigation is `:418`, "a status reached from a page
already up is in its links at once", which does
`pushState(\`${window.location.pathname}?status=${status}\`)` and asserts an
attached link. It counts nothing, so an added country request cannot fail it.

## The test that proves the exit

A new case in `e2e/pages.spec.ts`, beside the SB-403 one it completes: open the
seeded guide, assert zero `Country` requests, then navigate within the document
changing **only the query**, and require at least one. `at least one` rather than
an exact count, for the same reason SB-405 records: both callers of
`useAddressCountry` ask, and pinning the number would make the query-sharing card
a breaking change.

It must be watched failing with the latch keyed on pathname alone, which is
today's code, so the failure needs nothing planted: the case fails against `main`
as it stands.

## Files

- `apps/web/src/core/router/AddressShell.tsx`, the latch.
- `apps/web/e2e/pages.spec.ts`, the case.
- `apps/web/src/core/router/#SB-403 - A deleted country is still served from the client cache.md`,
  whose "from the first navigation onwards" is too broad as written and is
  corrected to say which navigations count. The card that closed is not reopened;
  only its record is made accurate, which CLAUDE.md requires of a plan that reads
  as stale beside the code.
- this plan.

## What the plan check settled, including one thing it caught

Run 2026-09-17, against react-router-dom 7.18.3 and urql 5.0.4 as installed.

1. **Nothing rewrites the search on hydration**, which was the doubt this plan was
   written around. `BrowserRouter` initialises from the browser's current
   location and does not touch the search string; the only initial redirects in
   this repository are the root redirect and `CountryRoute`'s canonical one,
   which preserves `search` unchanged, and a seeded file is already canonical.
   `readsQuery` changes React state and never navigates. So `pathname + search`
   cannot be tripped before the reader acts.
2. **`location.key` would not even work here**, for a reason better than the one
   I gave. React Router reads its key from `history.state.key`, and the e2e
   helper navigates with `history.pushState({}, ...)`, which sets no key: both
   the opening entry and the synthetic navigation read as `"default"`. A
   key-based latch would fail to catch the very navigation the test makes. My
   own argument, that a replace during hydration could trip it, stands too, but
   this one is decisive and checkable.
3. **Excluding the hash is right.** Neither `CountryQuery` nor the reader-detail
   parsing reads it, so a hash-only move cannot change the country.
4. **The assertion must poll, and mine would have raced.** Changing
   `requestPolicy` does produce the fresh `network-only` operation, but urql
   keeps the prior result while the new request starts and **subscribes
   asynchronously**, so the request leaves after the navigation has rendered.
   Reading `countries.length` once, immediately, can see zero and fail for a
   timing reason that has nothing to do with the defect. It becomes
   `await expect.poll(() => countries.length).toBeGreaterThan(0)`.

   The existing path-navigation case at `:148` escapes this only because it first
   awaits a visible heading change, which gives the request time to leave. A
   query-only navigation changes nothing visible to wait on, so the poll is doing
   real work rather than being defensive.

## The step I am least sure of

**Whether anything rewrites `location.search` during the first render of a
hydrated page**, which would trip the latch immediately and cost SB-155's
zero-request guarantee. SB-256's `readsQuery` flips in an effect right after
mount, but it only *reads* the query to resolve status, role and workplace; it
does not navigate. If some path does normalise or rewrite the query on arrival,
pathname plus search is the wrong key and the answer is a comparison that ignores
whatever that rewrite changes.

**Answered twice over.** The plan check read `BrowserRouter` in react-router-dom
7.18.3 and found no rewrite on hydration, and the run then confirmed it from the
other side: if the search were rewritten on arrival, the new latch would trip on
the seeded first render and `pages.spec.ts:79` would fail. It passes.

## What the runs proved, 2026-09-17

**Failing first, against today's code, with nothing planted.** The case was added
before the latch was touched, because the defect was live on `main`:

```
1) [pages] e2e\pages.spec.ts:158 a seeded page asks again when the reader changes only a query detail
   Error: a query-only navigation must ask for the country again
   expect(received).toBeGreaterThan(expected)
   Expected: > 0
   Received:   0
   Call Log: - Timeout 5000ms exceeded while waiting on the predicate
```

`Received: 0`, after five seconds of polling. Not a race, not a slow request:
across a whole poll window, a reader who picked a role on a seeded page caused
**no country request at all**, which is the defect stated as a number.

**Then passing, with the latch keyed on `pathname + search`.** Full suite, both
projects:

```
50 passed (1.1m)
```

The four that decide this card, named rather than counted:

- `pages.spec.ts:158` the new case, now green;
- `pages.spec.ts:79` "asks for none of it again", green, so the fix did **not**
  trip the latch on the seeded first render. This was the real risk: a latch that
  fires too eagerly undoes SB-155, which is exactly what a blanket `network-only`
  did earlier in this same mechanism;
- `pages.spec.ts:114` SB-403's path case, still green;
- `countries.spec.ts:56` the deleted country, still Not Found.

Lint clean with zero warnings and `lint:tsc` clean. As a child of SB-403 this
needed only the tests covering the files it changed plus lint and the type
checker; the full suite was run instead, because `AddressShell.tsx` governs the
country guard on every page and the rule says to run more rather than guess.
