# SB-204, A researched fact exempt from one fee says which fee

**Exit:** on the deployed API, Turkey's limited company formation answers with a fee fact whose key
names the fees Law 492 exempts, from a successor version, and no version in force carries
`formationFee`.

## What is wrong, read from the files

`src/rules/research/turkey/company-formation.ts` gives the `form-a-limited-company` version a fact
`formationFee` with `operator: 'none'`, sourced to `feesLaw`, Harçlar Kanunu 492 Madde 123, labelled
`law492-123-formation-exempt` and nothing else.

The version's English note already says the right thing, and so does the agreed document's sentence.
**The structured fact does not.** A key called `formationFee` with operator `none` reads, to anything
taking the key at its word rather than reading the prose beside it, as forming a company being free.
It is not: the same agreed document records the Competition Authority levy at 0.04 per cent, the
Trade Registry Gazette at 2.48 lira per word, and Istanbul's chamber charges of 2,160, 2,760, 250 and
3,305 lira. A founder budgeting from the fact alone is told zero.

## The key, decided from the evidence rather than from the card's suggestion

The card proposed `registryFee`. **That is wrong in the same direction as `formationFee`, only less
far**, and the plan check said so independently. Madde 123's third paragraph exempts the listed
company transactions from "bu Kanunda yazılı harçlardan", the fees written in THAT LAW, judicial fees
excepted. It does not name a registry fee.

Two true facts were available and only one belongs on this version:

- **The statute.** `law492-123-formation-exempt` is the fact's only label, and its scope is Law 492's
  fees. A key naming that scope is exactly as wide as its evidence.
- **The chamber's tariff.** `ito-harc-formation-exempt` does say formation is exempt, under the
  heading TESCİL HARÇLARI, "Kuruluş Harcı: Kuruluş işlemleri harçtan istisnadır", which IS registry
  specific. But that is İstanbul Ticaret Odası's own 2026 tariff PDF, and the agreed document already
  treats İTO's figures as Istanbul's. **A national version must not rest on one city's chamber
  document**, so re-sourcing the fact there to justify `registryFee` would trade one misstatement for
  a worse one.

So the key is **`feesUnderLaw492`**, and the fact keeps its source and its single label.

## What changes

`src/rules/research/turkey/company-formation.ts`:

- the existing `form-a-limited-company` version gains `validTo: '2026-09-16'`, and nothing else about
  it changes, because it is a record of what was served;
- a successor is added, `validFrom: '2026-09-16'`, same obligation, same empty criteria, same source
  and labels, carrying **all four** facts, since a version is the whole answer and a successor with
  only the corrected fact would take the minimum capital, the cash capital deadline and the levy away
  from every reader. In it, **the fact that was `formationFee` is renamed `feesUnderLaw492`**; the
  other three are copied unchanged. (The first draft of this plan said "formationFee becomes the new
  key", which reads as the opposite of what it means. The check caught it. It is the OLD key that
  goes.)

`apps/web/src/shared/rule-answer/factLabels.ts` gains `feesUnderLaw492` with a **new** message that
says what the statute says, not "Registry charge on company formation". Reusing the old string would
carry the old error into the new key, which the check named as the trap.

`apps/web/src/locales/*`: `npm run i18n:extract -w @skipbureau/web`, a Persian translation written
into `fa.po`, then `npm run i18n:compile -w @skipbureau/web`. My first draft claimed no catalog work
was needed; that only held while the label was being reused, which it no longer is.

**`formationFee`'s label stays**, and for a better reason than the one I first gave. I said the label
test walks every version. The real reason is that the API accepts `at`: the ended version can still
be asked for and served for 2026-09-14 and 15, so its label is not dead weight, and the test's lack of
a `validTo` filter is protecting those answers rather than merely being unfiltered.

`prisma/research/agreed/turkey/company-formation.md`: the sentence "The state's own formation fee is
**zero**: formation is exempt from the registry *harç*" is narrower than the statute it cites, in the
same way the key was. It is corrected to say what Madde 123 says, keeping İTO's narrower line where
İTO is what supports it.

## The agreed document changes, so the conversation gets a closing pass

The owner's order of 2026-09-12 is that research content is settled in its own conversation, resumed,
until both sides are satisfied. SB-358 established what that looks like when a document changes after
its last round. So the corrected document goes back into **turkey/company-formation's** conversation,
`01a093b1-8cc5-7ed1-bb67-c6d984ec7fba`, with the closing question, and the turn is recorded in
`prisma/research/talk/turkey/company-formation.md`.

**That needs a mechanism this repository does not have yet.** `roast.py` resolves a session as
`sessions[f"{mode}:{brand}"]`, so `search:codex` holds exactly ONE conversation, and it currently
holds health insurance's `01a093c8-…`. There is no flag to address a conversation by name. To resume
Turkey's, its id is written into `.claude/roast-sessions.json` first, **with no roast in flight**,
because the map is rewritten before a roast runs and an edit made mid-flight is overwritten. That file
is gitignored and untracked, so this is machine state and not a repository change. That roast.py
cannot address a conversation by name is a real gap and belongs on the board as its own card, not
here.

## What a successor means, which is not that the law changed

Ending the version on 2026-09-16 and starting another records a validity transition for what is an
editorial correction: Madde 123 says today what it said on 2026-09-14. The check's judgement, taken:
**versions mean "what this product served from this date"**, and that is accepted rather than papered
over. No note is added claiming the change is editorial, because a reader-facing note is not
provenance. First-class correction metadata would be separate work if the owner ever wants the
distinction recorded.

## How it is checked

`research-rules.e2e.spec.ts` gains an explicit assertion, because the existing one cannot prove this
card: `factsOf('form-a-limited-company')` derives its expectation from the research file itself, so a
rename would sail through it unchanged. The new assertion **names `feesUnderLaw492` as a literal** and
requires that nothing served in force carries `formationFee`.

Then that spec whole, the web's `factLabels.test.ts`, and lint and the type checker on both apps.
SB-204 is a child of SB-190, so it closes on the tests covering what it changes rather than the full
suite.

Then the exit, which is written against the deployed API and can only be met by publishing:
`npm run research:publish -w @skipbureau/api -- src/rules/research/turkey/company-formation.ts`,
which refuses while the web's label change is uncommitted, runs the label tests, commits the bytes it
checked, waits for the deployed receipt to equal the files' digest, and reads the case back. The
read-back is the evidence: the successor must serve `feesUnderLaw492`, and no version in force may
serve `formationFee`.
