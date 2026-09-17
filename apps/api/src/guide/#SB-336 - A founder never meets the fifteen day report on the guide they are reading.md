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

**The same reading at the page level, controlled the same way.** The deployed pages,
before any rebuild:

```
en TR/guides/company-formation   200, 140131 bytes, obligation title present: false
fa TR/guides/company-formation   200, 143048 bytes, obligation title present: false
en TR/guides/work-permit         200, 108906 bytes, obligation title present: true
fa TR/guides/work-permit         200, 111423 bytes, obligation title present: true
```

The work permit pages are the control, and they are what make the company formation
reading mean anything: the prerendered HTML does carry obligation titles, and it
carries the Persian one, so false there is a real absence rather than a limitation of
the check. Without the control, a page that simply never embeds obligation titles
would have read exactly the same way.

**Two encoding traps nearly corrupted this reading, and both are recorded because
they will recur.** The Persian title is read out of work-permit.ts rather than typed
into a shell argument, because non-ASCII arriving through the command line on this
machine can become replacement characters that silently fail to match, which would
have shown up as the Persian page lacking the duty when the truth was a mangled
search term. And the first attempt died on printing that title: Python's stdout here
is cp1252 and raised UnicodeEncodeError, killing the script at the print rather than
at the comparison. The fix is to force UTF-8 output and to report presence rather
than echo the string.

**The API rollout, measured rather than waited out.** Northflank took the build
rather than skipping it, which a push landing mid-build can suffer, and the deployed
API was polled every thirty seconds against both guides:

```
07:51:46  company-formation=no   control work-permit=yes
07:52:17  company-formation=no   control work-permit=yes
07:52:48  company-formation=no   control work-permit=yes
07:53:31  company-formation=yes  control work-permit=yes
```

So the duty reached the deployed API 120 seconds after the push, and the control held
yes throughout, which rules out the poll having simply started answering differently.

**And no second Pages build was needed, which is worth explaining rather than
leaving as luck.** The standing warning is that Pages prerenders from whatever the
API served at build time, so a green Pages run proves nothing about content and a
deploy that starts before an API rollout is stale by construction. Here the run's job
list settled it: at 05:58Z the pages job had not started at all, because it waits on
the check job, and the API had rolled out at 05:53:31Z. So the prerender was always
going to read an API that already served the duty. The order was confirmed from the
job timings, not assumed from the fact that the push came first.

**The deployed API gives a founder the employer's note, which is the half of the exit
the link alone does not prove.** Linking the obligation and serving the right version
of it are different facts, and a reader scoped to company-founder could in principle
have been handed the worker's note. Asked as that reader, production answers:

```
slug    report-employment-starting-and-ending
answer  answered
note    locale en-US, starts with For the employer, not For a worker
        For the employer: tell the Ministry within fifteen days when work under a
        foreign employee's permit or exemption starts or ends ...
```

Two things follow. The resolution is answered rather than contextRequired, so the
plan check's ruling that a single satisfied criterion leaves no open candidate holds
against production and not only against a local build. And the note is read from the
reader answer rather than the obligation, which matters: guide.model.ts line 142 says
the obligation's own notes are empty whenever the guide is asked for a reader, so a
query that looked there would have found nothing and I would have reported a missing
note that was never missing.

**The Persian half, verified at the API rather than argued.** Asked in fa-IR as a
company founder, production answers:

```
obligation title   matches the seed's fa title exactly, and is Persian
note               locale en-US, translationMissing true
                   still the employer's note, in English
```

That is the restated exit confirmed in the one place it could have failed. Had the
note come back as English silently claiming to be Persian, the restatement this plan
talked the check into would have been wrong and the card would not be done.
translationMissing true is the API saying in as many words that the version has no
note in the language asked for, which is exactly what RuleAnswer renders as a bdi
element with lang set to en.

**One thing observed here and deliberately not filed.** The guide's own title comes
back in English for a Persian request, because the researched loader writes no
translated guide text, which researched-guides.ts states where it writes the area
rows and which SB-049 already covers. It is a known boundary rather than something
this card uncovered, and filing it would put noise on the board.

**The reader's page needs the deploy too, and the mechanism says why.** Before the
Pages build landed, the deployed English page with the founder role in its address
still showed six duties and not the seventh, its headings reading Form a limited
company, Request electronic tax notifications, Get a tax certificate, Register an
employee for social insurance, Get a workplace licence, Keep company books
electronically. That is not a caching accident. SB-155 seeds the client from the
prerendered file through ssrExchange, and pages.spec.ts line 121 records the
consequence in its own words: the opening render asks for nothing, and only a
navigation within the document asks the API again. So a reader arriving cold reads
the file. This card's live exit therefore waits on the Pages build for the reader
exactly as it does for a crawler, even though the API carried the duty two minutes
after the push.

**And one string on that page nearly became a false positive.** Searching the page
for within 15 days matched, which for a moment looked like the duty had arrived. It
had not: that match belongs to the deadline to request electronic tax notifications
after starting business, a different obligation of this same guide that happens to
carry the same fifteen days. This duty is identified by its own title and by the
employer's note, never by the figure alone, and the test written for it asserts all
four things together for exactly this reason.

**The crawler's half, proved against the baseline in both languages.** CI finished
green and its pages job ended at 06:01:02Z, after the 05:53:31Z rollout. The deployed
files then read:

```
en TR/guides/company-formation   before false, after true   140131 -> 140336 bytes
fa TR/guides/company-formation   before false, after true   143048 -> 143241 bytes
```

Both grew by about two hundred bytes, which is an obligation title and its markup
rather than a different page, and the Persian file carries the Persian title. The
work permit control read true before and after, so the check was capable of
reporting true throughout and the flip is the deploy rather than a change in how it
was measured. This is the half that matters for search, which CLAUDE.md treats as a
first class constraint: the duty is now in the HTML a crawler reads without running
a script.

**The reader's half, on the deployed site, in both languages.** With the browser's
own cache bypassed, the English page shows seven cards where it showed six, the new
one exactly where this plan said to put it, after registering an employee:

```
Form a limited company
Request electronic tax notifications
Get a tax certificate
Register an employee for social insurance
Report when employment starts or ends
Get a workplace licence
Keep company books electronically
```

and the card itself reads, all within one element:

```
For you
Report when employment starts or ends
For the employer: tell the Ministry within fifteen days when work under a foreign
employee's permit or exemption starts or ends, or when cancellation is required.
This is your reporting duty.
Employer's deadline to notify the Ministry of employment changes
within 15 days
```

with the worker's note absent. The figure is asserted INSIDE that card rather than
anywhere on the page, because this same guide's electronic tax notifications duty
carries the same fifteen days, and a page wide match would have been satisfied by it
while proving nothing. A control in the same read confirms the two are different
elements.

The Persian page shows the same seven cards with the employer's note present, its
document lang fa-IR and dir rtl, and the note's bdi elements carrying lang en-US. So
the English prose is marked as English rather than passed off as Persian, which is
the restated exit met in the browser as well as at the API.

**Two measurement faults were diagnosed rather than worked around, and both would
have been easy to write up as defects.** A read taken after the deploy still showed
six cards, which looked like the change had not arrived. Fetching the same path from
inside the page with cache set to no-store returned 140336 bytes containing the
title, with an age header of 0, so the origin had been serving the new file all along
and the stale render was this browser's own HTTP cache. Earlier, a read returned
every string false with an empty heading list while the DOM held six h3 elements:
innerText depends on layout, a hidden pane draws no frames, and textContent answers
without layout. Neither false reading is recorded as a result, because neither was
one.

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
