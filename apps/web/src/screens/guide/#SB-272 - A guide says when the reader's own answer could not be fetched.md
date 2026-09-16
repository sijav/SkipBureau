# SB-272, A guide says when the reader's own answer could not be fetched

**Exit:** a Guide story whose `GuideAnswers` handler fails once shows the rule for everyone, a notice
that the reader's answer could not be loaded, and a retry that brings Hamburg's fee when the handler
answers; watched failing.

## What happens now

`Guide.tsx:65` takes only the data:

```ts
const [{ data: answers }] = useQuery({ query: GuideAnswersQuery, variables: { country, slug, locale, reader }, ... })
```

The error and the refetch are dropped. Line 152 builds `answerOf` from
`answers?.guide?.obligations ?? []`, so a failed request leaves that map empty, every obligation's
`answer` is `null`, and every rule falls through to `state="general"`.

So a reader who has already said Hamburg is shown the rule for everyone, silently, with nothing saying
anything failed and no sign that their own answer is missing. The guide's own query on the same screen
*is* handled, at line 75, which is what makes the gap easy to miss: one of the two queries on this
screen is handled and the other is not.

**What it does NOT do, checked rather than assumed.** An earlier draft of this plan said the reader is
asked where they live all over again. That is false. `RuleAnswer.tsx:91` gates the ask panel on
`{state === 'general' && asks && (`, and with no answer row `answer?.needs[0]` is undefined, so `asks`
is undefined and no ask panel renders. The bug is silence, not a repeated question, and the fix is a
notice rather than any change to what is asked.

## Where the notice goes, and three things it is not

**Not a fifth `RuleAnswer` state.** Its states, `answered`, `general`, `needsReview` and `noRule`, are
each a property of ONE rule. This failure is one request covering the whole guide, so a per-rule state
would be a category error and the notice would repeat once per rule on the page.

**Not `Unreachable`.** That is a whole screen, `Page` + `Reading` + an `h1`, and it replaces the page.
Here the guide loaded; only the reader's answer did not.

**Not `InfoPanel`.** Its eyebrow is fixed per kind by design, "so no caller can relabel one register as
another", and every kind is a content register: `officialInformation`, `practicalAdvice`, `warning`,
`scamWarning`, `legalUncertainty`, `coverageGap`. A failed request shown as "Warning" would tell the
reader the rule carries a warning, which is a false statement about the content.

So it is its own small presentational piece, placed inside the existing `SectionFrame` at
`Guide.tsx:263`, above `{ruleAnswers}`, where it reads once for the section it belongs to.

## What changes

- `apps/web/src/shared/<name>/`: the story first, then the component, then its markdown, with an
  `index.ts`, as every other folder in `shared` is built. One prop, `onRetry`.
- `apps/web/src/screens/guide/Guide.tsx`: take `error` and the refetch from the answers query, and
  render the notice when it errored.
- `apps/web/src/screens/guide/Guide.stories.tsx`: the story the exit names.

The retry mirrors the idiom already on this screen rather than inventing a second one:
`startTransition(() => refetch({ requestPolicy: 'network-only' }))`.

**Strings.** One new English lingui message for the notice. "Try again" is written as the same English
string the other screens use, so lingui gives it the same id and its Persian translation is already
there. Nothing is written in Persian here; that is the owner's rule.

## The question I asked, and its answer: no suppression

I had proposed suppressing the `asks` prompt for details the reader has already given, on the belief
that a failed request asks them again. The check answered that the premise is false and I verified it
at `RuleAnswer.tsx:91`, quoted above. **So nothing is suppressed.** It would fix nothing, and it could
hide a legitimate prompt in a future response shape where `needs` is populated alongside an error.

That is worth leaving in this file rather than deleting: the card's own description says a reader "is
shown an apparently complete answer", and it is easy to read that as the stronger claim. The rendered
state is the weaker one, and the notice is the whole fix.

## What the plan check said

**The retry works, and it gave me an assertion I had not planned.** This repository pins urql 5.0.4,
confirmed in the lockfile along with `@urql/core` 6.0.3. Its reexecute function runs even while the
query is paused, `network-only` is the documented retry form, and a successful result **clears
`error`** after a brief fetching state. So the notice disappears on its own, and the story must assert
that disappearance rather than only that Hamburg's fee arrives. Without it the story would pass on a
page still showing a failure notice beside a correct answer.

**One correction I am not taking.** It said the per-component Markdown requirement "is not borne out by
the existing `shared` tree". The tree says otherwise: 41 folders, 46 component markdown files, and only
`button` and `lazy-part` without one. `CLAUDE.md` requires it by name under SB-059, and the owner's
file outranks a reviewer's impression, so the notice gets its `.md`.

**One correction I am taking gladly.** The notice is new interface text and needs its Persian
translation in `fa.po`. Leaving it English would also make the planned Persian visual check
meaningless, since the thing under inspection would be the one untranslated string on screen.

## How it is checked

The story is the check the exit names, following the shape of the existing `Unreachable` story at
`Guide.stories.tsx:169`: a `GuideAnswers` handler that fails once and then returns nothing, so the next
matching handler answers. It asserts the rule for everyone and the notice, clicks "Try again", and
asserts Hamburg's €16 arrives, reusing the `RuleAnswers` story's DE/anmeldung fixture.

It asserts three things after the retry, not two: Hamburg's €16, and that the notice is gone.

**Its own counter, not `Unreachable`'s.** That story keeps a module level `let asked = 0` at
`Guide.stories.tsx:45`, documented as "how many times Unreachable's guide has been asked for" and reset
in its own `beforeEach`. It is scoped to one story by convention rather than by construction, so a
second story mutating it would couple the two runs and produce a pass or a failure that has nothing to
do with this code. This story declares its own.

The handler can safely fall through: `handlers.ts:187` answers `GuideAnswers`, and it keys its reply on
the reader, returning `answered` with the fee only when `residenceRegions` includes `DE-HH` and
`needsDetail` with no facts otherwise. So Hamburg's €16 cannot appear unless the retry actually carried
the reader's region, and the assertion cannot pass by accident.

Run with `npm run test:storybook -w @skipbureau/web`, which drives `scripts/story-tests.ts` and runs the
four matrix projects one at a time. That matters on this machine: four projects racing to write one
pre-bundle trip EPERM and leave the deps cache short, after which browser runs hang or fail on
expect-type, and the failure looks like a broken story rather than a broken cache.

Watched failing by hand, both halves: with the notice removed the story must fail on the notice, and
with the retry not refetching it must fail on the fee.

Then the browser, because this is a UI change: `en-US` and `fa-IR`, light and dark. A computed style is
not proof.

## The step I am least sure of

Whether a new shared component is right for two lines and a button, or whether this belongs inline in
the screen. The convention here is that pages hold no styling and every folder in `shared` carries a
story and a markdown file, which argues for the component. Against it: there is exactly one caller, and
a component invented for a single use is the ceremony this working agreement warns about. I lean to the
component because the rule about pages is explicit, but I would take the opposite answer.
