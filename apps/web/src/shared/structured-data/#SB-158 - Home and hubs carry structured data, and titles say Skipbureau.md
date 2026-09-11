# SB-158, Home and hubs carry structured data, and every title says Skipbureau as the wordmark does

**Exit:** the built home, a goal hub and an area hub each carry JSON-LD that
parses, the hubs a BreadcrumbList matching their breadcrumb, and every page
title and publisher name reads Skipbureau.

## What each page gets

- **The country's home**: `WebSite` (name, the site's address, the page's
  language) and `Organization` (name, address, and `logo`, the 512 icon from
  SB-157, which Google wants at 112px or more). Google only uses `WebSite` for a
  result's site name at the domain level, which a GitHub project page is not,
  so that part may be ignored until the site has a domain; the Organization and
  its logo are read regardless.
- **An area hub**: the `BreadcrumbList` of the trail it shows: home, the goal
  where the goal has more than one area, the area.
- **A goal hub**: it shows no breadcrumb, so its list is the position it has,
  home then the goal.

Built the way the guide's is (SB-087): pure functions beside
`guideStructuredData`, fed from the screens and from the prerender alike, so
the file and the page say the same thing. Each hub's head function moves the
trail it already computes into its `head.ts`, as the guide's did.

## Skipbureau, one spelling

The wordmark (Figma 43:523) and the interface write **Skipbureau**. The title
suffix and the JSON-LD publisher, both written this week, say SkipBureau.
Search results would show both. The message `{named} · SkipBureau` becomes
`{named} · Skipbureau`, with its Persian, and the builders' site name follows.
The interface strings that still say SkipBureau (the Unreachable screen, Ask's
field in one story) are the design's to settle and are left alone here.

## How it is checked

Unit tests for the new builders, beside the guide's. The pages e2e reads the
JSON-LD out of the built home and an area hub, and the title of the guide it
already opens, now ending in Skipbureau.
