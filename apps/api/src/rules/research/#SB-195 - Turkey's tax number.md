# SB-195, Turkey's tax number

**Exit:** on the deployed API, Turkey's tax number answers with its fee naming
the page that states it, or this card records why no official page states it and
nothing is written.

## What the agreed research verified

`research/agreed/turkey/tax-number.md` carries two definitions, and nothing else
in it is tied to a page:

- `gib-2010-report-foreigner-id`, the Revenue Administration's 2010 report:
  from 1 July 2010 a foreigner's identity number is used as their tax number.
  That is a rule about which number serves, not a figure.
- `uludag-tax-id-free`, Bursa Uludağ University's guidance for its prospective
  students: "Obtaining a Tax ID is free of charge". The agreed text itself says
  "according to the public university guidance we checked".

## The decision: nothing is written

**The fee has no page a rule may cite.** SB-190's rule for choosing a fact's page
asks first for a verified definition and then for a page whose own scope covers
the fact's. The fee is a national fact about what the Revenue Administration
charges. The only page stating it is one university's guidance for its own
applicants, which is narrower than that fact, the same shape as a city chamber's
page for a national charge, and the same defect SB-174's review filed as SB-184
and SB-185. A university is a public body, but it is not the authority that
issues the number or sets its price, so its page is not an official source for
the fee.

**The 2010 identifier rule is national and verified, and it is not written
either.** The card asks for the fee. A fact saying which number serves as the tax
number is a new kind of fact, with nothing in Germany's research to compare it
with, and it does not change anything a reader is asked to do or pay. SB-197's
guide can say it in words, citing the report.

**What the research could not verify stays unwritten**, as the card says: a
processing time, and a lease or a phone line needing a tax number.

So no obligation and no version for the tax number is added to
`src/rules/research/turkey.ts`, and the deployed database gains nothing. That is
the exit's second branch, recorded here and on the card.

**The fee is filed as research**, not guessed: a card to find it on the Revenue
Administration's own pages, through the research conversation the owner ordered
on 2026-09-12, after which a fact could be written with an official page.

## Files

This plan; a note on SB-195; a sentence in `prisma/research/README.md`'s SB-190
section saying that a figure whose only page is narrower than the fact is left
unwritten until research finds one that is not; and the research card. No code,
no schema and no data change.

## The step I am least sure of

**Treating a public university's page as narrower than the fact.** The owner's
order asks for an official source, and a state university is part of the state.
The line drawn here is authority over the fact, not whether the body is public:
the tax administration sets what a tax number costs, and a university only
repeats it for its applicants. If that line is wrong, the fee could be written
today from the university's page.

## How it is checked

There is nothing to run: no row is added, so no test changes. The check is this
plan's, on the judgement above, and after closing, the card's own review.
