# SB-337, two versions of one duty state the fifteen days twice and nothing holds them equal

**Exit, as the card words it:** changing the fifteen days on one version of
`report-employment-starting-and-ending` and not the other fails a test, watched
failing.

That wording probably cannot survive this plan, for a reason set out at the end.

This plan lives in `apps/api/src/rules/research/`, beside the other research plans,
because the change is to `turkey/work-permit.ts`.

## What is there, measured

- **The two versions.** `turkey/work-permit.ts` line 230 is scoped to
  `situation: worker` and line 254 to `situation: company-founder`, written by
  SB-216. Each carries its own inline `facts` array stating `reportWithin`,
  `within`, `15`, `days`, from the same source and citing the same label
  `law6735-22-1-fifteen-days`. They agree today, and nothing but care keeps them so.
- **No fact array anywhere in the research tree is a named constant.** Every
  `facts:` is written inline, in both countries. So sharing one would introduce an
  idiom rather than follow one.
- **The spec has already been burnt by this exact shape.** The `toldInSituation`
  helper in `test/research-rules.e2e.spec.ts` carries a note from SB-216 saying it
  used to take the first version matching a slug, so it "asserted a reader's facts
  and note against whichever came first in the file, and passed while the two said
  the same thing".

## Repeating a fact key across versions is the product's core mechanism, not a defect

This is the measurement that decides the approach, so it was run rather than
reasoned about. Across both countries, 27 pairs of obligation and fact key are
stated by more than one version. Eighteen of them state it identically. Nine differ
on purpose:

```
DIFFER  germany  report-your-address                registrationFee              7 versions, 7 statements
DIFFER  germany  register-a-trade                   soleTradeRegistrationFee     3 versions, 3 statements
DIFFER  germany  pay-care-insurance-contributions   employeeCareShare            2 versions, 2 statements
DIFFER  germany  pay-care-insurance-contributions   employerCareShare            2 versions, 2 statements
DIFFER  germany  register-a-trade                   notifyTradeOfficeWhen        2 versions, 2 statements
DIFFER  germany  register-a-trade                   lateOrMissingTradeNotificationFine
DIFFER  germany  get-a-residence-permit...          currentTitleWhileDeciding
DIFFER  turkey   report-your-address                reportAddressChangeWithin    3 versions, 3 statements
```

That is the owner's order of 2026-09-14 working exactly as written: a narrower place
inherits the wider rule and states only what differs there. A check that demanded
equality would be demanding that this product stop doing the thing it exists to do.

**So the risk this card names exists in eighteen places, not one.** Every one of
those eighteen is a pair of versions that agree today with nothing holding them
equal. This card's fifteen days is one instance.

## The rule I hoped for does not exist, and the measurement says so

The obvious separator would be scope: versions scoped to different **places** may
differ, versions differing only by **situation** must agree. It is false in both
directions:

```
DIFFER  germany  register-a-trade  notifyTradeOfficeWhen               dims = situation
DIFFER  germany  register-a-trade  lateOrMissingTradeNotificationFine  dims = situation
AGREE   turkey   report-your-address  lateAddressNotificationFine      dims = residenceStatus
AGREE   turkey   report-your-address  falseAddressDeclarationFine      dims = residenceStatus
```

Two versions differing only by situation state the same key differently on purpose,
and two versions scoped by residence status agree. **No structural property of a
version separates intended agreement from intended difference.** Equality here is a
statement about the law, and the law is not in the shape of the data.

## What that rules out, and why the card's second option is the weaker one

The card offers "assert that versions of one obligation sharing a fact key state it
identically unless the file says they differ on purpose". Measured against the data,
that clause is doing all the work: it needs a declared exception for all nine
deliberate cases, and it must be maintained every time the research finds a new
regional difference. That is a second hand written list whose drift is invisible,
which is precisely what SB-316 deleted rather than assert against. A gate that fails
when the research is right is worse than no gate.

## The approach

**Write the fact once and give both versions the same object.**

