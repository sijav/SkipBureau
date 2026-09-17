# SB-410, a CI-only browser failure leaves no trace, screenshot or report behind

**Exit:** a deliberately failed e2e job on a scratch branch leaves a downloadable
artifact containing the Playwright report and the failing test's trace or error
context, and a passing run uploads nothing.

## What the card assumed, and what is actually true

The card says to upload `apps/web/playwright-report` and `apps/web/test-results`.
Checked rather than taken:

- **`playwright.config.ts` line 44 is `reporter: 'list'`.** The list reporter
  writes no HTML report, so **`playwright-report` does not exist and never has**.
  Uploading a path that is not there is at best a warning and possibly a second
  failure, which would be a poor outcome for a card about making failures
  legible.
- **`test-results` does exist**, and it is where failures land. Tonight's real
  failure wrote
  `test-results/pages-a-seeded-page-asks-...-pages/error-context.md`.
- **`use: { trace: 'on-first-retry' }`** at line 45, and `retries` is 2 under CI,
  so a CI failure is retried and a trace is genuinely produced. Locally, where
  retries are 0, a first failure produces no trace at all.
- **`.gitignore` line 11 covers `test-results/`.** It does **not** cover
  `playwright-report/`.

## The approach

**1. Add the HTML reporter beside the list one.**

```ts
reporter: [['list'], ['html', { open: 'never' }]],
```

`open: 'never'` is not decoration. Playwright's html reporter opens a browser on
failure by default, which is hostile in a terminal and meaningless on a runner.

The list reporter stays, because it is what makes a CI log readable line by line;
the html reporter is what makes a failure explorable afterwards.

**2. `.gitignore` needs nothing.** An earlier draft added `playwright-report/`,
on the strength of `git check-ignore -v apps/web/playwright-report` reporting it
unignored. The plan check said the line was already there, and both observations
were right: **`.gitignore` line 10 is `playwright-report/`**, and `check-ignore`
still reports it unignored **because the directory does not exist yet**. A
pattern with a trailing slash matches only when git can tell the path is a
directory, and for a path that is not on disk it cannot. The line starts working
the moment the html reporter creates the directory. Recorded because the next
person to run that command will see the same apparent contradiction.

**3. `ci.yml`'s e2e job gains an upload step after the suite:**

```yaml
      - uses: actions/upload-artifact@v7
        if: failure()
        with:
          name: playwright-${{ github.run_id }}-${{ github.run_attempt }}
          path: |
            apps/web/playwright-report
            apps/web/test-results
          if-no-files-found: error
          retention-days: 7
```

Two details from the plan check, both corrections to what this plan first said:

- **`if-no-files-found: error`, not `ignore`.** I reached for `ignore` to survive
  the case where the html report exists but no trace was taken. That case needs
  nothing: v7 applies this setting only when **nothing at all** matches, so a
  partial match simply uploads what is there. `error` therefore costs nothing in
  the case I was worried about and buys something real, a loud failure if the
  reporting produced no files whatsoever, which is the silent-success this card
  exists to prevent.
- **`github.run_attempt` in the name.** Rerunning only the failed job keeps the
  same `run_id`, and v7 artifacts are immutable, so a second attempt would
  collide and fail on upload. If this job ever becomes a matrix, it needs a
  matrix suffix too.

`@v7` comes from `gh api repos/actions/upload-artifact/releases/latest`, which
reports **v7.0.1**, published 2026-04-10. This matters: from memory I would have
written `@v4`, three majors stale. The repository already pins `checkout@v7` and
`setup-node@v7`, so v7 is also the house style rather than an outlier. **This
card exists because SB-401 refused to guess this version**, so guessing it now
would defeat the reason it was filed.

`if: failure()` keeps a green run silent, which the exit requires explicitly.
Seven days is long enough to diagnose a red main and short enough not to
accumulate.

## Files

- `apps/web/playwright.config.ts`, the reporter.
- `.gitignore`, one line.
- `.github/workflows/ci.yml`, one step.
- this plan.

## How it is proved

A green run cannot distinguish an upload step that works from one that silently
uploads nothing, and that indistinguishability is the whole reason this card
exists. So the proof has to be a real failure:

1. Scratch branch, one assertion broken by hand, pushed.
2. The `e2e` job fails, and the run lists an artifact.
3. The artifact downloads and contains the html report and the failing test's
   `error-context.md` or trace.
4. Delete the branch. Main never goes red, which is the condition attached to the
   owner's decision that CI runs the suite.

That is roughly twelve minutes of CI for a few lines of YAML. It is worth it
here, because the failure mode being guarded against is precisely a step that
appears to work.

## The step I was least sure of, and how it was settled

**Whether `upload-artifact@v7` fails or merely warns when one of several listed
paths is missing.** A run where the html report exists but no trace was taken, or
the reverse, presents a partially missing path list, and if v7 counted that as no
files found, a step added to explain one failure would cause a second one.

It does not, and the answer comes from the implementation rather than from the
README. At tag v7.0.1, `src/upload/upload-artifact.ts` line 31 is
`if (searchResult.filesToUpload.length === 0)`, and the `switch` on
`inputs.ifNoFilesFound` with its `warn`, `error` and `ignore` cases sits inside
that branch. `filesToUpload` is the aggregate over every path given, so a partial
match has a non-zero length and never reaches the switch. The README says the
same in words, "If a path (or paths), result in no files being found for the
artifact", but the count is the mechanism.

So `if-no-files-found: error` fires only when **both** paths are empty, which is
exactly the silent success this card exists to catch, and never on the partial
case that `ignore` was first reached for.

This is recorded because the proof below cannot show it. A real failure writes
both directories and a green run skips the step, so neither run exercises a
partial match. It was read from the source because nothing else here can prove
it.
