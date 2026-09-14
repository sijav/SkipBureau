# ContextPanel

Figma 47:686: a record, not a settings form. Ruled rows with mono labels and
no input until a row is tapped; an unanswered row says Add in the accent.
Where the reader comes from and where they are can be said so far, and both
go into the address; the rest say Coming soon rather than offering an Add that
does nothing.

**Currently in** is the destination, the country the address is in (SB-172). It
offers only the countries SkipBureau covers, which is a different list from
every country somebody can come from.

Tapping a row that names a country selects that name, so typing replaces it
rather than adding to it: tapping Turkey and typing Ger finds Germany.

## Props

- `origin`: Where the reader comes from, once they have said.
- `country`: Where they are, the code and name the address is in, for Currently in.
- `countries`: The countries SkipBureau covers, which is all Currently in offers.
- `onCountry`: Called with the code chosen under Currently in, only when it is a different country.
- `countryName`: Where they are, for "City in Turkey".
- `options`: Every country someone can come from, named in the reader's language.
