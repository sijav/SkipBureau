---
active: true
iteration: 4
max_iterations: 0
completion_promise: "SKIPBUREAU-DONE"
started_at: "2026-09-09T22:50:00Z"
---

Continue building **SkipBureau**, a step-by-step guide to bureaucracy abroad for
travellers and expats. This prompt is the trigger; the rules are below and in
the files it names. Re-read them this iteration, in full, before touching
anything.

## Step 0, do this first, every single iteration

The context you had is gone. Rebuild it from disk:

1. `CLAUDE.md`, the working agreement, the product, and the owner's rules.
2. `DESIGN.md`, the design contract. Figma `Xk7m6KtxdfGtZb6CO32K74`, every token
   and component family with its node id.
3. The board: `node ~/.claude/skills/todo/todo.mjs` (the `/todo` skill).

If a file disagrees with the repository, the repository is right and the file is
stale, so fix the file. Anything not in those files or in the code was never
recorded. Record it now.

## The owner outranks every file here

These rules were written by the assistant. **A direct instruction from the owner
beats all of them, and the more recent instruction wins.** If something here
contradicts what the owner said, the owner is right and this file is wrong.

**Never invent a gate the owner did not ask for.** No score thresholds, no
mutation testing, no verification apparatus, nothing that refuses to let work
close. If a check seems necessary, say so in the reply and let them decide.

## The rules that get broken first, so read them twice

- **Components before screens.** Every component is built and storybooked on its
  own before any screen composes it.
- **Match the design exactly**, not approximately. Every size, state, variant
  and token comes from Figma, and `DESIGN.md` records the node id of each one.
  `get_metadata` gives structure and sizes only: call **`get_design_context` on
  the node** for fills, strokes, padding and font weight before building a
  component. With no nodeId `get_metadata` lists only the first page. Pages
  `5:3`, `5:4` and `5:5` are empty, and page `90:523` is archived.
- **There is no mobile design.** Every frame is 1440. Anything responsive is
  invention, so it is the owner's decision, not a guess (SB-019).
- **Every user-facing string goes through lingui with an ENGLISH id.** Persian
  is the translation. A bare literal in a `.tsx` is a defect in either language.
- **No colour, spacing or radius literal in a component.** Everything resolves
  through the theme built from the tokens in `DESIGN.md`. `text-on-accent` is
  near-black, not white, and the focus ring is `accent-text`, both for measured
  contrast reasons recorded there.
- **A story before the component**, and stories render from their args.
- **No TypeScript escape hatches.** No `as` to force a mismatch, no
  `@ts-ignore`, no `any`.
- **Documentation prose lives in markdown**, never as JSDoc in a `.tsx`.
- **Country is a dimension, not a constant.** Turkey is the first country, not
  the subject. Adding a second must need no code change.
- **A language control belongs in the topbar**, in the slot the profile control
  occupies, without changing the header height of 68 or 60.

## Then work the loop

1. **Roast the previous iteration.** Ask of the last summary: is this really
   done, is something left over? Check against reality. Run it, read the code,
   read `git status` and `git diff`. A false or premature "done" is repaired
   before any new work starts. This roast is yours, not the skill.

2. **Pick the work.** `todo next`, then `todo move <id> in_progress` before
   touching a file. The script picks, not you: highest severity, fewest points,
   lowest id, never one whose parent is unfinished. If the pick looks wrong, fix
   that task's severity, points or parents and run it again. Discovered work
   becomes a board entry with all nine fields **before** you do it. Never use
   the built-in TodoWrite.

3. **WRITE THE PLAN FIRST, AND HAVE IT CHECKED, BEFORE BUILDING ANYTHING.**

   Write exactly what you are about to do into `.claude/plan.md`: the approach,
   the files you will touch, how it meets the exit condition, and the step you
   are least sure of. Then:

   ```bash
   python ~/.claude/skills/roast/roast.py plan      --title "SB-00X ..." --exit-condition "..."      --did "$(cat .claude/plan.md)"      --ask "the thing you are least sure of"
   ```

   That kind is ChatGPT **with web search**, because half of "is this the right
   approach" is a question about what a library actually does in this version.
   **Every time `.claude/plan.md` is touched it gets checked again.** Wait for
   this one: the whole point is that it comes back before the time is spent.

   Then judge it as you would any roast, adjust the plan, and only then build.

4. **Do it**, linear, one unit at a time, until it meets its exit condition. For
   anything with a UI, open it in a browser and look at it in `en-US` and
   `fa-IR`, light and dark.

5. **Fire the roast in the BACKGROUND, close the task, and take the next one.**

   ```bash
   python ~/.claude/skills/roast/roast.py task --title ... --did ... --ask ... &
   todo move <id> done
   ```

   **Do not wait for it.** Commit, `todo next`, and start building the next
   task while it runs. Waiting on a round trip to another model is how an
   iteration gets spent on nothing.

6. **When the roast comes back, judge it and FILE. Do not stop to do it.**

   Its output is evidence, not a verdict. Reproduce each finding, or say what it
   misread, and never silently drop one. **Every finding that survives becomes
   its own board entry with all nine fields, and you carry on with the task you
   are already building.** A finding is work for later. It is not an interrupt.

   **Relay the roast to the owner in your reply**, they cannot see it: what was
   found, what you accepted, what you rejected and why.

   **The one exception.** If a finding means the task you are building right now
   is built on something wrong, and would have to be redone anyway, then stop:
   revert what you have done on the current task, put it back to `backlog`, and
   do the finding first. That is a judgement about whether the current work is
   already wasted, not an excuse to chase every finding.

   **Never re-roast a task to grind its score up.** There is no score and no
   minimum. That once cost five rounds on one task while the product stayed
   empty. One roast, one adjudication, file, next.

7. **Commit**, then go straight to `todo next`.

## Never

Never end an iteration on a summary, a checkpoint, or a "want me to do X?"
question. When a piece lands, start the next one. Use the question tool only for
a decision that is genuinely the owner's, and it stops the loop for a real
answer, which is what it is for. Do tell them, unprompted, when something is
costing far more than it is worth.

Output `<promise>SKIPBUREAU-DONE</promise>` only when every board task is `done`
or `dropped`, every closed task carries a roast whose findings were filed, and
the product is live-verified in a browser in both languages. The board emptying
is the condition. Never output it falsely to escape the loop.
