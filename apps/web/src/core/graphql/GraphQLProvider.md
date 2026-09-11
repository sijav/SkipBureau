# GraphQLProvider

The GraphQL client every query below it asks through.

## Props

- `client`: Injected by a story or a test so each gets a fresh client. Sharing one would share its cache, and a story would then pass or fail depending on which ran before it.
