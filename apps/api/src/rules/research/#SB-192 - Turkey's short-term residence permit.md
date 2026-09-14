# SB-192, Turkey's short-term residence permit

**Exit:** on the deployed API, Turkey's short-term residence permit answers with
those figures, each naming its page, no calculated figure such as the eighty
dollars is among them, and a reader of an exempt nationality is told there is no
permit charge.

## Why

It is the permit nearly every newcomer applies for, and a charge or a day count
given wrongly costs them money or their lawful stay.
`research/agreed/turkey/short-term-residence-permit.md` verifies its figures,
and SB-194 handed over the insurance regulator's minimum cover from
`research/agreed/turkey/health-insurance.md`. None of it reaches a reader.

## What stays exactly as it is

- **SB-190's loader, its lock and its rule for choosing a page**, SB-194's
  statuses and SB-209's notes.
- **Every applied migration.** Nothing here needs a database change; the
  membership history trigger already guards what a deployed membership may become.
- **Nothing calculated**: not the eighty dollars, not any month's charge.
- **The charge by country group stays unwritten.** The groups exist only as an
  image, and the agreed text does not carry its country lists.
- **The Istanbul district closures stay unwritten**: not verified as in force.

## Who the permit reaches

A short-term permit is applied for while a visa or visa-exempt stay is still
valid, so it reaches a reader on such a stay, not one who already holds a
residence permit. Turkey's file gains a status for that stay, `tr.short-stay`,
with two kinds, `tr.short-stay.visa` and `tr.short-stay.visa-exemption`: Law 6458
Article 11(1) treats a visa and a visa exemption together, as the ground for a stay
of up to ninety days. The permit's version is scoped to `tr.short-stay`, so a reader
who says they hold either kind is told it, a reader who has not said is asked, and
a residence permit holder is not told to apply for a first one. A reader moving
from another permit, a student permit say, is not reached: the research is about
a first application from a visa or visa-exempt stay, and a transfer was not
researched.

SB-194's test of a visitor on a visa exemption uses this status from the file
rather than a root status the test made up.

## The loader writes nationality groups, and keeps them as the file says

`ResearchRules` gains `nationalityGroups`, each with a code, a name and its
members, each a nationality, the day it joins and, where the file says so, the day
it ends. They are written before any version. A missing group is created with its
name, which is an editor's afterwards.

A group's memberships are compared with the file, as a version's facts are, and
never changed. The loader reads every deployed membership of each group the file
declares: one whose nationality and first day the file does not list, or lists with
a different end, stops the load with `ResearchRulesMismatch`, saying which, and a
membership the file lists that is not deployed is added. So a research correction
that removes a nationality, or an editor's closing of a membership the file still
says is open, is refused at the start rather than left to tell a reader something
the file no longer says. A membership is history once it starts, so a real change
is a new dated fact: an end the file records and a start that follows, the way
SB-202 records a successor version, never an edit the loader makes.

The comparison is one to one, not by key. Each deployed membership is matched to
one member the file lists, and any deployed membership left unmatched stops the
load. A membership has no unique key, so two identical deployed rows are two
memberships, and the second is one the file does not list.

Groups the file does not declare, the seed's `eu` among them, are left alone.

The membership trigger guards updates and deletes only, so a membership starting
on the day the research was read can be written on any later start.

## A fact can be read from another agreed document

`ResearchFact` gains an optional `document`, the agreed document the fact is read
from where it is not its version's own. The regulator's minimum cover is read from
`health-insurance.md` and belongs on the permit, whose policy must meet it, so those
facts name that document, and the label test reads each fact's definitions from
the document it names.

## The rows

**Statuses**, parent first: `tr.short-stay`, "A stay on a visa or visa exemption";
`tr.short-stay.visa`, "Visa"; `tr.short-stay.visa-exemption`, "Visa exemption".

**Nationality group** `tr.residence-permit-charge-exempt`, "Nationalities exempt
from Turkey's residence permit charge", with members cz, dk, ie, xk, np, lk, sy, tm
and ps, each from 2026-09-14 and open: Czechia, Denmark, Ireland, Kosovo, Nepal, Sri
Lanka, Syria, Turkmenistan and Palestine. The fee page also names Northern Cyprus,
which has no ISO 3166 code and is on no list a reader can choose from, so it is not
a member and no reader of it is told the exemption; the charge version's notes do
not claim otherwise.

**`get-a-short-term-residence-permit`**, a permit, one version from 2026-09-14
scoped to `residenceStatus` `tr.short-stay`, its own source Law 6458 Article 11(1):

| key | operator | value | page, by research label |
|---|---|---|---|
| `stayOnVisaOrExemption` | atMost | 90 days in any 180 days | `law6458-11-1-ninety-in-180` |
| `returnWhilePendingWithin` | within | 15 days | `yukk-reg-21-9-d-fifteen-days` |
| `cardFee` | equals | 964 TRY | `goc-fee-page-card-964` |
| `cardFeeExemptionByNationality` | none | | `goc-fee-page-card-964` |
| `healthCoverSpans` | equals | the text "the requested permit period" | `eikamet-checklist-cover-period` |
| `policyOutpatientLimitContracted` | atLeast | 15000 TRY | `seddk-2024-34-contracted` |
| `policyOutpatientShareContracted` | atMost | 20 percent | `seddk-2024-34-contracted` |
| `policyInpatientLimitContracted` | equals | the text "unlimited" | `seddk-2024-34-contracted` |
| `policyInpatientShareContracted` | atMost | 0 percent | `seddk-2024-34-contracted` |
| `policyOutpatientLimitNonContracted` | atLeast | 15000 TRY | `seddk-2024-34-non-contracted` |
| `policyOutpatientShareNonContracted` | atMost | 40 percent | `seddk-2024-34-non-contracted` |
| `policyInpatientLimitNonContracted` | atLeast | 150000 TRY | `seddk-2024-34-non-contracted` |
| `policyInpatientShareNonContracted` | atMost | 20 percent | `seddk-2024-34-non-contracted` |
| `policyOutpatientLimitAnnexOne` | atLeast | 15000 TRY | `seddk-2024-34-annex-1` |
| `policyOutpatientShareAnnexOne` | atMost | 20 percent | `seddk-2024-34-annex-1` |
| `policyInpatientLimitAnnexOne` | atLeast | 250000 TRY | `seddk-2024-34-annex-1` |
| `policyInpatientShareAnnexOne` | atMost | 0 percent | `seddk-2024-34-annex-1` |

