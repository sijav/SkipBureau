# SB-357, the rewritten Berlin paragraph never got its research conversation's sign-off

**Exit, as the card words it:** `talk/germany/residence-permit.md` carries a pass on the enumerated
four route paragraph, naming the session it ran in, whose last round raises nothing new.

This plan lives in `apps/api/prisma/research/` because that is where the research documents, their
conversations and their README are. No code changes.

## What is actually wrong, read from the four files

- **The document's conversation is `01a093c2-4c44-7dd2-b927-478f5d8922e6`.** It is at
  `talk/germany/residence-permit.md` line 6, and at `sessions.json` under
  `"germany/residence-permit"`. The two agree.
- **Its last real closing pass was 2026-09-15 07:11 UTC**, talk line 1091, asked in that
  conversation, and it came back no.
- **SB-184 then changed the document on 2026-09-16**, and that turn went somewhere else. Talk line
  1460 records it: the pass went to `01a09371-2c9c-7e33-a46c-8bcb6e01c583`, whichever conversation
  `search:codex` happened to hold, "not to `01a093c2-...` above". That thread had never read this
  subject.
- **So the paragraph a reader sees has never been put to the conversation that researched it.**
  `agreed/germany/residence-permit.md` lines 86 to 93 now enumerate four permit routes, academic
  skilled workers, skilled workers with vocational training, research employment, and employment of
  certain nationalities.
- **What actually changed, read from `d40403c` rather than from the talk file's summary of it.**
  Three evidence blocks are new, `berlin-online-vocational`, `berlin-online-research` and
  `berlin-online-nationalities`. Three were rewritten: `berlin-online-before-expiry`, re-read on
  2026-09-16 with its locator widened from "Verfahrensablauf, Schritt 1" to "Schritte 1 bis 3",
  `berlin-card-4-to-6-weeks` and `berlin-sticker-fee-56`. One was untouched,
  `aufenthg-81-4-before-expiry`, which only moved within the sentence.

  **The first draft of this plan, and of the question, said five markers were new.** Two of them,
  `berlin-online-before-expiry` and `aufenthg-81-4-before-expiry`, were cited by the OLD sentence and
  are visible in the removed lines of that commit. Telling this conversation that two of its own
  existing citations were new would have invited it to reopen settled material inside a prompt whose
  accuracy is the whole point. The diff caught it; the talk file's prose summary did not.

  **And the change is not a citation tidy up.** The old sentence ended "you do not need to wait for
  an appointment". The new one ends with the LEA reviewing the application and an appointment to
  attend in person following. That is reader-facing advice reversed, which is the part of this
  rewrite most worth a closing pass, and neither the card nor the talk file mentions it.
- **`README.md` is stale rather than false.** Line 145 says "The residence permit came back no." That
  was true of the 2026-09-15 text. It is not true of the text published today, because the document
  changed the next day and the sentence does not say which version it covers.

## This is worse than SB-358 in one way and better in another

**Worse:** in SB-358 the right conversation answered the wrong question, a pass on the proposal
rather than on the result. Here the wrong conversation answered entirely, so `01a093c2` has never
seen this material in any form. The instruction SB-358 used, disregard your own earlier
recommendation, does not apply, because the recommendation was not this conversation's. The turn is
told instead that the material is new to it and was settled in another thread, so it judges it cold.

**Better:** the facts were not taken on that thread's word. The talk file records "Every quote was
read from the official pages here on 2026-09-16, not taken from the answer", and one proposed
wording was refused, "the LEA assigns any necessary in-person appointment", because no page says
"any necessary". It also records a difference a copy and paste would have hidden: 329328, 305304 and
328457 exclude both a Schengen C visa and an already expired title, while 350471 excludes only the
expired title, so each definition carries its own page's wording. The evidence is sound. What is
missing is this conversation's review of it.

## What changes

**One more turn in `01a093c2-4c44-7dd2-b927-478f5d8922e6`**, resumed, never `--fresh`. The question
is the one the other documents were closed with: does any marker attach a figure to a page that does
not state it, or quote evidence that leaves out a condition its sentence depends on.

**Pasted inline, which is this document's own precedent.** `close-de-permit.txt` is the prompt that
closed this document before, and it carried the prose inline. This card does the same rather than
inventing a delivery method for it.

**The claim that nearly changed that was tested, and it is false for this path.**
`talk/germany/health-insurance.md` line 1670 records that German quotes passed as command line
arguments on this machine arrive as U+FFFD, and the first draft of this plan took that as given and
chose to send a path instead. Measured: "Beschäftigung Gebühren prüfen gültig" passed to python as a
single argument from this shell arrives as U+00E4 and U+00FC, with no U+FFFD, and the same string
read back from a UTF-8 file arrives identically. Whatever that line measured, it was not this path.
The rule that a fallback is checked before it is relied on is what caught it, and it was one command.

