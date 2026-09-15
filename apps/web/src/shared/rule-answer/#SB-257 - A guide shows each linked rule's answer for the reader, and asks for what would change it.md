# SB-257, A guide shows each linked rule's answer for the reader, and asks for what would change it

**Exit:** in a browser against the local API with the research loaded, Germany's Anmeldung guide
shows the two weeks and the fine ceiling with their pages, asks where the reader lives, and after
Hamburg is chosen in the panel shows the 16 euro fee without a reload, in en and fa, light and
dark; its stories and a Playwright spec prove it and were watched failing.

## Why

Researched rules with their pages and verified dates are the product's one real advantage, and no
page shows one. SB-255 made the API answer a guide's obligations for a reader; SB-256 put the
reader's nationality, place and residence status in the link. This card shows the answer on the
guide, and asks for whatever detail would change it.

## What the answer is made of, and what it has no words for

A rule fact carries a key, an operator, a value, a unit or currency, and its page and read date,
and nothing reader-facing: `reportAddressChangeWithin within 2 weeks`. A value alone can mean
nothing without its key, as the first check showed: `uetsAccountRequired` is `yes`, Turkey's
health cover has several different 20 per cent shares, and Germany's care shares are 1.8 per
cent twice. So every fact line carries a label, and the words around the facts are the rule's
notes, the agreed reader-facing prose, marked with their language.

- **A label for every fact key a guide links today**, 31 of them: the address duty's six
  (`reportAddressChangeWithin`, `lateAddressNotificationFine`, `falseAddressDeclarationFine`,
  `appointmentBookedThrough`, `uetsAccountRequired`, `registrationFee`), Turkey's short-term
  permit's and its charge's eighteen, and Germany's residence permit's seven. A label is
  interface text keyed by the fact's stable key, in lingui, with Persian in `fa.po`, and each
  English label is written from the agreed document's own wording for that figure, not guessed
  from the key: `policyOutpatientShareContracted` is the share the policy may leave to you for
  outpatient care at a contracted provider.
- **A fact line** is the label, then the value, then the page it was read on, linked, with the
  day it was read. The value is the interface's: the five operators ("within", "at most", "at
  least", "none", an equals written as the value itself), a sum in its currency, a number in the
  closed units days, weeks, months, years, working days, calendar years, per cent and percentage
  points. A unit outside that set, such as "days in any 180 days" or "times the gross minimum
  wage", and a text value, such as "stays valid, if applied for before it expires", are content,
  shown in English and marked as English.
- **A fact whose key has no label shows no line.** Its figure is still in the notes. A web unit
  test enumerates every fact of the obligations guides link, from `apps/api/src/rules/research`,
  and fails for a key with no label, so a new link or a new fact cannot ship a meaningless line.
- **What guides link is written once**, in `apps/api/src/guide/obligation-groups.ts`, a pure
  module with no imports: the address guides' groups, with the sample fallback
  `register-your-address`, which the research does not hold and so has no facts to label, and each
  researched guide's groups. `sample-content.ts` and `researched-guides.ts` link from it, and the
  label test reads it, so the test cannot drift from the links. `sample-content.ts` itself imports
  Prisma at runtime, which a web test cannot load.
- **The label sheet comes first**: one row per key, its English label and the agreed sentence or
  table heading it is written from, checked before any component. The health cover's labels keep
  the table's scopes, a provider the insurer has contracted with, a non-contracted provider or a
  public hospital outside Annex 1, one of Annex 1's public hospitals; `healthCoverSpans` names the
  requested permit period; and Bursa's appointment site and UETS account are Bursa's documents,
  never labelled as a national requirement.

## Which answer a reader sees

- **Nothing said, or a detail missing.** The rule for everyone in the country, the version the
  prerendered file already carries (`resolution: general`), with its facts and notes, and a line
  saying which detail can change it, "Where you live can change this", with a button that opens
  the details panel. This is the owner's model of 2026-09-14: the country-wide rule is the
  default and a narrower place states only what differs, so the default is shown as the default,
  never as the reader's own answer. Where there is no rule for everyone
  (`resolution: contextRequired`), only the line and the button.
- **Answered.** The reader's own answer, with the facts it takes from wider places, and each
  rule's notes, widest first: in Hamburg, the fee with the federal two weeks and fine.
- **Needs review.** The rule for everyone, if any, and the API's reason why the reader has to
  decide.
- **No rule.** One line: we hold no rule on this for what the reader has told us.

## The data

