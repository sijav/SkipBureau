# SB-414, every country we cover brings its own languages

**Exit:** the **interface** exists in the locales the owner named, appears in the
language control, and renders with the correct direction and native date
formatting; a locale is added by its catalog, the locale registry, and localized
country-name records, with nothing else in the app needing to change; and guide
content that is not in the reader's language still says so.

The owner, 2026-09-17:

> "yeah I want more languages all the languages that we have country for! right
> now it's only two, every time we add a country we need to add it's
> language/languages/locales!"

> "you should start translating those based on the context and everything
> correctly ... some of them which are short or some words needs through context
> then you can look up for it"

## Two plan checks, and the four things I got wrong

This plan was rejected twice. Every correction below was verified on this machine
rather than taken on trust, and every one of them was mine to make.

1. **Turkish plurals.** I claimed Turkish has a single CLDR category.
   `new Intl.PluralRules('tr').select(1)` returns **`one`**, categories
   `one/other`, exactly like German and English. All 26 ICU plural messages keep
   both forms in Turkish, worded identically where Turkish does not distinguish
   them. As planned, 26 messages would have been wrong on every page showing a
   count. Installed lingui is **6.6.0**, not the 5 I asserted.

   Worth carrying: **Persian selects `one` for zero** where the other three
   select `other`.

2. **The exit promised something false.** It said a locale could be added by its
   catalog and the registry alone, while the same plan required `bootstrap.ts`
   country-name rows. Both cannot be true. The exit above now names the
   localized country-name records as part of adding a locale.

3. **Four existing assertions break, not two.** I wrote that the i18n tests
   contained no such assertion. They do, and my grep missed them because its
   quoting failed to match, which is a trap recorded in this project's notes and
   the second time it has bitten tonight:

   | file | assertion |
   |---|---|
   | `paths.test.ts:53` | `localeFromSegment('de')` is `null` |
   | `paths.test.ts:67` | `readerFromSegment('de')` is `null`, "a language we do not have" |
   | `i18n.test.ts:39` | `nearestLocale(['de-DE'])` is `defaultLocale` |
   | `i18n.test.ts:50` | `isLocale('de-DE')` is `false` |

   Every other `de` in `paths.test.ts` is Germany the **country** and is
   untouched.

4. **Dates, and they are the owner's call rather than mine.** Measured with the
   app's own `SHAPES.day`: `en-GB` gives `24 Aug 2026`, `tr-TR` gives
   `24 Ağu 2026`, `de-DE` gives `24. Aug. 2026`. The design draws the English
   form. I first recorded this as something the owner needed to know; the check
   was right that choosing against a design literal is theirs to decide.

   **Asked and approved, 2026-09-17: follow each language.** So German shows
   `24. Aug. 2026`, Turkish `24 Ağu 2026`, and English and Persian are untouched.
   `i18n.test.ts:59` already pins the English form exactly, so the new tests copy
   a precedent rather than invent one.

## Why this card is the interface only

The content layer is structurally two-locale, hardcoded as `en-US`/`fa-IR` pairs
at every insertion point: `bootstrap.ts:39-42` country names, `seed.ts:245-246`
region names, `:274-275` obligations, `:328-329` rule notes.

CLAUDE.md requires every fact in guide content to be researched against official
sources with the date it was checked. Machine translating a researched German
rule into Turkish would produce an unsourced claim wearing the authority of a
verified one, which is the precise failure that rule exists to prevent. So
content is **researched** per locale, not translated, and that is **SB-418**.

**The one exception**, because it is four rows and appears in nearly every
heading: country names get `tr-TR` and `de-DE` records, so a Turkish page says
Türkiye rather than Turkey.

## The locales

| field | `tr-TR` | `de-DE` |
|---|---|---|
| `label` | `Türkçe` | `Deutsch` |
| `dir` | `ltr` | `ltr` |
| `catalog` | `tr` | `de` |
| `path` | `tr` | `de` |
| `dates` / `months` | `tr-TR` | `de-DE` |

## The lingui locale list, derived rather than repeated

`lingui.config.ts` holds its own `['en', 'fa']`. It is derived from the registry
instead, with two details from the check:

- **import `locales.ts` relatively**, not through the `src/...` alias: lingui 6.6
  loads its TypeScript config through Jiti, which does not resolve this app's
  alias;
- **derive from each entry's `catalog`, de-duplicated**, not from the locale tag,
  so a future `de-AT` shares `de` rather than demanding a second catalog.

If the relative import drags in `src/core/country` through `locales.ts` and Jiti
cannot follow it, the static list stays and the exit says so. That is the one
step where the plan may have to give way to what the tool does.

## Order of work

Turkish end to end first: registry, lingui list, extract, translate 335, compile,
look at it in a browser. Then German. 670 strings in one pass, reviewed by
nobody, is how a systematic error reaches every string at once.

Vocabulary comes from the researched content already in this repository, which is
sourced and dated: *Anmeldung*, *Gewerbeanmeldung*, *Fragebogen zur steuerlichen
Erfassung*. "Address registration" is *Anmeldung*, never a literal rendering.

## Files

