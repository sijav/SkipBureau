# CountryName

The country the reader is in, named.

It does not fetch. `CountryRoute` has already confirmed the country exists
and put its name in context, so a second request here would ask the same
question twice and could answer it differently.

## Props

- `variant`: How prominent this is. The header wants small, a heading wants large.
