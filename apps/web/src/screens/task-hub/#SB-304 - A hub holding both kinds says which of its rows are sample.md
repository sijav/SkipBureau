# SB-304, a hub holding both kinds says which of its rows are sample

**Exit:** a hub holding both a researched and a sample row tells the reader only
that some of the page is sample, proven by a story over a mixed hub, and the
SB-302 plan says what TaskHub actually shows.

## What was there before this card, and what the card leaves

Read rather than assumed, because the card describes three screens and is wrong
about none of them but precise about only one.

- **`TaskHub.tsx` lines 192 to 201 showed the warning or nothing.** Past tense on
  purpose: that is the block this card rewords, so those same lines now carry the
  scoped sentence and the quotation below is what they said before. It was
  `{hub.sample && (...)}` with no other branch, and the wording was a blanket
  claim over the whole page: "Descriptions on this page are sample content for
  design review. They deliberately avoid fees, thresholds and eligibility rules,
  which are determined during guided setup against verified sources."
- **`CategoryHub.tsx` lines 191 to 200 are one or the other**, a ternary on
  `hub?.sample`, warning against "Every guide shows when it was last verified and
  links to the official source".
- **`Home.tsx` lines 100 to 110 are one or the other too**, on `sampleQuestions`,
  the same pair.
- So the SB-302 plan's "One of the two, never both, never neither" is **true of
  Home and CategoryHub and false of TaskHub alone**. The sentence is not wrong in
  general, it is wrong about one screen of three, and the correction has to say
  which rather than strike the line.
- **`sample` is one boolean on the view.** The TaskHub query asks
  `areas { slug kind title description }` and `guides { slug title verifiedAt }`.
  A guide carries `verifiedAt`; an area carries nothing about where it came from,
  and neither row carries a researched flag.

## The approach

The card offers two routes and this takes the wording one.

Per row provenance means a new field on the area and guide types, a resolver that
knows which rows are researched, regenerated client types, and a mark rendered on
each row. That is an API change and another card's size. It would also still need
this same wording fix, because a blanket sentence under marked rows contradicts
the marks. The exit asks only that the reader be told **some** of the page is
sample, so the wording is not a cheaper substitute for the real fix, it is the
part the exit names.

**The notice becomes scoped**, from a claim about the page to a claim about part
of it:

> Some descriptions on this page are sample content for design review. Those
> deliberately avoid fees, thresholds and eligibility rules, which are determined
> during guided setup against verified sources.

"Those" rather than "They", because once the first sentence says "some", "They"
has two possible referents and the second sentence has to attach to the sample
ones or it makes the same overclaim again in a quieter way.

**No assurance line is added to TaskHub.** The card records its absence as a fact
the SB-302 plan should state, and the exit does not ask for one. Adding it would
be inventing scope, and the owner's rule is that a gate or an addition nobody
asked for does not get invented here.

## What the flag actually means, checked at the source

The plan check asserted that `sample` already means "at least one listed area or
guide is sample". That is worth verifying rather than taking, because the whole
wording argument rests on it, and it holds. `guide.service.ts` lines 160 and 161:

```ts
sample: task.categories.some(
  (category) => sampleArea(countryCode, category.slug) || category.guides.some((guide) => sampleGuide(countryCode, guide.slug)),
),
```

`.some(...)`, over areas and their guides, with `sampleArea` and `sampleGuide` at
lines 63 and 64 being `!RESEARCHED_AREA_KEYS.has(...)` and
`!RESEARCHED_GUIDE_KEYS.has(...)`. Line 210 is the same shape for a category hub.

So the flag is already an existential, and "Some descriptions on this page are
sample content" is precisely what it licenses. The current wording is not merely
clumsy on a mixed page, it says something the flag never claimed.

## Files

- `apps/web/src/screens/task-hub/TaskHub.tsx`, the notice.
- `apps/web/src/screens/task-hub/TaskHub.stories.tsx`, the mixed story.
- `apps/api/test/hub-sample.e2e.spec.ts`, the assertion its own test name promises
  and does not make.
- `apps/web/src/locales/{en,fa,tr,de}.po`, all four, because the English source
  **is** the message id. The compiled `*.mjs` beside them are ignored
  (`.gitignore` line 27) and are not committed.
- `apps/api/src/guide/#SB-302 - A hub no longer tells a reader that researched content is sample material.md`,
  the corrected sentence.
- this plan.

## How it meets the exit condition

The plan check corrected the proof, and the correction is taken. A `sample: true`
mock on its own proves only that the wording branch renders; it proves nothing
about the hub holding both kinds. The smallest honest version joins two seams
that already exist, so no field is added to a row purely to be tested.

**1. The API says the mixed hub is real.** `hub-sample.e2e.spec.ts` line 56 is
named "an area of researched guides is not sample, one the research does not name
is, and a goal holding both is", and its hub assertion is only
`toContain('first-week')`, the sample row. It never checks that
`register-your-address`, the researched one, is in the returned hub at all, so the
last clause of its own name is unproven. It gains that assertion, and the hub then
demonstrably holds both.

**2. The story shows what a reader is told over that same pair.** `TaskHub.Mixed`
mocks a `getting-settled` hub carrying both `first-week` and
`register-your-address` with `sample: true`, and asserts the scoped sentence is
shown and the blanket one is not. `handlers.ts` line 89 already special cases
`getting-settled` to a hub whose areas are just `first-week`, so the story
overrides that pair rather than inventing rows.

`Researched` and `SampleContent` stay untouched, so an all researched page still
asserts it says nothing and an all sample page still asserts it says something.

**3. The three other languages are not left behind.** Lingui 6.6.0 matches catalog
entries by exact id only: no fuzzy matching, no previous-msgid carry forward. So
rewording orphans the existing fa, tr and de translations, and an English fix that
silently falls back to English in three offered locales would be a worse defect
than the overclaim being fixed. `npm run i18n:extract` then a translation of the
new entry in each of the three, then `i18n:compile`, and zero missing is part of
the proof rather than a follow up.

An explicit message id was considered and rejected on the check's reasoning: it
would invent a convention for one message purely to preserve a translation, when
every other message here is keyed on its source text.

**4. The SB-302 plan gains its correction next to the sentence that was wrong**
rather than in place of it, so the record of what was believed survives. The
correction is specific: "one of the two, never both, never neither" holds for
`Home` and `CategoryHub`, and `TaskHub` has no assurance branch at all, so a
researched task hub shows neither line.

## The step I am least sure of, now

**Whether the reworded English reads as well as the sentence it replaces.**
"Those deliberately avoid fees, thresholds and eligibility rules" is carrying the
referent that "They" used to carry, and once the first sentence says "some" the
second has to attach to the sample descriptions rather than to all of them. If
the wording reads awkwardly to the owner it is a wording call, not a mechanism,
and the design is unaffected: the branch, the story and the catalogs are the same
either way.
