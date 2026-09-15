# SB-286, The reader's situation is the panel's Role row and in the link, a worker or a company founder to start

**Exit:** on the live site, choosing a role in the panel keeps it in the link, the panel names it and a guide asks
its rules with that situation, in en and fa; a Playwright spec proves it and was watched failing.

The card said "the control names it". The context control's chip draws nationality and place (Figma 44:532) and has
never drawn the residence status, which the panel's row names; a role is shown the same way, in its row.

The owner, 2026-09-15, asked what comes first, given that every work permit rule and five of company formation's six
apply by the reader's situation and no reader can say theirs, answered **Role row first**: build the reader's
situation, a worker or a company founder to start, as the panel's Role row and in the link like the city and status,
then link the guides (SB-280).

## What a situation is here

A rule version's criterion on the `situation` dimension, today `worker` (Turkey's work permit) and `company-founder`
(Turkey's company formation, Germany's business registration). The API already takes `situation` on a reader. Unlike a
residence status, it is not a status a country names in law, with its own table and official names: it is how the
product describes what a reader is doing in the country, and `company-founder` means the same in both countries.

- **The API lists the situations a country's researched rules use**: `situations(country)` answers the distinct values
  of the `situation` criteria of that country's rule versions written by a research file, sorted. The e2e seed's own
  rules also name a `student` situation no research does, and a reader is only ever offered what the research says. No
  migration and no research change: a situation a research file adds appears when its rules load.
- **The web names each situation** as interface text in lingui, keyed by its value, English with Persian in `fa.po`:
  `worker` "Worker", "شاغل"; `company-founder` "Company founder", "بنیان‌گذار شرکت". A unit test enumerates every
  situation value in `apps/api/src/rules/research` and fails for one with no name, as the fact label test does.
- **Role is the reader's word throughout.** The panel's row is Role, so the question over a rule that needs one says
  "Your role decides the answer", "نقش شما پاسخ را تعیین می‌کند", in place of "Your situation"; `situation` stays the
  criterion's name inside the code.

## In the link, the route and the panel

- **The link carries it in its query**, as it carries the status: `?situation=worker`, after the page's own query and
  the status. `paths.ts` reads it (`situationFromSearch`), sets or removes it for the Role row, and drops it with the
  status on Clear all and on a change of country, since which situations a country's rules use differs by country.
- **The route confirms it**, as it confirms a status: a situation the country's researched rules do not use is Not
  Found. **One gate reads both after hydration**: `readsStatus` becomes the flag for the reader's details a query
  carries, so a prerendered page's first render has neither, the existing effect turns both on together, and both are
  confirmed from the one ReaderDetails answer before they reach the country's context, the shell and the journey.
  Reading the situation at once while the status waits would bring back the hydration mismatch SB-256 avoided.
- The country's context, the shell and the journey carry `situation` beside `status`, so every link a page builds
  keeps it.
- **ReaderDetails** asks `situations(country)` with the places and statuses. The panel's **Role** row, Soon today, is a
  choice of the country's situations, named, and choosing one moves the link, as the Residence status row does.
- **Guide.tsx** sends the situation in the reader where the link has one.

## How it is checked

- An API test: Turkey's situations are `company-founder` and `worker`, Germany's `company-founder`.
- Unit tests for the paths: a situation read from a query, set, taken out, kept beside a status and a page's own
  query, and dropped on Clear all and a change of country; and the label test.
- Stories: the panel's Role row, and YourDetails choosing a role puts it in the link.
- A pages test on the built site: on the permit guide, the panel's Role row, Worker; the link gains `?situation=worker`
  and the page's GuideAnswers request carries `situation: "worker"`; watched failing with Guide.tsx not sending it. It
  proves the situation reaches the rules, not that a worker's answer changes: no guide links a rule that needs a role
  until SB-280 links the work permit and company formation guides.
- New strings in Persian; DESIGN.md's context control and SB-189 paragraph say the Role row is filled.
- Pushed, then looked at on the live site in en and fa.

Checked on 2026-09-15 and approved with corrections. The check agreed a situation is a product criterion and not a legal
status, so it stays in the rules' criteria with its name as interface text, a catalog of its own only if situations ever
need descriptions or sources. It asked that the query count only researched rule versions, since the e2e seed names a
`student` situation; that status and situation share one gate after hydration; and that the test claim only that the
situation reaches the rules until SB-280. It gave the names, Worker and Company founder, and Role as the one word in the
panel and the question. All taken.
