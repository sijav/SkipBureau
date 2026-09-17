# SB-336, a founder never meets the fifteen day report on the guide they are reading

**Exit, as the card words it:** on the live site, the Turkish company formation
guide shows the fifteen day report with the employer's note, in en and fa, and the
researched guide specs pass.

This plan lives in `apps/api/src/guide/` because `obligation-groups.ts` is the file
that changes. It also touches `apps/web/e2e/pages.spec.ts`, which is where the
change is actually proved.

## What is there, measured

- **The duty exists for a founder in the API and nowhere a founder reads.**
  `rules/research/turkey/work-permit.ts` line 254 is a version of
  `report-employment-starting-and-ending` scoped to
  `situation: 'company-founder'`, carrying the fact `reportWithin within 15 days`
  and the note "For the employer: tell the Ministry within fifteen days when work
  under a foreign employee's permit or exemption starts or ends, or when
  cancellation is required. This is your reporting duty." A worker version sits
  beside it at line 230 with its own note. SB-216 wrote the founder one.
- **`TURKEY_COMPANY_FORMATION` does not list it.** `obligation-groups.ts` line 27
  holds six groups: forming the company, electronic tax notifications, the tax
  certificate, registering an employee for social insurance, the workplace licence
  and keeping company books electronically. The report is not among them, and its
  doc comment says "then the five duties after it".
- **A guide's linked obligations are the only web surface that renders rule
  answers.** `researched-guides.ts` line 640 is the company formation guide and
  line 764 gives it `obligations: TURKEY_COMPANY_FORMATION`, so nothing reaches a
  reader that the group does not name.
- **The role already exists and the country already offers it.**
  `situationLabels.ts` line 15 names `company-founder` "I am starting a company",
  and the guide's own research file `rules/research/turkey/company-formation.ts`
  line 28 already scopes rules to that situation, so the guide asks for the role
  today.
- **The fact is already labelled.** `factLabels.ts` line 64 is
  ``reportWithin: msg`Employer's deadline to notify the Ministry of employment
  changes` ``, wording already written from the employer's side. SB-316 made the
  web label test derive its slugs from the guides' own obligations, and
  `TURKEY_WORK_PERMIT` already links this obligation, so the derived set does not
  change and no new label is needed.

## Two things the card says that the code does not

**The sources and citation specs do not move, and the card says they do.** Its
description says to take the consequences because
"`researched-guides.spec.ts` holds its sources to the pages its sentences cite".
That test cannot be affected by this change. `shownOf` at line 114 composes the
guide's description and its **sections**, and nothing else:

```ts
const [first, ...rest] = guide.detail.sections
return folded([first?.title?.en, guide.guide.en.description, first?.body?.en, ...].join(' '))
```

A guide's `obligations` never enter that string, so `labelsCited`, `pagesCited` and
the two date assertions cannot change when a group gains a duty. The company
formation guide's sources stay exactly as they are. This is written down because
the card sends the next person looking for work that is not there.

**And the spec that does compare obligations cannot fail on this change.**
`researched-guides.e2e.spec.ts` line 141 compares the served obligation slugs with
`researched.obligations.map((group) => group[0])`. Both sides read
`TURKEY_COMPANY_FORMATION`, so adding a group moves the expectation and the served
value together. That is the same shape as SB-322's seed side plant, which passed
while proving nothing. It is recognised here before a run is spent on it, and it is
why the proof below is on the web rather than in that spec.

## The exit's "in en and fa" is restated, and here is the measurement behind it

**No rule note in the research corpus has a Persian translation: none of the 48
`notes` blocks under `src/rules/research` carries an `fa` key.** That is by design
rather than by omission. `RuleAnswer.tsx` line 14 calls a note "a rule's note, the
agreed prose, in its own language" and line 63 renders it as
`<bdi lang={note.lang}>`, which exists precisely so agreed English prose can sit
inside a Persian page and be marked as English for a screen reader and for the
bidirectional algorithm.

