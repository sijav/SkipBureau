# GraphQLProvider

The GraphQL client every query below it asks through.

## Props

- `client`: Injected by a story or a test so each gets a fresh client. Sharing one would share its cache, and a story would then pass or fail depending on which ran before it.

## It also holds the boundary the app waits at

Queries suspend (SB-046), so the page a reader is on stays until the next one
has what it needs, rather than blanking. Whatever suspends needs a Suspense
boundary above it, and that boundary must sit **below** the client: React
throws away a suspended subtree and builds it again on retry, so a boundary
above this provider would build a new client, ask again, and suspend again,
without end. So the provider carries its own boundary, inside itself. The
routes have a nested one of their own, which is the one that matters to a
reader; this one catches everything else, a story rendering a screen on its
own above all.

A query for something that opens **over** a page, the Ask panel or the country
list in Your details, opts out with `context: overThePage`. The nearest
boundary for those is above the whole app, so suspending would hide the page
they opened over.
