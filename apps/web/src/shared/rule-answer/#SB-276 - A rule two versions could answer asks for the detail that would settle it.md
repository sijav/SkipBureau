# SB-276, A rule two versions could answer asks for the detail that would settle it

**Exit:** a `RuleAnswer` story in `needsReview` with `asks` shows the warning, the reason, the detail
that would settle it and a Tell us button that calls its handler, `Guide.tsx` passes a review's first
need, and the story was watched failing.

## What a reader is shown now

`RuleAnswer`'s `needsReview` branch is one panel and nothing else:

```tsx
{state === 'needsReview' && reason && (
  <InfoPanel kind="warning" heading={<Trans>Two rules could apply to you</Trans>}>{reason}</InfoPanel>
)}
```

So the page says two rules could apply, gives the reason, and stops. The only way forward is to find
the header's control unprompted, which is the same dead end SB-275 just removed for the `general`
branch.

**The API already carries what is missing**, checked rather than assumed. `guide.service.ts:74`:

```ts
if (side?.ambiguous) return { ...NO_ANSWER, answer: ReaderAnswer.needsReview, needs: side.needs, reason: side.ambiguous }
```

`needs` travels with the ambiguity. `Guide.tsx` simply never reads it on this path.

## What changes

`Guide.tsx` computes the need two lines *below* the `needsReview` return:

```ts
const need = answer?.needs[0]
const asks = need ? detailWords[need] : undefined
```

Those two lines move **above** the `needsReview` branch and both branches use them. Hoisting rather
than duplicating: `detailWords` is already in scope, and a second copy of the same lookup is the kind
of parallel path that drifts apart later. The branch then passes `asks` and `onAsk`, because a question
with no way to answer it is the defect this card exists to remove.

`RuleAnswer` shows the detail and a Tell us **under** the warning, inside the same `InfoPanel`, so the
ambiguity and the way out read as one thing rather than two stacked panels.

## The wording is new, and the general branch's cannot be borrowed

The `general` branch says "{asks} decides the answer" or "{asks} can change this". Neither is true
here. Two rules already apply, so the detail does not decide *whether* there is an answer.

**But "settles which applies" overstates it, and the check was right to say so.** `needs` means a
detail *could* break the ambiguity, not that the first one will: the resolver can still answer
`needsReview` after the reader gives it. Promising a resolution the product cannot guarantee is the
same class of false claim this board keeps filing cards about.

So the wording is "{asks} could help settle which rule applies", with "Tell us and we'll check again"
under it. New English messages, and therefore new `fa.po` entries, which is the obligation SB-272's
check held me to: a notice left untranslated makes the Persian pass meaningless.

## How it is checked

`RuleAnswer.stories.tsx` already has `NeedsReview` at line 107, asserting only the warning. Its args
gain `asks`, and `AsksFirst` is the precedent for the rest: a `userEvent.click` on Tell us followed by
`expect(args.onAsk).toHaveBeenCalled()`.

**That component story is not enough, and on its own it would have been a false green.** It proves
`RuleAnswer` *accepts* `asks`; it cannot prove `Guide.tsx` *passes* `answer.needs[0]`. Delete the
pass-through and the component story stays green, because its args are handed to it directly. So there
is a second story, at the Guide level, whose answers handler returns `needsReview` with
`needs: ['residenceRegion']`, asserting the rendered detail and the Tell us control. That is the same
shape as SB-394, which this board already carries: a branch nothing exercises, claimed as covered.

Watched failing by hand, each separately: the Guide pass-through removed, which the Guide story must
catch and the component story must not; and the button removed, which the component story catches.

Then `npm run test:storybook -w @skipbureau/web`, one project at a time, and the browser in `en-US` and
`fa-IR`, light and dark, since this adds something a reader reads.

## The step I was least sure of, answered

I thought a `needsReview` card carrying the rule for everyone's facts might be three claims in one, the
middle contradicting the first. **That was wrong, and the reason is worth keeping.** Those facts come
from the separate unpersonalised guide query and are labelled "The rule for everyone"; the personalised
`needsReview` response carries no facts at all. So they are a baseline the reader can still use, not a
claim that either competing rule is theirs. They stay, and changing that would be a product decision of
its own rather than part of this card.

## What else the check corrected

Hoisting `need` and `asks` is safe: a pure lookup, and the later `!general && !asks` render guard is
untouched by moving it earlier.

`RuleAnswer`'s own markdown is updated with the new state behaviour, and the existing rule stands that
an actionable Tell us requires `onAsk`, because a known detail is not always one the panel can take.
