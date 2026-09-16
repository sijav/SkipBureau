# SB-369, CI is red: a researched guide's sources no longer match its document's order

**Exit:** `cd apps/api && npx vitest run test/researched-guides.spec.ts` passes, and CI's check job is
green on main.

## What is actually wrong, which is not what the card's title says

The card, which I wrote, says the sources no longer match the document's order and suggests deciding
"which is right, the guide's source list or the assertion". **Both are right. The guide's PROSE is
what is wrong.**

`researched-guides.ts:621` still carries the sentence SB-204 replaced:

> The state's own formation fee is zero: formation is exempt from the registry *harç*.

The agreed document now says, after three rounds with the research conversation:

> The fees written in Law 492 for forming the company are zero: Article 123 exempts the formation of
> a limited company from the fees written in that Law, and Istanbul's registry tariff shows the
> formation *harç* line as exempt. That exemption is Law 492's own fees, wider than a registry charge
> and narrower than the cost of forming a company, which the levy, the Gazette and your chamber all
> add to below.

SB-204 corrected the document and left the guide behind. The guide is what a reader opens, so for two
publishes the site has been telling readers a sentence the research no longer supports: that the
state's own formation fee is zero, which claims more than Article 123 does, and which is exactly the
overclaim SB-204 existed to remove.

## Why it surfaced as a sources failure rather than a text failure

`pagesCited(document, shown)` walks the document's sentences, keeps the footnote labels of those the
guide actually shows, and then lists each label's page **once, in the order the document defines the
labels**. Several labels share one URL: the İTO tariff PDF is cited by the formation exemption, by
the Gazette rate and by the certification fees, so which label is "used" decides where that URL first
appears.

With the guide's fee sentence no longer matching any sentence in the document, `law492-123-formation-exempt`
and `ito-harc-formation-exempt` are never marked used. Law 492's page then leaves the derived list
entirely, and the İTO PDF sinks to wherever its next-used label is defined. That is precisely the
diff CI printed: 23 against 22, with `1.5.492.pdf` and `harc.pdf` sitting higher in the guide's own
array than in the derived one.

**Test 1 does not report this, and that is worth knowing rather than trusting.** "Every text of each
researched guide is its agreed document's" iterates every guide and its first failing `expect` throws,
so `de/residence-permit` aborts the loop before `tr/company-formation` is ever reached. Fixing SB-370
will expose this same guide there. The two cards are one defect seen twice: an agreed document changed
and its guide did not follow.

## What changes

`src/guide/researched-guides.ts`, the company-formation guide's cost section: the stale sentence is
replaced by the document's two sentences, verbatim after the document's own markers are stripped, so
that `plain(document)` contains the guide's body. Nothing else in that section moves.

**The sources array is expected to need no change at all.** Once the sentence matches, the two labels
are used again and the derived order should equal the array already written. If it does not, the
array follows the document rather than the other way round, and the plan is wrong about the cause.

`plain()` folds all whitespace, paragraph breaks included, so the guide's body spanning the
document's new paragraph break is fine and needs no restructuring of the section.

## What the check answered

**Stale prose only, confirmed against the file.** Nothing else in that section changes the ordering,
and the instruction is explicit: do not edit the sources array to fit a failure. The document and the
spec both stay as they are, because the document is the authority and the spec is the guard that
caught the drift.

**No research conversation.** A verbatim restoration of already agreed prose makes no new
reader-facing claim. One would be needed only if the guide's wording departed from the document.

**Do not derive guide bodies from the document at seed time**, which I had asked about. The guide is a
deliberate projection: sectioned, selectively omitting parts like Germany's city table, and held
against adding emphasis the document does not carry. Deriving it would erase that editorial boundary,
and the equality spec exists precisely to make drift visible while keeping it.

## This card cannot meet its exit alone, and that is the check's real catch

Its exit asks for `researched-guides.spec.ts` to pass and CI to be green. **It cannot**, because test
one iterates every guide and throws at `de/residence-permit` before Turkey is reached. Until SB-370
lands, the spec stays red whatever this card does, and a green Turkey-specific result would be
mistaken for closure.

So **SB-370 becomes this card's blocker** on the board rather than a note here, and the acceptance run
is the whole spec after both, then the `check` job on main itself.

## A third guide was stale, and only this card's fix could reveal it

The prediction held: once the fee sentence matched, `tr/company-formation` passed BOTH tests and its
sources array needed no change. What the fix revealed is a third instance of the same defect, which
had been hiding two layers down.

`de/health-insurance` lists `bundestag.de/resource/blob/1170364/WD-6-015-26.pdf` among its sources,
and the agreed document cites it **nowhere**: SB-185 took the pensioner paper out this morning and
replaced it with the calculated definition resting on three statutes. Its prose already matches, since
that guide passes the containment test, so only the source list is stale. One entry is removed.

**This is not new scope and it gets no card of its own.** This card's exit is the whole spec passing
and CI green; that failure is inside the exit rather than beside it. Its provenance is SB-185 and it
is recorded here so it is not lost. SB-371 is the card that stops the class recurring, by running this
spec whenever an agreed document changes.

Worth saying plainly: three guides went stale from three different cards, and each instance is a one
or two line repair. A separate plan and check cycle per instance costs far more than the repairs do.
The value is in SB-371, not in the ceremony around each symptom.

## How it is checked

`researched-guides.spec.ts` whole, which is under a second, plus `research-rules.e2e.spec.ts` because
the same guide's content is seeded there, and lint and the type checker. SB-369 is a child, so that is
its gate; this changes no schema and no research data, so nothing is published. CI's own `check` job
on main is the second half of the exit, and that needs the commit pushed.
