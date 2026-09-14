# SB-196, Turkey's company obligations after registration

**Exit:** on the deployed API, those obligations answer with their deadlines,
each naming the page that states it.

## Why

A limited company's deadlines start when it is registered, and each has a
penalty or a closure behind it. `research/agreed/turkey/company-formation.md`
verifies five duties that follow registration, and none reaches a reader.

## What stays exactly as it is

- **SB-190's loader and its rule for choosing a fact's page**, SB-194's statuses,
  and SB-209's notes. This card adds rows to Turkey's file and changes no code.
- **Limited company formation's deployed version**, national, exactly as it is.
  Its scope is SB-207, below.
- **Nothing calculated**: none of these figures is.

## Who these reach

These are duties of someone running a company, not of everyone who moves to
Turkey. A version with no criteria would tell a student to register employees
with SGK. So each version is scoped to the situation `company-founder`, the
dimension the seed's student rules already use: a reader who says they are
starting a company is told them, a reader who has not said is asked for their
situation, and a reader in another situation is not told them. The API already
takes a situation; no screen asks for one yet.

`company-founder` says where the reader is in their journey, not whether each
duty binds them. It cannot tell apart a founder with no employee, premises that
need no licence, or a company registered before 1 January 2026. So no version
claims its duty binds every founder: each one's notes open with the condition
that makes it bind, before any figure. Since SB-209 those notes come with the
answer, so a founder is told the condition beside the deadline, and the checks
read it from that answer.

Formation itself was written national by SB-190, so today every reader is told
to form a limited company. Scoping it changes a deployed version's criteria,
which a researched file cannot yet record as a successor, so it is SB-207, after
SB-202, and not part of this card.

## The rows

Five obligations, each with one version from 2026-09-14 scoped to `situation`
`company-founder`, and nothing narrower than the whole country:

| obligation | kind | fact key | operator | value | page, by research label |
|---|---|---|---|---|---|
| `request-electronic-tax-notifications` | tax | `requestAfterCommencement` | within | 15 days | `gib-brochure-2026-e-tebligat` |
| `get-a-tax-certificate` | tax | `firstAfterLiability` | within | 1 months | `gib-brochure-2026-certificate-month` |
| | | `renewEachYearBy` | equals | the text "31 May" | `gib-brochure-2026-certificate-may` |
| | | `renewAfterDeclarationDeadlineInSpecialPeriod` | within | 1 months | `gib-teblig-408-special-period` |
| `register-an-employee-for-social-insurance` | insurance | `registerBeforeStart` | atLeast | 1 days | `sgk-employer-one-day` |
| `get-a-workplace-licence` | permit | `obtainBefore` | equals | the text "opening" | `isyeri-ruhsat-reg-6-before-open` |
| `keep-company-books-electronically` | document | `keptIn` | equals | the text "ETDS" | `ticaret-etds-2026` |
| | | `opensWith` | equals | the text "registration" | `ticaret-etds-2026` |

Each version's own source is the page that makes it a duty: the brochure's
e-Tebligat section, the brochure's certificate section
(`gib-brochure-2026-certificate-month`), SGK's employer duties, the licence
regulation's Article 6, and the Ministry of Trade's ETDS announcement.

**Each page, by SB-190's rule.**

- The fifteen days and the first month each have one page, GİB's April 2026
  brochure for new corporate taxpayers, whose scope is a new limited company's.
- 31 May has three: the brochure, Communiqué 408 section 2.3, and GİB's rights
  and duties guide. All three cover a limited company. The brochure's sentence
  is the whole fact, capital companies, every year, by the last day of May. The
  communiqué's states a printing window for corporate taxpayers, from 1 May to
  the end of 31 May, without "every year" in it, and the guide repeats the
  communiqué. So the brochure.
- The special accounting period has one page, Communiqué 408.
- "At least a day before" is stated only by SGK's employer duties page. Law 5510
  Article 8 says "before the start of insurance" and Article 7 when that starts,
  so neither states the day.
