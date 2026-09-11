# SB-133, CLAUDE.md overstates what a crawler will not do with a JavaScript page

**Exit:** the SEO section states what Google actually does with JavaScript
pages, and the conclusion still follows.

## What it says, and what is true

The first rule of `CLAUDE.md`'s SEO section says content that only appears
after JavaScript runs "is content a crawler may never index and can never rank
properly". That is overstated. Google does render JavaScript, on pages that
answer 200: it queues them for a rendering pass after the first crawl, which
makes indexing of script-built content slower and less certain, not impossible.
What Google does not do is render a page that answers with an error status,
which is why the 200 was the blocker (SB-076). Other crawlers, and the link
previews in chat apps, mostly do not run JavaScript at all.

## The change

Rewrite that one rule to say exactly that, keeping its conclusion: a page's
title, description and content belong in the HTML the server sends, because
everything that arrives later arrives slower, less surely, or for some readers
never. Name what is already in the file (SB-076, SB-085) and what is not yet
(the body, SB-155), so the rule is also an honest status.

Only `CLAUDE.md` changes.