- `apps/web/src/core/i18n/locales.ts`, two entries.
- `apps/web/lingui.config.ts`, the derived locale list.
- `apps/web/src/locales/tr.po`, `de.po`.
- `apps/web/src/core/i18n/i18n.test.ts`, two assertions.
- `apps/web/src/core/router/paths.test.ts`, two assertions.
- `apps/web/e2e/routing.spec.ts`, the root-redirect locale, below.
- `apps/api/src/bootstrap.ts`, four country-name rows.
- this plan.

## How it is proved

1. `i18n:extract` reports `tr` and `de` at 335 with **0 missing**, then
   `i18n:compile` succeeds.
2. Dates assert exactly: `24 Ağu 2026` and `24. Aug. 2026`, beside the existing
   English `24 Aug 2026`, so the approved departure is pinned.
3. A count renders correctly in Turkish for 1 and for several.
4. `paths.test.ts` asserts `tr` and `de` resolve, and that `/tr-TR/` parses as
   Turkish with a Turkish origin.
5. The language control offers four locales, looked at in a browser in light and
   dark, `html lang` and `dir` correct on each.
6. Full suite green.

## The root-redirect test, which is unstable today

`routing.spec.ts` asserts the root lands on `/(en|fa)/TR`. `Desktop Chrome` sets
no locale, so **Playwright falls back to the host system's locale**: that test has
never been an English guarantee, it has been passing because this machine and the
runners happen to be English. With four negotiable locales a German-configured
machine would fail it for a reason unrelated to what it tests.

So that test sets `locale: 'en-US'` explicitly and asserts `/en/TR`, and
negotiation for German and Turkish is covered by unit tests where it belongs.
This is a pre-existing latent flake that this card makes reachable rather than
one it introduces.

## The step I am least sure of

**Whether Jiti can load a config that imports `locales.ts`**, since that file
imports `src/core/country` in turn. If it cannot, the derived list is not
available and `lingui.config.ts` keeps a static array that must be edited
alongside the registry. The fallback is not harmful, it just makes "one place"
into two, and the exit is written to survive either outcome.

**Answered: Jiti loads it.** The fallback was not needed. Adding `de-DE` to
`locales.ts` alone made `de` appear in extraction, which is the exit's central
claim demonstrated rather than argued.

## What was built and what it proved, 2026-09-17

**Four locales, all complete:**

```
en (source)  335    -
de           335    0
fa           335    0
tr           335    0
```

670 strings written by hand, in four validated batches per language, each batch
checked against the catalog's exact message ids before a character was applied.
That check earned its place twice: it caught a deliberately planted decoy key in
Turkish batch 1, and a real failure in batch 4 where a source string uses a
straight apostrophe, `application's confirmation`, while its neighbours use curly
ones. Without it that string would have stayed silently untranslated in a catalog
reporting success.

**The statutory vocabulary came from this repository's own research**, not from a
dictionary and not from invention:

| label | Turkish | German |
|---|---|---|
| Residence permit charge | İkamet izni harcı | Gebühr für den Aufenthaltstitel |
| Card fee | Belge bedeli | Dokumentengebühr |
| Fees under Law 492 | 492 sayılı Harçlar Kanunu harçları | Gebühren nach Gesetz Nr. 492 |
| Deadline to send the tax questionnaire | Vergi formunu gönderme süresi | Frist für den Fragebogen zur steuerlichen Erfassung |
| Monthly contribution assessment ceiling | Aylık prime esas kazanç tavanı | Monatliche Beitragsbemessungsgrenze |

*Belge bedeli* is not a rendering of "card fee"; it is the term the research
records as `İkamet İzni Belge Bedeli 964,00 TL`. *Beitragsbemessungsgrenze*
likewise appears in the German research with its own figures.

**Two grammatical traps, both designed around rather than discovered later.**
Turkish suffixes follow vowel harmony, so `{name}'de` is right for Türkiye and
wrong for Almanya; those strings use `için`. German needs an article, "in
Deutschland" but "in **der** Türkei", so those use a colon construction:
`{name}: Was müssen Sie tun?`.

**The web gate, green:** tsc and lint clean, **96 unit tests** (up from 92, the
four new being Turkish and German locale and date assertions), 178 storybook
tests across four projects, build, and **50 e2e across both projects**.

**A risk the SB-401 plan check called unknowable, now measured.** Four locales
double the prerendered page count, and the `pages` web server has a 360 second
Playwright timeout. The e2e run finished in **1.4 minutes**. There is a wide
margin, and it is now a number rather than a worry.

**Four assertions changed, and one found stale.** `paths.test.ts` and
`i18n.test.ts` each used German as their example of an unsupported language; with
German shipped they would have asserted nothing, so the example moved to `ja-JP`
and positive assertions were added in their place. Separately the API's
`bootstrap.e2e.spec.ts` asserted `countryText.count() === 4`, a number from when
there were two locales. That is now the cross product of countries and shipped
locales, which is the property the product needs: a count alone would pass with
eight rows even if half named the wrong locale, or if one country had four names
and the other none.

## What this deliberately did NOT do

Guide content is untouched. `taskText` is still English and Persian only, and its
assertion still passes, so **the twelve goal titles on Home are English for a
Turkish or German reader**. That is the most visible edge of the interface and
content split, and it is SB-418, which must be researched per locale rather than
translated, because CLAUDE.md forbids machine translating a sourced legal fact.

Country names are the single exception, four rows in `bootstrap.ts`, because
Türkiye against Turkey appears in nearly every heading.
