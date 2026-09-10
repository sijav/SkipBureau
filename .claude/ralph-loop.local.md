---
active: true
iteration: 16
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
- **SEO is utmost, and it is a constraint on every screen, not a pass at the
  end.** The owner, 2026-09-10. This product is found through search or it is
  not found: nobody standing in a government office knows SkipBureau exists,
  they type their problem into Google. So a page has to BE a page, a URL has to
  return 200, the two languages need reciprocal `hreflang`, each guide needs
  its own title and description in each language, guides carry `HowTo`
  structured data, and the sitemap is generated. The verified date this product
  already requires is the sharpest advantage it has, so it belongs in the
  markup. See CLAUDE.md.
- **A language control belongs in the topbar**, in the slot the profile control
  occupies, without changing the header height of 68 or 60.

## Then work the loop

1. **Roast the previous iteration.** Ask of the last summary: is this really
   done, is something left over? Check against reality. Run it, read the code,
   read `git status` and `git diff`. This roast is yours, not the skill.

   A false or premature "done" is repaired **before any new work starts, by
   filing a card for what is actually left** — not by reopening the closed task.
   `done` is terminal. The challenge is the valuable half of this step and it
   stays; what it must never become is a licence to go back into something that
   was already called finished.

2. **Pick the work.** `todo next`, then `todo move <id> in_progress` before
   touching a file. The script picks, not you: highest severity, fewest points,
   lowest id, never one whose parent is unfinished. If the pick looks wrong, fix
   that task's severity, points or parents and run it again. Discovered work
   becomes a board entry with all nine fields **before** you do it. Never use
   the built-in TodoWrite.

3. **WRITE THE PLAN FIRST, AND HAVE IT CHECKED, BEFORE BUILDING ANYTHING.**

   **The plan file goes where the work goes.** The owner, 2026-09-10:

   > "you write in the file named #[task_number] - [title].md in the related
   > folder that the doing is about to write there! not a separate folder, this
   > is important"

   So the file is `#SB-0XX - <the task's title>.md`, written **in the folder
   the task is about to build in**: `apps/api/prisma/` for a schema task,
   `apps/web/src/shared/<component>/` for a component, `apps/web/src/core/` for
   a core change. Not in `.claude/`, not in a `plans/` folder. Whoever opens
   that folder later sees what was intended there, next to what was built.

   Where a task genuinely spans several folders, it goes in the one that
   receives most of the work, and the plan says which others it touches.

   Write exactly what you are about to do: the approach, the files you will
   touch, how it meets the exit condition, and the step you are least sure of.
   Then:

   ```bash
   PLAN="apps/api/prisma/#SB-008 - Data model, country is a dimension.md"
   python ~/.claude/skills/roast/roast.py plan \
     --title "SB-008 ..." --exit-condition "..." \
     --did "$(cat "$PLAN")" \
     --ask "the mechanism you are least sure of, named"
   ```

   That kind is ChatGPT **with web search**, because half of "is this the right
   approach" is a question about what a library actually does in this version.
   **Every time the plan file is touched it gets checked again.** Wait for this
   one: the whole point is that it comes back before the time is spent.

   **Ask it real questions.** `--ask` is the roast. A question that names the
   mechanism you doubt gets an answer worth having; "is this a good approach"
   gets a generic answer and wastes the round trip. Ask about the part you are
   least sure of, not the part you are proudest of.

   Then judge it as you would any roast, adjust the plan, and only then build.
   The plan file stays in the tree and is committed with the work.

4. **FINISH IT FIRST. Tests and everything, and make sure it actually works.**

   The owner, 2026-09-10: _"you finish the task first (with test and everything
   and you make sure it works, THEN and only THEN you put it in done)"_.

   Linear, one unit at a time, until it meets its exit condition. Then, before
   the task is `done`:

   - the tests it needed are written and **passing**
   - lint clean, `lint:tsc` clean, the build succeeds
   - **it was run**, not inferred. For anything with a UI that means a browser,
     in `en-US` and `fa-IR`, light and dark
   - a guard you added was watched failing on a case you planted by hand

   A task that is `done` is a task that works. Nothing is closed on the
   expectation that it works, and nothing waits for a roast to find out.

   **How much of the gate you run depends on whether the task has a parent**, the
   owner's rule of 2026-09-10: a task with **no parent** closes on the **full
   suite**; a **CHILD** closes on the **tests for the files it changed**, plus
   lint and the type checker where it touched. A child is one slice of a parent
   and the whole gate runs again when the parent closes. It is a rule about cost,
   not rigour: the same checks run, once, where they mean something. If you
   cannot tell which tests cover what you changed, run more rather than guess.


5. **THEN move it to `done`, and only then fire the roast, in the background.**

   <!-- roast-order -->
   ```bash
   todo move <id> done          # FIRST. The task is finished and proven.
   python ~/.claude/skills/roast/roast.py task --title ... --did ... --ask ... &
   ```

   **That order is the rule, not a formatting choice.** These two lines were the
   other way round, so the reviewer could read and report on work before it was
   closed, which is the one thing this step exists to prevent. A command block
   gets copied; the sentence above it does not. Do not tidy them back.

   **Do not wait for it.** Commit, `todo next`, and start building the next
   task while it runs. Waiting on a round trip to another model is how an
   iteration gets spent on nothing.

   The roast is a check on work that is already finished and already proven. It
   is not the thing that decides whether the task was done.

6. **When the roast comes back: roast it, file the findings, and then FORGET
   them unless they block what you are building now.**

   Its output is evidence, not a verdict. Reproduce each finding, or say what it
   misread, and never silently drop one. **Every finding that survives becomes
   its own board entry with all nine fields.**

   **A finding is a CHILD of the task it came out of**, filed with
   `todo add --parent-task <that task>`, never as a loose card. One level: a
   child never gets children. **When the LAST open child of a parent closes,
   roast the parent together with all of its children**, on what was done for
   the whole task rather than the last piece. What that round finds becomes a
   new child, and it repeats until a round finds nothing.

   Then exactly one of two things happens.

   **Does a filed finding block the task you are building RIGHT NOW?**

   - **Yes** → revert what you have done on the current task, put it back to
     `backlog`, and go to `todo next`. The first pick will probably be one of
     the findings you just filed, because it is more important, which is the
     whole point of the board choosing.
   - **No** → **forget it.** It is on the board. Carry on with what you were
     building as though the roast had never come back. Do not weigh it up
     again, do not half-do it, do not let it change the current task.

   **Relay the roast to the owner in your reply**, they cannot see it: what was
   found, what you accepted, what you rejected and why.

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
