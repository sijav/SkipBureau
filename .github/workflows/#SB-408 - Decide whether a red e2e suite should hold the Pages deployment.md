# SB-408, decide whether a red e2e suite should hold the Pages deployment

**Exit:** the owner has been asked through the question tool and answered, and
`ci.yml` either lists `e2e` in the `pages` job's `needs` or a comment beside that
`needs` list records that it deliberately does not, with the owner's reason.

## The decision, which is the owner's and is now made

Asked 2026-09-17, with the measured timing in front of them, because the card's
own "argument against" had been written before those numbers existed: the `e2e`
job finishes in **about two minutes** while `pages` already waits on `check`,
which takes **9 to 11**. So the gate costs no wall clock at all.

**They chose: block the deploy.**

So `pages` becomes `needs: [check, secrets, e2e]`. That is the whole change.

This card exists because the SB-401 plan check refused to let the gate be
implied: "That changes run the suite in CI into block production deployment on
the suite, which the owner has not explicitly chosen." It is now chosen.

## The mechanism worth getting right, which is why this is not just a one word edit

**In GitHub Actions a job whose dependency is SKIPPED is itself skipped.**
`pages` already has `if: github.ref == 'refs/heads/main'`, and it will now depend
on a job that has no `if` of its own, so `e2e` runs on every push and pull
request and should never be skipped.

**An earlier version of this section overstated the danger, and the plan check
corrected it.** It said that renaming or removing `e2e` would leave `pages`
silently not running. That is wrong: Actions **rejects** a workflow whose `needs`
names a job that does not exist, so that case is loud. The genuinely quiet case
is narrower and worth keeping: if someone gives `e2e` a condition that skips it
on `main`, `pages` is skipped too, shown as skipped rather than red.

That is a maintenance risk rather than a design flaw, and it is not a reason to
reach for `always()` or extra gate machinery, both of which would weaken exactly
the blocking the owner asked for.

## Files

- `.github/workflows/ci.yml`, the `pages` job's `needs` list, with a comment
  recording the owner's decision and its date so the next reader does not have to
  guess whether the gate was deliberate.
- this plan.

## How it is proved

1. **The YAML parses and the job graph is what it claims.** `pages.needs` reads
   `['check', 'secrets', 'e2e']`.
2. **A green push still deploys. Observed 2026-09-17, on `b5bba2c`, run
   35162165546:**

   ```
   secrets  success
   e2e      success
   check    success
   pages    success
   ```

   This was the important one. The risk of this change was never that it fails
   to block, it is that it blocks everything for ever, and a deploy that never
   happens looks like nothing at all rather than like a failure. It deployed.

   The card was closed on its stated exit before this run finished, which was
   deliberate: the exit was met, and the extra proof was one this plan invented
   rather than one the card asked for. The task roast agreed, and added the
   correction now applied here, that the plan must not present this as completed
   proof until the run has actually been seen.
3. The blocking behaviour itself is not proved by deliberately breaking a test on
   main, because that would leave the site un-deployed and main red to prove
   something GitHub Actions documents. If it is ever worth proving, a scratch
   branch cannot show it either, since `pages` only runs on main.

## The step I was least sure of, now settled

**Whether `needs` is enough, or whether the `pages` job's existing `if` interacts
with it.** It is enough. GitHub applies a default `success()` status check to
every job unless the condition explicitly uses a status function such as
`always()`, so `if: github.ref == 'refs/heads/main'` does not let the deploy run
after a failed `e2e`. A failed or skipped required job skips `pages`, and neither
the `concurrency` group nor the `environment` block changes that ordering. No
`if` change is required.

## The one thing the plan check got wrong, refuted rather than dropped

It raised a prerequisite: that `ci.yml` "has `check`, `secrets`, and `pages`, but
no `e2e` job", so this card must wait for SB-401 or carry that job itself, or
`needs: e2e` would be an invalid workflow reference rather than a gate.

**That is not the state of the repository.** Checked rather than argued:

- `.github/workflows/ci.yml` line 93 is `e2e:`, in the working tree and at `HEAD`;
- `git log -S` names the commit that introduced it, `bc033a7`, which is SB-401;
- GitHub ran it on `main` in run 35160720465: `check: success, secrets: success,
  e2e: success, pages: success`.

So the prerequisite is already met and the reference is valid. The check appears
to have read an older copy of the file. Recorded here because a finding is
evidence to reproduce or answer, never something to quietly work around, and
because agreeing with it would have made this card wait on work that had already
landed.
