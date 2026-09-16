# SB-212, A company owner who is not founding one is told the duties that bind them

**Exit:** on the deployed API, a reader who says they run an existing limited company is told the tax
certificate and the electronic books duties with their facts and notes, a founder still is, and the
earlier versions stay in the history.

## The premise is right, and the duties' own notes prove it

SB-196 scoped six duties to `company-founder`. Their notes open by naming what actually binds them,
and **none of those conditions is founding**:

- `request-electronic-tax-notifications`: "For a corporate taxpayer, which a limited company is"
- `get-a-tax-certificate`: renewed "by 31 May each year"
- `register-an-employee-for-social-insurance`: "Once the company employs someone under a service
  contract"
- `keep-company-books-electronically`: "For a company registered from 1 January 2026"

`company-founder` was a proxy for "has a company", and the resolver contradicts the criterion before
the note can explain anything: `fitOne` matches a situation with `===`, so an owner who says anything
else is told none of these, and an owner who says nothing is merely asked.

## The mechanics are cheap. The design is not

**A new situation costs almost nothing.** `country.resolver.ts:62` lists a country's situations as the
distinct `situation` values among its researched criteria, so a value reaches the reader's Role picker
the moment a version names it. `YourDetails.tsx` maps them through `SITUATION_LABELS` and silently
drops any without a name, which is what `situationLabels.test.ts` guards. So the web side is one label
and one Persian translation.

**But a version cannot name two situations.** SB-181's partial unique index covers `situation`, so
`founder OR owner` is not expressible on one version. And unlike places and statuses, a situation has
no tree: `fitOne` sends `residenceRegion`, `workRegion` and `residenceStatus` through `treeFit`, and
`situation` through `===`. A situation is also global rather than country-scoped, since Germany's
`business-registration.ts` names `company-founder` too and the label file states that a situation
means the same in every country that names it.

So reaching both a founder and an owner is one of:

1. **Two versions per duty**, one per situation, with identical facts and notes. Works today, needs no
   schema, and doubles the versions for these duties, concurrently rather than historically, which is
   a different thing from the historical duplication SB-207's roast defended.
2. **A situation tree**, `company-owner` with `company-founder` a kind of it, so one criterion reaches
   both. It is the model the schema already expresses twice, and it is the honest shape. It is also a
   third tree: schema, migration, loader, `Trees`, and it would be the first GLOBAL tree, since the
   other two are keyed by country.
3. **Drop the criterion** so the duties reach everyone, which recreates precisely the defect SB-207
   just fixed: a student told to keep company books.
4. **Leave it**, which is the defect this card exists for.

**My recommendation is 1 now and 2 as its own card if the owner wants the model**, because the cost of
2 is a schema feature and this is a two point card. I want that judged rather than assumed, and I am
saying plainly that this card is mis-sized at two points whichever way it goes.

## What is NOT mine to decide

**Which duties bind an owner is a question about Turkish law, not about this schema.** The card names
the tax certificate and the electronic books. Reading the notes, `register-an-employee-for-social-insurance`
and `report-employment-starting-and-ending` bind whenever the company employs anyone, which an owner
does more often than a founder; `get-a-workplace-licence` binds before premises open, which happens
again for new premises; and `request-electronic-tax-notifications` is due within fifteen days of
commencement, which really is a founding duty.

The owner's order of 2026-09-12 is that content is settled in the document's own conversation. So the
split goes to `turkey/company-formation`'s conversation before any version is written, and the answer,
not my reading, decides which duties get an owner-scoped version.

## What the check found, and three things I had wrong

**The card's exit is broader than its authority, and the evidence was already in front of me.** The
agreed document says "companies registered from 1 January 2026 keep their share register and general
meeting minutes electronically in the ETDS", and that version's own fact is `opensWith: 'registration'`.
So the electronic books duty binds companies registered from that date, **not every existing company**,
and a `company-owner` situation cannot express a registration date. I quoted that note in this very
plan, under the list of what binds each duty, and did not follow it through. So the exit as written,
"told the tax certificate and the electronic books", cannot be met honestly, and the card is corrected
on the board rather than built to.

**Two concurrent versions are not novel here.** I worried that duplicating across situations at one
instant differs from the historical duplication SB-207's roast defended. The repository already does
it: `work-permit.ts` carries `report-employment-starting-and-ending` twice, once scoped `WORKER` and
once `FOUNDER`. So shape 1 is the existing pattern, and no situation tree is warranted now; a tree
would also not solve the registration-date condition, which is the actual blocker.

