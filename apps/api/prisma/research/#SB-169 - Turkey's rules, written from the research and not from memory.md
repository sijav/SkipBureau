# SB-169, Turkey's rules, written from the research and not from memory

**Exit:** every Turkish rule on the deployed database names, on each fact, an official
page and the day it was read, none rests on a calculated definition, and a reader who has
said they live in Bursa sees Bursa's address registration answer, inheriting the rest from
the national rule.

## Why

Every guide on the live site is still illustrative content, and the product's one claim is
that it can prove when a rule was last verified. SB-191 to SB-196 each wrote one agreed
document's figures into rows, each choosing a page for each fact by the rule SB-190's plan
records. This card is the check of the whole: that the 19 versions and 69 facts now in
`src/rules/research/turkey.ts` follow that rule taken together, and that the deployed
database says what the file says.

## What stays exactly as it is

Every version, fact, source, loader and test. No version is changed: history is
append-only, and a correction to a deployed version would be a successor, which needs
SB-202. The guides are SB-197's.

## The rule every fact is held to

From SB-190's plan, for one fact, in order: a definition of the same agreed document,
verified, never calculated and never a superseded edition; a page whose own scope covers
the fact's; and a page whose evidence states the whole fact, and among those the one that
states the fact itself rather than a change to it or a clause of a longer list. Never by
marker order, never by which page looks more official. Where two pages each state the
whole fact, the rule does not rank them, and either stands.

## The audit, already run as research for this plan

A script listed, for each of the 69 facts, the definitions it names beside every other
verified definition of the same document whose evidence spells the same value, as a
figure, with Turkish separators or in Turkish words, and flagged a chosen passage that does
not spell the value and a page of one place cited by a version for all of Turkey. Every flag
and every pair was then read in the evidence itself. What it found:

- **Every fact rests on a verified definition that states it.** The 16 flags were the
  script's own reach: English values against Turkish text ("more than one year" is "bir
  yılı geçtiği tarihten sonra"), `yirmidört` written as one word, `on binde dördü` for
  0.04 per cent, `28.075,50`, "UETS hesabı" in a list of required documents. None rests on a
  calculated definition: the three calculated definitions are named by no fact or version.
- **No page is narrower than its fact.** İstanbul's chamber pages, İstanbul's 2021 notice
  and the university's guidance state figures only as research evidence; Bursa's notice is
  cited only by the Bursa versions.
- **Where two pages state a figure, the chosen one follows the rule:**
  - the minimum capital: the Ministry of Trade's page, which states the current 50,000,
    over Article 580's 10,000 with a note and decision 7887's raise, as SB-190 recorded;
  - the premium days: SGK's page, which states them in one sentence and its debt condition
    and exemptions in the paragraphs after it, over Law 5510's Article 67(1)(a), a clause of
    a longer list;
  - the premium base: SGK's guide, twice the minimum wage, over Article 80's twice the
    floor, which needs Article 82 to become the minimum wage;
  - the card fees and the work permit fee: the Migration Presidency's and the Labour
    Ministry's 2026 fee pages over rows of the Treasury communiqué's table and of Law 492's
    tariff;
  - returning while an application is pending: the regulation's Article 21(9)(d) over a
    2016 e-İkamet guide and İstanbul's notice.
- **Ties the rule allows**, two whole statements of one figure: cover from the day after
  the request, Law 5510's Article 61(1)(c) and SGK's guide; 90 days in 180, Law 6458's
  Article 11(1) and the foreign ministry's page; reporting within 15 days, Law 6735's
  Article 22(1) and the Labour Ministry's FAQ 59; working while an extension is assessed,
  the regulation's Article 27(5) and FAQ 21; renewing the tax certificate by 31 May, GİB's
  April 2026 brochure for capital companies, Communiqué 408 and GİB's rights guide.
- **Every page is on a Turkish government host**: mevzuat.gov.tr, sgk.gov.tr, csgb.gov.tr,
  goc.gov.tr and e-ikamet.goc.gov.tr, bursa.goc.gov.tr, gib.gov.tr and cdn.gib.gov.tr,
  ticaret.gov.tr, seddk.gov.tr and nvi.gov.tr.

So nothing is corrected. Had a fact broken the rule, its correction would have been a card
waiting on SB-202.

## The deployed database, read back version by version

A scratch script asks the deployed API, for each of the 19 versions, as the reader that
version reaches: its residence status, its situation, a nationality of its group, its place,
and for a national address version a province other than Bursa, since a reader who names
none is asked. For each, the answer for that obligation must carry every one of the
version's own facts with the file's page, page name and read day, and no fact of that
obligation may lack a page or a day. A Bursa reader's answer must hold Bursa's two facts and
the national three, each on its own page. It is run once, after this plan is checked.

## Recorded

`prisma/research/README.md` gains a short section, Turkey's rules checked as a whole
(SB-169): the rule, the pairs above and why each chosen page wins, the ties, and the live
read-back. The audit script is not committed: the rule is applied by whoever writes a
version, and a second audit is a later card's to run, not a gate.

## Files

`prisma/research/README.md` and this plan. No code, schema, migration or test change.

## What this card does not do

It rewrites no guide, which is SB-197; checks no German rule, which is SB-170's; and changes
no deployed version, since nothing breaks the rule.

## The step I am least sure of

**The ties.** The rule leaves two whole statements unranked, so the tax certificate's 31 May
rests on a brochure where a communiqué says the same; either is a correct citation, and a
tie-break would be a preference the rule does not state.

**One reader per version.** The read-back shows each version reached by the reader its
criteria describe, not every reader it reaches; the research spec covers the others on
PGlite.

## How it is checked

The live read-back above, every version reached and every fact on its page and day. Then
the full API suite, since this card has no parent, run plainly outside the hour SB-219
describes, which avoids that failure rather than shows the suite free of it.
