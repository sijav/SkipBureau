# SB-170, Germany's rules, written from the research and not from memory

**Exit:** every rule row for Germany carries an official source URL and a verified date, and
a state that differs shows its own answer.

## Why

Germany is the second country and the one that proves the model: rules that hold for a
state-based country as well as a province-based one mean a third needs no code. SB-223 to
SB-227 each wrote one agreed document into rows, the Länder and cities, the Anmeldung, the
residence permit, health and care insurance, and trade registration, and each was published
live under SB-232. This card is the check of the whole: that the 31 versions and 59 facts
`src/rules/research/germany.ts` composes follow the rule for choosing a page taken together,
and that the deployed database says what the files say. It is SB-169's check, for Germany.

## What stays exactly as it is

Every version, fact, source, loader and test. A correction would be a change to one case's
file published through `research:publish` (SB-232), on a card of its own.

The card's description predates SB-188. A fact now names its own page, so "split the row by
source" is how the rows are already written, and no relation is added.

## The rule every fact is held to

From SB-190, as `prisma/research/README.md` states it: a verified definition of the same
agreed document, never calculated and never a superseded edition; a page whose own scope
covers the fact's; and among those, the page that states the whole fact itself, not a change
to it or a clause in a longer list. Never marker order, never how official a page looks. Two
pages that each state the whole fact are a tie the rule does not rank.

## The audit, already run as research for this plan

A script set each of the 59 facts' chosen definitions beside every other verified definition
of the same agreed document whose evidence spells the same value, as a figure, with German
separators (`1.000`, `24 500`, `16,00`) or in German words, and flagged a chosen passage that
does not spell the value, a page of one Land or city cited by a version with no place, and a
label that is not verified or sits on another page than its fact. SB-169's roast found that
matching values cannot surface a rival for a text or a none fact (SB-222), so each of
Germany's 21 text and none facts was printed with every verified definition of its document,
and read. What it found:

- **Every fact rests on a verified definition, on its own page, that states it.** The 6 flags
  are condition labels beside a label that states the value on the same page: the five-year,
  one-tenth and lowering conditions of §3(3) sentences 4 and 5 IHKG beside the €5,200 and
  €25,000 of sentences 3 and 4, and the waiver of §19(3) UStG beside the €25,000 and €100,000
  of §19(1). The other matches were the script's reach: `2` in "Abs. 2", `drei` inside
  `dreißigsten`, `ein` in every article, `25` inside `25.000`. No fact rests on a calculated
  definition, and the one calculated definition, the average share, is named by no fact.
- **No page is narrower than its fact.** Every Land or city page is cited only by versions of
  that place: Hamburg's, Berlin's, Saxony's, Munich's, Düsseldorf's, Wiesbaden's, Freiburg's
  and Cologne's. IHK Rhein-Neckar's rates page and Hamburg's gazette stay research evidence.
- **Where two pages state a figure, the chosen one wins by the rule:**
  - the €5,200 chamber contribution exemption, §3(3) sentence 3 IHKG, over IHK Rhein-Neckar's
    table, which is one chamber's own rates;
  - Hamburg's €16 registration fee, hamburg.de's service page, which states it, over the 2025
    gazette's amendment of the fee tariff, a change to it;
  - the 0.25 care discount per child, the Health Ministry's care page, which states the
    discount from the second to the fifth child under 25 in two sentences, over §55(3) SGB
    XI's clause in a longer sentence;
  - the two weeks to register, §17(1) BMG, over Saxony's page, which is narrower, and §27(2)
    BMG's two weeks, which is another duty;
  - the €1,000 fine for registering late, §54(2) No. 1 BMG, over the fictitious address and
    the landlord's confirmation offences, which share paragraph 3's ceilings;
  - the €100,000 current-year VAT threshold, §19(1) UStG, over the Finance Ministry's letter,
    which names it inside its first-year and loss-of-exemption rules.
