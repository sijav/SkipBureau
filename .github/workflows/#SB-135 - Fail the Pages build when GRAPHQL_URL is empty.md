# SB-135, Fail the Pages build when GRAPHQL_URL is empty

**Exit:** with `GRAPHQL_URL` unset, the pages job fails before building and
names the variable; with it set, the job builds and deploys as now.

## Why here

`VITE_GRAPHQL_URL` is baked into the build, so the address the site asks for
its data is decided in the pages job and cannot be corrected afterwards. The
client falls back to `http://localhost:4000/graphql`, which is right on a
developer's machine and wrong on the published site: every visitor's browser
would call their own machine and read "SkipBureau could not load this", while
CI and Pages both stay green. That is the failure this repository keeps
finding, a check reporting success over a site that cannot work.

## The change

One step in the pages job, before the build, reading the same variable the
build uses: `https://` passes and says which address it is building against;
empty, or anything else, stops the job with a message naming the variable.
The comment above the build step is corrected at the same time: it still says
the variable is unset until SB-014 gives the API a home, and SB-014 is done.

This refuses a deploy, which is a gate, so it is in the reply to the owner as
one. It refuses only a build that would publish a site that cannot load, which
is the opposite of the gates his order of 2026-09-10 was about.

## Least sure of

Nothing in the mechanism. The risk is proving it: emptying the repository
variable to watch the job fail would break the live deploy until it was put
back, so the shell is run here with each of the three inputs instead, and the
real run proves the passing path.

## How it is checked

The `case` block run locally with an empty value, an `http://` value and the
real `https://` one; then the pages job on this push, which builds and deploys
with the variable set.
