# SB-088, A generated sitemap and a robots.txt that means it

**Exit:** adding a guide row and rebuilding puts it in `sitemap.xml` with the
right `lastmod` and alternates, with no file edited by hand.

## Where it comes from

The prerender (SB-076) already walks the API for every page that should be
found, in every language, with each page's canonical address and alternates.
The sitemap is written from that same list, in the same run, so a guide
written in the database is in the sitemap after the next build, and nothing is
listed that has no file.

## What is in it

- **Canonical pages only.** A page whose canonical is another address is left
  out: a goal that opens its only area (its canonical is the area's hub) and a
  guide read in a language it is not written in (its canonical is the language
  it is written in). A sitemap that lists non-canonical addresses sends a
  search engine two answers for one page.
- **`lastmod`** where the page has a real date: a guide's verified date, an
  area's last-reviewed date, a goal hub's newest source check. The country's
  home has none of its own, so it carries none rather than an invented one.
- **Alternates** as `xhtml:link rel="alternate" hreflang`, the same ones the
  page's head carries, x-default included, only for pages in more than one
  language.

`sitemap.xml` sits at the site's base, `/SkipBureau/sitemap.xml`, which is
allowed to list everything under `/SkipBureau/`.

## robots.txt, and what this host does with it

Crawlers read `robots.txt` only at a host's root. This site is a GitHub
**project** page, so its root is `sijav.github.io/robots.txt`, which belongs to
the owner's user site, not to this repository. A `robots.txt` in this build
lands at `/SkipBureau/robots.txt` and no crawler reads it there.

It is written anyway, one `Allow` and the `Sitemap` line, because it becomes
the real one the day the site gets its own domain, and it costs nothing. What
actually tells a search engine about the sitemap on this host is either
submitting it in Google Search Console, or a `robots.txt` in a
`sijav.github.io` repository. Both are the owner's; the report says so.

## Files

| file | change |
|---|---|
| `src/core/prerender/sitemap.ts` | `sitemap(pages, origin)` and `robots(origin)`, pure |
| `src/core/prerender/prerender.ts` | pages carry `lastModified`; `render` adds the two files |
| `scripts/prerender.mjs` | writes whatever `render` returns, unchanged |
| `src/core/prerender/sitemap.test.ts` | canonical only, lastmod, alternates, escaping |
| `e2e/pages.spec.ts` | the built sitemap answers 200 and lists the guide with its date and alternates |
