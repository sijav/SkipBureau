# SB-381, The guide says checkout and restore revert a publish even after the reset, and they do not

**Exit:** `prisma/research/README.md` describes the order rather than claiming `checkout` or `restore`
revert a publish after the reset has run, and says what a reset leaves behind when one of them ran
first.

## What the document says now

In the paragraph SB-235 added, "And this is what happens if you do not":

> `git checkout -- <path>` and `git restore <path>` are worse in their own way: they write the old
> bytes back into the working tree, so the next commit reverts it even after the reset has run.

The first half is true. The second half is false, and SB-235's own roast caught it.

## What is actually true, proven rather than assumed

This card exists because a card replaced a missing reason with a wrong one, so the replacement is not
being taken from the finding's wording either. The publish's shape was reproduced in a throwaway
repository: commit `old`, write `new` into the working tree, then build the commit through a temporary
`GIT_INDEX_FILE` with `read-tree`, `update-index --cacheinfo`, `write-tree`, `commit-tree` and
`update-ref`, which is what `commitBytes` does and which never touches the main index.

```
after a publish:                      HEAD: new   index: old   tree: new

A  checkout BEFORE the reset:                     index: old   tree: old
B  reset, then checkout:                          index: new   tree: new
C  checkout, then reset:                          index: new   tree: old
   then a plain git add:                          index: old
D  restore BEFORE the reset:                      index: old   tree: old
```

So:

- **`checkout` and `restore` write the INDEX's bytes into the working tree**, not HEAD's. That single
  fact explains both halves.
- **Before the reset** the index still holds the pre-publish bytes, so either command puts them back
  in the tree.
- **A reset afterwards does not undo that**, which run C shows in three steps: the reset puts the
  index back to `new` while the tree stays `old`, and a plain `git add` then stages `old` again. It
  repairs the index and does not touch what the earlier command already wrote. This is the part the
  current paragraph gropes at and states wrongly.
- **`git restore <path>` behaves exactly as `git checkout -- <path>` here**, which run D shows rather
  than assumes. The paragraph names both commands, so both were tested; `restore --staged` is a
  different thing and is not what the paragraph is about.
- **After the reset** the index holds the published bytes, so both commands write those, and neither
  can take a publish back.

The repository's fsmonitor trap applies to that experiment and was handled: this machine's system
gitconfig sets `core.fsmonitor = true`, so the throwaway repository was created with it off and
`gc.auto 0`, and removed afterwards.

## What changes

`prisma/research/README.md`, that paragraph only. One sentence is replaced by a description of the
order. No code changes: `resetNotice` in `scripts/publish-research.ts` is already correct, read from
source at lines 67 to 69, because it requires the reset before either command rather than describing
what they do, which is why the card says only the guide is wrong.

**A second file carries the same sentence**, found by searching for the claim rather than assuming the
README was its only home. `scripts/#SB-235 - A publish's commit cannot be taken back by a plain commit
or checkout before its git reset line runs.md` asserts it in its own voice, as a bullet: "so the next
commit reverts it even after the reset". That is the same falsehood from the card that introduced it,
not a quotation of the guide, and this repository's rule is that a plan reading as stale beside the
code is corrected rather than removed. So the bullet is corrected in the same edit. The exit names the
README because that is the document a reader consults, and fixing one copy of a claim while leaving
its twin in the folder next door would defeat the card's own reason.

The replacement says, in the document's own voice:

> `git checkout -- <path>` and `git restore <path>` are dangerous in the same window and for the same
> reason: both write the index's bytes into the working tree, and until the reset runs the index still
> holds the ones from before the publish. Run either first and the old bytes are back in the tree,
> where an ordinary `git add` stages them again, and the reset that follows repairs the index without
> touching what they wrote, so the stale file is still sitting there. Once the reset has run the index
> holds the published bytes, so both commands write those and neither can take a publish back.

## How it is checked

This is a documentation card, so the check is that the claim is true, which the transcript above
establishes, and that the document still reads as one argument rather than a patch. There is no test
to write and no guard to plant: inventing one here would be a gate nobody asked for.

What the repository already runs over this file was checked rather than assumed, because writing a
loose claim into a plan is the failure this card exists to correct. Nothing reads the document's
contents. The one spec that names it, `test/publish-research.spec.ts`, passes its path as a sample
argument to `resetNotice` and asserts the printed `git reset` line quotes it; it never opens the file.
So no test can fail on this paragraph's wording, the check is the reading, and inventing one here would
be a gate nobody asked for.

## What the plan check said

It confirmed the second false claim, which run C had already exposed and which this card was not
filed for: "the reset is the whole of the remedy" is wrong in the checkout-first order, where the
reset repairs only the index and the stale working tree bytes remain. Correcting it in the same edit
is required, or the exit is only partly met. Taken, and the sentence is now split so SB-232's reason
for leaving the index alone survives while the conclusion is corrected.

Three corrections, all taken:

- "an ordinary `git add`" was broader than the evidence. Adding an unrelated path does not stage the
  stale file, so it reads "a later `git add <path>`, or a broad add that includes it". Run C staged
  the path itself, which is exactly the narrower case.
- The boundary sentence earns its space, because the paragraph explains where these commands read
  from, so the forms that read somewhere else belong beside it: `git checkout <tree-ish> -- <path>`
  and `git restore --staged <path>`.
- The likeliest misreading is treating `git reset -q -- <paths>` as though it updated the working
  tree. It is now said outright that the reset updates the named index entries from the now published
  `HEAD` and does not touch the working tree.

The wording is largely the check's own, which the owner's rule of 2026-09-15 says to take where it
keeps the meaning, fitted to this document's voice.

## The step I am least sure of

Whether the replacement paragraph stays short enough. The current one is already dense, and the true
account has four moving parts, index versus HEAD, before, after, and what a reset does not undo. If it
grows past the surrounding prose it will be skipped by the person who most needs it, which is the
failure mode the original sentence already has.
