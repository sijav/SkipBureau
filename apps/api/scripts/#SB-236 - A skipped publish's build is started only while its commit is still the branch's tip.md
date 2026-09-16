# SB-236, A skipped publish's build is started only while its commit is still the branch's tip

**Exit:** a test gives the dispatch decision a branch tip that has moved past the publish commit
and it does not dispatch, and a tip still at the commit and it does; planted, a decision that
ignores the tip fails that test.

## Why

Northflank skips a push that lands while another build runs, and pushing again sends nothing, so
`publish-research.ts` starts the build itself: when the publish commit still has no Northflank
status three minutes after its push, it dispatches `northflank-build.yml` for that exact sha.

The hole is that it dispatches for a commit it no longer checks is current. If another push under
`apps/api` lands in those three minutes, that push's build carries the publish too, so the digest
can match and the script report **live**, while the build dispatched for the older sha finishes
afterwards and deploys the older commit over the newer one. Nothing says it happened: the receipt
is a digest of the research file, which both commits satisfy, and the read-back asks the API what
it serves, not which commit it is running.

So a publish can roll the deployed API back to older code with no error at all, undoing a change
pushed a minute after it.

## What changes

A pure decision beside the others the script already exports, in the shape `runVerdict` uses, a
choice with the reason attached:

```ts
export type DispatchChoice = { dispatch: true } | { dispatch: false; reason: string }
export const dispatchChoice = (tip: string | null, commit: string): DispatchChoice
```

- the tip **is** the commit: dispatch, this is the case the fallback was written for;
- the tip is **another commit**: do not dispatch, because a newer push is on the branch and its
  build carries this publish; keep waiting for that build's digest;
- the tip could **not be read**: do not dispatch. Dispatching on an unknown tip is the very thing
  this card exists to stop, and waiting costs at worst the fifteen minutes the loop already allows.

At the call site the tip is read with `git ls-remote origin <branch>`, whose output is
`SHA<TAB>ref`, through a wrapper that returns `null` rather than throwing, because this runs inside
the wait loop where a momentary network failure must not end a publish. `branch` is already
`refs/heads/main` from `symbolic-ref HEAD`, which `ls-remote` takes as a ref, and the remote is
`origin`.

**The wrapper is where this is most likely to go wrong**, which the check named: `ls-remote` exits
**successfully** when a ref matches nothing, so an empty answer would sail past a naive reader and
become an unsafe dispatch. So `null` is returned for a non-zero exit, for empty output, for a first
field that is not forty hex characters, and for a ref that is not the branch asked for. Only a
well-formed sha counts as a tip.

## What it costs, and the case I am least sure of

Declining to dispatch means the publish now waits for another build to carry it. Usually there is
one: a later research publish runs this same fallback for its own commit. **But not always**, and
the plan first claimed otherwise. An ordinary push can be skipped by Northflank exactly as the
publish's was, and then neither commit is built and this publisher waits out its fifteen minutes
and throws. Waiting longer cannot fix a skipped build.

**That failure is the right one**: it says the deploy did not arrive, and it does not silently
serve older code, which is what the card exists to stop.

**A stronger version exists and is deliberately not taken here.** The check's alternative is to
establish that the moved tip is a **descendant** of the publish commit and then dispatch the
**tip** rather than the older commit: that cannot roll code back and it also rescues a skipped
ordinary push. It must never dispatch an unverified tip, since a force push or a rewritten branch
may not contain the publish at all. That is a larger change than this card's decision and is left
to its own card rather than smuggled in.

There is also a window between reading the tip and the dispatch landing. It is small, and nothing
in this repository can close it from the publisher's side, since GitHub accepts the dispatch for
any sha; closing it properly would mean the workflow itself refusing to build a sha that is not
the tip. That is named here rather than pretended away.

## The tests

`test/publish-research.spec.ts` already tests this family of pure decisions with literal inputs,
`buildStateOf`, `dispatchArgs` and `runVerdict` among them. The new test gives `dispatchChoice`:

- a tip equal to the commit, and expects a dispatch;
- a tip that is another sha, and expects no dispatch with a reason naming the newer tip;
- a `null` tip, and expects no dispatch.

**And the parser, which the check called the likeliest thing to be wrong here.** `tipIn` is
exported beside the decision and given `ls-remote`'s answers: a well-formed `SHA<TAB>ref` line for
the branch asked for, which is the tip; empty output, which is what a ref matching nothing gives
while still exiting successfully; a sha that is not forty hex characters; and a line naming
another ref. Only the first is a tip and the rest are `null`, so an empty answer can never become
a dispatch.

Planted: the decision made to ignore the tip, `() => ({ dispatch: true })`, which must fail the
moved-tip case. That is the exit condition's own planted case.

## Files

`apps/api/scripts/publish-research.ts`, `apps/api/test/publish-research.spec.ts`, and this plan.

## How it is checked

SB-236 came out of SB-232's roast, so it is a child: the tests covering the files it changes,
`publish-research.spec.ts`, plus the API's lint and `lint:tsc`. There is no deployment to read
back: this changes when a build is started, not what is served, and the next research publish
exercises it in its ordinary course. The planted case is what proves it.