So "shows the fifteen day report with the employer's note, in en and fa" cannot
mean a Persian note, and it is restated as: **the card is present and correct on
both the English and the Persian page, its obligation title translated, its note
the agreed English prose marked with its own language.** The obligation's title
does carry both, `work-permit.ts` line 28, English "Report when employment starts
or ends".

This follows CLAUDE.md, which says no test is written for any language other than
the English base, so the Persian half is looked at rather than asserted. SB-316 set
the precedent for restating an exit whose wording names a mechanism that cannot
hold, and the plan check ruled that restatement necessary rather than an overreach.
This one is put to the check on the same footing.

## The approach

**One line, and the comment that describes it.**

1. `TURKEY_COMPANY_FORMATION` gains `['report-employment-starting-and-ending']`.
   Position matters: the group is "most preferred first" and the array order is the
   order a reader meets the duties, so it goes after
   `register-an-employee-for-social-insurance`, which is the point at which a
   founder has an employee to report.
2. Its doc comment stops saying "the five duties after it".
3. `pages.spec.ts` gains the test that proves a founder meets it.

`researched-guides.ts` picks the group up on its own, and `loadResearchedGuides`
writes the `guideObligation` row, so no seed edit is needed.

## Files

- `apps/api/src/guide/obligation-groups.ts`, the group and its comment.
- `apps/web/e2e/pages.spec.ts`, the proof.
- this plan.

## How it is proved

**On the web, because that is the only place this change is observable.** A new
test opens `en/TR/guides/company-formation?situation=company-founder`, the way the
business registration test at line 554 already drives a role through the address
rather than the panel, and asserts the card for "Report when employment starts or
ends" carries the employer's note and the fifteen day figure.

**The plant is the change itself, reversed.** Removing the new entry from
`TURKEY_COMPANY_FORMATION` must make that test fail, and it is a plant that can
actually fail, unlike the two seed derived comparisons above: the test names the
obligation and the note as literal expectations, and the group is the only thing
that puts them on the page.

**Run, and it passes.** The pages project reports 33 where it reported 32, the new
case among them:

```
ok 29 [pages] > e2e\pages.spec.ts:605:1 > a founder forming a company meets the
   fifteen day report, in the employer's own terms (2.6s)
```

So a founder on that address meets the card carrying all four things the check asked
for, and its prediction that the address answers rather than asks is confirmed
against a real build instead of taken on its word. The figure reads as within 15
days, which was measured from factValue.ts line 80 and its own tests rather than
copied from the check's paraphrase.

**The rest of the gate, green.** SB-336 is a child by provenance, so it closes on the
tests covering what it changed plus lint and the type checker where it touched. The
whole API suite was run rather than a chosen file, because a group feeds the two
sample seeds and the researched loader alike and guessing which specs cover that is
exactly the case the rule says to run more for:

```
API tests   21 files, 215 tests passed      exit 0
API lint                                    exit 0
API typecheck                               exit 0
web lint                                    exit 0
web typecheck                               exit 0
```

**Planted, and it fails for the right reason.** With the entry removed from
TURKEY_COMPANY_FORMATION alone and the identical line in TURKEY_WORK_PERMIT left
untouched, which was verified against the backup before the run rather than assumed:

```
1) [pages] > e2e\pages.spec.ts:605:1 > a founder forming a company meets the
   fifteen day report, in the employer's own terms
   Error: expect(locator).toBeVisible() failed
1 failed, 32 passed
```

The assertion that fails is the one looking for For you inside the card, which is
correct: without the link there is no card at all, so the first assertion to touch it
is the first to go.

**And exactly one test failed, which is the measurement this card wanted.** The other
thirty two passed. Nothing else in that suite covers the company formation guide's
linked duties, and researched-guides.e2e.spec.ts, which does compare obligations,
followed the constant exactly as this plan predicted instead of catching the removal.
Restored from the copy rather than from git, because the file held this card's
uncommitted work and a checkout would have destroyed it, and the restored file is
byte identical to the backup with both groups carrying the duty again.

