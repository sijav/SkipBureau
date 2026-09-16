# SB-400, seven dev e2e tests fail against this app, and nothing was running them

**Exit:** `npm run test:e2e -w @skipbureau/web` passes every dev project test
against this app, and each of the seven has either a corrected expectation or a
recorded reason the app changed.

## How seven broken tests stayed invisible

Two blindfolds at once, and both are now on the board:

- **CI has never run the e2e suite** (SB-401). `ci.yml` has three jobs, and its
  only Playwright line installs Chromium system libraries. Nothing runs
  `npm run test:e2e`.
- **Locally the `dev` project was testing another product** (SB-397). It pointed
  at Vite's default 5173 with `reuseExistingServer`, and a KarNama server had
  held that port since 2026-09-14. Every `dev` test asserted against KarNama's
  login screen.

Fixing the port is what made these visible. The app is healthy: the page
snapshot from the failing run is SkipBureau's own home page with Turkey
resolved, and the whole `pages` project is green.

## This was already known, and half fixed

`e2e/#SB-077 - Prove a deep link on the real deployment, not on a local mimic.md`,
written **2026-09-11**, says:

> `pages.spec.ts` opens `en/tr/g/get-a-sim-card`, an address the app stopped
> using on 2026-09-10, and waits for a `resolved-country` test id that no screen
> renders any more.

SB-077 repaired `pages.spec.ts` and left `routing.spec.ts` and
`countries.spec.ts` carrying the same two defects. So this is not rot that crept
in unseen: it was named five days ago and the sibling specs were not brought
along.

## The seven, each with a cause read from the code

| test | cause, verified |
|---|---|
| `routing.spec.ts:3` | `resolved-country` exists nowhere in `src`, **and** the app redirects to `/en/TR` where the test expects `/en/tr` |
| `routing.spec.ts:9` | `resolved-locale` and `resolved-country` gone, **and** the slug `get-a-sim-card` does not exist; the seed writes `sim-card` |
| `routing.spec.ts:18` | `resolved-locale` gone |
| `routing.spec.ts:25` | expects `/en/tr/g/get-a-sim-card`, the pre-canonical form and the wrong slug |
| `countries.spec.ts:56` | `resolved-country` gone, and `country-name` is rendered by no screen |
| `countries.spec.ts:92` | `country-name` is rendered by no screen |
| `responsive.spec.ts:48` | asserts the guide's 720 reading measure on the **home** page |

Each claim above was checked:

- a repo-wide search finds `resolved-country` and `resolved-locale` only in these
  two spec files and in SB-077's plan. No component renders either;
- `addressCountry.ts` line 95: "One page, one address: `/en/tr/t/x` and
  `/EN/TR/tasks/x` are both `/en/TR/tasks/x`". Lowercase locale, **uppercase**
  country, long segments;
- `prisma/sample-sim-card.ts` line 8 is `slug: 'sim-card'`;
- the only imports of `src/shared/country-name` are `CountryRoute.stories.tsx`
  and the component's own stories. **SB-402** is filed for that orphan;
- `DESIGN.md` line 1087 states the 720 measure inside the **Guide Detail** spec,
  immediately above that page's section list. The Home section, line 965,
  states an ask field of 760x64, already wider than 720, and no cap on the
  hero heading.

## What changes, and the principle

**The app is not changed to suit its tests.** Every fix brings an expectation to
what the product does, and where that is not possible the test is retargeted to
where the contract actually exists.

- **The canonical address.** `routing.spec.ts` asserts `/en/TR/...` with the long
  segments, and keeps its case that a shared `/en/tr/g/...` link still arrives
  there, which is the behaviour `addressCountry.ts` documents and SB-077 named.
- **The missing test ids.** The assertions move to what a reader can see. The
  country home names its country in the hero heading, so "this country resolved"
  is asserted on the rendered page rather than on an id nothing emits.
- **The slug.** `get-a-sim-card` becomes `sim-card`.
- **The reading measure.** `responsive.spec.ts:48` moves to a guide page, where
  DESIGN.md specifies 720. Its second half, that the heading gives way on a
  phone, keeps its intent.
- **Nothing new is added.** No fresh coverage, no new gates. This card makes
  existing tests true, and each change carries the reason in a comment.

## Files

- `apps/web/e2e/routing.spec.ts`
- `apps/web/e2e/countries.spec.ts`
- `apps/web/e2e/responsive.spec.ts`
- this plan

## How it is proved

