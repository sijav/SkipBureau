# SB-087, Guides carry structured data with the verified date: Article, BreadcrumbList and HowTo

**Exit:** a built guide's source carries one JSON-LD Article with
`dateModified` equal to the guide's `verifiedAt` and a BreadcrumbList matching
its breadcrumb, both parsing as JSON; a guide with steps also carries a HowTo
with one HowToStep per step, and a guide with none carries no HowTo.

## What changed about the task before it started

It was written for HowTo rich results. Google stopped showing those in
September 2023 and removed their documentation; its search gallery today lists
Article and Breadcrumb, not HowTo. So the date reaches Google through
**Article**, the trail through **BreadcrumbList**, and **HowTo** stays because
schema.org is read by more than Google and it is exactly what a guide is. The
card's exit named Google's Rich Results Test passing for HowTo, which can no
longer happen, so the exit was restated to something checkable.

## What each carries, and only when the guide has it

- **Article**: `headline` the title, `description` the description or the
  intro, `inLanguage` the language the content is actually in, `dateModified`
  the verified date, `mainEntityOfPage` the canonical address, SkipBureau as
  author and publisher, and every official source as a `citation`.
- **BreadcrumbList**: the trail the page shows, the area (or home) then the
  guide, at canonical addresses.
- **HowTo**: one `HowToStep` per step of the how-to section, one `HowToSupply`
  per item of what you need, `estimatedCost` from the cost text. No
  `totalTime`: `GuideText.time` is prose ("1 to 2 hours") and schema.org wants
  an ISO 8601 duration, and a guessed one would be a false statement in markup
  a machine trusts. No steps, no HowTo.

## One builder for the page and the file

`guideStructuredData` in `src/shared/structured-data/` is a pure function from
the guide query's data to the three objects, typed with `schema-dts` (Google's
own schema.org types, 2.0.0, types only), so a misspelt property fails the
type check rather than silently invalidating the markup.

- The Guide screen renders them through `StructuredData`, a
  `<script type="application/ld+json">` per object.
- The prerender (SB-076) writes the same objects into the file's head, marked
  `data-prerendered` like the rest of the file's head, so `PageHead` removes
  them once the page has rendered its own.
- The area address the breadcrumb links to moves into the guide's `head.ts`
  beside `guideHead`, so the visible trail and the marked-up one cannot drift.

`<` is escaped as `<` in the file, so no text in a guide can close the
script tag early.

## How it is checked

A unit test of the builder: a guide with steps gives Article, BreadcrumbList
and HowTo with a step each; one without steps gives no HowTo; the date is the
verified date. And `e2e/pages.spec.ts` parses the JSON-LD out of the built
guide's served source, which is the exit.