- `GuideQuery` gains `obligations { slug title resolution facts { … } notes { … } }`, the answer
  for everyone, which the prerender renders into the file.
- A new `GuideAnswersQuery($country, $slug, $locale, $reader: ReaderInput!)` selects only
  `guide { slug obligations { slug reader { answer needs reason facts { … } notes { … } } } }`.
  The page asks it with the reader the link says: `nationality` where there is one, and
  `residenceRegions` and `residenceStatuses` only where a place or a status is said, left out
  otherwise for clarity (the resolver reads an omitted list and an empty one alike). It is paused
  while rendering at build time (`typeof window === 'undefined'`), so the prerender never starts
  it, and in the browser it does not suspend (`overThePage`), so the first client render is the
  file's and the reader's answer replaces the general one when it comes. Its variables change with
  the link, so choosing Hamburg asks again, without a reload.

## The page and the panel

- `src/shared/rule-answer/RuleAnswer.tsx`, story first: one obligation's answer as above, in the
  guide's reading column. Its value lines are `factValue`, a function of the fact and the locale,
  with a unit test.
- `Guide.tsx` renders the answers under a heading of their own after the quick answer, before the
  sections, only where the guide links an obligation. DESIGN.md's Guide Detail section records it
  as a departure: the design draws no rule answer.
- The details panel opens from the page: the shell gains `detailsOpen` and `setDetailsOpen`, and
  `YourDetails` reads them instead of its own state, so the header control and the answer's button
  open the same panel, anchored to the control.
- New strings, with Persian in `fa.po`: the section heading, the detail lines, the button, the
  no-rule and review lines, the operators and units, "read on", "checked".

## The e2e API

`e2e/api-server.mjs` runs the seed and not the research, so no German Anmeldung rule exists there.
It gains the deployed entrypoint's order, the built API's bootstrap and research load before the
seed, which is what "the local API with the research loaded" asks. The order matters: sample
content links a guide to the first obligation of each group the database has, so the research's
`report-your-address` has to be there before the seed links Germany's Anmeldung, or it links the
seed's `register-your-address`. The seed's obligations share no slug with the research's, its
countries, regions and region texts are inserted skipping duplicates, so the research's rows stay
as the research wrote them and gain the seed's Persian place names, and the research loader only
removes rows its own files own.

## How it is checked

- `factValue`'s unit test: each operator, a duration, a sum in each currency, a percentage, a unit
  outside the closed set, a text value.
- The label test: every fact of every obligation a guide links has a label.
- `RuleAnswer` stories in the four schemes: general with the missing detail and the button,
  answered with inherited facts, needs review, no rule; the button calls its handler.
- A `Guide` story at `/en/DE/guides/anmeldung` with msw handlers for both queries: the general
  answer and its question, then a changed address answered with the fee.
- `e2e/pages.spec.ts` on the built site with the e2e API: `en/DE/guides/anmeldung` shows the two
  weeks and the €1,000 ceiling with their pages and the line about where the reader lives; opening
  the panel from the answer's button and choosing Hamburg shows €16 without a reload.
- Planted: `factValue` dropping the unit; the page asking without the place; `YourDetails` keeping
  its own open state, so the answer's button opens nothing.
- The full web suite, lint, `lint:tsc` and build, one Storybook project at a time, then pushed and
  looked at on the live site in en and fa, light and dark, where the research is loaded.

## The steps I am least sure of

**The default beside the question.** SB-176 gives no provisional answer beside a missing detail,
and this shows the country-wide rule beside one, as the rule for everyone, not as the reader's
answer. The first check read every linked obligation: Germany's national Anmeldung states the two
weeks and the fine and Hamburg only adds its fee; Turkey's address duty and Germany's residence
permit have no rule for everyone, so they show only the question. The one rule today whose place
version overrides a national figure is Germany's care insurance in Saxony, and no guide links it;
the day one does, the default beside its question would be wrong for Saxony's workers, and the
label test's list of linked obligations is where that decision is made again.

**Thirty-one labels.** Each is a claim about what a figure is, so each is checked against the
sentence of its agreed document that states the figure, and the health cover's twelve against
the regulation's own table headings.

Checked twice on 2026-09-15. The first check found that a value alone can mislead without its
key, that the answers query had to be paused at build time, and that an omitted list and an empty
one read alike. The second approved the labels as interface text and the paused query, and asked
for the shared manifest of obligation groups in place of a list kept in the test, and the address
duty's count of six; both taken.