1. In `turkey/work-permit.ts`, lift the single `reportWithin` fact out of the two
   versions into one named constant beside the `WORKER` and `FOUNDER` criteria that
   are already declared there, and give both versions that same reference.
2. Say in a comment why it is shared: Law 6735 Article 22(1) is one duty with one
   deadline, told to two audiences, so the two versions differ in who they address
   and in nothing else.

This does not detect a divergence, it removes the way one happens by accident. The
notes stay separate, because they genuinely differ: one addresses the worker and one
the employer.

## Files

- `apps/api/src/rules/research/turkey/work-permit.ts`, the shared fact.
- `apps/api/test/research-rules.e2e.spec.ts`, the two assertions the check required.
- this plan.

## How it is proved

The card's exit asks to change one version and watch a test fail. After this there
is no "one version" to change: the two read the same object, so the divergence it
describes is no longer expressible.

**The obvious replacement does not work, and the check caught it.** I proposed that
changing the shared value must fail both readers' existing assertions. It would not.
`toldInSituation` compares the served facts with `factsIn(TURKEY, version)`, so its
expectation is read from the same object a plant would edit and moves with it. That
is the third draft on this board of a plant whose two sides share one source, after
SB-322's seed and SB-336's obligation comparison.

**So the proof is two assertions that fail for different reasons, and neither can
stand in for the other.**

1. **Identity.** The worker version's `reportWithin` fact and the founder version's
   are the same object. Replacing or cloning one fails here, and this is the
   assertion that says the divergence is not expressible.
2. **Literals.** The API returns the fifteen days to each reader, written in the test
   as a literal rather than read from the file. Changing the shared deadline fails
   both of these, and no edit to the research can satisfy them by moving the
   expectation with it.

**This follows an idiom the file already has rather than inventing one.** A few lines
below `toldInSituation`, SB-212 left exactly this reasoning: "the assertion has to
name the facts as literals. factsOf compares the API with the file, so it would pass
whatever the file said", and the tax certificate test names its fact keys literally
for that reason. The same circularity, already met and already solved here.

**Run, and the file passes.** The whole spec reports 39 tests passed in 21 seconds.
The whole file is run rather than the one test, because this spec loads the research
inside an earlier test and a filtered run leaves later tests with no researched
obligation to find, which reads as a failure of the change rather than of the filter.

**That run does not by itself prove the new test ran**, because vitest's default
reporter prints a count and not names, and 39 passing would look the same if the new
case had not been collected. The identity plant below settles it: a failure names the
test.

**Planted on identity, and it fails on exactly the right distinction.** The founder's
reference is replaced by an inline clone carrying identical values, the worker left
sharing, verified against the backup as a single hunk before the run:

```
x the worker and the founder are told one fifteen day report, written once
AssertionError: both versions state the deadline from one fact, not two that agree:
  expected { key: 'reportWithin', ...(5) } to be { key: 'reportWithin', ...(5) }
  Received: serializes to the same string
Tests  1 failed | 38 passed (39)
```

**Serializes to the same string is this whole card in one line.** The two facts are
deeply equal and are not the same object, which is precisely the state the card
exists to remove: two statements that agree today with nothing holding them so. A
deep comparison would have passed and reported the file healthy.

It also settles what the green run could not. 1 failed and 38 passed of 39 means the
new test is one of the 39 and it ran. And the literal assertions passed throughout,
because the clone carried the same values, so this plant isolates identity and
touches nothing else.

**Planted on the shared value, and the result shows why the check refused my first
proof.** The one shared constant is changed to thirty days, verified against the
backup as a single line before the run:

```
x the worker and the founder are told one fifteen day report, written once
AssertionError: worker: expected { key: 'reportWithin', ...(8) } to match object
  -   numericValue: 15
  +   numericValue: 30
Tests  1 failed | 38 passed (39)
```