The whole suite, with KarNama still holding 5173 so the original condition is
present: `npm run test:e2e -w @skipbureau/web` green, both projects, 48 tests.
That also unblocks SB-397, whose exit needs the suite to pass, and SB-401, which
cannot turn CI's e2e on while main would go red.

## What the plan check changed

Run 2026-09-16. It accepted reader-visible assertions over restored ids, and
accepted moving the 720 measure to a guide, confirming that Home has a
1280-wide content column and promises nothing about its heading, so a 1280 `h1`
there is not a demonstrated defect. Then it corrected three things, and two of
them were errors I was one step from making.

1. **Keep `routing.spec.ts:25`. Do not delete it.** I had it down as duplicated
   by `pages.spec.ts`'s "an address shared before the markers were spelled out
   still arrives". It is not: that one covers the retired **`g` segment**, while
   this one uniquely covers the retired **`en-US` reader segment**. Deleting it
   would have left the legacy locale form covered only by unit paths tests and
   not by a running app. It is corrected instead, to `/en-US/tr/g/sim-card`
   arriving at `/en/TR/guides/sim-card`.
2. **`routing.spec.ts:18` gains `html[lang="en-US"]`.** Dropping its
   `resolved-locale` assertion leaves only `dir="ltr"`, which is not the same
   claim. I caught that the Persian sibling was already covered by `lang` and
   `dir` and did not check the English one.
3. **An eighth defect, in a list I never read.** `responsive.spec.ts`'s `ROUTES`
   includes `/en/tr/g/get-a-sim-card`, which canonicalises to a guide that does
   not exist, so its "guide" overflow case has been exercising **Not Found**
   while passing. It becomes `/en/TR/guides/sim-card`. This is not new coverage;
   it makes an existing route test the page it claims to test.

It also noted the prerequisite this card already depends on: the full suite is
proof only because SB-397 both moved the port and set
`reuseExistingServer: false`. Without the second, KarNama on 5173 could still
make the result meaningless.

## What the first run found, and what it cost the plan above

The suite went from seven failures to three. All three are recorded here because
two of them contradict what this plan said before it was run.

1. **The routing expectation was wrong, and so was the check's correction.** Both
   assumed `en-US` is a lingui tag to be shortened to `en`. It is not:
   `paths.test.ts` asserts `readerFromSegment('en-US')` is
   `{ locale: 'en-US', origin: 'us' }`, so the second part of the reader segment
   is the reader's **origin country**, and `canonicalPath` puts it back exactly
   as it read it. There is no locale-shortening step in that function at all;
   `MOVED = { t: 'tasks', g: 'guides' }` is the whole marker rule. So the app was
   right both times, and the test now expects `/en-US/TR/guides/sim-card`. Its
   name changed too: it was describing a rule this code does not have.
2. **The reading measure was still on Home.** This plan said to move it to a
   guide. The `ROUTES` list beside it was fixed and the test itself was not,
   which is an omission rather than a misjudgement. `Guide.tsx` puts the `h1`
   inside a Stack with `maxWidth: readingWidth`, checked rather than assumed, so
   the assertion now runs where the 720 cap is real.
3. **The cache failure is a product defect, not a stale expectation, and it is
   SB-403.** With `country-name` replaced by the hero heading, the test finally
   reaches its real question and answers it: after the Portugal row is deleted,
   navigating back in the same document still renders "What do you need to do in
   Portugal?". `addressCountry.ts` runs `CountryQuery` with
   `requestPolicy: 'cache-first'` and nothing invalidates a country that has
   gone. The assertion's own comment had already named the risk, "the guard being
   wrong in exactly the case it exists for". **It is left failing on purpose.**
   Weakening it would turn a live defect into a green tick.

So this card cannot make the suite green by itself. Its exit allows "a recorded
reason the app changed" per test, and SB-403 is that reason for the cache case,
but SB-397 and SB-401 both wait on a suite that actually passes, so they stay
blocked until SB-403 lands. That is the owner's call to make rather than mine to
paper over.

## The doubt that started this, and how it resolved

Whether replacing a missing test id with a visible-text assertion weakens the
test. Text is lingui-translated and can be reworded; an id is stable. The answer
is that the id was not stable, it was **absent**, and restoring it would mean
adding markup to the product whose only purpose is to be asserted on. Where the
fact is reader-visible, assert what the reader receives. Where it is not, as
with a page's language, assert the document's own `lang` and `dir` rather than
inventing a seam, and never assert a Persian string.