- **Text and none facts, read against every definition of their documents.** Six places'
  free registrations each rest on that place's own page saying so. A title staying valid
  while a permit is decided rests on §81(4) sentence 1 AufenthG, Berlin's online confirmation
  being narrower and cited only by Berlin's versions; a Schengen visa not staying valid on
  §81(4) sentences 1 to 3, over Berlin's page; a visa-free stay counting as permitted on
  §81(3). The half share on the Health Ministry's financing page; membership beginning with
  the employment on §186(1) SGB V. Telling the trade office at the same time on §14(1) GewO,
  over Cologne's page, which is narrower; losing the exemption for the whole transaction on
  the Finance Ministry's letter, the only definition that states it; self-employment counting
  as work on §2(2) AufenthG; and working on a residence title on §4a(1) and (3) AufenthG. None
  has a rival of the same scope.
- **Three facts rest on the only definition that states them, on a page that is not a
  statute, and the plan check read each against the exit's official source.** The first-year
  €25,000 VAT ceiling and the loss of the exemption for the whole transaction stand on the
  Finance Ministry's letter of 18 March 2025, since §19 UStG states neither. Hamburg's €25
  trade registration fee stands on the Handelskammer Hamburg's page, a public-law corporation
  stating its own fee. The one week to tell the accident insurer does not stand on DGUV's page:
  DGUV is a registered association, and §192(1) SGB VII states the whole duty, the week and
  that a trade notification made within it fulfils it, as its page read on 2026-09-15. SB-263
  adds that definition to the agreed document and moves the fact to it.
- **Every page a fact cites** is on gesetze-im-internet.de, bundesgesundheitsministerium.de,
  bundesfinanzministerium.de, service.berlin.de and berlin.de, hamburg.de, amt24.sachsen.de,
  stadt.muenchen.de, service.duesseldorf.de, wiesbaden.de, freiburg.de, stadt-koeln.de,
  handelskammer-hamburg.de or dguv.de.

So one fact is corrected, by SB-263, before this check is recorded, and nothing else.

## The deployed database, read back

The deployed API's research rows already say the germany file owns 31 versions, 21 places, 4
statuses and 1 nationality group, and its digest equals the one the build computes from the
files, `3f10bfe5…` before SB-263, so the database holds what the files say. It is compared
again after SB-263's publish.

Then a scratch script asks the deployed API, for each of the 31 versions, as the reader that
version reaches: its residence status, its situation, a nationality of its group, its place of
residence or of work. Where another version of the same obligation narrows a detail this one
does not state, the reader gives a value none names, Niedersachsen for a place and Brazil for
a nationality outside §41(1)'s seven, so nothing is left to ask. Turkey has
`report-your-address` too and a move's needs cover both sides, so every reader also names
Ankara and a Turkish residence permit. For each, Germany's answer must carry every one of the
version's facts with the file's page, page name and read day, together with the facts it
takes from the versions it narrows by place alone, compared by key, value and page rather than
by order: Hamburg's €16 with the
federal two weeks and €1,000, Saxony's care shares with the federal rates and the child
discount, Cologne's fee and its four weeks and six months with the federal duty and fine, and
Munich's seven months and Berlin's card, confirmation and emergency weeks with their status's
own §81(4) answer. No fact may lack a page or a day, and nothing may still be asked. It is run
once, after this plan is checked.

## Recorded

`prisma/research/README.md` gains a short section, Germany's rules checked as a whole
(SB-170): how the audit ran, the pairs and why each chosen page wins, the three facts on their
only definition, and the live read-back. The scripts are not committed, as SB-169's were not.

A rule written on the deployed database outside the file would not show in this read-back,
which asks for the file's versions. That limit is Turkey's too and is SB-221's to close; a note
on SB-221 says it covers Germany.

## Files

`prisma/research/README.md` and this plan. No code, schema, migration or test change.

## What this card does not do

It writes no guide (SB-197, SB-198) and corrects nothing itself: the accident insurer's week is
SB-263's, a research change published on its own.

## The step I am least sure of

**Official, for a page that is not a statute.** The check drew the line at who publishes the
page: a ministry's letter and a public-law chamber stating its own fee count, and an
association's page does not where the statute states the same duty. A fact found later on a
page of that kind is judged the same way.

**One reader per version**, as for Turkey: each version is shown reached by the reader its
criteria describe; the research spec covers other readers on PGlite.

## How it is checked

The digest comparison above and the live read-back. Then the full API suite, since this card
has no parent.

Checked once on 2026-09-15, which found the accident insurer's week, SB-263. Checked again
once SB-263 is live, since the data this reads changes.