**The 38 passed is the important half.** toldInSituation runs this very obligation
twice, once through WORKER_DUTIES and once through COMPANY_DUTIES, and it passed with
Turkey's statutory reporting deadline doubled. It compares the API against
factsIn(TURKEY, version), so the expectation moved with the edit. Had this card
shipped with the proof I first wrote, changing fifteen days to thirty would have gone
green and two readers would have been told a deadline the law does not set.

So the two assertions fail for different reasons and neither substitutes for the
other, which is exactly what the restated exit claims: the versions share one fact,
and both readers keep the statutory fifteen days.

**Restored from the copies rather than from git**, because both files held this
card's uncommitted work, and both are byte identical to their copies afterwards with
the diff back to the card's own change.

## The exit needs restating, and the check should rule on it

"Changing the fifteen days on one version and not the other fails a test" names a
mechanism that this change deletes. Restated as an outcome:

**The two versions of `report-employment-starting-and-ending` cannot state different
deadlines, because they state one fact, proved by changing it once and watching both
the worker's and the founder's assertions fail together.**

SB-316 hit this exactly: its exit named a list that the work removed, the check ruled
the restatement necessary rather than an overreach, and the board carries the outcome
instead of the mechanism. This is put on the same footing.

## The seventeen others are a separate card, not scope creep

The measurement found eighteen agreeing pairs. Fixing one and filing the rest is the
honest split: each of the other seventeen needs a judgement about whether its
agreement is one fact told twice or two facts that happen to match today, and that
judgement is research work rather than a refactor. Doing them blind would be
asserting intent I have not checked.

## What the plan check settled

**Not ready as written: the refactor is right, its proof was tautological.**

- **compose preserves the shared object, load does not, and both were checked here
  as well as taken from the ruling.** compose.ts line 69 pushes the version itself,
  so the reference survives into the composed rules. load.ts line 372 builds a fact
  row per version with version.facts.map, so the database holds two rows either way.
  Sharing therefore prevents accidental divergence in the research FILE and claims
  nothing about the stored rows. That is the narrowing this plan asked for, and it is
  now stated rather than left as a worry.
- **The proof this plan proposed could not fail.** toldInSituation takes its expected
  facts from TURKEY.versions through factsIn at spec line 520, which is the very
  object a plant would edit, so a changed fifteen becomes the expected value too and
  both sides move together. That is the third time on this board that I have drafted
  a plant whose two sides derive from one source, after SB-322's seed and SB-336's
  obligation comparison. It is the reason this check is waited for and not
  backgrounded.
- **The proof that works is two assertions that fail for different reasons.** One
  asserts the worker and founder versions reference the same fact object, so a cloned
  or replaced founder fact fails on identity. One asserts the API returns the literal
  within 15 days for each reader, with the literal written in the test rather than
  read from the seed, so changing the shared deadline fails both. Neither can be
  satisfied by the other, which is what the single assertion lacked.
- **The exit becomes**: the research versions share one fact, and both reader answers
  retain the statutory fifteen days.
- **The obligation level national facts idea is rejected**: a larger research model
  with no evidence it is needed here. The one fact refactor plus the independent test
  is the simplest thing that works.
## The step I am least sure of

**Whether sharing the object is actually strong enough to claim.** A future editor
can still write a different inline array into one of the two versions, and nothing
stops them. What sharing changes is that a divergence stops being a one line slip in
a file full of near identical blocks and becomes a deliberate act of replacing a
named reference. That is a real improvement and it is not the same as impossible, so
the plan says so rather than overclaiming.

**Second, whether the shared reference survives the pipeline. Answered, and the
claim is narrowed.** It does survive `compose()`, which pushes the version object
itself at line 69, and it does NOT reach the database as one row: `load.ts` line 372
builds a fact row per version with `version.facts.map`, so two rows are written
either way. Checked here as well as ruled on by the plan check. So this card claims
only what is true: a divergence can no longer happen by accident in the research
FILE, and nothing about the stored rows changes. The test is what covers the data,
and it covers it by literals rather than by shape.