**The live half needs a deploy, and that is a cost worth stating.**
`obligation-groups.ts` is under `apps/api/**`, so Northflank rebuilds the API on
push. Only then does the deployed API serve the new `guideObligation` row, and only
a Pages build after that serves a page carrying it. A green Pages run proves
nothing about content on its own, so the order is: push, wait for the API to answer
with the obligation, then rebuild Pages, then read the deployed page in English and
in Persian.

**The before-reading, taken with a control.** Before anything is pushed, the
deployed API answers:

```
tr/company-formation  form-a-limited-company, request-electronic-tax-notifications,
                      get-a-tax-certificate, register-an-employee-for-social-insurance,
                      get-a-workplace-licence, keep-company-books-electronically
                      report duty present: false
tr/work-permit        get-a-work-permit, report-employment-starting-and-ending,
                      apply-for-a-residence-permit-after-a-work-permit,
                      keep-working-while-an-extension-is-assessed
                      report duty present: true
```

The work permit guide is the control, and it is the reason this reading can be
trusted: it shows the obligation exists in the deployment and that the query is
sound, so company formation's absence is a fact about the data rather than about my
asking.

**The control earned its place on the first attempt.** Asked with the country as TR,
copied from the address bar, both guides returned null. Had I asked about company
formation alone, that null would have been written down as the baseline absence and
any later deploy would have looked like it changed something. The API takes the
country in lower case, as the spec's own helper does at line 222. Introspection is
disabled on the live API, so a wrong argument returns an empty answer rather than
anything that explains itself, which is precisely when a control stops being
optional.

## What the plan check settled

**Ready, with one wording correction.** Adding the obligation to the group is the
smallest correct change, and the new English Pages test is the right proof because
the existing API spec derives both its expectation and its result from the same
constant.

- **The founder address answers rather than asks, and here is why.** Resolution is
  per obligation: the worker version is contradicted by the situation being
  company-founder, the founder version has its sole criterion satisfied, and no open
  relevant candidate remains to create a needsDetail. So the doubt recorded below is
  answered, and the test may assert the note and the figure directly.
- **The Persian restatement is sound, and the exit is to be amended rather than
  quietly reinterpreted.** This rule's title has Persian content, its researched note
  has only English, notesOf preserves the selected note's locale and RuleAnswer
  renders it as a bdi element with lang set to en. The card is not to be blocked on
  translating legal prose. The board's exit now reads that the card is present on
  both pages, with the Persian title and a correctly identified English note, and the
  Persian page is inspected by hand because the repository rule forbids
  language-specific tests.
- **Both cannot-fail claims hold.** The source and date specs are unaffected because
  their displayed-text scan excludes obligations, and the existing obligation
  comparison stays green but is not evidence for this change.
- **The assertion must check four things in the same card**: For you, the obligation
  title, within 15 days, and the employer note. A card that carries only some of
  those would let a partial answer pass.
- **The live half is run with PAGES_URL after the API rollout and the Pages deploy
  that follows it**, which genuinely targets the deployed site rather than starting
  local servers.
## The step I am least sure of

**Whether the situation alone is enough for the card to answer, or whether the
guide will show it asking for something more.** The founder version's criteria is a
single dimension, `situation: 'company-founder'`, so an address carrying that role
should be a complete answer and the card should render its note and figure rather
than a "Tell us" prompt. But the residence permit card on another guide asks for
nationality on top, and a rule whose criteria are satisfied can still render as
needing detail when a different fact on the same card is unscoped. If that happens
the test asserts the wrong thing, and the honest fix is to assert what the reader
actually meets rather than to add reader context until the page says what the card
predicted.

**A boundary this deliberately does not cross.** `situationLabels.ts` line 11
records that `company-founder` and `existing-company-owner` are exclusive and
matched with `===`. The report duty has only worker and founder versions, so a
reader who says they run an existing company is told nothing, although Article
22(1) puts the duty on employers of foreigners generally. That is a gap in the
research scope rather than in this card's linking, and it is filed separately.
