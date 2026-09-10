# SB-084: the documents claim a guarantee the database does not give

Revised after the plan check, which found the largest gap I had missed. Not
re-checking: every change is an adoption of what it prescribed.

**Exit condition.** TECH-DEBT.md lists every part of the rule history that is
not enforced, and DESIGN.md claims only what the triggers actually do.

This plan sits at the repository root because both files it changes do.

## What is actually enforced, read from the migration

`20260909232307_rule_history_is_append_only` creates three triggers:

| trigger | on | when |
|---|---|---|
| `rule_version_history_is_immutable` | `RuleVersion` | BEFORE UPDATE OR DELETE |
| `rule_fact_history_is_immutable` | `RuleFact` | BEFORE UPDATE OR DELETE |
| `rule_versions_do_not_overlap` | `RuleVersion` | AFTER INSERT OR UPDATE |

The first two only raise when `validTo` is **not null**. So the guarantee is
narrower than it reads: a **closed** version row and the facts already on one
cannot be changed or removed by ordinary DML. That is all.

## What the check found that I had missed

**An OPEN version is completely unprotected.** The trigger tests
`OLD."validTo" IS NOT NULL`, so until a version is closed a writer can edit or
delete it, change its facts, rewrite its source, move its `verifiedAt`, or
backdate `validTo`. An open version covering 2020 to now is most of the
history, and every one of those edits changes what a query about 2021 returns.
So "a change is a new row, never an edit" is not enforced even for time a
current row already covers. This is the gap that matters most and it is the one
I did not see.

Also missed: **inserts**. A criterion inserted onto a closed general version
narrows who it historically applied to. A `RuleText` row inserted for a new
locale changes what a past reader in that locale would have been shown.

## Cascades, which I asked about

Ordinary foreign-key cascade is **not** a bypass: PostgreSQL runs cascading
changes as normal child-table UPDATE and DELETE, so the row triggers fire.

`TRUNCATE ... CASCADE` **is** a bypass, because it does not fire ON DELETE
triggers. There is no role or privilege setup in this repository to put that
out of reach, so it is a gap and gets listed as one rather than waved away as
privileged.

## What I will change

1. **TECH-DEBT.md**: amend the preamble so it admits known, temporary
   enforcement gaps as well as suppressions, since an unenforced invariant is
   neither silenced nor pinned. Then replace the single fact-insert entry with
   one consolidated entry naming every gap, **linking SB-081 as its owner**,
   whose removal check is that mutation tests prove each gap closed.
2. **DESIGN.md**: stop saying "append-only". Say what is true: closed version
   rows and the facts already on them cannot be updated or deleted by ordinary
   DML, and everything else is listed in TECH-DEBT. Do not imply dated
   nationality membership is immutable, because it is not.
3. **SB-081**: extend its description to carry the open-version gap and the
   insert paths, so the enforcement card covers what this card documents.

No code. SB-081 is the enforcement work.

## Where I am least sure now

Nothing about the inventory: the check enumerated it and I have verified each
one against the migration. What remains uncertain is whether one consolidated
TECH-DEBT entry is easier to act on than one per gap. I am taking the
consolidated form because the gaps share a cause and an owner, and six entries
that all say "SB-081" would read as six problems rather than one.
