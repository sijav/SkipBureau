# ContextPanel

Figma 47:686: a record, not a settings form. Ruled rows with mono labels and
no input until a row is tapped; an unanswered row says Add in the accent.
Where the reader comes from, where they are, the place in it where they live,
the residence status they hold and their role can be said, and all of them go
into the address.

**Currently in** is the destination, the country the address is in (SB-172). It
offers only the countries SkipBureau covers, which is a different list from
every country somebody can come from.

**City** and **Residence status** offer the country's places and statuses
(SB-256), each after the one it is inside, a level further in: München under
Bayern, a visa under a stay on a visa or visa exemption. Partial, 47:640, has
them as Add; Complete, 47:663, names them.

**Role** offers the situations the country's researched rules name, a worker or
a company founder (SB-286), each by the name the interface gives it.

Tapping a row that names something selects that name, so typing replaces it
rather than adding to it: tapping Turkey and typing Ger finds Germany.

**Clear all** takes back the nationality, the place, the status and the role,
never the destination.

**It takes focus when it mounts** (SB-275), at its own heading rather than at
the first row. The panel is rendered only while it is open, so mounting is
opening, and a reader who opened it from the keyboard has to arrive inside it:
before this, focus stayed on whatever they pressed, Tab walked on past the
panel, and Escape reached nothing. The heading is the focus target rather than a
wrapper because it has a name to announce, which is what the WAI-ARIA dialog
pattern asks for, and Escape still bubbles from there to the popper.

## Props

- `origin`: Where the reader comes from, once they have said.
- `onOrigin`: Called with the nationality chosen.
- `country`: Where they are, the code and name the address is in, for Currently in.
- `countries`: The countries SkipBureau covers, which is all Currently in offers.
- `onCountry`: Called with the code chosen under Currently in, only when it is a different country.
- `countryName`: Where they are, for "City in Turkey".
- `options`: Every country someone can come from, named in the reader's language.
- `loadingCountries`: Whether the countries query is still in flight. Currently in then says it is still looking, rather
  than that nothing matches, which is what an empty list says on its own.
- `loadingDetails`: The same for the query behind City, Residence status, Role and Where you work. Two flags rather than
  one, because the two queries answer at different times.
- `place`: The place where the reader lives, once said.
- `places`: The country's places, in the order the row lists them, each with how far in it is.
- `onPlace`: Called with the place chosen under City, only when it is a different one. Without it the row is Coming soon.
- `status`: The residence status the reader holds, once said.
- `statuses`: The country's statuses, in the order the row lists them, each with how far in it is.
- `onStatus`: Called with the status chosen, only when it is a different one. Without it the row is Coming soon.
- `situation`: The reader's role, once said, a situation's code and the name the interface gives it.
- `situations`: The situations the country's researched rules name, in the order the row lists them.
- `onSituation`: Called with the role chosen, only when it is a different one. Without it the row is Coming soon.
- `onClear`: Clear all. Without it Clear all takes back only the nationality.