**What `search` mode actually sends, which settles the rest.** `build_prompt` returns early for a
search: only `--ask` reaches the prompt, and `--title`, `--why`, `--exit-condition`, `--did`,
`--files` and `--diff` are all discarded. So there was never a file channel to choose between, and
everything the reviewer sees rides in `--ask`. From there the prompt goes to codex on **stdin** with
`encoding="utf-8"`, and `run_codex` says why in a comment, that passing it as an argument "breaks on
Windows once it is longer than the command line limit". So nothing downstream of python mangles it.

**The path is named as well, because the reviewer can open it.** `codex exec resume` is invoked with
`-c sandbox_mode="read-only"`, and read only forbids writing, not reading. So the turn is handed the
text and told where the file is, and neither route depends on the other working.

**A canary, because 18,936 bytes of document sits close enough to Windows' 32,767 character argument
limit to deserve one.** The answer must name the last footnote definition in the file,
`munich-up-to-seven-months`, and quote five consecutive words from it. A truncated argument cannot
produce that, and neither can a reviewer answering from memory of an older version of this document.
The plan check named this step as the likeliest in the whole card to produce a confident pass over
nothing, and this is what closes it: not a promise to be careful, a thing the answer either contains
or does not.

**Asked over the whole document, with the change since its last pass named.** The closing question
covers the document, as it did for the other three, because the whole document is what is published.
The turn is told what changed since 2026-09-15 so it knows where the unreviewed material is, rather
than being left to find it.

**And it must refuse rather than answer if it cannot open the pages.** This was learned from the run
that was discarded. Sonnet volunteered that WebFetch had been denied four times and that it had
therefore judged from the evidence blocks quoted inside the document. That is not the question being
asked. The question is whether a marker attaches a figure to a page that STATES it, so answering from
the document's own quotes is circular: those quotes are the thing under test. The turn is now told to
name the pages it could not reach and answer "Cannot verify" rather than "No.". Codex carries its own
web search rather than WebFetch, so this may never arise, but a pass resting on the document quoting
itself would look like a check and not be one, which is this card's defect wearing different clothes.

**If the answer is not a no, the correction is applied here and the round is fired again.** An
earlier draft of this plan said the opposite, that any correction becomes a new card, and that
contradicted this card's own exit condition, which requires a last round that raises nothing new. A
correction deferred to another card means the last round DID raise something, so the exit would be
unmet while the plan told me to close. SB-358 settles it by precedent: its answer found the
`"rounding": "none"` error, the correction was applied inside that card, and the next pass came back
no. The owner's order of 2026-09-12 says the same thing directly, that it repeats until a round
raises nothing new.

**The scope guard survives, narrower.** What belongs in a new card is a rewrite, not a correction: if
the answer calls for re-researching a fact, re-opening a decision the document already settled, or
changing what the guide tells a reader beyond fixing a marker or a quote, that is separate work. A
field, a wording, a missing condition on a quoted passage, a marker pointing at the wrong page: those
are applied here, and the round goes again.

Found by reading this plan against its own card while waiting for the reviewer, which is the cheapest
moment to find it. Under a live answer I would have followed the wrong half.

Then two files:

- `talk/germany/residence-permit.md` gains the turn, asked and answered, in the shape the file
  already uses, with the reviewer and session recorded.
- `README.md`'s sentence is corrected the way SB-358 corrected the health insurance one, so it
  distinguishes the 2026-09-15 pass from the later one this card runs, rather than gaining a per
  document ledger.

## Files this touches

`apps/api/prisma/research/talk/germany/residence-permit.md`,
`apps/api/prisma/research/README.md`, and this plan. Nothing under `src/`, and no migration.

`agreed/germany/residence-permit.md` is deliberately not in that list. If the answer is a no it does
not change, and if it is not a no the correction is a new card.

## The mechanism this card has to respect

`roast.py` resolves a session as `sessions[f"{mode}:{brand}"]`, so `search:codex` holds exactly one
conversation, and there is no flag to address one by name: the flag list is `--title`, `--why`,
`--exit-condition`, `--did`, `--files`, `--diff`, `--ask`, `--model`, `--fresh`. So this subject's id
is written into `sessions["search:codex"]` in `.claude/roast-sessions.json` before firing. That file
is gitignored machine state, so this is not a repository change.

