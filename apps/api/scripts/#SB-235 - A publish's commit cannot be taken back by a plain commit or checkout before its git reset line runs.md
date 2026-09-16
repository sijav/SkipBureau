# SB-235, A publish's commit cannot be taken back by a plain commit or checkout before its git reset line runs

**Exit:** `test/publish-research.spec.ts` builds a publish commit in a temporary repository, runs a
plain `git commit` after it, and HEAD still holds the published bytes; **or** the research guide and
the publish's report name plain commit, checkout and restore as taking a publish back before its reset
line runs.

## The mechanism, read from the script

`commitBytes` builds the commit in a **temporary index**: `GIT_INDEX_FILE` points at a throwaway
folder, `read-tree` seeds it from the starting commit, each checked file is hashed with
`hash-object -w` and staged with `update-index --cacheinfo`, then `write-tree`, `commit-tree` and
`update-ref <branch> <commit> <start>`. The branch moves. **The repository's own index is never
touched**, so for the committed paths it still holds the bytes from before the publish, until the
printed `git reset -q -- <paths>` runs.

In that window:

- a bare `git commit`, or `git add` of anything followed by one, commits those old entries and is an
  immediate revert of the publish;
- `git checkout -- <path>` or `git restore <path>` copies the index's version into the working tree,
  so in this window it writes the old bytes back there, and a reset afterwards repairs the index
  without touching them (SB-381, which corrected the same sentence in the guide).

## The first branch of the exit is unreachable, and deliberately so

A test where a plain commit leaves HEAD holding the published bytes would require the script to bring
the main index level itself. **SB-232 declined that with a reason**, in its own plan: git has no
compare-and-swap for a single index entry, so a write there from the background could swallow a change
another process staged in the foreground. Its point 5 then records the consequence as a known limit,
naming this exact sequence, `git add` of the board followed by a bare commit.

So this card takes the second branch. Reversing SB-232's decision is a different card and a bigger
one, and it would trade a documented hazard for an undocumented race.

## What the card gets wrong, which is worth saying

It says the guide "warns only against stash, pull and merge". It does more than that: `README.md`
already says "every commit names its paths, `git commit -- <paths>`". What it does not say is **what
happens if you do not**, and it never mentions `checkout` or `restore` at all. So the instruction is
there and the reason is missing, which is the kind of rule people drop the moment it is inconvenient.

## What changes

`prisma/research/README.md`, the paragraph that already names stash, pull and merge: it gains the
consequence and the two missing commands. A bare commit takes the publish back; `checkout --` and
`restore` put the old bytes back so the next commit does.

`scripts/publish-research.ts`, the report's last line. Today it prints only the command:

```
now, in the foreground: git reset -q -- "<paths>"
```

It will say what the line is for, so somebody reading the report alone, without the guide, knows why
it is not optional.

**And the wording becomes testable rather than trusted.** The line is built inline in `main()`, where
no test can see it. It moves into an exported helper beside `messageOf` and `labelTestArgs`, which are
exported for exactly this reason, and `publish-research.spec.ts` asserts it names the reset, the paths
and each of the three commands. That is a small change and it is what stops this prose rotting the way
the guide's did.

## This MITIGATES. It does not prevent, and the card's title says it does

The check's correction, taken: documentation cannot make a publish impossible to take back, and the
card's title promises exactly that. What this card delivers is that somebody who reads the report or
the guide knows the hazard and the one command that ends it. Nothing stops somebody who reads neither.

I asked whether prose is a real fix, given I ran the hazardous sequence three times today and the
guide's half-written rule did not prevent the hazard existing. The answer is that prose is what is
available. A `pre-commit` hook, with a marker the publish writes and clears, could refuse the bare
commit without touching the index, but **git has no equivalent hook for `checkout` or `restore`**, the
hook has to be installed on each machine, and `--no-verify` walks past it. So it would cover one of
the three commands, conditionally. That is a separate, smaller safeguard to offer the owner rather
than something to build inside this card, and it is not a replacement for saying the thing out loud.

## The report's sentence, as the check worded it

> Before any commit, checkout, or restore, run `git reset -q -- <paths>`: the main index still contains
> the pre-publish bytes, and a plain commit would revert this publish.

One imperative sentence in the report, the explanation in the guide. That answers the question I could
not settle: the report is what somebody sees when the publish finishes, so it carries the instruction,
and the guide is what they read once, so it carries the why.

## What I am least sure of

**Whether the report should say all of it.** A report that prints a paragraph is a report nobody
reads, and the guide is where reasons belong. My instinct is one added sentence naming the three
commands, with the guide carrying the why. If the check thinks the report should stay one line and
only the guide change, I would rather hear it than pad the output.

## How it is checked

`test/publish-research.spec.ts` whole, which is where the new assertion goes and which needs no
database or network, plus lint and the type checker. SB-235 is a child of SB-232, so that is its gate.
Nothing here touches research data or the schema, so nothing is published.
