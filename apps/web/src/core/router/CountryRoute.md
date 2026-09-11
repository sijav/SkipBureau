# CountryRoute

Guards `/:reader/:country` and hands the country, and where the reader comes
from, down.

Which countries exist is a database answer, not a compile-time one, so this
asks, through the same question the shell above it asks (SB-161).

An unknown country is Not Found, never a redirect to one we do have. A stale
link reading `/en/ZZ/guides/residence-permit` must not silently become
another country's rules: a reader would act on them.
