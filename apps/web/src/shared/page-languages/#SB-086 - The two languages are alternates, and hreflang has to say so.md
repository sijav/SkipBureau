# SB-086, the two languages are alternates, and hreflang has to say so

Written 2026-09-11, before building. The plan roast waits, by the owner's
order of 2026-09-10.

## What it does

A page that exists in both languages tells a search engine so: a
`<link rel="alternate" hreflang>` for each language it actually has, one for
`x-default`, and the canonical link they all point back to. A page in one
language only emits no alternates at all, and never claims a translation that
does not exist.

## How

- **React 19 puts it in the head.** React 19.2 hoists a `<link>` rendered
  anywhere into `<head>` and removes it when the component unmounts, so each
  screen declares its own languages where it knows them. No effect writes to
  `document.head`, and no library is added.
- **One component,** `src/shared/page-languages/PageLanguages.tsx`. The screen
  passes the path of the page in any language and the languages the page has.
  It renders the canonical link and, when there is more than one language, an
  alternate per language and `x-default` for English.
- **Addresses are absolute and carry no origin.** `/en-IR/TR/guides/sim-card`
  shows the same content as `/en/TR/guides/sim-card`: where the reader comes
  from changes no content yet. So every variant's canonical is the address
  without the origin, and the alternates point at canonical addresses only,
  as Google asks. The base path, `/SkipBureau/` on GitHub Pages, comes from
  Vite's `BASE_URL`, the same place the router's `basename` does.
- **What a guide has comes from the database.** `GuideView` gains `locales`,
  the languages its text rows exist in (`apps/api/src/guide/`). A guide read
  under `/fa/` with no Persian row is the English guide in a Persian frame: its
  canonical is the English address and it emits no alternates.
- **Which screens.** Home, the task hub, the category hub and the guide. The
  suggest dialog renders the guide under it, so it inherits the guide's
  canonical, which is right: it is not a page of its own. Search results and
  Coming soon pages are not content to rank and emit nothing.
- **hreflang values** are the URL's language segment, `en` and `fa`: the pages
  are for readers of a language, not of a region.

## How it is proved

The Guide story checks the head: for the SIM guide in two languages, an
alternate for `en`, `fa` and `x-default`, each absolute, and a canonical; for
an English-only guide, a canonical and no alternate. Then the full suite, the
build, and the live site's head read in a browser.

## The step I am least sure of

That React hoists `rel="alternate"` and `rel="canonical"` as it does
stylesheets. The React docs say a `<link>` is always placed in the head unless
it carries `itemProp` or is a stylesheet without `precedence`; the story
reading `document.head` is what settles it rather than the docs.
