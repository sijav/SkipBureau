# SB-338, only the build workflow can hold a dispatch to the branch's tip

**Exit, as the card words it:** `northflank-build.yml` refuses a sha that is not the
branch tip when the publisher dispatches it, a manual dispatch of an older sha still
builds, and both are proved by a run rather than by reasoning.

This plan lives in `.github/workflows/` because the guard is the new work. It also
touches `apps/api/scripts/publish-research.ts`, its spec, and SB-236's plan.

## What is there, measured

- **The publisher checks the tip, and cannot hold it.** `publish-research.ts` has
  `tipOf(branch)` reading `git ls-remote origin <branch>`, and `dispatchChoice(tip,
  commit)` refusing unless the tip is the commit. Both are pure and tested. But the
  read and the dispatch are two calls, so a push landing between them is dispatched
  anyway. The card is right that SB-236's title overclaims.
- **The workflow trusts its input completely.** `northflank-build.yml` takes one
  input, `sha`, checks it is forty hex characters, and posts it to Northflank. There
  is no branch in the job at all.
- **It runs with `permissions: {}`**, and its header states why the logs print only a
  build's id, commit and status: the repository is public, so the token, the
  service's environment and Northflank's build message stay out. Any guard added here
  has to keep that true.
- **`dispatchArgs` is pinned exactly.** `publish-research.spec.ts` line 286 compares
  the whole argument list with `toEqual`, so adding an input fails that test until it
  is updated. That is a feature: the test is the record of what the publisher sends.

## My first design was wrong, and the mistake is worth keeping

I proposed that the job read the branch itself, `git ls-remote` against the public
repository, and refuse unless `inputs.sha` was that tip.

**That merely moves the race.** A push can land after the job's read and before its
Northflank POST, exactly as it can land between the publisher's read and its
dispatch. It would have been a guard that looks like it closes the window and does
not, which is worse than the honest gap it replaced, because the card would have been
closed against it.

## The approach

**GitHub already captured the commit, so nothing needs reading.**

`github.sha` on a `workflow_dispatch` run is the commit of the dispatched ref as
GitHub recorded it when the dispatch was accepted. Comparing the input against that
closes the publisher-to-workflow window with no read, so there is no second instant
for a push to land in.

1. `northflank-build.yml` gains a second input, `require_tip`, a boolean defaulting
   to **false**. Off, the workflow behaves exactly as today, so a manual historical
   build still works.
2. A refusal step before the Northflank step:

   ```yaml
   if: ${{ inputs.require_tip && inputs.sha != github.sha }}
   ```

   `inputs.require_tip` is a real boolean in this context. `github.event.inputs.require_tip`
   is the string "true" or "false", which is the trap this avoids: a shell test on a
   non-empty string reads "false" as true, and the guard would fire on every manual
   build while looking like it worked.
3. `publish-research.ts` sends `inputs[require_tip]=true` in `dispatchArgs`, and the
   spec's pinned list is updated to match.

No checkout, no token, no `git`, no network call, and no retry logic, so
`permissions: {}` stays and nothing new reaches the log.

## Files

- `.github/workflows/northflank-build.yml`, the input and the refusal step.
- `apps/api/scripts/publish-research.ts`, the flag in `dispatchArgs`.
- `apps/api/test/publish-research.spec.ts`, the pinned list and the test's name.
- `apps/api/prisma/research/README.md`, which documents the manual build command and
  now says what leaving the new input off means.
- `apps/api/scripts/#SB-236 - ...md`, corrected where it implies the publisher alone
  enforces this.
- this plan.

## How it is proved, by runs

The exit demands runs rather than reasoning, and one of them would normally mean
deploying older code over the live API. That is avoided rather than skipped.

1. **The refusal.** Dispatch with `require_tip=true` and a sha that is not the
   dispatched ref's commit. The run must stop at the refusal step and never reach
   Northflank, so nothing is built and nothing is deployed.
2. **The tip still builds.** Dispatch with `require_tip=true` and the ref's own
   commit. The run must pass the guard and build.
