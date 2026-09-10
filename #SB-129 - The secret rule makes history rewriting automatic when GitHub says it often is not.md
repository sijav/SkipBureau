# SB-129, the secret rule makes history rewriting automatic when GitHub says it often is not

**Exit condition:** `CLAUDE.md` says when rewriting history is needed and when
it is not, and names the test for involving GitHub Support.

## What is wrong

SB-120 fixed a rule that overstated a threat and omitted the remedy. It then
overstated a step: it lists **revoke or rotate, then rewrite history, then
contact Support** as a sequence, as though each follows automatically.

GitHub's guidance is that where rotation fully mitigates, rewriting history can
be **unnecessary and disruptive**. Rewriting is containment for residual
exposure, compliance or policy, not an automatic second step. Telling someone to
rewrite the history of a shared repository at three in the morning, when the
credential is already dead and the rewrite breaks every open branch, is bad
advice dressed as thoroughness.

"Contact Support, where it applies" is the other half, and it is not actionable.
I wrote "where it applies" without saying what applies. The real test is not
whether the credential can be rotated: it is whether the data still presents
risk after rotation, whether it is sensitive data at all, and whether the
repository's writable refs are already clean. GitHub makes the final call, and
what they can then help with is cached views and pull request references.

## The approach

Rewrite the three steps as one decision rather than a sequence:

1. **Revoke or rotate.** Always, first, no condition.
2. **Then ask whether anything is still at risk.** If rotation killed it, stop.
   Say that explicitly, because stopping is the common case and the rule
   currently implies it never happens.
3. **Rewrite only for residual exposure**, and name the cost: it rewrites every
   commit id, so every open branch, fork and clone has to catch up.
4. **Support when the data is still sensitive after rotation and the refs are
   clean**, through the portal, for cached views and pull request references.

## Files

| file | change |
|---|---|
| `CLAUDE.md` | the remediation section |

## How it meets the exit condition

It is a claim about what the file says, so it is read: the section has a stop
condition after rotation, and names the test for Support rather than saying
"where it applies". No test to write, and inventing one for a paragraph is the
apparatus the owner has told me not to build.

## The step I am least sure of

**Whether I am now over-correcting in the other direction.** Two rounds have
moved this paragraph from "for ever, and here is nothing" to "here is a
sequence" to "here is a decision tree". Each round was right on its own terms
and the paragraph keeps growing, and a rule nobody finishes reading at three in
the morning fails exactly when it is needed. The test for this change is
whether it is SHORTER and more decidable, not more complete.
