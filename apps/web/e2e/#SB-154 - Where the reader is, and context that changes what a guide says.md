# SB-154, Where the reader is, and context that changes what a guide says

**Exit:** the control reads a nationality and a city from real data in its Complete state, and
choosing a nationality in the panel changes a guide already on screen, on the live site.

## Where it stands

The card was split into SB-255, SB-256, SB-257 and SB-258 and is what remains: the whole exit, checked
on the live site in both languages. SB-271 has since stopped a rule with no version for everyone
calling itself the rule for everyone. Looked at on https://sijav.github.io/SkipBureau/ on 2026-09-15,
in English and Persian, with no reload and no console error:

- **Turkey's short-term residence permit guide.** The charge asks "Your nationality decides the
  answer". Choosing Czechia in the panel, from the charge's Tell us, moves the link to
  `/en-CZ/TR/guides/short-term-residence-permit` and answers the charge For you: the research's note
  that Czechia is among the nine exempt nationalities, and its line. Choosing İzmir then moves it to
  `/en-CZ/TR-35/...`, and the control reads "From Czechia · İzmir", "از چک · İzmir" in Persian.
- **Germany's residence permit guide**, on a visa-free stay. Choosing the United States answers For you
  with "Deadline to apply inside Germany", the 90 days AufenthV 41(1) gives its nationals.

So the exit holds today. Nothing proves it: the SB-257 test changes a guide by place, and no test
chooses a nationality against the real API. That path is also the fragile one: the API matches a
nationality group's members case-sensitively (SB-277), and the web gets the exemption only because it
lowercases the origin it reads from the link.

## What this card adds

- **The e2e API loads the researched guides**, `node dist/load-researched-guides.js` after the seed,
  as production runs it after the sample content, so the built site has Turkey's permit guide. Its
  comment then says what the e2e API shares with production, the research before the content and the
  researched guides after it, and that `prisma/seed.ts` is its own content, which production does not
  run.
- **A test in `e2e/pages.spec.ts`**, on the built, prerendered site against that API:
  `en/TR/guides/short-term-residence-permit` asks "Your nationality decides the answer" for the charge;
  Tell us, Nationality, Add, Czechia; the link is `/en-CZ/TR/guides/short-term-residence-permit`, and
  the charge is answered For you with its line and its note, every assertion found inside the charge's
  own answer so that another rule's For you cannot pass it; then the header control, City in Turkey,
  Add, İzmir;
  the link is `/en-CZ/TR-35/guides/short-term-residence-permit`, the control reads "From Czechia ·
  İzmir", and only the first document was requested. It reads only rows the loaders write, so it is
  safe beside the file's parallel tests.
- Nothing in the app changes.

## How it is checked

- The new test on the local build, then the whole pages project, and the dev project compared with its
  13 known failures (SB-268), test by test.
- Planted: Guide.tsx asking without the nationality, so the charge keeps its question and the test
  fails on the built site.
- Pushed, then the test against the live site with `PAGES_URL`, and the same steps looked at in
  Persian on the live site.

Checked on 2026-09-15 and approved. The check read the loaders and found no overlap between the
researched guides and the seed's content; they add their guides, hubs and sitemap entries to the e2e
build, and no pages test counts those. It confirmed that only the answers query, asked with the
nationality, can answer the charge, so the plant proves the test, and advised anchoring every assertion
to the charge's answer and asserting its note as well as the URL, both taken. It advised against a
nationality the research does not exempt, which would test the data rather than the path.
