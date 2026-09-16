# SB-213, The workplace licence note says only what its page states

**Exit:** the deployed API's answer for a founder's `get-a-workplace-licence` carries no sentence
its cited page does not state, the version keeps its obligation, criteria and `validFrom`, so its
legal period and identity are untouched, and `research-rules.e2e.spec.ts` holds that note to a
wording a definition supports. The withdrawn wording lives in git, not in the database: see the
history decision below, which says plainly what is and is not preserved.

## Why

SB-196 wrote the note the deployed API now serves:

> Where the premises and what is done there need an opening and operating licence: get it from
> the authorised administration before the premises open or operate. Premises opened without one
> are closed by that administration, and which administration issues it depends on where the
> premises are.

Its page is `workplaceLicenceRegulation`, labelled `isyeri-ruhsat-reg-6-before-open`, whose
definition in `agreed/turkey/company-formation.md` carries Article 6's first paragraph. That
paragraph states two things and not a third:

- premises cannot be opened or operated without a licence duly obtained **from the authorised
  administrations**, so the first sentence stands;
- premises opened without one **are closed by the authorised administrations**, so the first half
  of the second sentence stands.

It says nothing about **how** the authorised administration is decided. The clause "which
administration issues it depends on where the premises are" is ours, not that page's.

## The clause is true, and Article 4 is where it lives

The first plan expected to drop it. The plan check searched the regulation and found the
provision: **Article 4 defines `yetkili idare`**, assigning authority by the premises' setting,
outside municipal boundaries, metropolitan and district or ordinary municipal boundaries, and
organised industrial zones, and also covering matters the law assigns exclusively. Its defining
text includes `kanunlarda münhasıran il özel idaresine yetki verilen hususlarda il özel idaresini`
and `organize sanayi bölgesi sınırları içinde organize sanayi bölgesi tüzel kişiliğini`.

So the clause is not invention, it is an **unsourced truth cited to the wrong article**, and the
fix is to source it rather than delete a fact a founder needs. The wording the check gives, which
is taken as given because it keeps the meaning and is more exact than mine:

> Which authorised administration issues the licence depends on the premises' setting and on any
> authority the law assigns for that kind of premises.

**The most failure-prone step, named by the check: the 2005 text is not necessarily the rule
today.** Article 4 has been amended, and special zone cases have been added since. So the
evidence recorded is from the **current official consolidated text**, the URL the file already
cites, and the wording is verified against that consolidation rather than the Resmî Gazete of
2005, before the clause is kept.

## Through the conversation first

The owner's order of 2026-09-12: one resumed turn in the `turkey/company-formation` session,
which exists. It is given Article 4 as read from the current consolidation and asked for that
provision's own passages as evidence, whether the allocation is by setting alone or by the matter
assigned in law as well, and whether the English above is supported by the consolidated text as
it now stands. Its wording is taken as given where it keeps the meaning, and fixed only where it
is wrong. Then the fixed-point turn, whose answer is to be a single `No.`

If that turn cannot support the clause from the regulation's current text, the clause goes and
the note ends at what Article 6 states. Either ending meets the exit.

## The data

In `src/rules/research/turkey/company-formation.ts`:

- `sources.workplaceLicenceRegulation.name` becomes
  `İşyeri Açma ve Çalışma Ruhsatlarına İlişkin Yönetmelik, Madde 4 ve 6`, keeping its one
  consolidated URL. The check refused the general title: a reader checking the claim loses the
  pinpoint, and naming Article 6 alone pretends it supports the whole note. A note carries no
  source of its own (`RuleNote` is `ruleVersionId`, `text`, `locale`, `translationMissing`) and a
  fact's source fields cannot honestly stand in for one, so the version's single name is the only
  thing a reader sees on the source card and it must name both articles;
- a definition for Article 4 in `agreed/turkey/company-formation.md`, verified, with the current
  consolidated page's own passages as evidence, fetched and matched in composed form before the
  line is written;
- the `get-a-workplace-licence` version labels both `isyeri-ruhsat-reg-6-before-open` and the new
  Article 4 label, and its `notes.en` takes the agreed wording.

### The history decision

**The version keeps its obligation, criteria and `validFrom`.** Both rounds of the check argued
this, and the second accepted it: a successor would create a reader-visible "law changed" diff
when only our wording was corrected.

Its first round also said the loader could not rewrite a started version at all, because the
history trigger forbids deleting one. That named a superseded file,
`20260911200000_rule_history_is_append_only_throughout`, which SB-202 replaced:
`20260915100000_research_load_follows_its_files` rewrites all three history functions "each
letting the research load through first", so the version guard reads
`IF skipbureau_rule_version_is_new(OLD.id) OR skipbureau_research_load()`, and `load.ts:161` sets
that setting as the load's first statement. `research-rules.e2e.spec.ts` proves it today,
asserting `versionsRemoved: 1` against Turkey's own file, whose versions start on `2026-09-14`
and have therefore started. The second round read those files and agreed the publish will not
fail.

