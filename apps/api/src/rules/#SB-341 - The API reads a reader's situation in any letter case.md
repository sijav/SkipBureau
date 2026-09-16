# SB-341, The API reads a reader's situation in any letter case

**Exit:** an API test asks a founder duty with `company-founder` and `COMPANY-FOUNDER` and a worker
duty with `worker` and `WORKER`, and each pair gets the same answer; watched failing before the
change.

## Why

`fitOne` compares a reader's situation to a rule's criterion with `===`, and situations are stored
lower case, `worker` and `company-founder`. A caller sending `WORKER` therefore **contradicts**
every situation-scoped version, and `if (fit.contradicted) continue` drops each one before
resolution, so the obligation does not appear in the answer at all. Not a question, not an error:
it is simply absent.

That is worse than the nationality fault SB-277 fixed, where the reader was at least told there was
no rule for them. Here the duty vanishes. And nothing refuses the input: `checkProfile` validates
regions and statuses against stored rows and throws `BAD_USER_INPUT` by name, and looks at no
situation at all.

SB-277's plan check found this while refusing to let that card grow, and asked for it to be stated
separately. This is that card.

## Where it goes, which is already decided

SB-277 established the funnel and proved it: `RulesService.resolveChecked` is the one place every
resolution passes through, `resolve` once, `move` once per side, `changes` once per date, and a
guide through `resolve`, while a guide that links no obligations calls `checkProfile` alone and
resolves nothing. The nationality is canonicalised at the top of it. The situation joins it there.

`canonicalNationality` is used in exactly one place, `rules.service.ts:155`, so the change is small
either way. **It is renamed** to say what it now does: a function called `canonicalNationality`
which also lower-cases a situation is a lie in the name, and the next reader of the funnel would
not know to look inside it. One helper, one call, covering the reader codes nothing validates.

SB-277's plan is a committed record that names the old function; it gets a line saying SB-341
renamed it, rather than being edited to pretend it always said this.

## The question this card should not answer alone

**Canonicalising is not obviously right.** Regions and statuses are refused by name because they
are keys validated against stored rows, and a country's situations are enumerable too: the API has
a `situations` query, and `situations.e2e.spec.ts` asserts the Role row offers exactly the
situations a country's researched rules name.

So there is a real alternative: **refuse an unknown situation** the way an unknown region is
refused. Canonicalising alone means `WORKER` works and `wroker` is still silently nothing, and a
caller cannot tell those two apart.

**The check answered it: canonicalise only, and it gave the reason.** A situation is enumerable
only **per country**. Turkey's rules name `worker` and `company-founder`; Germany's name only
`company-founder`. So there is no global set of valid situations to check against, and treating the
`situations` query as one would make a Turkish worker moving to Germany an **invalid profile**
rather than a person for whom Germany has no worker-scoped rule. Which country's list would bind,
the source, the destination, the union, or a registry that does not exist, is a product decision
nobody has taken, and inventing it inside a one point card is how a gate nobody asked for appears.

So validation stays out. It is not filed either, because what it should mean is undecided: the card
would be a question wearing a task's clothes. This plan records the question instead.

## The tests

`research-rules.e2e.spec.ts` already asks a founder duty through `toldInSituation(COMPANY_DUTIES,
'company-founder')` and a worker duty through `toldInSituation(WORKER_DUTIES, 'worker')`. The pairs
go beside those: one founder duty asked with both cases, one worker duty asked with both, each
expecting the same answer.

Written **before** the change and run, as SB-277's were, so the failure is the bug itself rather
than a planted one: the upper-case call should come back undefined where the lower-case one
answers.

## How it is checked

This card has **no parent**, so it closes on the **full suite**: the API's, and the web's unit and
four story projects, plus lint and `lint:tsc`. Then a deployed read of both pairs, since the fault
is one only a caller other than the web can hit and the web is not what proves it.

## The steps I am least sure of

**Canonicalise or validate**, above.

**The rename.** It touches one import, one call site and one sentence of a committed plan. The
alternative, a second helper called at the same place, keeps each function single-purpose at the
cost of two lines in the funnel and of the next code having nowhere obvious to go.
