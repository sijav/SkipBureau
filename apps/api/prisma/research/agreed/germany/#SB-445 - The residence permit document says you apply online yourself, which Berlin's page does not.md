# SB-445, the residence permit document says you apply online yourself, which Berlin's page does not

**Exit, as the card words it:** neither the agreed document nor the published guide prose says a
reader applies online "yourself" or otherwise claims who may submit the application, the appointment
sentence is unchanged, and `researched-guides.spec.ts` passes.

This plan lives in `apps/api/prisma/research/agreed/germany/` because that is where the document is.
One sentence changes.

## What is there

`residence-permit.md`, lines 10 to 14, in the preamble:

> The correction worth naming: the draft told a reader who cannot get an
> appointment to plead an emergency. The actual answer is that in Berlin you
> **apply online yourself, and an appointment follows the LEA's positive review
> rather than standing between you and applying**. Published as drafted, it would
> have sent people to beg for a slot they did not need.

## Why the claim is false

Berlin's own page for this permit lists, among the documents it requires, the case of an application
made by somebody else: `Bei Antragstellung durch Bevollmächtigte: Vollmacht mit Angabe des
Verfahrensgegenstands`. A power of attorney naming the matter is exactly what an authorised
representative brings, so the page expressly contemplates an application this reader did not submit
personally.

**"Yourself" is an exclusivity claim, and nothing on that page supports it.** The rest of the
sentence is right and is what five rounds of SB-357 established: the online application comes first
and the appointment follows the LEA's positive review.

## Where it came from, which is the part worth naming

**This sentence was written during SB-357, by me, as part of a correction**, and then passed by five
closing rounds of the document's own conversation. It was caught only because a plan check for a
different card happened to open the same page. A pass convened to remove sentences claiming more than
the evidence supports introduced one, and its own sign-off did not see it.

## The card's `why` is overstated, and that is recorded rather than quietly relied on

The card says a reader who cannot attend in person is told, wrongly, that applying is something they
must do themselves. **No reader is told anything**, because this sentence is never published:
`researched-guides.spec.ts` asserts each SECTION's text against its document, and this paragraph sits
above the document's first `##` section heading, which is at line 24, so it is front matter rather
than a section. So the exit's second half, that the published guide prose must not say it, is
**already satisfied and needs no work**.

**This plan first said "above the first heading", which is false**: the first heading is the document's
`#` title at line 1, above this paragraph, not below it. The claim was written from an earlier note of
my own rather than checked, then checked and corrected. The conclusion did not move, because the
boundary that matters is the first `##`, but a plan that misstates its evidence teaches the next
reader to trust a structure that is not there.

It is still worth fixing, for a reason that is not reader harm: the document is the source of truth,
the fixed point was recorded against it, and the next correction will be written from it.

## What changes, and the plan check rewrote it

**The first version of this plan changed one word and would have failed the exit.** It replaced
"apply online yourself" with "the online application comes first" and left the rest of the sentence
standing. The check refused it on both counts it was asked about, which is why they were asked:

> "Removing only 'yourself' leaves 'rather than standing between you and applying,' which still casts
> the reader as the applicant. Its proposed grep for `yourself` would therefore pass while the broader
> prohibition remains violated."

> "'The online application comes first' is too loose: it can imply that filing is unconditionally
> available, despite the page's lawful-stay and four-month conditions."

Both are right, and the second matters more than the word this card was filed about: the document's
own Berlin paragraph, settled over five rounds, says Berlin takes the application no earlier than four
months before a national D visa or current employment residence permit expires, and sets a different
condition for certain nationalities. A sentence implying a reader may simply apply online whenever
they like would have been **a fresh overclaim written into the correction of an overclaim**, which is
this card's exact failure mode repeating one level down.

So the whole sentence is replaced, in the check's own wording, taken as given because it keeps the
meaning and states the qualification mine dropped:

> The actual answer is that, where Berlin's published conditions for the online route are met, the LEA
> reviews the online application, and an appointment follows the LEA's positive review.

It keeps the appointment sequence the exit protects, states the necessary qualification, and says
nothing about who submits.

## What does NOT change

- **The appointment half**, which the exit names explicitly and which five rounds established.
- **The "Corrected again on 2026-09-17" paragraph below it**, which quotes the earlier false wording
  in order to record what was wrong. Quoting an error to name it is not asserting it.
- **The twin, which is SB-446**, the same claim in the SB-443 plan at line 47. It is a separate card
  with its own exit and is taken in the same pass immediately after this one, because fixing one and
  leaving the other is precisely the failure that produced both.

## How it is proved

- **The replacement sentence is there in full**, asserted verbatim rather than inferred from the
  absence of one word.
- **The preamble claims nobody applies personally**, which is the exit's actual prohibition and the
  thing a `yourself` search cannot show. Lines 1 to 23 must carry no claim that the reader applies or
  submits: "yourself", "you apply", "you submit", "your application" and "between you and applying"
  all zero.

  **A `yourself`-only search was this plan's original proof, and it was insufficient.** It would have
  passed over the clause that still casts the reader as the applicant, which is the defect the exit
  names. A check that reports clean while the defect stands is worse than no check, and this one would
  have been trusted precisely because it was planted and watched failing on the word it did cover.
- **Planted.** Put the old sentence back and the search must find it, so the check is watched failing
  before it is trusted. Restored from a copy, not by `git checkout`, which would discard this plan.
  The plant runs in its own command with nothing slow beside it.
- **The guide is unaffected, and the reason is verified rather than assumed.**
  `researched-guides.spec.ts` asserts `expect(document).toContain(folded(...))`, so the DOCUMENT must
  contain the GUIDE's text, not the reverse. Front matter that is never published therefore breaks
  nothing, which is why no test has ever read this paragraph. "apply online" must also appear nowhere
  in `researched-guides.ts`, which it does not.
- This card has no parent of its own work, so it closes on the full suite, plus lint and the type
  checker.
