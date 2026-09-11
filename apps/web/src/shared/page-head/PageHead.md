# PageHead

SB-085: a page's title and description, with its languages (SB-086) and
what a shared link shows (SB-089). React 19 lifts all of it into the head
and takes it out when the page goes.

## Props

- `title`: What the page calls itself, as its heading does.
- `description`: The sentence a search result shows under the title.
- `kind`: A guide is an article to a link preview; any other page is the site.
- `modified`: An article's verified date.