**What is preserved, and what is not, stated plainly.** The loader deletes the row and writes it
again under the same key, so the legal period and the version's identity are untouched: it is not
ended, renumbered or superseded, and the move screen never reports a change that did not happen.
The database does **not** keep the withdrawn sentence, and cannot show six months from now that
readers were once served it. That audit trail is git alone. The check weighed that cost and
judged it smaller than a fabricated legal change, which is the same conclusion SB-263 reached on
2026-09-15, "a page is corrected, not the law". The card's exit, that the earlier version stays
in the history, is met on its own words, the version stays; it is not met for the earlier text,
and this plan does not pretend otherwise.

The loader needs nothing new: `sameVersion` compares notes, `aside` takes the row, and section 6
writes it again, counted as `versionsChanged`.

## The tests

The honest problem first: **neither assertion covering this note can catch it.**
`research-rules.e2e.spec.ts` compares the served note to `version.notes.en` read from the same
file, so it passes for any wording, and `COMPANY_DUTIES` asserts only that the note opens with
`Where the premises and what is done there need an opening and operating licence`, which this
edit does not touch. Both stay green by construction, which is why a wrong sentence has been
served since SB-196.

So the new assertion holds this duty's note to a text the spec states itself and names the old
clause as one that must not come back. Restoring it fails the test; that is the planted case.
Both rounds judged this "a real but narrow regression guard", which is exactly the claim made for
it: it catches this sentence and any later edit to this note made without deciding it twice, and
it catches nothing in any other note. The check also confirmed what this plan assumed, that **no
mechanical check available today can establish that an English note follows from Turkish evidence
arrays**, since the recorded status, page and read date prove neither translation nor entailment.
That is SB-311's work, not a one point card's.

## Publishing

```bash
npm run research:publish -w @skipbureau/api -- src/rules/research/turkey/company-formation.ts
```

In the background. It checks the types and the research specs, commits the data file, the agreed
document and the talk, pushes, waits for the deployed digest and reads the case back. Then the
deployed API is asked for a founder's `get-a-workplace-licence` answer and the note it serves is
read in full.

## Files

`src/rules/research/turkey/company-formation.ts`, `test/research-rules.e2e.spec.ts`,
`prisma/research/agreed/turkey/company-formation.md` with its talk and session, and this plan.

## The steps I am least sure of

**Whether Article 4 as consolidated today still reads as the check quoted it.** That is the named
failure and it is why the evidence comes from the consolidated page rather than the 2005 Resmî
Gazete, and why the clause is dropped rather than guessed if the turn cannot support it.

**Whether the clause can be one sentence a founder understands.** Setting, and authority the law
assigns, is two ideas in a note that already runs three sentences. The check's wording carries
both; if the research turn lengthens it further, the clause says the administration depends on
the premises' setting and leaves the rest to the regulation.

## As built

The conversation answered, then closed at its fixed point with a single `No.` It refused
"for that kind of premises" as narrower than the paragraph's `hususlar` and `konular`, and gave
the clause this note now carries, as its own sentence rather than a third limb of the second:

> Which administration issues the licence depends on where the premises are and which authority
> the law makes responsible.

**It could not reopen the page itself**, which answered 502 to it, so it reasoned from the text
supplied to it. That is recorded rather than hidden: the independent check is this end, where the
consolidated frame was fetched from the official host on 2026-09-16 and every passage recorded as
evidence was matched in it verbatim, in composed form, before the definition line was written,
which is the rule this project uses anyway. Article 4(a) turned out to have been amended on
17/4/2021, so the check's warning was right and the 2005 wording would have been wrong to record.

Two things the build settled that the plan did not foresee:

**Both definitions carry 2026-09-16.** The spec requires every label a version names to be
verified, on the source's page, and read on the day the source names, so Article 4 read today
cannot sit beside an Article 6 definition dated 2026-09-14. The page was genuinely read again
today and Article 6's recorded evidence matched unchanged, so its definition is re-dated with it
and the source leaves the shared `READ` for `RUHSAT_READ`. The version's `verifiedAt` moves to
today and its `validFrom` does not, which is the decision above. No guide's verified date moves,
because a guide takes the **oldest** read among the definitions its shown sentences cite and many
remain 2026-09-14.

**The document records the definition and gains no new prose.** The guide's section body repeats
that paragraph of the agreed document word for word, so adding the allocation sentence to the
document without rewriting the guide body would drift the two, which is SB-310, and rewriting the
guide body would put a guide page change inside a one point child card. The definition is the
research record and the note is what cites it; the document's prose still says only what it said.

## How it is checked

SB-213 came out of SB-196's roast, so it is a child: the tests covering the files it changes,
`research-rules.e2e.spec.ts`, plus the API's lint and `lint:tsc`, rather than the full suite.
Then the planted case watched failing, the publish reporting live, and the deployed answer asked
directly for the note a founder is served.
