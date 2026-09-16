# SB-260, Give the researched residence permit areas a description their hubs can carry

**Exit:** on the live site `/en/TR/tasks/get-a-residence-permit/short-term-residence-permit` and
`/en/DE/tasks/get-a-residence-permit/residence-permit` each carry a meta description that is a
sentence of its agreed document, and `researched-guides.e2e.spec.ts` asserts each area's description.

## One line writes the null, and everything else on the path is already there

`researched-guides.ts:1157`, inside `writeGuide`, writes an area's text for both locales:

```ts
const written = { title, description: null, startReason: null, askPrompt: null }
```

The `null` is explicit, for English and Persian alike. Nothing else is missing:

- `CategoryText.description` is `String?` in the schema;
- `CategoryView` already declares `description` (`guide.model.ts:221`);
- `guide.service.ts:391` already passes `text.description` into that view;
- `TaskHub.tsx:71` already renders `area.description`;
- `prerender.ts:219` already emits `<meta name="description">` from a page's description.

So the whole chain exists and one assignment empties it. That is why this card is small, and it is
worth saying, because the card reads like it might need a new field.

## No sentence is written, which is the card's own instruction

The agreed documents have no sentence written *for an area*, so none is invented. The candidate is the
guide's own `en.description`, which is already an agreed sentence and already served as the guide's
description. It sits in the same function: `researched.guide.en` is spread into the guide's text
twenty lines below.

**English only.** Persian keeps `null`: there is no agreed Persian sentence, and `writeGuide` already
deletes every non-English guide text at line 1180, so a Persian area description would be the only
translated researched prose in the loader and it would have no source.

**Only where the area has none**, as the card says. Today that is always, since the loader writes
`null`, but the condition is written rather than assumed so that an area which later states its own
description is not overwritten by its guide's.

## What changes

`src/guide/researched-guides.ts`: the English branch of that loop takes the guide's description.

`test/researched-guides.e2e.spec.ts`: the `categories` query already selects `slug` and `taskSlug`;
it gains `description`, and the assertion beside it requires each researched area's description to be
its guide's own. That is the exit's second half.

Nothing else. No schema change, no web change, no new string, and no sample content: `sample-content.ts:345`
records that the researched loader owns `register-your-address`'s row outright, so there is no second
writer to race.

## Which page this fixes, answered

Both addresses in the exit are **category-hub** routes, not task hubs. `CategoryHub` receives
`CategoryText.description` and hands it to `categoryHubHead`, which emits the page's meta description.
So the one line reaches both pages.

The task hub is a different thing: its own meta description comes from its `intro`, and an area's
description only affects the cards it lists. **So the card's description points at the wrong page**,
and the exit points at the right one. I am building to the exit.

## Dropped: "only where the area has none"

The check called that out and it is right. `ResearchedGuide.area` has no description of its own to
preserve, and the loader owns and overwrites these texts outright, so the condition can never fire. It
would only invent a precedence rule for a writer that does not exist, which is the speculative
machinery this repository says not to add. The English assignment is plain; Persian stays `null`.

If an area ever gains a description of its own, that is when a source field and a precedence rule are
written, by the card that gives it one.

## One thing softened

A meta description is not a guarantee of the snippet Google shows: it may use page content instead. It
is still the right mechanism and Google asks for accurate, page-specific descriptions, which is why
this card is worth doing. The card's "a search result the engine writes itself" is the risk, not a
certainty.

## How it is checked

`researched-guides.e2e.spec.ts` whole, plus `research-rules.e2e.spec.ts` because the same loader runs
there, and lint and the type checker. SB-260 is a child of SB-258, so that is its gate. Then the live
half: the site is rebuilt from the deployed API by Pages, so after the API carries the description I
read the two addresses and check the tag, remembering that a green Pages run proves nothing about
content until the API has it.
