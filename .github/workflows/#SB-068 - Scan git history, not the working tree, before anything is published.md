# SB-068, scan git history, not the working tree, before anything is published

**Exit condition:** CI fails a branch containing a planted credential in an
earlier commit that is absent from the tip.

## What actually happened, and why this card exists

Before the first push to the public repository I scanned the **working tree**
for credentials. The push carried 23 commits. A secret added in commit two and
deleted in commit three is not in the working tree and is still in the object
database, reachable through refs, cached views, forks and clones anyone already took. An earlier version of this said 'fetchable by anyone, for ever', which overstates it: long enough and outside your control is the true and sufficient version. SB-120 corrected the rule, and the remedy it omitted is revoke or rotate FIRST. I have since scanned every blob
reachable from every ref and the history is clean, so nothing is exposed. That
is luck plus a later correction, not a process.

What is missing is the rule and the check.

## The mechanism, and the two things that decide whether it works

### `fetch-depth: 0`, or the scan has nothing to scan

`actions/checkout` clones **shallow by default**, one commit. A history scanner
pointed at a shallow clone reports clean because there is no history there, and
it reports clean **loudly and quickly**, which is the worst possible failure
mode for a check like this. So the scanning job sets `fetch-depth: 0`.

The existing `check` job does not need history and keeps its shallow clone, so
this is a **second job** rather than a step bolted onto the first.

### Push protection is already on, and it fights the proof

`gh api` says this repository has `secret_scanning: enabled` and
`push_protection: enabled`. That is good, and it is a problem for proving this
card: if I plant a recognisable credential and push it, **GitHub blocks the
push** and the branch never reaches CI, so the exit condition cannot be
observed.

That is not a reason to weaken the proof. It points at the right one. Push
protection covers **partner patterns**, real tokens from known providers.
gitleaks covers those and also generic assignments. So the planted credential
must be one **gitleaks catches and push protection does not**, which
simultaneously demonstrates what this check adds over the feature GitHub
already gives us. If the planted secret were caught by push protection, the job
would be proving a capability we already had.

## The approach

A `secrets` job in `ci.yml`:

1. `actions/checkout@v7` with `fetch-depth: 0`
2. the pinned **gitleaks v8.30.1** binary, downloaded from its release rather
   than through `gitleaks-action`, which asks organisations for a licence key
   and is a dependency this does not need
3. the scan over the whole history, failing the job on any finding, output
   redacted so a real finding does not print the secret into a public log

And the rule in `CLAUDE.md`, beside the publishing rule, saying plainly: the
tree is not the history, and a scan of the tree answers a different question
from the one that matters before a push.

## Files

| file | change |
|---|---|
| `.github/workflows/ci.yml` | the second job |
| `CLAUDE.md` | the rule, next to the publishing rule |

## How it meets the exit condition

Exactly as written, on GitHub:

1. Branch. Commit a planted credential. Commit again **removing** it, so the
   tip is clean and only the history carries it.
2. Push. The `check` job should pass, since nothing at the tip is wrong, and
   the `secrets` job must go **red**. A working-tree scanner passes this
   branch, which is the whole point of the card.
3. Remove the offending commit from the branch, push, and watch it go green.

Both conclusions read from `gh run`, and the log checked to confirm the failure
names the planted credential's file and commit rather than failing for some
other reason.

## Corrected by the plan check, before building

Four things, and the last one changes what the rule in `CLAUDE.md` may claim.

**The command.** `gitleaks detect` is deprecated; `git` is the history command.
And `gitleaks git .` scans **the checked out ref's ancestry**, not every ref, so
the plan's stronger claim was not what the command delivered. It is
`gitleaks git --redact --exit-code 1 --log-opts="--all" .`.

**The binary has to be probed, not trusted.** There is an unresolved report
that 8.30.1 can exit 0 on canonical matches. It is against an ARM Homebrew
build, so it does not condemn the Linux artifact, but it means a pinned version
number is not evidence the scanner detects anything. So the job **plants a
known secret in a scratch repository and requires the scanner to find it**,
before the real scan runs. A scanner that silently stops detecting then fails
loudly instead of reporting clean, which is the failure mode this whole card
is about.

**The download has to be verified.** A pinned release downloaded without
checking its SHA-256 is a pinned version number and an unpinned binary. The
release publishes `gitleaks_8.30.1_checksums.txt`, so the job checks the
archive against it before executing anything from it.

**The fixture cannot be a generic API key.** GitHub can enable generic-pattern
detection separately, so there is no portable promise that a generic assignment
gets past push protection to reach CI. Instead a narrow rule matches a
SkipBureau-specific sentinel prefix, `SKIPBUREAU_PLANTED_SECRET_` followed by a
long alphanumeric run. GitHub has no provider credential to block, so the
branch reaches the runner every time, and the job proves the traversal and the
failure wiring deterministically. The separate probe proves the real default
rules still work, so the two together cover what one fixture cannot.

## What this check is, honestly

**It does not scan before anything is published, and the card's title
overstates it.** CI runs after GitHub has accepted the push, so by the time this
job starts, the objects are on GitHub. Push protection is the pre-push control
and it is already enabled here. This is the **backstop**: it catches what push
protection's partner patterns do not cover, it fails the branch before a merge,
a release or a deploy, and it makes the history question something a machine
asks on every push rather than something I remembered to ask once.

`CLAUDE.md` says exactly that, rather than implying a push can be stopped by a
job that runs after it.

## The step I am least sure of

**Whether the sentinel rule fires on history rather than only on the tree.**
The whole card turns on `--log-opts="--all"` actually reaching a blob that was
added and then deleted. If it quietly scans the tip, the planted branch passes
and I record a proof of nothing, which is the same mistake as the original
working-tree scan wearing a different hat.

That is why the proof plants the secret in one commit and **removes it in the
next**, so the tip is clean. A tip-only scan reports green on that branch, and
green is the failure.
