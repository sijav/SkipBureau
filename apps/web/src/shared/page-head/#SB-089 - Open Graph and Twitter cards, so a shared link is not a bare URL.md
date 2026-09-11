# SB-089, Open Graph and Twitter cards, so a shared link is not a bare URL

**Exit:** a guide URL pasted into a link preview tool shows that guide's title
and description in the language the URL names.

## Why the file matters more than the page here

WhatsApp, Telegram, Slack, X and Facebook build a link preview from the HTML
the server sends, and none of them runs JavaScript. So the tags have to be in
the prerendered file (SB-076); React renders the same tags on the page so a
navigated page is right too, and `PageHead` removes the file's copies once its
own are in, as it does the rest of the head.

## The tags

One pure function, `sharingTags`, used by `PageHead` and by the prerender:

- `og:site_name` Skipbureau; `og:type` `article` for a guide, `website`
  otherwise; `og:title` the page's own name with its country, without the site
  suffix that `og:site_name` already carries; `og:description`; `og:url` the
  canonical address.
- `og:locale` the language of the canonical page, as Open Graph writes it
  (`en_US`, `fa_IR`), and `og:locale:alternate` for every other language the
  page exists in, mirroring hreflang.
- `article:modified_time` for a guide: its verified date.
- `og:image` with its size and alt, and `twitter:card summary_large_image`. X
  falls back to the `og:` tags for title and description.

## The image, which the card left optional

The owner, 2026-09-11: *"I want this site to be shown nicely on search
engines"*. A preview with an image gets a large card; without one, a line of
text. So there is one: `og.png`, 1200 by 630, the wordmark (Figma 43:523) on
paper, drawn by `scripts/icons.mjs` with the rest of the brand images, from the
tokens and the Archivo files the app already ships. The same image for every
page: no per-page image generation, which would be a much larger piece of
work.

## Where the language comes from

`pageLanguages` already decides the canonical page and the languages a page
exists in. It now also returns which locale the canonical is and the list of
available ones, so `og:locale` and its alternates are never computed twice.

## How it is checked

A unit test of `sharingTags`. The pages e2e reads the tags out of the built
guide in both directions. Then the exit on the live site: the guide's English
and Persian addresses fetched the way a preview bot fetches them, the title
and description read from the tags.