**Two plans disagree about what that costs, and the disagreement dissolves on reading the code.**
SB-204 line 83 says the write needs "no roast in flight". SB-358 calls that the wrong fix and says
`roast.py` merges under a lock so no serialising is needed. Neither states its scope, and both are
half right. `roast.py` line 323 comments that read, merge and replace is one transaction needing its
own `SESSIONS_LOCK`, and `save_sessions` at line 351 implements it, so a concurrent roast of a
**different kind** cannot erase this id, which is SB-358's point. But a concurrent roast of the
**same kind** loaded `search:codex` at its start and writes its own back at the end, which is
SB-204's point and is not covered by merging. So: fired with `roast.py`, and no other `search` roast
alongside it. No lock file exists and the last search ran 2026-09-16T15:25, so nothing is in flight.

This was settled by reading `roast.py` rather than by choosing between two plan files, which is why
it is not a conflict to put to the owner: the mechanism answers it.

**What it displaces is recorded.** `search:codex` currently holds `01a093b1-8cc5-7ed1-bb67-c6d984ec7fba`,
which is turkey/company-formation. That id is in `sessions.json` and at line 6 of its own talk file,
so overwriting the slot loses nothing. After this run the slot will hold residence-permit's id, and
the next subject's turn sets its own, as every one of these has. That the slot is shared at all is
SB-364, which is open and owns it. This card does not fix it.

**The write is guarded, and both guards were watched refusing before the real run.** The id is set by
a small script rather than typed in, because two situations have to stop it and neither announces
itself: the sessions lock being held, meaning a roast is mid flight and would write its own session
back over this one, and codex still being rate limited, which would send this turn to a fallback
reviewer and produce a report that has to be discarded. Both branches were exercised deliberately.
With codex still blocked the script printed the seconds remaining on each model and refused. With a
lock file planted under a shell trap that removed it again, it refused on the lock, which is checked
first. After both, `search:codex` still read `01a093b1-...`, so the refusals refused rather than
reported and carried on.

Planting the lock is itself a small risk worth naming: the roast skill deliberately never steals a
stale lock, so a lock left behind would jam every later roast on this repository. That is why the
cleanup was a trap rather than a following command, and why its absence was checked afterwards
rather than assumed.

## Proving it resumed, which the stderr line does not

`roast.py` prints `resuming <id>...` **before** an attempt succeeds, so a codex attempt that failed
and fell back to Claude leaves exactly that line behind. Reading `.claude/roast-sessions.json`
afterwards proves nothing either, because every roast rewrites it on the way through.

So the evidence is **the report file's header**, which `roast.py` writes at line 748 after the run,
naming the reviewer it actually used. It carries three lines that settle this between them: `reviewer:`
with brand, model and effort, `session:` with the id and either `(resumed)` or `(new)`, and
`earlier attempts:` listing every reviewer skipped and why. So a fallback never has to be inferred.
The plan check fired earlier today produced a header reading `reviewer: claude sonnet, effort medium`
above `earlier attempts: skipped codex/gpt-5.6: out of usage`, in as many words, which is exactly the
outcome this turn must not be recorded on.

The turn counts only if that header names codex with
`01a093c2-4c44-7dd2-b927-478f5d8922e6 (resumed)`. Otherwise it is not recorded as the fixed point and
is fired again, because accepting a fallback here would be repeating SB-184's mistake with a
different cause.

**The reviewer is not asked to state its own session id.** An earlier draft of the question asked for
it as a third proof. That was withdrawn on reading the header: the id is already recorded by the tool
from the run itself, and a model that cannot see its own id might supply a plausible one instead. A
fabricated session id inside the evidence for a card about false sign-offs would be the defect this
card exists to fix, reproduced in its own paperwork.

**What happened on the first attempt, recorded because it is the case this section was written for.**
Fired at 09:05 with `search:codex` correctly holding `01a093c2`, the run fell through the whole
chain. Terra reported out of usage without saying when, so an hour was assumed. `gpt-5.6` was then
tried against the same session and failed emitting only its version banner, `OpenAI Codex v0.153.4`,
which matched neither the rate limit pattern nor the dead session one, so it was recorded as a plain
failure and its session id correctly kept rather than thrown away. Sonnet answered, resuming
`fbe54c3a-...`, which is `search:claude` and has never read this document.

**The answer looked clean, and that is the point.** It was a single line No., and it satisfied both
canary requirements: it named `[^munich-up-to-seven-months]` and quoted "Bearbeitungszeit Bis zu 7
Monate". The canary did its job exactly, proving the 23,447 bytes arrived intact and were read. It
proved nothing at all about who read them, and the header said `reviewer: claude sonnet` over
`session: fbe54c3a-... (resumed)`. Had the canary been the only proof, this card would have closed on
a pass from the wrong conversation, which is the defect it exists to correct. Two proofs, and neither
standing in for the other, is what caught it.

That answer disqualified itself on a third ground too, volunteered honestly rather than hidden: it
could not open the four Berlin pages, WebFetch having been denied by permission four times, so it
judged from the evidence blocks already inside the document. A question about whether a marker
attaches a figure to a page that states it cannot be answered without opening the page.

