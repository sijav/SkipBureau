# SB-291, a guide written only in English has one title on its Persian page, naming the country once

**Exit:** the fa file of a guide written only in English carries a title and
og:title that name the country once and add no Persian words to the English
title, and the en file's are unchanged.

## What is wrong, read from the live site today

Every researched guide is written in English only, so **every one of the ten**
shows a mixed-language title on its Persian page. Read from the deployed files
after today's Pages build, not from the card:

| page | en title | fa title |
|---|---|---|
| `TR/short-term-residence-permit` | Getting a short-term residence permit in Turkey | the same, plus the Persian for "in Turkey" |
| `TR/register-your-address` | Telling Turkey where you live | the same, plus the Persian for "in Turkey" |
| `TR/work-permit` | Working in Turkey | the same, plus the Persian for "in Turkey" |
| `DE/business-registration` | Registering a business in Germany | the same, plus the Persian for "in Germany" |

and the same for the other six. `og:title` carries it too, so it is what a
Persian search result and every link preview show. The Persian is described
rather than quoted here because this machine mangles non-ASCII through the
shell, and this file is read back that way.

## The mechanism

`title.ts` line 17:

```ts
export const pageName = (i18n, title, place) => (title.includes(place) ? title : i18n._(msg`${title} in ${place}`))
```

`place` is the country's name **in the page's locale**, from
`useCountry().name`, whose own comment says "Its name in the reader's language".
On a Persian page the title is English and the place name is Persian, so
`title.includes(place)` can never be true, and the Persian catalog's template
appends its own words.

The guard was written for a title and a place in the same language. Put
plainly: **the suffix is a localized template, and it is being applied to text
written in another language.** That is the defect, and it is one line, reached
from both call sites: `PageHead.tsx` lines 23 and 37, and `prerender.ts` lines
71 and 76. One fix covers the running app and the prerendered file, which
matters because those two must not disagree.

## The signal, and that it is really there

`PageLanguagesProps.shown` is "The language its content is in, where that is not
the one asked for", and `screens/guide/head.ts` line 26 already passes
`shown: guide.locale`. Asked of the deployed API today:

- `tr/short-term-residence-permit` in `fa-IR` answers `locale=en-US`,
  `translationMissing=true`, `locales=["en-US"]`;
- the same guide in `en-US` answers `locale=en-US`.

So `shown` is `en-US` on both pages, and the test cannot be "is `shown` set". It
has to be **`shown` compared with the page's locale**: different on the Persian
page, equal on the English one. That is also what keeps the en files unchanged,
which the exit condition demands.

`head.ts` line 26 is the only place in the app that sets `shown`, so the home
page and both hubs, whose titles are lingui messages in the page's own language,
are untouched.

### Why `shown` and not `canonicalLocale`

The plan check settled this with the case I could not construct. Both are
`en-US` on today's Persian page, so nothing separates them in the current
product. They differ when `languages` claims Persian is available but the API
falls back to English: `canonicalLocale` stays Persian while the title is
English, so a `canonicalLocale` test would apply the Persian suffix to English
text, which is this very bug by another route. `shown` is the language of the
content actually returned. It also behaves correctly for a future genuinely
bilingual guide: Persian content on a Persian page still gets the normal suffix.

## Why not "use the country name in the content's language"

That would read better still. It is rejected because the name is not available:

- `prerender.ts`'s `pagesIn` calls `CountriesQuery` once **per locale**, so
  during the Persian pass only Persian names exist in that run;
- the client holds exactly one name, `useCountry().name`, in the reader's
  language.

Getting the English name would mean another query per guide page in the browser,
for a suffix. Not worth it, and not this card.

## The approach

When the content's language is not the page's language, **return the title
alone**. No localized template is applied to foreign text. Preserve today's
behaviour exactly when `shown` is absent or equal to the page's locale.

The country is still named once, because every English guide title already
names its country: all ten were read from the live site and each contains
"Turkey" or "Germany". That is content convention rather than a guarantee, so
it is recorded as a risk below rather than claimed as a property.

## Files

- `apps/web/src/shared/page-head/title.ts`, where the decision is made.
- `apps/web/src/shared/page-head/sharing.ts`, so `og:title` decides the same
  way; `pageSharing` already receives `head` and `locale`, so it has both facts.
- `apps/web/src/shared/page-head/PageHead.tsx`, which calls `documentTitle`.
- `apps/web/src/core/prerender/prerender.ts`, the other caller, so the file a
  crawler reads matches the page a reader gets.
- `apps/web/src/shared/page-head/title.test.ts`, new: nothing tests `pageName`
  or `documentTitle` today.
- `apps/web/e2e/pages.spec.ts`, the test that actually proves the exit.
- `PageHead.md`, which should say what a page is called when its content is in
  another language.

## The test that proves the exit, which an earlier draft of this plan did not have

The plan check was right that a unit test proves the decision but not the
artefact: it cannot show that `PageHead`, `pageSharing` and the prerender all
forward the new input. The exit condition is about the generated **file**.

`apps/web/e2e/pages.spec.ts` already holds exactly the right case. Line 57, "a
guide opens cold, right to left", fetches `fa/TR/guides/short-term-residence-permit`,
which is the researched guide written in English only, reads the file's source,
and already asserts that its canonical and `og:locale` are the English page's.
It asserts nothing about the title, and that gap is where this defect lives.

So the assertion is added there, reusing the constants the file already defines
for the left-to-right test:

```ts
const GUIDE = 'Getting a short-term residence permit in Turkey'
const TITLE = `${GUIDE} · Skipbureau`
```

The Persian file must carry the same `>${TITLE}</title>` and
`og:title content="${GUIDE}"` as the English one. Three things make this the
right test rather than a convenient one:

- it is the exit condition stated directly: the country named once, with no
  Persian added to the English title;
- it asserts English constants, so it tests the **absence** of added Persian
  rather than any Persian string. The owner, 2026-09-10: "unless you want to
  test lingui it make zero sense to test Farsi". Nothing here tests a
  translation;
- it fails today, against the mixed title the live site serves, so it is watched
  failing before the fix without anything being planted.

The English assertions at lines 29 and 38 stay exactly as they are and are the
unchanged branch. `title.test.ts` is still added for the pure decision, which
the e2e cannot state as cheaply.

This card has no parent, so it closes on the **full suite**.

## What the plan check changed

Run 2026-09-16, accepted in full:

1. **`shown`, not `canonicalLocale`**, with the separating case recorded above.
2. **The e2e assertion**, because the earlier draft did not prove its exit.
3. **Leave `title.includes(place)` alone.** It is a heuristic and can fail for
   an inflected country name, where a title naming the country would not match
   its bare form and would take the suffix anyway. There is no evidence it fails
   in the current English and Persian product, and changing it would risk the
   English output the exit requires unchanged. Recorded as a limitation to
   revisit when a language that inflects place names arrives.

It also judged the canonical question out of scope: a guide with
`locales=["en-US"]` gives `available.length < 2`, so the Persian page's canonical
is the English path and it emits no alternates. That deliberately treats the
Persian URL as a fallback duplicate whose searchable representative is English,
which matches Google's guidance on canonicalizing to the best substitute
language. So this correction is chiefly about the browser tab and link previews,
and whether that fallback URL should exist at all is a separate product
decision.

## The residual risk, recorded

A future guide whose English title does not name its country would, on its
Persian page, name the country zero times, where the exit condition wants once.
Every guide that exists today names it, measured. If that stops being true, the
answer is the content's-language country name above, which is a bigger change
than this card.
