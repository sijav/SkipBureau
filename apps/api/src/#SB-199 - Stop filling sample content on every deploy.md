# SB-199, stop filling sample content on every deploy

**Exit:** the deployed API starts without running sample-content, Home still lists the twelve goals, and no sample row
comes back after a restart.

## Where this stands now

The filler has already stopped filling. SB-282 retired Turkey's sample rows and SB-301 Germany's, and moved both into
`prisma/sample-turkey.ts` and `prisma/sample-germany.ts` as test fixtures, leaving `COUNTRIES` in
`src/sample-content.ts` empty. SB-198 then proved on the deployment that nothing but the research reaches a reader.

So `node dist/sample-content.js` on every start now does exactly two things: it writes the twelve goals and their
text, which nothing else writes, and it retires sample rows that are already gone. That is the line PHASE-NEXT.md says
must come out before a real launch, and the only reason it is still there is the goals.

## The change

1. **The goals get their own writer.** `writeGoals(prisma)` moves out of `seedContent` into `src/goals.ts`, beside
   `tasks.ts` which holds the twelve. It is the same code, fill-only, including the hub copy that fills empty columns
   on a row an earlier start wrote.
2. **`bootstrap.ts` calls it**, and becomes testable while doing so. That file's own doctrine is the minimum a
   deployed database needs and nothing more, which is where the goals belong: they are names, not advice, exactly as
   its comment says of the countries. Its body becomes `bootstrap(prisma)`, taking the client, with the script's entry
   making the real one, so a test can run **the production path** rather than the shared writer underneath it. Its log
   says how many goals it wrote, as it does for countries.
3. **`seedContent` still calls it too**, so every existing caller behaves as it does today: `prisma/seed.ts`, the e2e
   API server that runs it, `guide.e2e.spec.ts` and `research-rules.e2e.spec.ts` all seed fixtures that expect the
   goals to exist.
4. **The entrypoint loses the step**, with its comment, leaving: recover, migrate, bootstrap, research rules,
   researched guides, serve.
5. **The retirement becomes a command somebody runs on purpose, and `sample-content` stops being runnable.**
   Leaving an executable called sample-content in the image, which no longer fills anything and which anybody could
   run against production believing it safe, is what the check refused. So `src/sample-content.ts` loses its `main`
   and its entry, and a small `src/retire-sample.ts` carries one: it retires both countries' listed rows and says what
   it deleted. Nothing on the start path calls it. `retireSample`, both slug lists and `retire-sample.e2e.spec.ts`
   stay as they are, and PHASE-NEXT.md names the command as the repair for a database restored from before the
   retirement.
6. **PHASE-NEXT.md's first section says what is true**: the sample content is gone from the deployment and from the
   start, the samples are fixtures, the retirement ran once for each country and is kept as a function, and there is
   nothing left to remove before a launch.

## How it is checked

- A test that **`bootstrap(prisma)` itself**, the function the entrypoint's script runs, writes the two countries,
  their names and the twelve goals with their text into an empty database. The check's warning is the one to heed
  here: a test that called the shared writer would pass while production's wiring was broken, so it calls bootstrap.
  Watched failing with the goals call removed from bootstrap.
- The API's suite, which already seeds through `prisma/seed.ts` and the three specs that call `seedContent`: if the
  goals stopped being written on that path, the hub tests fail.
- Lint, the type checker, and the full suite, since this card has no parent.
- Pushed; then the live read, with its limits stated plainly. **An API read cannot prove a process did not run**, so
  that half of the exit rests on the committed `docker-entrypoint.sh`, which is what the image runs. What the live
  read does prove: the twelve goals still answer for both countries, the **rendered Home page carries twelve tiles**
  rather than only the query answering, Germany and Turkey still hold exactly their researched areas, guides and
  questions, and the restart the deploy performs is itself the restart the exit asks about.

## Checked on 2026-09-16, and revised

Sound, with three changes, all taken. The new test must run **bootstrap's own wiring** rather than the writer it
shares with the fixtures, or it would pass while production's path was broken, which is exactly the trap this card
could fall into. The retirement must not be left as an undocumented executable that looks safe to run against
production: `sample-content` stops being runnable and the retirement becomes its own command, named in PHASE-NEXT.md.
And an API read cannot prove that a process did not run, so the exit's first half rests on the committed entrypoint,
while the live read proves the rendered Home page's twelve tiles rather than only the query that feeds it.

It confirmed the two things I doubted most: the goals are structural in the sense `bootstrap.ts` means, so a third
start step would only split one responsibility; and the two writers compose, since both create what is missing and
neither overwrites an editor's text, whichever order they run in.

## What I am least sure of

- Whether `bootstrap.ts` is the right home. Its comment says it inserts what is structural and writes no obligation
  and no rule; the goals are structural in the same sense, but the file has been about countries alone until now.
- Whether anything outside this repository still expects `dist/sample-content.js` to run on start. Nothing in the
  repository does once the entrypoint drops it.
- That the exit's "no sample row comes back after a restart" can only be shown from outside, by reading the API after
  the deploy's own restart, since the deployed logs are not something I can read.
