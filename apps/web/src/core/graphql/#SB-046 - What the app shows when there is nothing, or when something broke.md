# SB-046, What the app shows when there is nothing, or when something broke

**Exit:** each failure has a story and a Playwright case, and none of them
shows a blank page or an untranslated string.

## What is already there

Not Found for an address we do not have and for a guide or hub that does not
exist; Unreachable, with a retry, for a request that failed, on every screen;
"Nothing matches yet" for a search that found nothing; a guide that exists in
one language saying so (SB-049). Each has a story, except that only Home has
one for Unreachable.

## What is missing: the loading state

Every screen answers `if (fetching) return null`, so between two pages the
reader gets a blank page. It is invisible on a prerendered address, which
arrives with its data (SB-155), and it is what a reader sees on every
navigation inside the site: tap a guide's trail, and the page goes empty until
the hub's data lands.

The card asked for skeletons. CountryRoute's own note argues the other way,
and it is right: a skeleton shaped like the page is a promise, and the answer
may be Not Found. **So the page a reader is on stays until the next one has
what it needs.** That is what React does with a Suspense boundary inside a
transition, which the routes already have (SB-159) and React Router already
does; what is missing is that the queries suspend rather than reporting
`fetching`.

## The change

- The client asks urql for suspense on the browser as well as at build time.
  A screen then renders with its data or not at all, and the router keeps the
  previous page on screen meanwhile.
- `if (fetching) return null` becomes `if (fetching && !data) return null`:
  after this it is reachable only while a retry is in flight, and blanking the
  page there is the same mistake.
- A retry from Unreachable runs inside `startTransition`, so the screen the
  reader is looking at stays while the request is retried.
- Storybook's preview wraps a story in a Suspense boundary, since a story
  renders a screen directly.
- Unreachable gets a story on each screen that can show it, as Home has.
- The pages e2e gets the case a built site can actually prove: an address for
  a guide that does not exist answers with Not Found rather than a blank page.

## What it turned out to need, beyond the plan

- **The boundary goes inside `GraphQLProvider`, not in Storybook's preview.**
  A boundary above the provider rebuilds the client every time something
  suspends, since React throws away a suspended subtree and builds it again:
  new client, same question, suspends again, for ever. With the boundary in the
  preview, ten screen stories rendered an empty div and never recovered.
- **A query for something that opens OVER a page must not suspend.** The Ask
  panel's query and the country list in Your details both run while a page is
  on screen, and the nearest boundary for them is above the whole app: opening
  Ask hid the page it opened over, and the field lost the click that opened it,
  so `aria-expanded` never became true. Both now pass `context: overThePage`,
  a module constant because urql keeps the context in the dependencies of the
  subscription it builds.

## Least sure of

- **Hydration.** A prerendered page's queries are answered from the seed, so
  they do not suspend; one that is not in the seed suspends inside the routes'
  boundary, which keeps the file's markup until it resolves. The 40-page sweep
  and the pages e2e say whether that holds.
- **Stories.** A suspending screen needs a boundary above it or React throws;
  the preview's decorator is the one place to put it.

## How it is checked

The four combinations of every story; the pages e2e, including the new Not
Found case; the sweep of all 40 pages in light and dark; and a navigation
watched in a browser with the API slowed, to see the previous page stay rather
than the screen go blank.

## What was checked, and what it showed

- The whole suite: 205 files, 602 tests, green. Before the Ask story fetched
  the panel's code up front it failed two full runs in three, on the panel's
  cold import under four browsers at once.
- The pages e2e against a locally built and prerendered site: 11 of 11,
  including the new case for a guide that does not exist. Planted against it,
  a Not Found that draws nothing fails it, so the case can fail.
- The dev e2e: 13 failures, identical in name and count on the untouched
  code, all stale addresses and test ids (SB-146, SB-115). None are this card.
- The sweep: every one of the 38 prerendered pages, in light and dark, 98
  loads. All drew their page, none logged an error or a hydration warning.
- In a browser, with every GraphQL request delayed three seconds: clicking a
  goal on the home page changes the address at once and **leaves the home page
  fully on screen** until the hub's data lands, in English and in Persian.
  Opening Ask over a guide expands the field and leaves the guide drawn, with
  the panel appearing when its answer arrives.