**An unlabelled situation is NOT silently dropped.** `YourDetails.tsx` maps each code to
`{ code, name: label ? i18n._(label) : code }`, with no filter, and its comment says so: one with no
name shows its code, which `situationLabels.test.ts` stops before it ships. My paragraph above said
dropped, which is wrong. The label is still required; what happens without one is uglier rather than
invisible.

## What the conversation decided, which narrows this card to one duty

The turn is recorded in `talk/turkey/company-formation.md`. Its answer is that **five of the six
duties do not turn on the reader's situation at all**, so scoping them to an owner would swap one
proxy for another:

- **Tax certificate**: the only clean split. Two separate conditions, the first certificate for a
  newly established taxpayer within a month of tax registration, and the annual certificate for an
  **existing capital company**, by 31 May or within a month after the declaration deadline in a
  special accounting period. So an existing company's version carries the annual duty **alone**, and
  the first-certificate fact stays with the founder's.
- **Electronic tax notifications**: within fifteen days of the company's start date, with no repeat
  for an established company. Stays with the founder.
- **ETDS**: ongoing for a company whose establishment was registered from 1 January 2026. Registration
  is the qualifying event, and the reader would have to tell us their company's **trade-registry
  registration date**, which is a detail this product does not hold. The conversation was explicit
  that it should NOT be limited to somebody forming a company now, so leaving it founder-scoped is
  also wrong; it simply cannot be answered correctly yet.
- **Employee registration, workplace licence, employment reporting**: bind on events, a covered person
  starting work, premises opening or operating, a contract ending. Not on who the reader is.

**So this card builds one thing**: a `company-owner` situation, and a successor for
`get-a-tax-certificate` scoped to it carrying only the annual renewal facts, with the founder's
version ended and its own successor keeping the first-certificate fact. Everything else it was
originally asked to do is either wrong or not expressible, and each is filed rather than forced:

- the registration-date detail ETDS needs;
- the three event-bound duties, whose situation criterion is a proxy in both directions.

That is what the corrected exit asks for: the duties the conversation decides bind a company for as
long as it exists, and every duty it cannot scope to an owner named with its reason.

## The re-check settled the shape, and it is smaller than either of us assumed

**Add a version; end nothing.** My reading of `skipbureau_rule_version_clash` was confirmed: it
reports a clash only when the two versions' criteria sets are IDENTICAL, testing each side's criteria
`EXCEPT` the other's in both directions and requiring both to be empty. A founder-scoped version and
an owner-scoped one differ, so they do not clash. So there is no `validTo`, no successor and none of
SB-207's dance: one new concurrent version. The repository already runs this pattern, in
`work-permit.ts`, where `report-employment-starting-and-ending` exists once for a worker and once for
a founder.

**The founder's version keeps all three facts.** The first certificate is immediately relevant to
somebody founding now, and the annual facts correctly say what follows. Ending or trimming it would
spend history for nothing and would break this card's own exit, which promises a founder is still told
everything they are told today.

**The situation is `existing-company-owner`, not `company-owner`.** A founder is an owner in ordinary
speech, and `fitOne` matches with `===`, so a reader picking the wrong one of two overlapping names
silently loses duties. The two must read as exclusive journey states: "I run an existing company"
beside "I am starting a company". That means renaming the existing `company-founder` label as well,
which is interface text through lingui rather than research content, so it needs no conversation, but
it is a reader-facing wording change and is called out here rather than slipped in.

**The generic assertion cannot prove this.** `factsOf` compares the API against the file, so it would
pass whatever the file said. The spec gains an explicit case: an `existing-company-owner` reader is
told the certificate with exactly `renewEachYearBy` and
`renewAfterDeclarationDeadlineInSpecialPeriod` and NOT `firstAfterLiability`, while a
`company-founder` reader is still told all three.

## The new version's note

Composed from the document's own sentences about the annual certificate, so it states nothing the
agreed research does not. It is a new note rather than a changed one, and it introduces no claim, so
it needs no further pass through the conversation; the conversation has already said the annual
certificate applies to an existing capital company.

## How it is checked

`research-rules.e2e.spec.ts` whole and `researched-guides.spec.ts`, plus the web's
`situationLabels.test.ts` for the new label, and lint and the type checker on both apps. Then the
publish, and a live check with `at` for the day the successors start, as SB-207 did, since the
publish's own read-back only exercises versions in force today.
