# SB-343, a failed research take-down leaves the data file rewritten on disk

**Exit, as the card words it:** a `--down` run made to fail after its rewrite leaves
the data file exactly as it was, proved by planting a failure and comparing the file
before and after.

This plan lives in `apps/api/scripts/` because `publish-research.ts` is the file that
changes.

## What is there, measured

The order inside `main`, by line:

```
545  the argument guard, one data file
548  caseOf, which parses the path and checks nothing on disk
554  the agreed document must exist
561  THE REWRITE: writeFileSync of the case's data file
578  the build inputs guard, changes this publish would not carry
583  the snapshot, readFileSync of every selected path
586  the type check
591  the research specs
604  the uncommitted label guard, then the label test
620  changedSince, refusing if a selected file moved while the checks ran
635  commitBytes, the commit
639  the push, then the digest wait, Northflank, and the read back
```

and the top of the file ends with `main().catch(...)`, which prints the error and
sets `process.exitCode = 1`. **It cleans up nothing.** So every `PublishError` from
line 578 onwards leaves the rewritten file in the working tree with nothing saying
so.

**One thing the card says is not quite right.** It says the rewrite happens "before
the input guard". The argument guard is at 545, before the rewrite. What the rewrite
actually precedes is the **build inputs** guard at 578, the snapshot, and every
check. The defect is real and the ordering it names is not, so the plan says what is
there rather than repeating the card.

**`caseOf` does not check that the data file exists**, it only parses the path shape.
So a take-down can run with the file already deleted from the working tree, and a
restore then means removing the file rather than writing bytes back.

**This path has run once for real.** `21f6321`, germany/anmeldung, 2026-09-15,
against fifteen publishes. Real but rare, which is an argument for a small fix rather
than an apparatus.

## The card's first option cannot work, and that is the substance of this plan

The card offers "move the rewrite after the checks, or restore the file when the run
fails". The first is impossible here, for three separate reasons:

- **The snapshot is what gets committed.** Line 583 reads the selected paths into
  `snapshot`, and line 635 passes `snapshot`'s bytes to `commitBytes`. If the rewrite
  happened after the snapshot, the take-down would commit the un-reverted file.
- **The checks are meant to run against the reverted state.** The type check and the
  research specs exist to prove that removing this case still compiles and still
  passes. Run before the rewrite they would be checking the state the take-down is
  removing, which proves nothing about the take-down.
- **The digest is read from the reverted case.** Line 631 imports the data file to
  get `current`, and the country file to get `rules` and its digest, which is what the
  deployed database is then waited on to match.

So the rewrite has to happen where it is, and the fix is the second option.

## The restore window closes at the commit, which nothing currently says

This is the part that needs stating, because getting it wrong would be worse than the
defect. **A failure after `commitBytes` must not restore.** The commit exists by
then, `resetNotice` tells the operator the index still holds the pre-publish bytes,
and putting the old content back into the working tree would leave the tree
contradicting the commit that is about to be pushed or has already been pushed. The
push failure message even says so: it names the commit and says it is on the branch
and not on origin.

So the restore applies to failures **from the rewrite until `commitBytes` returns**,
and to nothing after that.

## The approach

1. Capture the file's bytes immediately before the rewrite, tolerating absence:
   `existsSync(path) ? readFileSync(path) : null`.
2. Wrap the region from the rewrite to the commit so a throw restores and rethrows:
   the captured bytes written back, or the file removed where there were none.
3. Leave everything after the commit untouched.
4. Say in a comment why the window ends at the commit, since that is the part a
   later reader would otherwise 'fix'.

The restore itself is a small exported function so the spec can drive it, matching
how this file already exports `changedSince`, `resetNotice`, `commitBytes` and the
rest for its spec.

## Files

- `apps/api/scripts/publish-research.ts`, the capture, the wrap and the restore.
- `apps/api/test/publish-research.spec.ts`, the planted failure.
- this plan.

## How it is proved, and the exit probably needs restating

The exit asks for "a `--down` run made to fail after its rewrite". **A real `--down`
run cannot be made in a test.** `main` needs a git repository with publish history in
its commit trailers, a full TypeScript check, two vitest runs, the web's label test,
a live API to read a digest back from, and a push to origin. The spec drives none of
that: it imports pure functions and builds throwaway git repositories for the ones
that read a log.

So the proof is of the mechanism rather than the command: the restore function is
given a file, a captured state and a body that throws, and the file must be byte
identical afterwards, with the throw still arriving. Both cases are planted, the file
that existed and the file that did not.

Restated: **a failure between the take-down's rewrite and its commit leaves the data
file exactly as it was, proved by planting a throw in that region and comparing the
bytes, and a failure after the commit deliberately leaves the reverted file in
place.**

That second half matters as much as the first and the card does not mention it.

## The plan check, and an outage worth recording

