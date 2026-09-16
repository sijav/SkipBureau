# SB-358, The health insurance document never got the conversation's fixed point answer

**Exit:** `talk/germany/health-insurance.md` carries a further pass on the document as it now stands
whose answer raises nothing new, and README's account of which documents reached a fixed point is
true.

## What is actually wrong, read from the two files

`talk/germany/health-insurance.md` ends with a turn whose answer is three substantive findings: that
a BKK24 leaflet states the base as monthly, that § 223 Abs. 2 SGB V supplies the thirty day month,
and that a calculated definition is legitimate where it is labelled and sourced. That is the answer
which CAUSED SB-185's change. The turn closes at "All read 2026-09-16". No pass has been run on the
document as SB-185 left it.

`research/README.md:158` says "With those applied, all three came back no." Read in context the three
are Anmeldung, business registration and health insurance, and for health insurance it is not true:
what came back was a proposal, not a no. The sentence credits this document with a fixed point it
never reached.

The owner's order of 2026-09-12 is that a research conversation continues "until both sides are
satisfied". One side has not answered since the document changed.

## What changes

**One more turn in the same conversation**, session `01a093c8-fa43-7c12-90e6-57f1465c3219`, held in
`sessions["search:codex"]`, resumed and never `--fresh`. The question is the one the other documents
were closed with: does any marker attach a figure to a page that does not state it, or quote evidence
that leaves out a condition its sentence depends on.

**It is asked against the text, pasted in, not against the conversation's memory of it.** The turn
carries the sentence and **five** definition blocks: `bmg-minimum-assessment-base`, which is what
establishes that the figure applies to self-employed voluntary members, `minimum-base-monthly`, and
its three statutory inputs `sgb5-240-daily-minimum`, `sgb5-223-thirty-day-month` and
`svbezgrv-2026-bezugsgroesse-monthly`. The check caught that my first list had four and dropped the
BMG block, which is the one carrying applicability rather than arithmetic.

**And it is told to disregard its own earlier recommendation.** What SB-185 wrote is not what that
turn proposed: the BKK24 leaflet it offered was rejected, deliberately, as one Kasse's information
sheet, and its citation of § 240 Abs. 2 was corrected to that paragraph's LAST SENTENCE, its subject
being economic capacity. A reviewer answering from memory of its own proposal would sign off on a
document that does not exist.

Then two files:

- `talk/germany/health-insurance.md` gains that turn, asked and answered, in the shape the file
  already uses.
- `README.md`'s sentence is corrected. Not a per-document ledger, which the check called extra
  machinery: the one sentence is made to distinguish the two documents that came back no on
  2026-09-15 from health insurance, which comes back no only in this further, later pass.

**No figure changes** unless the answer finds one wrong. If it does, that is a new card, not this
one: this card exists to close a round, and rewriting the document inside it would open another.

## Files this touches

`apps/api/prisma/research/talk/germany/health-insurance.md`, `apps/api/prisma/research/README.md`,
and this plan. The check caught that my first file list named only the plan, which cannot meet the
exit on its own.

## The mechanism this card has to respect

`roast.mjs` writes the WHOLE session map back at line 476, **before** the roast runs. Any other roast
in flight has already loaded that map and will write its own copy back, so a concurrent run can
restore a stale `search:codex` and lose the conversation this card depends on. Two roasts were owed
on SB-200 and SB-186, so I first planned to fire this turn only when nothing else was in flight.

**That was the wrong fix, and reading SKILL.md rather than assuming gave the right one.** The
wholesale overwrite is the **Node half only**: the skill records that `roast.py` writes the session
map by merge under a conversation lock, that `roast.mjs` has neither the lock nor the merging save,
and that the two runtimes are deliberately not at parity on concurrency. It says so directly above
the paragraph that promises merging, precisely so the promise is not read as covering both. **So this
turn is fired with `roast.py`**, which cannot erase another kind's id, and no serialising is needed.

## Proving it resumed, which the stderr line does not

The check found a real gap here, and the plan check's own run demonstrated it while answering:
`roasting with codex/gpt-5.6 (high), resuming ...` was printed, that attempt failed, and a second
line followed for `codex/gpt-5.6-terra (medium)`. **The `resuming` line is printed before an attempt
succeeds**, so a failed codex attempt that fell back to a fresh Claude conversation would leave that
line behind exactly as a successful resume does. Reading `.claude/roast-sessions.json` afterwards
proves nothing either, because every roast rewrites it on the way through.

So the evidence recorded in the talk file is **the written report**: it must name the reviewer as
codex and the session as `01a093c8-fa43-7c12-90e6-57f1465c3219` resumed, and if the run fell back to
another reviewer, the turn is not recorded as the fixed point and is fired again.

## What I was least sure of, and what the check answered

I doubted whether a resumed conversation can close itself at all: asked "is this now fine?" straight
after proposing the change, it is being asked to agree with itself. The check's answer is that this
is confirmation rather than independent verification, but that the exit asks for the fixed-point
pass and not a second opinion, and that a fresh reviewer would be a separate audit which would change
the standard already applied to the other three German documents. So the resumed conversation stays,
and the instruction to test the supplied text rather than its own recommendation is what carries the
weight.

## How it is checked

This is research, not code: no test covers it, and nothing under `src/` changes, so lint and the type
checker are unaffected. The check is that `talk/germany/health-insurance.md` records a pass that
raises nothing new, that the recorded report names codex and the resumed session, and that README's
account matches what the four talk files actually say.