- The licence has two: the regulation's Article 6, and the Ministry of Trade's
  guide for grocers, whose scope is one trade, narrower than the fact. So the
  regulation.
- ETDS has one page, the Ministry of Trade's announcement.

**Text where the law gives no number.** "31 May" is a day of the year and
"opening" is an event, so both are text facts, as SB-194's "more than one year"
is. No operator compares them, and nothing here needs one.

**What stays unwritten, and why.**

- That the registry passes the tax registration on, so a company files no
  separate commencement notice: the research says it, but no definition states it.
- The exceptions to "a day before": Article 8 lets construction, fishing and
  agriculture register on the day work starts. A fact cannot carry a condition on
  the kind of workplace, so the notes say it.
- That premises opened without a licence are closed: Article 6 says it, and it is
  a consequence, not a deadline, so it is in the notes.
- Which authority issues the licence, a municipality or another, depends on where
  the premises are. No place's office is researched, so no narrower rule is written.
- A home or virtual office as the registered address, and a bookkeeper: the
  research could not verify them.

## Notes, per version

Each version's English notes open with the condition that makes its duty bind,
which no criterion holds, and only then give the figures. The opening each one
starts with, which the checks look for in the answer:

- e-Tebligat: "For a corporate taxpayer, which a limited company is".
- The certificate: "For a corporate taxpayer, which a limited company is", and
  later that a company with a special accounting period renews within a month
  after its own declaration deadline instead of by 31 May.
- The employee: "Once the company employs someone under a service contract",
  and later Article 8's exceptions for construction, fishing and agriculture.
- The licence: "Where the premises and what is done there need an opening and
  operating licence", and later that premises opened without it are closed.
- ETDS: "For a company registered from 1 January 2026", and later that its books
  open with the registration.

## Files

`src/rules/research/turkey.ts` and `test/research-rules.e2e.spec.ts`. No loader,
schema or migration change.

## What this card does not do

It does not scope formation, which is SB-207, nor write chamber dues, which
differ by chamber, nor anything a sole trader does differently. It translates no
note: the notes are English, and SB-209 tells a reader asking in Persian that
they are only in English.

## The step I am least sure of

**The situation's name and shape.** `company-founder` is new vocabulary, beside
the seed's `student`, and whatever screen later asks a reader's situation has to
offer it. A situation is one value, so a student who is also starting a company
can give only one of the two. That is the profile's limit, not this card's.

**The brochure's edition, settled by the plan check.** Three facts rest on GİB's
"İşe Yeni Başlayan Kurumlar Vergisi Mükelleflerinin Hak ve Ödevleri", April 2026,
publication 602, which GİB serves from a path named `arsiv/onceki-dokumanlar`,
previous documents. The check found GİB's own list of 2026 publications showing
publication 602 as the current brochure for new corporate taxpayers, with no later
edition of it, so SB-169's rule against a superseded edition does not remove it.

## How it is checked

On PGlite, in `test/research-rules.e2e.spec.ts`:

- every label is a verified definition of its document on the page and day the
  file names, the existing test, now over the five new versions;
- after a load, a reader whose situation is `company-founder` is told each of the
  five obligations with the facts the file holds, each on its page, and with its
  version's notes as the answer serves them: the file's English notes, whose
  first sentence is the condition that makes that duty bind, the opening listed
  above for each; a reader who has not said is asked for their situation; a
  student is not told them;
- a second load adds nothing, the existing test.

Then planted faults, each watched failing: one version's situation criterion left
off, failing the assertions for the student and the reader who has not said; and
one version's notes starting with a figure instead of its condition, failing the
check that the answer opens with it. Then the full API suite, lint and
`lint:tsc`, the build, and the compiled loader run twice on a fresh database.
After the push, the deployed API answers a company founder with the five
obligations, each with its deadlines on their pages and its condition in the
notes beside them.