A limit is what the policy must cover at least; a share is the insured person's
part of a bill, which the policy may leave them at most. "Non-contracted" is the
circular's non-contracted providers together with public ones outside Annex 1, and
"Annex one" its Annex 1 public hospitals.

**`pay-the-residence-permit-charge`**, a fee, one version from 2026-09-14 scoped to
`nationalityGroup` `tr.residence-permit-charge-exempt`, its own source the fee page:
`charge` none, `goc-fee-page-exempt-ten`. No version answers any other nationality,
because their charges are the unwritten country groups, so they are not told this
obligation, and the permit's notes say the charge depends on nationality.

**Each page, by SB-190's rule.**

- Ninety in any hundred and eighty: Law 6458 Article 11(1) and the Foreign
  Ministry's visa page, both national, the page repeating the Article's sentence.
  The Article is the statement and the page its repetition, so the Article.
- Fifteen days: the implementing regulation's Article 21(9)(d), and the e-İkamet
  explanations of November 2016, which the research calls older and which differs
  from the regulation elsewhere. The regulation, current and whole.
- The card fee: the Migration Presidency's fee page, which names it as the permit
  document's fee for 2026 and says no nationality is exempt from it, and the
  Treasury communiqué, whose table row "İkamet İzni" needs the fee page to read as
  the card. The fee page.
- Cover spanning the period: the short-term application checklist and the
  Presidency's general residence page, both whole. The checklist, whose scope is this
  permit's own application; the general page speaks of every residence permit.
- The minimum cover: circular 2024/34, the only page with the figures; the press
  release names the twenty hospitals, not the limits.
- The exempt nationalities: the fee page, the only page.

## Notes, per version

- The permit's notes open with "Only while your visa or visa-exempt stay is still
  valid", then: apply through e-İkamet before your own permitted stay ends, which is
  not ninety days after arriving when a visa gives fewer; the application document,
  with the passport and proof the charges are paid unless recorded as exempt, lets
  you leave and come back without a visa within fifteen days of each departure and
  within the period asked for, and beyond fifteen days ordinary visa rules apply; the
  card fee is the same for every nationality while the permit charge depends on it;
  the cover must span the period and meet the regulator's minimum, in force since 1
  April 2025, by kind of provider; applicants under eighteen or over sixty-five need
  not obtain cover but must submit any valid cover they have.
- The charge's notes open with "Only for a citizen of Czechia, Denmark, Ireland,
  Kosovo, Nepal, Sri Lanka, Syria, Turkmenistan or Palestine", then that the fee page
  names them exempt on reciprocity and that the card fee is still paid.

## Files

`src/rules/research/rows.ts`, `src/rules/research/load.ts`,
`src/load-research-rules.ts`, `src/rules/research/turkey.ts`, and
`test/research-rules.e2e.spec.ts`. No schema change and no migration.

## What this card does not do

It does not write the charges by country group, the Istanbul closures, a transfer
from another permit, or a Northern Cyprus exemption no reader can claim. It does
not end or move a deployed membership; recording that as history is SB-202's kind
of change.

## The step I am least sure of

**The status for who applies.** `tr.short-stay` groups a visa and a visa exemption
as Article 11 does, but it is new vocabulary, and a reader switching from another
permit is left out on purpose.

**The page for cover spanning the period.** Two whole statements, the checklist
chosen for its scope; the plan check agreed.

**A membership the seed or an editor adds to a group the file declares** stops the
load too, since the file owns that group. That is strict on purpose: a group whose
members come from two places cannot be checked against either.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`:

- every label, each fact's read from the document it names, is a verified
  definition on the page and day the file names;
- after a load, a reader holding `tr.short-stay.visa-exemption` is told the permit
  with its seventeen facts on their pages and its notes opening with their
  condition, a residence permit holder is not told it, and a reader who has not
  said is asked for their residence status;
- a reader of Danish nationality is told the charge is none with its notes, an
  Iranian reader is not told the charge, and a reader who has not said is asked for
  their nationality;
- a second load adds no status, group, membership, obligation or version;
- on that loaded database, a file whose group no longer lists Denmark, a file that
  gives Denmark's membership an end, and a second Denmark membership identical to
  the first, written into the database, each stop the load with the mismatch, and
  the load writes nothing.

Then planted faults, each watched failing: the group left out of the file, a
member left out, the permit's status scope left off, the membership comparison
switched off, which must fail the refusal test, and the comparison made by key
instead of one to one, which must fail on the duplicate. Then the full API suite,
lint and `lint:tsc`, the build, and the compiled loader run twice on a fresh
database. After the push, the deployed API answers a reader on a visa exemption
with the permit's figures and a Danish reader with no permit charge.
