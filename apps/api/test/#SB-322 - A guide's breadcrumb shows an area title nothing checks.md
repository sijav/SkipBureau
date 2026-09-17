# SB-322, a guide's breadcrumb shows an area title nothing checks

**Exit, as the card words it:** a German area whose stored title differs from its
entry's fails the researched guides spec, and the live read-back compares the
titles a breadcrumb shows.

This plan lives in `apps/api/test/` because the spec half is the larger change. It
also touches `apps/web/e2e/pages.spec.ts`.

## What is there, measured

- **The title reaches four places a reader or a crawler sees.**
  `guide.service.ts` line 48 is `categoryTitle: area.title`, straight off the
  area's text row. The web spends it at `Guide.tsx` line 91 and 97 ("Back to X"),
  line 202 (the breadcrumb trail), line 217 (on the page), and `head.ts` line 66,
  `{ name: guide.place?.categoryTitle ?? home, url: area }`, which is the JSON-LD
  **BreadcrumbList**.
- **The spec compares slug, taskSlug and description, never title.**
  `researched-guides.e2e.spec.ts` lines 154 to 161 loop every country the research
  names and compare
  `{ slug: researched.area.slug, taskSlug: researched.task, description: researched.guide.en.description }`.
  SB-385 made that cover Germany as well as Turkey; the title was never in the
  shape.
- **The breadcrumb assertion checks everything except the name that matters.**
  `pages.spec.ts` lines 242 to 247 assert the block is a `BreadcrumbList`, that
  its positions run 1 to n without a gap, and that `itemListElement[0].name` is
  "Home". That test reads an **area** page, whose trail starts at Home. A **guide**
  page's trail is a different shape, and this plan first got it wrong: see the
  correction below. Either way, the area's title is never read.
- **`CategoryView` already exposes what is needed.** `guide.model.ts` line 220 is
  `@Field(() => String) title!: string`, and `categories(country, locale)` takes a
  locale, `guide.resolver.ts` lines 18 to 22. The spec's `AREAS` query selects no
  title and passes no locale, and `LOCALE` is
  `{ nullable: true, defaultValue: FALLBACK }`, so today it only ever compares
  English.

## One thing the card says that is not code

The card asks that "the live read-back compares the titles a breadcrumb shows",
and says SB-198's read-back compares `place { categorySlug goalSlug }`. **No such
read-back exists in the repository.** A grep for `categorySlug` across the whole
tree finds the API model and service, the web document, one mock and `head.ts`,
and nothing that asks the deployed API. `publish-research.ts` is the only script
that talks to the live host, and what it reads back is rules: versions and places.
`retire-sample.ts` line 10 says "SB-198 read the deployment back and found only
the research", which reads as a check somebody ran by hand.

**The clause is still satisfiable, without inventing anything.** `pages.spec.ts`
runs against the built site, and against the **deployed** one when `PAGES_URL` is
set, which is what `playwright.config.ts` calls `LIVE` and why that suite already
skips fixtures the live site does not hold. So extending its breadcrumb assertion
is extending a live read-back. That is what this plan does, and it is written down
because the card's wording points at a file that does not exist.

## What the plan check corrected

**The breadcrumb index was wrong, and it would have failed against correct code.**
This plan said the area sits at `itemListElement[1]`. It does not. `head.ts` lines
65 to 69 build a guide's trail as exactly two crumbs, the area then the guide:

```ts
trail: [
  { name: guide.place?.categoryTitle ?? home, url: area },
  { name: guide.title, url },
]
```

and `structured-data/guide.ts` line 38 maps them with `position: index + 1`. So on
a guide page `[0]` is the **area** and `[1]` is the **guide**, and there is no Home
crumb at all. The wrong index came from borrowing it from the existing test, which
reads an **area** page, whose trail does start at Home. Verified in the tree rather
than taken.

**The Persian half is dropped.** The distinction this plan drew is technically
real: an area title is database content written by the loader from
`researched.area.fa`, not interface text through lingui. But CLAUDE.md's rule is
unqualified, no test is written for any language other than the English base, and
the exit does not need Persian to be met. Arguing content against catalog was
reaching for a refused thing by renaming it, and the English half stands on its
own.

**Turkish live, German in the spec, and that is not a compromise.** The two halves
check different layers joined by a generic `placeOf`, so they need not share a
country. The deployed site serves Turkey's guides, so the live assertion uses one
of those; Germany's storage and load concern is what the spec's German row proves.

**The exit needs clarifying, not restating.** `pages.spec.ts` already is the
deployed read-back, because `PAGES_URL` replaces the project `baseURL` and
disables the local servers, so its fixtures read the published artifact. No new
script, and no third rewrite of a card's exit.

## The approach

**1. The spec compares the title, in English.** `AREAS` gains `title`, and the
shape compared for every researched country, Germany included, gains
`title: researched.area.en`. The existing slug, taskSlug and description
comparison is untouched, so SB-385's coverage is kept.

**2. The deployed breadcrumb's first element is read.** The cold guide test in
`pages.spec.ts` gains an assertion that the guide trail's `itemListElement[0].name`
is the Turkish area's title as the research names it.

