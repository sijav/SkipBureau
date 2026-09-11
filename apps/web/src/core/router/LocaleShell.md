# LocaleShell

Reads the language out of the URL and puts the whole app inside it.

It sits above the route table rather than inside it so that Not Found, and
an address whose country is wrong, still render in a working theme and a
language the reader probably asked for. Any casing is accepted here;
canonicalising it is `CountryRoute`'s job.

## Props

- `client`: The GraphQL client, where the caller has one already: seeded from a prerendered file, or the build's own.
