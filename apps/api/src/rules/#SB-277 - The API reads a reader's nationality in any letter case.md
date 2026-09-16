# SB-277, The API reads a reader's nationality in any letter case

**Exit:** an API test asks Turkey's charge with `CZ` and `cz` and Germany's visa-free skilled
worker's permit with `US` and `us`, and each pair gets the same answer, charge none and the
ninety-day deadline; watched failing before the change.

## Why

`fitOne` compares a reader's nationality to a rule's with `===`, and group membership is read from
the database by that same string. Nationalities are stored lower case, `['cz', 'dk', 'ie', …]` and
`@db.VarChar(2)`, so an upper-case code matches nothing. Measured on the live API on 2026-09-15:
Turkey's residence permit charge answers `cz` with charge none and `DK` with no rule at all, and
Germany's §41(1) AufenthV ninety days reach `us` and not `US`.

The web lowercases the origin it takes from the link, so readers are right today. Any other
caller, an admin tool, a script, a second client, sending the conventional upper-case ISO code is
told there is no rule, with no error to show for it.

## What is silently wrong, and what is merely unhelpful

This matters for scope, and it was read rather than assumed.

- **nationality and situation are never validated.** Nothing in `checkProfile` looks at them, and
  there is no list of codes to check a nationality against. A wrong case simply fails to match and
  the reader is told there is no rule. **This is the harm the card is about.**
- **regions and statuses are refused loudly.** `checkProfile` reads them from the database by the
  exact string and throws `ProfileError` → `BAD_USER_INPUT`: `Not a region: TR-34.` or
  `Not a residence status: …`. A caller sending the wrong case gets an error, not a wrong answer.

So the two dimensions with no guard are exactly the two that mislead. The other two are still
worth normalising, because an ISO code in its conventional case is a valid input and answering it
with an error is still the wrong answer, but nothing is silently wrong there today.

## What changes

**Only the nationality**, and in one place.

The first draft normalised four dimensions at the three resolver edges. The check refused both
halves of that and was right:

- **Statuses and regions are deliberately validated** against stored codes and answer
  `BAD_USER_INPUT`. Turning `TR.SHORT-STAY` or `Tr-34` into a success would change that contract
  and hide a client mistake the API catches today. The region transform would in fact have been
  harmless, since Turkey has only `TR-01`–`TR-81` and Germany five single-dot `DE-XX.city` codes,
  but harmless is not a reason, and its behaviour for a key with a second dot has no inventory and
  no test behind it.
- **`situation` has the same silent fault** as nationality, and is outside this exit. It is
  **SB-341** rather than a quiet extra.
- **The resolver edges are the wrong place.** Three of them today, and a fourth caller the plan
  had not noticed: `guide.service.ts` resolves through the service too. A new resolver that takes
  a reader would simply miss the normaliser.

So one pure `canonicalNationality` in `eligibility.ts`, beside `Profile` and the fit helpers,
applied at the top of `RulesService.resolveChecked`.

**SB-341 renamed it `canonicalProfile`** and gave it the reader's situation too, which had the same
silent fault, so the name would otherwise have described half of what it does. The placement and
the reasoning below are unchanged.

**That is the single funnel every resolution passes through**, which was read rather than assumed:
`resolve` reaches it once, `move` twice, one profile per side, `changes` twice, once per date, and
`guide.service.ts` reaches it through `resolve` whenever a guide links obligations. Where a guide
links none it calls `checkProfile` alone and resolves nothing, so no nationality is used at all.

It does not belong in `checkProfile`: that validates regions and statuses and never looks at a
nationality, and it returns nothing, so it could not hand back a corrected profile anyway.

`scripts/publish-research.ts` needs nothing: `readerFor` builds readers from a version's own
criteria values, already in the file's canonical case, never from a caller.

## The tests

`research-rules.e2e.spec.ts` already asks both of the exit's cases through the running server, and
`move.e2e.spec.ts` cannot: it seeds `prisma/seed.ts`, the sample content, so no researched rule
exists there at all.

- Turkey's charge is already asked with `nationality: 'dk'`, and the exempt group holds `cz`. The
  new assertion asks it with `CZ` and with `cz` and expects the same answer, charge none.
- Germany's visa-free permit is already asked through `answerFor(nationality, ['de.visa-free'])`
  over every member of the §41(1) group, `us` among them. The new assertion asks `US` and expects
  the ninety-day `applyInGermanyWithin` fact, the same as `us`.

Planted: the normaliser taken out of the edge, which must fail both pairs. That is the exit's own
planted case, and it is what the card means by "watched failing before the change".

## How it is checked

**This card has no parent**, so it closes on the **full API suite**, not only the specs it
touches, together with lint and `lint:tsc`. Then the planted case, and a deployed read of the two
pairs, since the card's measurement was taken on the live API and the fix should be shown there.

## The steps I am least sure of

**Whether normalising can ever mask a caller's mistake.** A status sent as `TR.SHORT-STAY` today
errors and would then resolve; that is the point, but it also means a client bug that used to be
caught loudly goes quiet. The same is true of regions.

**The region rule's shape.** It is written for `XX-00` and `XX-00.key`. A key with a second dot,
which nothing has today, would have its tail lower cased whole, which is probably right but is not
something any stored code exercises.
