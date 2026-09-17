# SB-316, a guide can link a group the label test never checks

**Exit, as the card words it:** a guide linking a group absent from
`LINKED_OBLIGATION_GROUPS` fails a test, proved by planting that omission.

That wording may not survive this plan, for a reason set out at the end.

This plan lives in `apps/api/src/guide/` because `obligation-groups.ts` is the
module the card is about. It also touches
`apps/web/src/shared/rule-answer/factLabels.test.ts`.

## What is there, measured

- **`obligation-groups.ts` holds eight named constants and one hand written array
  of them.** `ADDRESS_GUIDE`, `TURKEY_SHORT_TERM_RESIDENCE_PERMIT`,
  `TURKEY_HEALTH_INSURANCE`, `TURKEY_WORK_PERMIT`, `TURKEY_COMPANY_FORMATION`,
  `GERMANY_RESIDENCE_PERMIT`, `GERMANY_BUSINESS_REGISTRATION`,
  `GERMANY_HEALTH_INSURANCE`, and then `LINKED_OBLIGATION_GROUPS` listing all
  eight again.
- **The array has exactly one consumer. The constants have three, and I got that
  wrong.** `factLabels.test.ts` line 12 is the only reader of
  `LINKED_OBLIGATION_GROUPS`, which is the point that matters. But an earlier
  draft of this plan said the module as a whole has one consumer and that
  `sample-content.ts` does not link from here. Both wrong:
  `prisma/sample-turkey.ts` line 1 and `prisma/sample-germany.ts` line 1 both
  import `ADDRESS_GUIDE`, using it at lines 258 and 31. I had grepped
  `apps/api/src` and `apps/web/src` and read the miss as an absence, which is the
  same mistake as concluding a directory does not exist from a search too shallow
  to reach it. The four consumers are those two seeds, `researched-guides.ts` and
  the web test.
- **They agree today.** Ten guides, twenty five obligation slugs used, twenty
  five listed, nothing used but unlisted, nothing listed but unused. So this is
  the structural gap, not a live defect. SB-300 shipped the live version of it
  for an hour and a planted failure caught it.
- **A web test can load the researched guides.** This is the thing that decides
  the approach, so it was run rather than reasoned about: a throwaway unit test
  importing `RESEARCHED_GUIDES` through the `api/*` alias, which
  `tsconfig.app.json` maps to `../api/src/*`, passed in 493ms.

## Two claims in that module's header that are not true

The header reads: "sample-content.ts and researched-guides.ts link from here, and
the web's label test reads it to know which rule facts a guide can show (SB-257),
so this module imports nothing: a web test cannot load Prisma."

- **The header names the wrong consumer.** It says `sample-content.ts`, and the
  sample side actually reaches this module through `prisma/sample-turkey.ts` and
  `prisma/sample-germany.ts`. The claim's substance is true, its names are not,
  so the fix is to correct the names rather than strike the sentence.
- **"A web test cannot load Prisma" does not describe this module's neighbour.**
  `researched-guides.ts` line 1 is `import type { Prisma, PrismaClient }`, a type
  only import, erased at runtime, which is why the probe above ran at all. The
  constraint the header states as the reason for the module's shape is either
  stale or was never about this import.

In a card whose subject is two lists quietly disagreeing, a header that
misdescribes its own consumers is the same failure one level up, so it is
corrected here rather than left.

## The approach

**Derive, and then delete.**

1. `factLabels.test.ts` stops reading `LINKED_OBLIGATION_GROUPS` and takes the
   linked slugs from the guides themselves,
   `RESEARCHED_GUIDES.flatMap((guide) => guide.obligations.flat())`. A guide that
   links a group is then checked because it links it, not because somebody also
   wrote it down somewhere else.
2. `LINKED_OBLIGATION_GROUPS` then has no consumer at all, so it goes. The eight
   named constants stay: they are how a guide declares its groups, and they
   remain the single place each is written.
3. The header is corrected to say what is actually true of its consumers.

The card offers "derive the test's input from the researched guides' own
obligations, or assert that the two sets are equal". This takes the first,
because the second keeps two lists and adds a third thing to maintain, while the
first removes the possibility rather than reporting it. Detection is what this
card exists to add, and not needing detection is better than having it.

## Files

- `apps/web/src/shared/rule-answer/factLabels.test.ts`, the derivation.
- `apps/api/src/guide/obligation-groups.ts`, the array removed and the header
  corrected.
- this plan.

## How it is proved

The exit asks for a planted omission to fail. After this there is no list to omit
from, so the plant moves to the other end.

