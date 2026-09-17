# SB-359, nothing checks that a calculated definition's inputs exist or are verified

**Exit, as the card words it:** a test walks every calculated definition in `prisma/research/agreed`
and requires each named input to exist, to be status verified, and to have a url, evidence and a read
date; and deliberately misspelling one input key makes that test fail.

This plan lives in `apps/api/test/` because that is where the spec is.

## What is there

`research-rules.e2e.spec.ts:108-120`, the parser every definition check reads through:

```ts
type Definition = { url: string | null; status: string; read: string; evidence: readonly string[] }
...
definitions.set(found[1], { url: found[2] ?? null, status: meta.status, read: meta.read, evidence: passagesOf(meta.evidence) })
```

It keeps `url`, `status`, `read` and `evidence`, and **drops `inputs`, `formula` and `rounding` on the
floor**. The test at line 145 then walks only the labels a version or fact names. A calculated
definition is named by nothing, so no test has ever looked inside one.

## What the data actually is, counted rather than assumed

Ten calculated definitions, in five of the thirteen agreed documents, every one carrying exactly the
keys `status`, `read`, `inputs`, `formula`, `rounding`:

| document | calculated definitions |
|---|---|
| `germany/business-registration.md` | `ihkg-ten-percent`, `ihk-rn-35-example`, `ihk-founder-relief-zero` |
| `germany/health-insurance.md` | `threshold-monthly-equivalent`, `share-at-average`, `minimum-base-monthly` |
| `germany/residence-permit.md` | `federal-sticker-fee-56` |
| `turkey/health-insurance.md` | `tr-gss-base-2026`, `tr-gss-premium-2026` |
| `turkey/short-term-residence-permit.md` | `main-group-twelve-months` |

Twenty input references in total. Nineteen resolve to a sourced definition that is `verified` and
carries a url, evidence and a read date. **One does not, and it is the reason this plan is not the
card.**

## The exit cannot be met as written, and the data says so

`turkey/health-insurance.md` holds a chain:

```
[^tr-gss-base-2026]: calculated | {"status": "calculated", "read": "2026-09-14", "inputs": ["csgb-minimum-wage-2026", "sgk-gss-guide-twice-minimum-wage"], "formula": "33,030 lira times 2", "rounding": "none"}
[^tr-gss-premium-2026]: calculated | {"status": "calculated", "read": "2026-09-14", "inputs": ["tr-gss-base-2026", "sgb5510-81-1f-twelve-percent"], "formula": "66,060 lira times 12 per cent", "rounding": "none, the result has two decimal places"}
```

`tr-gss-premium-2026` takes `tr-gss-base-2026`, which is **itself calculated**: status `calculated`,
no url, no evidence, by design, because its own inputs carry those. The exit asks that each input "be
status verified, and have a url, evidence and a read date". Implemented literally, **the new test
would turn the suite red on correct data**, which is the opposite of what the card is for.

So the rule the test actually enforces is the one the data supports: **every input resolves**. An
input is satisfied if it is a sourced definition that is `verified` with a url, evidence and a read
date, **or** if it is itself calculated and all of its own inputs resolve. Cycles are refused rather
than followed.

That is not a softening of the card. It is the same requirement stated so that a two step
calculation passes and a broken one cannot: every leaf of the tree still has to be verified, sourced
evidence.

## Cycles and depth, after the first measurement was wrong

**Measured twice, because the first resolver could not have found what it was looking for.** It
returned 1 for a non calculated input and then took the maximum over those, so it could never report
more than 1, and it duly reported "every calculated definition takes only sourced inputs" one command
after a different survey had printed `tr-gss-base-2026` as a calculated input. Two of my own outputs
contradicted each other and the incrementing one was wrong.

Rewritten to increment and to carry a stack: **no cycles anywhere, deepest chain 2**, that one case.
A check that reports clean while being incapable of reporting anything else is the failure this
project has already been bitten by twice today, and it is worth naming here because the test being
written is exactly such a check if nobody plants against it.

## Walking the directory, not the rules

The test walks `prisma/research/agreed/*/*.md` directly, skipping `#` plan files, rather than
iterating `COUNTRIES`.

**Because an orphan already exists.** Germany's rules name six documents and Turkey's name six, twelve
of the thirteen on disk. `turkey/tax-number.md` is named by no rules file at all; it reaches the
product only through `researched-guides.spec.ts`, whose own `DOCUMENTS` map is hand maintained and
omits the region documents. It holds no calculated definition today, so the two strategies agree, **by
luck rather than by construction**. Walking the rules would silently skip any document that falls out
of them later, which is precisely the shape of the hole this card exists to close.

## Is this a gate the owner did not ask for

