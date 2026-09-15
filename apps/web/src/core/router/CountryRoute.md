# CountryRoute

Guards `/:reader/:country` and hands down the country, where the reader comes
from, and the place and residence status they have said.

Which countries exist is a database answer, not a compile-time one, so this
asks, through the same question the shell above it asks (SB-161).

An unknown country is Not Found, never a redirect to one we do have. A stale
link reading `/en/ZZ/guides/residence-permit` must not silently become
another country's rules: a reader would act on them.

A place or a residence status the country does not have is Not Found the same
way (SB-256). A place is checked before the page draws, so an address with one
draws nothing below the header until the country's places are in; a status is
checked once its answer is in, so a page hydrated from its file stays on screen
meanwhile, without the status.