3. **The historical path.** Make a board-only commit after the implementation lands,
   then dispatch its **parent** with `require_tip` left off. The run must build.

**Why a board-only commit makes run 3 safe.** Northflank builds the API from
`apps/api/**`, both `package.json` files, `package-lock.json` and `.dockerignore`
(SB-136, SB-156), and `.dockerignore` excludes `.claude` from the build context
entirely, which was read rather than assumed. So the parent and the board commit
carry **identical included repository inputs**.

That is the claim, and it is deliberately narrower than the one this plan first made.
It is not "the same image" and not "an unchanged deployment": the base is
`node:24-alpine`, which is mutable, so image identity is not established by anything
here. What is established is that the build reads the same repository content, so the
API it serves is the same.

**And the commits must be made after the implementation, not before.** An earlier
draft proposed proving run 3 with `c0d53a8` against today's tip. Those two do differ
only in `.claude/todo.db`, but once this card's own changes land, that pair no longer
shows identical build inputs. The pair has to be created after the change.

Runs 2 and 3 both build, so this costs two Northflank builds. That is the price of
the exit's "by a run rather than by reasoning", and it is said out loud rather than
quietly reduced to one.

## SB-236's plan and title are corrected, not rewritten

SB-236's title says a build "is started only while its commit is still the branch's
tip", which its mechanism cannot guarantee, and its plan reads as though the
publisher settles it. The correction says what is true: the publisher's check narrows
the window to the gap between two calls, and the workflow's comparison against
`github.sha` is what closes it. The plan stays where it is, with the correction added
rather than the record edited away.

## What the plan check settled

- **The `git ls-remote` design relocates the race instead of closing it**, and
  `github.sha` closes it because GitHub captured that commit when it accepted the
  dispatch. This is the substance of the card and I had it wrong.
- **`inputs.require_tip` is a real boolean; `github.event.inputs.require_tip` is a
  string.** Use the former.
- **The historical proof must use a pair created after the implementation**, and its
  claim narrowed to identical included repository inputs.
- **The three runs are sufficient** as listed, and the publisher's pinned argument
  test gains `inputs[require_tip]=true`.
- **`permissions: {}` can stay**, because nothing is read.

## The step I am least sure of

**Whether `github.sha` is the dispatched ref's tip in every case I care about.** The
check says it is GitHub's recorded last commit of the ref, which is what run 1 and
run 2 will show directly: run 2 passes only if the input equals it, run 1 fails only
if it does not. If `github.sha` ever resolved to something else, such as the workflow
file's own ref, run 2 would fail with a tip I did not expect, and that failure is
readable rather than silent. So the design's one assumption is the thing the first
two runs test first.

**Second, whether the input is a boolean by the time the condition reads it.** The
dispatch API takes input values as strings, and the publisher sends
`inputs[require_tip]=true` as a string while the workflow declares the input
`type: boolean`. The guard is correct only if Actions coerces that string into a real
boolean in the `inputs` context. If it does not, the value is a non-empty string,
which is truthy, and the condition would hold for a manual build that left the input
off as well, breaking exactly the case run 3 exists to protect.

This is named here rather than discovered later, and the three runs separate it
cleanly: run 3 dispatches with the input absent, so if it passes the guard and builds,
the default is genuinely false rather than an empty string being read as true. Run 3
is therefore not only the historical path, it is the test of this assumption.

**And this repository has already answered half of it.** `northflank-path-rules.yml`
declares `apply` as `type: boolean` with `default: false`, exactly this shape, and
reads it at line 62 as `if: inputs.apply`, a bare boolean with no string comparison.
CLAUDE.md records that workflow as the one run by hand with the owner's secret, so
the idiom has been exercised here and not merely written. The guard added by this
card follows it rather than inventing a form.

**What that precedent does not cover, stated so it is not over-read.** The
path-rules input is ticked in GitHub's own form, which sends a real boolean, while
the publish sends `inputs[require_tip]=true` as a string through the dispatch API.
So the precedent settles how such an input is declared and read, and says nothing
about the string-from-API path. Run 3 is still what settles that remainder.