**Why the chain fell through at all, which took a direct probe to learn.** `gpt-5.6` did not fail
transiently. Run by hand with a one line prompt in a throwaway conversation, rather than by resuming
this document's thread, which a junk probe must never touch, it answers:

```
ERROR: {"type":"error","status":400,"error":{"type":"invalid_request_error",
"message":"The 'gpt-5.6' model is not supported when using Codex with a ChatGPT account."}}
```

So the chain's second reviewer cannot run on this account at all, and never could. `roast.py`'s
`RATE_LIMITED` pattern does not match a 400, so it is recorded as a generic failure, never blocked,
retried on every run, and the chain falls straight to `claude/sonnet`. That is the whole mechanism
behind the pass this card discarded. Filed as its own card, since it is not about this document and
affects every roast of every kind.

The consequence here is narrow: the only codex model this account can actually use is
`gpt-5.6-terra`, so this turn waits for it rather than for "codex" in general. Its block lifts at
10:02:51, and forcing `--model gpt-5.6` is not a workaround but a guaranteed failure.

**A flaw in the guard, found by it being in the way.** `set_session.py` refused when ANY model was
blocked. After that attempt terra was blocked for an assumed hour while `gpt-5.6` was free, so the
guard would have refused a retry that was sound. The rule it wants is to refuse when EVERY codex
model is blocked, since a fallback needs all of them gone. Fixed in the script rather than worked
around at the call site.

**And the stored block is an estimate, not a fact. Measured twice, not reasoned once.**
`prune_expired` deletes an entry the moment its recorded time passes, and both times the very next
call found the model still out of usage. At 09:02:47 codex's window "reopened" and the 09:05 run fell
through it. At 10:02:51 terra's did, and the 10:04 run, forced to terra with no chain beneath it,
got `gpt-5.6-terra is out of its usage window and usable again` followed immediately by
`out of usage, it did not say when, so an hour is assumed`, re-blocking until 11:04:12.

The time is parsed from whatever the previous error said, and when the error says nothing an hour is
guessed. So an expired block means the GUESS ran out, not that the quota returned. Any guard reading
that state, `set_session.py` included, can stop a fire that is certainly hopeless and can never
promise one that will succeed.

**Forcing the model is what keeps that cheap.** Both failures cost a clean exit 1 and nothing else,
because `--model` skips the chain: no fallback reviewer ran, no report was written, nothing had to be
judged and discarded. The first attempt, which used the chain, produced a polished and completely
worthless "No." from a conversation that had never read this document.

**A second proof, of a different thing.** Naming the reviewer proves WHO answered. It proves nothing
about WHAT they read, and this card exists because a turn answered about a document it had never
seen. So the answer must also name `munich-up-to-seven-months`, the document's last footnote
definition, and quote five consecutive words from it. That separates a turn that read the text sent
to it from one answering out of memory of an older version, and it is also the truncation canary: an
argument cut short by the command line limit cannot contain the file's last line. Both proofs are
required and neither stands in for the other.

**Both codex models are rate limited until 2026-09-17T09:02 UTC.** A fire before then falls back to
sonnet, which has no web search and is not this document's conversation, and would produce a report
that has to be thrown away. So the turn waits. The deliverable of this card is the sign off itself,
so there is no build to get on with in the meantime and no "ask twice and proceed": that rule is for
a plan check, where the work can proceed without it.

## What I am least sure of

**Whether a resumed conversation can close material it has never seen.** SB-358's doubt was that a
conversation asked to bless its own proposal is confirming rather than verifying. Here the doubt runs
the other way: `01a093c2` has no memory of the four routes at all, so it is closer to a fresh
reviewer with context on everything around the paragraph. I think that is better rather than worse,
and it is what the owner's rule of 2026-09-12 asks for, one conversation per subject, resumed. But it
means the turn is doing real work rather than confirming, so a "not a no" is likelier here than it
was for the other documents, and that is the expected outcome rather than a failure of this card.

## How it is checked

This is research, not code. No test covers it, nothing under `src/` changes, so lint and the type
checker are unaffected, and the owner's rule that a child closes on the tests covering what it
changed comes to nothing here because it changes no code.

The check is that `talk/germany/residence-permit.md` records a pass that raises nothing new, that the
recorded report names codex and `01a093c2-4c44-7dd2-b927-478f5d8922e6` resumed, that the report
carries the canary, `munich-up-to-seven-months` named with five consecutive words quoted from it, and
that README's account matches what the talk file actually says. A markdown heading scan and a code
point scan run over both changed files before they are committed, the second because this repository
has already had one U+00A0 arrive inside a plan explaining why U+00A0 is dangerous, and the first
because appending a section immediately above an existing heading has produced a run on heading here
seven times.
