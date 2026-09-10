# SB-031, run lint, typecheck, test and build on every push

**Exit condition:** a branch with a deliberate lint error is reported failed by
the workflow on GitHub, and a clean branch is reported green.

## Why this one matters more than it looks

Everything this repository asserts about itself is asserted by tests that only
run when I remember to run them. No colour outside `tokens.ts`. No bare English
literal. Twenty one contrast pairs. A contract that breaks when a server field
is renamed. Every one of those is a check nobody runs on a schedule, which
makes it a comment with a test suite attached.

## What runs, in what order

One job, `ubuntu-latest`, on push and on pull request.

1. `npm ci` at the root, which installs both workspaces, with
   `setup-node`'s own npm cache.
2. **`npx playwright install-deps chromium`**, separately, because the
   postinstall hook installs the browser without its system libraries and the
   Storybook project runs stories in a real Chromium.
3. **`npm run db:generate -w @skipbureau/api`.** The generated Prisma client
   is not committed, and the SDL emitter reaches it through the resolvers and
   `PrismaService`. Without this the very first real step fails on a missing
   import. It needs no database: `prisma.config.ts` defaults the url to an
   empty string.
4. `npm run contract -w @skipbureau/web`, which emits the SDL from the Nest
   resolvers and runs codegen. It needs no database: `schema-emit.ts` builds
   from resolver metadata alone.
5. `npm run lint` in both workspaces, `--max-warnings 0`.
6. `npm run typecheck -w @skipbureau/web` and `lint:tsc -w @skipbureau/api`.
7. `npm test -w @skipbureau/web`, both vitest projects, unit and Storybook.
8. `npm test -w @skipbureau/api`. **No database service needed**: the API tests
   run PGlite, Postgres compiled to WebAssembly, in process.
9. `npm run build` in both.

## Corrected by the plan check, before building

**The browser cache is gone, and that is a departure from the card.** The card
says "Playwright browsers cached rather than downloaded per run". Playwright's
own CI guidance now advises against caching the browser binaries: restore time
is usually comparable to download time, and the Linux system libraries are not
cached either way. So the workflow does the straightforward install, and
whether a cache is worth adding becomes a question for a measured run rather
than an assumption. The card has been corrected to say so.

**The coverage step had to change command.** The plan said `npm test` would
print the coverage number. It does not; only `npm run test:coverage` enables
it. Since `test:coverage` runs both vitest projects anyway, it replaces the
plain test step rather than being added beside it.

**Action versions were checked rather than remembered**, which is the project
rule and it earned itself here: `actions/checkout` is on **v7.0.1** and
`actions/setup-node` on **v7.0.0**. I would have written v4.

## The coverage step is a report, not a gate

The card says "the coverage gate". **I am not adding one**, and this is the
place to say why rather than quietly doing either thing.

Coverage today is 82% of statements. There is no agreed threshold anywhere in
this repository, so any number I picked would be one I invented, and the
project's own rule is that I do not invent a gate the owner did not ask for. A
threshold set at today's number also fails the moment someone adds an
uncovered line to an unrelated file, which trains people to raise the number
rather than write the test.

So the step **runs coverage and prints it**, which makes the number visible on
every push and costs nothing. Turning it into a gate is the owner's call, and
SB-112 is where that decision belongs, since it is the card about making the
number honest in the first place.

## What is deliberately NOT in this workflow

**The Playwright e2e suite.** It builds the API, starts PGlite, migrates,
seeds, builds the web app twice and serves it two ways. That is worth having in
CI and it is a different job with different caching, and the card names lint,
typecheck, test and build. Adding it here would be me widening the task. It
gets its own card.

## Files

| file | change |
|---|---|
| `.github/workflows/ci.yml` | new, the whole workflow |

## How it meets the exit condition

The exit condition is about GitHub, not about a file that looks correct, so it
is proved on GitHub:

1. Push a branch carrying a **deliberate lint error**, a bare English literal
   in a `.tsx`, which is exactly what `lingui/no-unlocalized-strings` exists to
   catch. Watch the run go red, and read the log to confirm it failed **at the
   lint step for that reason** rather than at install for an unrelated one.
2. Push the same branch with the error removed. Watch it go green.

Both observed through `gh run`, with the conclusion quoted.

## The step I am least sure of

**Whether restoring the browser cache before `npm ci` actually stops the
download.** The postinstall hook runs `playwright install chromium`, which is
supposed to be a no-op when the browser is already in `~/.cache/ms-playwright`
at the exact revision it wants. If the revision in the cache key does not match
the revision the installed Playwright asks for, it downloads anyway and the
cache silently buys nothing but a slower job. I will check the install step's
log for a download line rather than assuming the timing improved.