**The first attempt returned nothing, because every reviewer was unavailable at
once.** On 2026-09-17, around 08:50, the plan roast reported: codex/gpt-5.6 failed
part way through its own output, codex/gpt-5.6-terra was out of its usage window with
an hour assumed, and the claude/sonnet fallback produced no output at all. That is
recorded because a check that did not happen must not be mistaken later for a check
that found nothing.

It was asked again rather than skipped. If the second attempt also returns nothing,
the work proceeds and this section says so: waiting an hour for a reviewer would be
turning a check into a gate that refuses to let work close, which this project's
rules forbid in as many words, while quietly dropping the rule would be worse than
either.

## What was built, and the shape decided without a ruling

The check never returned, so the shape was chosen here and the reasoning is recorded
rather than left implicit.

**The window is a named flag, not a brace position.** Wrapping only the rewrite to
the commit would have needed six variables hoisted out of that region, because
`snapshot`, `rules`, `current`, `digest`, `previous`, `id` and `commit` are all
declared inside it and read afterwards. So the `try` runs from just after the
take-down block to the end of `main`, and `committed = true` sits immediately after
`commitBytes` with the reason beside it. The `catch` restores only while `committed`
is false. A reader now sees where the window closes, instead of inferring it from
where a brace happens to fall.

**The 181 line re-indentation was proved to be only indentation.** An ordinary diff
reports 196 insertions and 164 deletions, which hides everything. `git diff -w`
reports exactly six changes: the new `restorer`, the two declarations, the capture,
the `try`, the `committed = true`, and the `catch`. Nothing else moved.

```
typecheck                                exit 0
publish spec, 26 tests where it had 24   exit 0
API lint                                 exit 0
```

## The exit is met literally after all, by a real run

This plan argued that a real `--down` made to fail could not be run in a test, and
that is still true of a test. It is **not** true of a run, and the difference matters
because the card asked for a run.

**The build inputs guard sits two steps after the rewrite and throws on a dirty
tree.** This card's own uncommitted changes under `apps/api` are exactly such a tree,
so a take-down of a case with an unreverted publish rewrites the data file and then
fails, with no commit, no push and no build anywhere near it:

```
npm run research:publish -w @skipbureau/api -- --down src/rules/research/turkey/work-permit.ts

research publish: the deployed build is made from changes this publish would not
carry: apps/api/scripts/publish-research.ts, apps/api/test/publish-research.spec.ts.
Commit them first.

before  13030 bytes  sha 1c5611ab29a8bad0
after   13030 bytes  sha 1c5611ab29a8bad0   restored
```

**The error message is what proves the rewrite happened.** An identical file before
and after would mean nothing on its own: had `lastUnreverted` thrown first, the run
would have stopped before the rewrite and the file would be identical for the
uninteresting reason. The failure reported is the build inputs guard, which is after
the rewrite, so the run reached past it and the file came back anyway.

turkey/work-permit was chosen because only germany/anmeldung has ever been taken
down, so it is the case whose publish is still unreverted.

**And the guard was watched failing.** The same command, the same case, the same
guard, with only the restore call removed:

```
before  13030 bytes  sha 1c5611ab29a8bad0
after   11413 bytes  sha e4ad8fad620a1398   left rewritten, 51 diff lines
```

What it abandoned is not abstract. The diff's first hunk is the loss of the FOUNDER
criteria and the SB-216 comment above it, which is work shipped earlier the same day:
a take-down of an unrelated case, failing for an unrelated reason, quietly deleting
1617 bytes of a research file that nobody asked it to touch. That is the defect in
one measurement.

Both files were then put back from copies rather than from git, since both held this
card's uncommitted work: the data file is byte identical to its copy and clean
against HEAD, and the restore call is back in the script.

So the exit is met as the card worded it: a `--down` run made to fail after its
rewrite leaves the data file exactly as it was, proved by planting a failure and
comparing the file before and after, in both directions.

## The step I was least sure of, answered by building it

**Whether wrapping most of `main` in a try was the right shape.** Left here as it was
written, because what was doubted beforehand is the useful part of the record. It was
answered by doing it rather than by a ruling, since the check never returned.

The worry was that a `try` around the region re-indents a large block for a small
guarantee and shows a reviewer a big diff for a two line idea, while the tidy
alternative, a module level undo called by the top level `catch`, keeps the diff
small and introduces the hidden state this file has otherwise avoided.

**The visible `try` won, and the diff turned out not to be the problem I feared.**
`git diff -w` reduces 196 insertions and 164 deletions to six real changes, so a
reviewer reads the change rather than the indentation. The flag made it better than
planned too: `committed` names where the window closes, which a brace position never
could.

Second, whether restoring on a failed **publish** matters too. This card is about
`--down`, and only `--down` rewrites a file before the checks. A publish rewrites
nothing, so there is nothing to restore, and the scope stays where the card put it.
