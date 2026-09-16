# PageHead

SB-085: a page's title and description, with its languages (SB-086) and
what a shared link shows (SB-089). React 19 lifts all of it into the head
and takes it out when the page goes.

A page is called by its own words and the country they are about, so that a
search for one country's guide does not return another's. The country is added
only where the title does not already name it, and only where the title is
written in the language the page is read in: a guide with no text in this
language keeps its own title untouched, because adding one language's words to
another's names the country twice (SB-291). `shown` is what says which language
the words are in.

## Props

- `title`: What the page calls itself, as its heading does.
- `description`: The sentence a search result shows under the title.
- `kind`: A guide is an article to a link preview; any other page is the site.
- `modified`: An article's verified date.
