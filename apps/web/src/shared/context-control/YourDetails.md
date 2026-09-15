# YourDetails

The context control wired to the address. Where the reader says they come
from becomes part of the URL, `/en-IR/TR`, so a page they share says it too,
and taking it back returns them to `/en/TR`.

Choosing another country under Currently in changes the address's country
(SB-172). A page that exists in every country stays: home, the guides index and
a search, with its question. Anything else, a task or category hub, a guide or
its suggest page, belongs to one country and may not exist in the other, so it
goes to that country's home rather than to a page that could be Not Found. A
place and a status belong to the country being left, so neither goes with it.

Choosing a place under City puts it where the country was,
`/en-IR/DE-HH/guides/anmeldung`, and choosing a residence status adds
`?status=de.visa-free`; both keep the page (SB-256). The control then names the
place beside the nationality. Clear all takes back the nationality, the place
and the status.