**The obvious plant is impossible, and that was measured rather than assumed.**
Adding a guide that links a group whose facts have no label needs an obligation
that has researched facts and is not already linked. There is none: a probe over
every researched version found no unlinked obligation carrying facts at all. Every
one of them is already linked and already labelled.

**So the plant is two staged, and it proves the derivation rather than the labels.**

1. Remove one key from `FACT_LABELS`. The test must fail, naming that fact, which
   shows it is still checking the facts of the obligations guides link.
2. Leave the label removed, and unlink that obligation from the guide that links
   it. The test must pass again, which shows its scope follows what the guides
   link and nothing else. Under the old array this second step would have changed
   nothing, because the slug would still have been listed.
3. Restore both, and the test is green.

Stage two is the one that matters. Stage one alone would pass just as well over a
hand written list, so it cannot tell the new arrangement from the old.

**Run, and it holds.**

Stage one: removing ``charge: msg`Residence permit charge`,`` failed with
"factLabels.ts has no label for: pay-the-residence-permit-charge.charge". It named
that fact and no other, which also settles a risk this plan had not checked:
`FACT_LABELS` is keyed by fact key alone, not by obligation and key, so had any
other linked obligation carried a `charge` fact, stage two could never have gone
green and the result would have been unreadable.

Stage two: with the label still missing, unlinking
`['pay-the-residence-permit-charge']` from `TURKEY_SHORT_TERM_RESIDENCE_PERMIT`
made the test **pass**. Under the old array it would still have failed, because
the slug would still have been listed. Restored from copies rather than from git,
since this file already held the card's uncommitted work, and green again.

**The first attempt at stage two proved nothing, and is recorded rather than
quietly redone.** It matched the line containing the group and deleted it, but
that line is the whole `export const TURKEY_SHORT_TERM_RESIDENCE_PERMIT`
declaration, so it removed the constant rather than one of its groups. The test
failed, and I had filtered the output down to a pass or fail count, so the reason
was invisible: it could have been the same assertion or a broken import. A
narrower match, on the group's text inside the line, is what made stage two mean
anything.

## The exit condition may need restating, and that is the check's to rule on

"A guide linking a group absent from `LINKED_OBLIGATION_GROUPS` fails a test"
cannot hold once that array does not exist. The guarantee the card wants survives
and gets stronger, but its wording names the mechanism rather than the outcome.

Restated: **the label test's input is the guides' own obligations, so a linked
group cannot be absent from it, proved by a guide whose linked facts have no
label failing that test.**

**Ruled on, and done.** The check called the restatement legitimate rather than an
overreach, and went further: once the redundant list is correctly removed the old
exit is impossible, so the card could not close honestly without the update. The
board now carries the outcome, and the alternative it was weighed against, keeping
the array and asserting equality, was rejected for preserving the drift this card
exists to remove.

## What the plan check settled

- **Delete the array rather than assert against it.** Keeping a second list to
  satisfy the old exit's wording would preserve the drift this card exists to
  remove.
- **Restating the exit is required, not an overreach.** Once the array is gone
  the old wording cannot hold, so the card could not close honestly against it.
  The board now carries the outcome rather than the mechanism.
- **The third option is rejected.** Moving the guide to groups mapping into this
  module, to keep the web test's import small, is not worth it: the web unit
  project already aliases API source for exactly this kind of test, 493ms is
  proportionate, and `import type` is erased from emitted JavaScript by
  guarantee rather than by luck.
- **The module stays.** It is the small, pure owner of `ADDRESS_GUIDE` for the
  two sample seeds, so folding it into `researched-guides.ts` would drag the seed
  into files that want four lines from it.

## The step I was least sure of, answered

**Whether a web test should import a 1,300 line API seed module.** Deriving means
`factLabels.test.ts` pulls in `researched-guides.ts`, which carries every guide's
full text, its sections, sources and the loader. I proposed, as a fallback, keeping
a derived list inside `obligation-groups.ts` instead, to avoid the weight.

The check rejected that fallback and the worry with it: the web unit project
already aliases API source for this kind of test, the measured 493ms load makes
the coupling proportionate, and `import type` is erased from emitted JavaScript by
guarantee rather than by luck. So the heavier import is the right trade and the
lighter shape would have been churn for a purity that does not pay.

## The step I am least sure of now

**Whether the label test can still fail.** Before this, its input was a list
somebody maintained, and the failure it guards against was that list falling
behind. Now its input is derived, which removes that failure but also removes the
only way the test was ever seen to be wrong. A test whose input is computed from
the same data it checks can become a tautology without anyone noticing, so the
planted proof below is not a formality here: it is the only thing that shows this
test still refuses something.
