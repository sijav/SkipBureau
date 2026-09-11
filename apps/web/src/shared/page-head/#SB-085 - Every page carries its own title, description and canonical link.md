# SB-085, Every page carries its own title, description and canonical link

**Exit:** viewing the source of a guide, with JavaScript off where prerendering
applies, shows that guide's title, its own description and a canonical link, in
both languages.

## What a page says about itself

`PageHead` takes the place of `PageLanguages` in the four screens that are
pages: home, task hub, area hub and guide. It renders:

- **`<title>`**: the page's own words, then the country where those words do
  not already name it, then the site. `Register your address in Turkey ·
  SkipBureau`, while `Company types in Turkey · SkipBureau` gets no second
  Turkey. The country is what makes two countries' guides of the same name
  distinct results, and what a search for one actually contains.
- **`<meta name="description">`**: the guide's description, or its intro where
  it has none (several live guides have none); the hub's intro; the area's
  description; the home's own line under its heading.
- the canonical link and the alternates, which `PageLanguages` already renders
  (SB-086) and keeps rendering.

The words are the ones the page already shows, from the database, so nothing
here is a template pretending to be content. The two joins, `{title} in
{place}` and `{page} · SkipBureau`, are lingui messages with Persian
translations.

## One source for the screen and for the file

A crawler reads the file SB-076 writes; a person gets what React renders. If
the two were built separately they would drift, and the first sign would be a
search result naming a page the reader never sees.

So each screen exports a function from its query data to the page's head,
`homeHead`, `taskHubHead`, `categoryHubHead`, `guideHead`, and both the screen
and the prerender call it. The decisions that choose the page are exported the
same way: which guides are written (an unwritten one is Coming soon) and which
goal opens its only area directly.

`PageLanguages`'s choice of canonical and alternates moves into a function,
`pageLanguages`, for the same reason; the component renders what it returns.

## What React does with the prerendered head

React 19 lifts `<title>`, `<meta>` and `<link>` into the head. On the client
it does **not** adopt a `<title>` already in the document; it adds its own
beside it. That was assumed at first and the browser showed two titles, so
`index.html`'s title carries the same `data-prerendered` marker as the
prerendered description and links, and `PageHead` removes all of them once its
own are in. Until then the file's title stands, which on a prerendered page is
already the right one; and a page that is left for another never leaves its
canonical behind.