CLAUDE.md is explicit that one is never to be invented, and that rule has been applied against three
separate temptations today, including one this same spec raised.

**My reading is that this is not a new gate but an existing one's blind spot**, and the check should
say if that is wrong. `research-rules.e2e.spec.ts:145` already requires every referenced definition to
be `verified`, on its source's url, on its source's day: established apparatus, relied on by SB-444
only hours ago. `definitionsOf` simply discards the fields that would let the same rule reach a
calculated definition's inputs. This adds no new kind of refusal, no threshold and no score.

### The check ruled against that reading, and the work stopped here

> "This is a new gate, not merely a repair to the existing one. `research-rules.e2e.spec.ts` currently
> validates provenance only for definitions actually named by rule versions and facts. Walking every
> calculation, recursively validating its dependency graph, and failing on malformed agreed-document
> data creates a broader refusal condition, especially for guide-only documents such as
> `turkey/tax-number.md`. Under the owner's explicit no-new-gates rule, do not build it unless the
> owner expressly authorizes this card as an exception."

**It is right and my distinction was the rationalisation I suspected it might be**, which is why it
was asked as a question rather than asserted. The existing rule is narrow on purpose: it validates
what a rule version or fact actually names. This card would extend refusal to every agreed document on
disk, on data no rule serves.

It also corrected the plan's own framing: `turkey/tax-number.md` is **not** effectively dead. It is
guide content, named in `researched-guides.spec.ts:16`, so the invariant would reach product research
rather than a forgotten file. That strengthens the case for walking the directory, and it strengthens
the case that this is a gate.

So no code is written. The owner decides whether this card is authorised as an exception, per
CLAUDE.md: "If a check seems necessary, say so in the reply and let the owner decide."

### The invariant to build, if it is authorised

Recorded now so the ruling is not re-derived later. It is stricter than this plan first proposed:

- a calculated definition has a **non-empty** `inputs`, and non-empty `formula` and `rounding`, and a
  read date;
- each input resolves either to a verified sourced leaf with url, non-empty evidence and a read date,
  or to another calculated definition meeting these same structural requirements;
- cycles fail.

**`formula` and `rounding` are required after all**, against this plan's first judgement that they
were out of scope: without them the graph is sourced but the purported calculation states no
operation. And non-empty `inputs` is necessary or an empty calculated definition resolves vacuously,
which is the hole my own restatement would have opened.

The plants stay as planned, all four, including the nested-calculation and cycle cases: without them
the recursive rule is only reasoned about.

## What changes

1. `Definition` gains `inputs: readonly string[]`, and `definitionsOf` stops discarding it.
2. One test is added beside the existing definitions test.
3. `readdirSync` joins the existing `node:fs` import.

Nothing else. `formula` and `rounding` stay unread: the exit names inputs, and checking arithmetic
prose is a different card nobody has asked for.

## How it is proved

- **The exit's own planted case**: misspelling one input key must make the test fail, naming the
  definition and the missing label.
- **One plant per branch, because a check with four reasons to fail and one plant is one eighth
  tested**: an input that does not exist, an input whose status is not `verified`, a sourced input
  with no evidence, and a calculated input whose own input is missing, which is the branch the chain
  exists to exercise. Each watched failing, then restored from a copy, not by `git checkout`, which
  would discard this plan.
- **The suite is green first**, so a later red is the plant and not the edit.
- **The whole file is run, never `-t` on the new test.** `research-rules.e2e` loads the research
  inside an earlier test, so a filtered run reaches a later one with nothing loaded and passes without
  checking anything.
- This card has no parent, so it closes on the full suite, plus lint and the type checker.

## Dropped, by the owner's decision of 2026-09-17

The conflict was put to him with both rules quoted and located: `CLAUDE.md` lines 37 to 39, forbidding
a gate nobody asked for and saying a check that seems necessary is for him to decide, against this
card's own exit requiring one. He was given three choices, to authorise it as an exception, to move it
to phase Quality, or to drop it. **He chose to drop it.**

So no test is written, now or later, and the ten calculated definitions stay exactly as they are. The
hole is recorded in `PHASE-NEXT.md` rather than `TECH-DEBT.md`, because CLAUDE.md draws that line
explicitly: a deliberate scope cut is a decision, and debt is what you did not mean to take on.

**This plan stays rather than being deleted**, per CLAUDE.md's rule that the record is corrected and
not removed. It is now the account of why the hole is open on purpose: what is unchecked, what the
check ruled, what the invariant would have been if it were ever authorised, and who decided against
it.

**Worth naming for whoever reads this next:** the reasoning in "Is this a gate the owner did not ask
for" above was wrong, and I had already half suspected it, which is why it went to the check as a
question rather than a conclusion. A hole being real is not an argument that closing it is permitted.
