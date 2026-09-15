# SB-279, Turkey's tax number, health cover, work permit and company formation guides, written from the agreed research

**Exit:** on the live site each of the four guides shows its agreed document's heading, sections and
sources and nothing else, reached from its goal on Home, and test/researched-guides.spec.ts passes for
every researched guide and fails when one sentence is changed.

## The four guides

Four entries in `apps/api/src/guide/researched-guides.ts`, after SB-281's, written by the script that
reproduced SB-258's Turkish guide field by field and wrote SB-281's, under SB-258's rule: the title is
the document's heading; the description is the first section's first sentence, and that section's body
starts after it; one section for each bold lead of "What a reader is told", with the paragraphs under
it, footnote markers, bold and list markers taken out and nothing else; the sources are the pages the
footnotes cite, in the order the footnotes are defined, each named from its footnote's locator; no quick
answer, cost, time, steps, note, callout or option; and no link to a rule, which is SB-280. Every
footnote of the four was read on 2026-09-14, so each is verified that day.

| document | goal | area and guide slug | area title | sections | sources |
|---|---|---|---|---|---|
| tax-number.md | `banking-and-money` | `tax-number` | "Get a tax number", "دریافت شماره مالیاتی", as the check gave it | 4 | 2 |
| health-insurance.md | `health-and-insurance` | `health-insurance` | "Join general health insurance", "ثبت‌نام در بیمه سلامت عمومی" | 7 | 6 |
| work-permit.md | `work` | `work-permit` | "Get a work permit", "دریافت مجوز کار" | 7 | 9 |
| company-formation.md | `start-a-business` | `company-formation` | "Form a limited company", "تأسیس شرکت با مسئولیت محدود" | 7 | 23 |

An area is titled as the research file titles its obligation, as SB-258 did, and where a file has
several, by its first. The tax number has no research rules file, so its area takes the title the check
gave in that form. None of the slugs is a sample slug.

A source is named from its footnote's locator in the locator's own words, never a title supplied from
memory: "6112 sayılı Kanun, Madde 19", as the locator writes it.

The tax number guide lists two sources, the two pages its document footnotes. The document also tells a
reader to apply through the tax administration's foreigners page, which only its Sources list names;
SB-258's rule does not add it, and a guide that links it needs that page footnoted and verified in the
research first.

Each kind appears once in a guide and never `yourOptions`, in the document's order:

- **Tax number:** Two numbers, and one of them takes over, `beforeYouStart`; You do not need a residence
  permit to get a tax number, `howToDoIt`; What you actually need it for, which is less than you have
  been told, `importantToKnow`; When it goes wrong, `commonProblems`.
- **Health cover:** The policy your permit needs has a legal minimum, `whatYouNeed`; Do not assume the
  policy you already own counts, `whatToCheck`; SGK, and the year, `beforeYouStart`; What it costs, and
  it is not small, `importantToKnow`; If you get a job, this changes, `howToDoIt`; Emergency care is not
  automatically free to an uninsured foreign visitor, `commonProblems`; By province, `whereToDoIt`.
- **Work permit:** Who applies, `beforeYouStart`; Whether your job can produce a permit at all,
  `whatToCheck`; The exemptions are worth checking before you give up, `importantToKnow`; Passing those
  tests is not the same as being allowed to do the job, `whatYouNeed`; If you leave the job or lose it,
  `commonProblems`; Do not assume a pending application protects you, `howToDoIt`; Fees, `whereToDoIt`.
- **Company formation:** Can you even own one?, `beforeYouStart`; The five Turkish employees,
  `importantToKnow`; What it costs, `whatYouNeed`; What happens after registration, which is where the
  deadlines are, `howToDoIt`; The municipal licence has no grace period, `whatToCheck`; Where your
  company can live, `whereToDoIt`; A bookkeeper, `commonProblems`.

## A lead that asks

Company formation's first lead is a question, "Can you even own one?". The spec's rule that a bold lead
keeps its full stop becomes a rule that it keeps its closing mark, a full stop or a question mark, and
the script reads a question as a lead.

## The tests

- `test/researched-guides.spec.ts`: the four documents join `DOCUMENTS`, and the lead rule accepts a
  question mark.
- `test/researched-guides.e2e.spec.ts` needs no change: since SB-281 (commit c2fec2e) it serves every
  entry of `RESEARCHED_GUIDES`, reads Turkey's areas from it and finds the guides it changes by slug.

## What a reader sees in between

Banking & money, Health & Insurance and Work open in Turkey, each onto its one area. Start a business
has ten areas until SB-282 deletes the sample nine.

## How it is checked

- The spec, watched failing with one sentence of one of the four changed.
- The API's lint, type check and full suite; the whole web e2e run, whose API loads the researched
  guides, against its known dev failures (SB-268).
- Pushed, then on the live site, in en and fa, each of the four reached from its goal on Home: its
  heading, its sections and its sources, and no quick answer or cost strip.

Checked on 2026-09-15 and approved with amendments. The check gave the tax number area's titles and
confirmed Banking & money; found company formation's first sentence reads correctly as its description
under its title; found every kind mapping safe; and agreed the tax number guide lists only its two
footnoted pages, the application page staying out until the research footnotes it. All taken. It also
said the e2e test still assumed one Turkish area; that was true before SB-281 and is not in the tree this
builds on, where SB-281 already reads the areas from `RESEARCHED_GUIDES`.
