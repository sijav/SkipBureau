# SB-297, Publishing research runs the web's label tests before it writes

**Exit:** `research:publish` refuses to write when a researched situation or a linked obligation's
fact has no label, proven with one planted in a research file, and publishes once the label
exists.

## Why

The publish is the path the owner's research takes to the live database. It checks the API's types
and runs `research-rules.e2e.spec.ts` and `research-regions.e2e.spec.ts`, and **nothing from
`apps/web`**.

So a research file that adds a situation, or adds a fact to an obligation a guide links, is written
live while the deployed site has no name for it. The Role row then shows the raw code, and the
rules section drops the unnamed fact's line entirely, which is worse than showing it: the reader
is not told the fact exists.

SB-286's roast is what found this. `situationLabels.ts` says a situation with no name "fails now,
rather than reaching a reader as its code", and that is true only of a **push**, which CI checks.
The research goes live through the publish, which never runs it. `factLabels.ts` carries the same
claim and the same gap.

## Why running them from the publish actually catches it

Read rather than assumed: both tests import from the API through the `api/…` alias and read the
research itself.

- `situationLabels.test.ts` builds the set of situations from `RESEARCHED`'s versions' criteria and
  asserts every one is a key of `SITUATION_LABELS`.
- `factLabels.test.ts` takes `LINKED_OBLIGATION_GROUPS.flat(2)`, collects every fact key of every
  version of those obligations from `RESEARCHED`, and asserts each is a key of `FACT_LABELS`.

So a situation or a fact planted in a research file fails them without touching anything web-side,
which is exactly the case the exit asks to be proven.

## What changes

One more `run(...)` in the check block, beside the API specs and **before anything is written**:
the checks sit above `commitBytes`, so a failure throws with the working tree untouched and nothing
pushed.

It invokes the same vitest binary the API specs use, with the working directory set to `apps/web`
so its own `vitest.config.ts`, its alias and its lingui plugin are the ones in force, and with:

```
--project=unit src/shared/context-control/situationLabels.test.ts src/shared/rule-answer/factLabels.test.ts
```

**`--project=unit` is not a detail.** The web config has four `storybook:${mode}-${direction}`
projects beside `unit`. Running them from a publish would be slow, needs a browser, and on this
machine they race over one pre-bundle and fail with EPERM. `unit` is `environment: 'node'` and
includes only `src/**/*.test.ts`.

**Two files rather than the whole `unit` project**, because a publish must refuse for the reason it
is checking. Running every web unit test would let an unrelated failure block a research publish,
which is a different and worse kind of stop. The check agreed, and refused the alternatives: a tag,
a directory or a separate project would still rest on somebody classifying a future test correctly.

The failure is reported as the API specs' are, `NO_COLOR`, the output filtered to the lines that
say what failed, wrapped in a `PublishError` naming the labels rather than the specs.

**The filter would have eaten the answer**, which the check caught: it keeps only lines matching
`FAIL|AssertionError|Error:|Tests`, and the missing key appears in vitest's diff, which is none of
those. So both assertions take an `expect` message naming the situations or facts that have no
label, and that message is on a retained line.

### A passing gate is not a labelled site

The check's central objection, and it is right. The publisher snapshots and commits **only the API
research files**, and `otherInputs` does not count the web's label files among the build inputs it
guards. So the label could be added locally, the gate would pass, and the publish would commit and
push the research data alone: the live site would still have no name for the situation, which is
the exact harm this card exists to prevent.

So the label must already be **committed** for the publish to proceed. The publish refuses when
`apps/web/src/shared/context-control/situationLabels.ts` or
`apps/web/src/shared/rule-answer/factLabels.ts` is dirty or untracked, with the same words the
build-input guard already uses: commit them first. A gate that passes on a working tree the publish
will not carry is worse than no gate, because it reports safety it has not established.

## The tests

This is a child of SB-286, so it closes on the tests for what it changes, plus the API's lint and
`lint:tsc`.

- The arguments are a pure exported value, as `dispatchArgs` already is, so
  `publish-research.spec.ts` can assert the project, the two paths and the working directory
  without running anything, and the dirty-label refusal is a pure decision tested the same way.
- **The exit's own planted case, run for real**: a situation added to a research file with no label
  in `SITUATION_LABELS`, then `research:publish` run against that case. It must stop in the checks,
  naming the situation that has no label, **before** it commits, pushes or writes.

  That is safe **for an ordinary publish**, which is what this rehearsal uses: the check block
  precedes `commitBytes`, so nothing reaches the repository or the database. It is **not** true of
  `--down`, which rewrites the case's data file before the input guard, the snapshot and the
  checks, so a failure there leaves that edit on disk. That is a separate defect and is filed.
- Then the label added **and committed**, and the checks run again to show they pass. The full
  publish is not run a second time to prove that half, because a real publish pushes and deploys;
  the two files passing with the label committed is exactly what the publish would have seen.

## The steps I am least sure of

**Whether the web's vitest resolves from the API's binary with a changed working directory.** The
workspace hoists vitest, so the same `vitest.mjs` should read `apps/web/vitest.config.ts` when run
from there, but that is the thing to try first rather than last.

**Whether refusing on two files is the right line.** A label is not the only web-side thing a
research file can break; it is the only one with a test that reads the research today.

## Files

`apps/api/scripts/publish-research.ts`, `apps/api/test/publish-research.spec.ts`, and this plan.