## Files

- `apps/api/test/researched-guides.e2e.spec.ts`, the title in the comparison.
- `apps/web/e2e/pages.spec.ts`, the breadcrumb's first name.
- this plan.

## How it is proved

A German area whose stored title differs from its entry's must fail the spec.

**The obvious plant cannot fail, and finding that out is worth more than the**
**plant was.** Changing a German area's `en` in `researched-guides.ts` moves BOTH
sides of the comparison at once: the expectation reads `RESEARCHED_GUIDES`, and
`beforeAll` loads the database from that same seed, so the loader writes the
changed title and the test expects it. Planted that way, Germany's anmeldung title
became "A title left from the sample era" and all ten tests still passed.

So what this assertion proves is that the loader **round trips the seed**, and the
divergence the exit names, stored against entry, only exists when one side moves
alone. The plant therefore goes on the **loader**: `writeGuide` is made to write a
title the entry does not carry, which is exactly the shape of the defect this card
is about, a stored title that is not what the research says the area is called.

For the breadcrumb, a loader-side divergence must move what the trail's first
element says, which is what shows a reader and a crawler see it rather than only
the database holding it.

**Scoped to Turkey, not Germany, and the difference matters.** The cold guide test
reads `TR/guides/short-term-residence-permit`, so a divergence confined to German
rows leaves that page's trail untouched and the assertion passes. That would be a
third plant that cannot fail, after the seed-side one where both sides moved
together and the unscoped one where Turkey threw before Germany was reached. The
two halves of this card therefore plant in opposite countries on purpose: Germany
for the spec, because the exit names a German area, and Turkey for the breadcrumb,
because that is the guide the deployed site serves.

**And the plant has to be scoped to Germany, which the first loader-side attempt**
**was not.** The comparison loops country by country and Turkey comes first, so an
unscoped divergence throws on Turkey's rows and never reaches Germany's. That run
proved the title is compared; it did not prove the sentence the exit actually
says. Scoping the plant to `researched.country === 'de'` gives:

```
AssertionError: de: expected [ { slug: 'anmeldung', ... } ] to deeply equal [ ... ]
+     "title": "Register where you live (planted)",
+     "title": "Register a business (planted)",
+     "title": "Get health insurance (planted)",
+     "title": "Get a residence permit as a skilled worker with a degree (planted)",
Tests  1 failed | 9 passed (10)
```

with Turkey's rows still matching, restored from a copy, and ten passing again.
That is the exit's first clause word for word.

**The breadcrumb half, run twice.** Clean, the pages project passes 32 of 32,
including the cold guide test that now reads the trail. With the loader planted for
Turkey alone, so that `written` stores `title + ' (planted)'`:

```
1) [pages] > e2e\pages.spec.ts:23:1 > a guide opens cold, left to right
   Error: the breadcrumb names the area the research names
   Expected: "Get a short-term residence permit"
   Received: "Get a short-term residence permit (planted)"
   1 failed, 31 passed
```

**Exactly one test failed, and that is the card's point rather than a weak plant.**
The plant rewrote every Turkish area title in the database, and the other thirty one
tests still passed, the area hub test at line 506 among them. Nothing else in that
suite reads an area's title text. The sentence this card opens with is therefore
measured rather than asserted.

**And the failure says which of the two things it is.** The worry recorded below was
that a stale build and a stale title would look alike from the outside. They do not:
the message names the expectation and prints the stored value beside it, so a title
that diverged in the database reads differently from a page built before the
assertion existed. The run takes 69 seconds end to end, servers included.

**The deployed artifact was read, not assumed.** The exit's second clause is about
the live read-back, and a local build passing says nothing about what GitHub Pages
is serving today, so the published page was fetched and its JSON-LD parsed:
`/en/TR/guides/short-term-residence-permit` answers 200 and its `BreadcrumbList` is

```
position 1: 'Get a short-term residence permit'
position 2: 'Getting a short-term residence permit in Turkey'
```

which is the area title the research names, followed by the guide. So the trail the
deployed site serves already carries the right title, the assertion passes against
the real artifact and not only against a local build, and the stale sample title this
card was filed about is confirmed absent from production rather than assumed absent.

**And the mechanism was run against production, not only the data read.** Setting
PAGES_URL and running the pages project scoped to the cold guide test passes in 3.5
seconds with no local server started, because that variable replaces the project
baseURL and empties the webServer list. That is what makes this file the live
read-back the card asks for, rather than a local build that happens to agree with
production. The exit is therefore met on both clauses by evidence: the spec clause by
the Germany scoped loader plant failing, the live clause by the Turkey scoped plant
failing locally and this same test passing against the deployed artifact.

## The step I am least sure of

**Whether the live half can fail for the right reason.** The spec half is planted
against the seed, so a mismatch is unambiguous. The breadcrumb assertion reads a
built or deployed artifact, so a stale build, rather than a stale title, could
fail it, and the two look alike from the outside. The assertion should therefore
name what it expected and what it found, so the next person is not left guessing
which of the two they are looking at.