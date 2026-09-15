# SB-255, A guide answers its linked rules for the reader who asks

**Exit:** on the deployed API, Germany's anmeldung guide asked for a reader living in DE-HH answers report-your-address
for that reader with Hamburg's 16 euro fee and the federal two weeks, each on its page, and asked with no place names the
place as needed while still carrying the rule for everyone; Turkey's register-your-address guide asked for a residence
permit holder living in TR-34 answers the 20 working days; the places query lists Germany's Länder with their cities
under them and the statuses query its four statuses; the API tests prove each and were watched failing.

The exit's "while still carrying the rule for everyone" is met by the same guide asked without a reader, which is the
page a search engine reads; asked with a reader who said nothing, the guide carries the question alone (below, and the
first check).

## Why

SB-154, split on the owner's answers of 2026-09-15: the address guides show their rule for the reader, by city and
residence status, the two rules where nationality makes the exception each get a short guide (SB-258), the city is kept
in the link (SB-256), and the guide page shows the answer (SB-257). All of that needs an API that can answer a guide's
rules for a reader, and lists what a reader can say. Today a guide shows only a version with no criteria
(`generalVersionAt`), so nothing a reader says changes it, and on the deployed database the two address guides link to
nothing: sample content links them to `register-your-address`, which only the test seed creates, while the researched
duty in both countries is `report-your-address`.

## What is built

**A guide asked for a reader answers for that reader, and only for them.** `guide(country, slug, locale, reader)` takes
an optional input object, `ReaderInput`, holding what `changes` takes: `nationality`, `situation`, `residenceRegions`,
`workRegions`, `residenceStatuses`, with the same descriptions. GraphQL tells an omitted object from an empty one, and
the two are different requests:

- **No `reader`, or `reader: null`**: the guide as it is today, each obligation's `resolution`, `facts` and `notes` from
  the version for everyone, and `reader` null. This is what the prerender and `guides(country, locale)` ask, so a page's
  file and the list stay exactly as they are and no rule is resolved per guide.
- **A `reader`, even an empty one**: the profile is checked once, for every guide, one linking nothing included, so a
  code that is no place or status, or two places of one country, is `BAD_USER_INPUT` whichever guide is asked. Where the
  guide links an obligation, `RulesService.resolve(country, profile, at, locale)` runs once, the resolver `move` and
  `changes` use, so a guide and the move query never answer one reader differently. Each obligation's `reader` is then
  its answer, and its `facts` and `notes` are empty lists for that call, their descriptions saying so, because the
  version for everyone beside a question is the provisional answer SB-176 refuses: care insurance's 1.8% each, beside a
  question about where the reader works when Saxony's split might be theirs. `resolution` still says whether a version
  for everyone exists, which is a fact about the rules rather than an answer. A place or status of another country is
  absent for this one, as `treeFit` already treats it, so the guide asks for its own.

`reader` on `GuideObligationView` carries:

- `answer`, a new enum `ReaderAnswer`: `answered` where one rule applies and no detail could change it; `needsDetail`
  where one could, named in `needs`; `needsReview` where two rules clash, with `reason`; `noRule` where no rule held for
  this obligation in this country applies to what the reader said, including where none is held at all;
- `needs` (`[Detail]`), `reason`, `ruleVersionId`, `facts` (`[RuleFactValue]`, each with its version, page, page name and
  read day) and `notes` (`[RuleNote]`), exactly as `ResolvedRule` carries them, and empty where the answer is not
  `answered`.

The order of the checks is `compare`'s: a clash first, then a question, then the answer. `RulesService.checkProfile`
becomes public, `resolve` still calls it, and the guide service calls it itself only for a guide that links nothing, so
a request is checked once. `asInputError` and the argument descriptions move from `rules.resolver.ts` into
`rules/profile-args.ts`, which both resolvers import; `RulesModule` exports `RulesService` and `GuideModule` imports
`RulesModule`.

**What a reader can say about a country.** In `country/`, two queries beside `countries`:

- `places(country, locale)`: every `Region` of the country, `code`, `parentCode`, `officialCode` and `name`, the
  `RegionText` in the language asked for where one exists, else the official name the research wrote, by code;
- `residenceStatuses(country, locale)`: every `ResidenceStatus`, `code`, `parentCode` and `name`, the
  `ResidenceStatusText` in the language asked for where one exists (the research load writes `en-US` and `fa-IR`), else
  its canonical name, by code.

Names in a reader's language for places are not written by any research yet; the official name stands until they are,
and SB-256 decides how the panel shows it.

**Each address guide links one address duty, the researched one where it exists.** `sample-content.ts` names, for each
address guide, `report-your-address` and then `register-your-address` in order of preference, links the first the
database has, and deletes the guide's link to any other obligation in that list, so a guide never carries two rules for
one duty. The schema records no owner for a link, so the deletion is bounded to those two named slugs and nothing else a
guide links is touched. This runs for every guide the sample content names, existing or new: a guide that exists is
otherwise skipped whole, and on the deployed database both address guides already exist. The file's fill-only contract
says so. On the deployed database, where the research load finishes before sample content starts
(`docker-entrypoint.sh`), the link is `report-your-address`; on a seeded test database `register-your-address`, so
`guide.e2e.spec.ts` keeps its fixtures; after a research load and sample content run again, `report-your-address` alone.

## The tests

- `test/guide.e2e.spec.ts`, on the seed's fixtures:
  - the address guides link exactly `register-your-address`; after a fixture links another obligation to the anmeldung
    guide and `seedContent` runs again, that link survives and the address link is still exactly `register-your-address`;
  - the student-only obligation that spec already adds answers `needsDetail` with `needs: [situation]` for a reader who
    said nothing, `answered` with its 50 euro fee for a student and `noRule` for a worker, with empty `facts` and `notes`
    on each of those calls while its `resolution` stays `contextRequired`;
  - `reader: null` answers as the guide asked for nobody does, the version for everyone in `facts` and `reader` null;
  - the seed's `pay-care-insurance`, linked to the anmeldung guide for the test, asked with an empty reader answers
    `needsDetail` with `needs: [workRegion]` and no facts in `reader` or beside it, and asked with no reader still shows
    the version for everyone;
  - `reader: { residenceRegions: ["XX-99"] }` is refused with `BAD_USER_INPUT` on the anmeldung guide and on Turkey's
    `sim-card`, which links nothing.
- `test/research-rules.e2e.spec.ts`, after a load and `seedContent` run again as the entrypoint runs it:
  - both address guides link exactly `report-your-address`;
  - Germany's anmeldung guide for a reader in `DE-HH` answers with exactly the federal version's facts and Hamburg's, read
    from Germany's file, each on its page; for an empty reader it answers `needsDetail` with `needs: [residenceRegion]`;
    asked with no reader its `resolution` is `general` with the federal facts;
  - Turkey's register-your-address guide for `tr.residence-permit` in `TR-34` answers the national facts for that status
    from Turkey's file;
  - `places(country: "de")` is every Land with no parent and every city under the Land the file names;
    `residenceStatuses(country: "de", locale: "fa-IR")` is the file's four statuses with their Persian names.
- Planted, each watched failing: the guide service resolving an empty profile instead of the reader's, which the Hamburg
  test must fail; the version for everyone served on a call with a reader, which the care insurance test must fail; the
  check skipped for a guide that links nothing, which the `sim-card` test must fail; the linking deleting every link of an
  address guide, which the surviving-link test must fail; `places` returning no parent, which the Länder test must fail.

## Files

`src/guide/guide.model.ts`, `guide.resolver.ts`, `guide.service.ts`, `guide.module.ts`; `src/rules/rules.module.ts`,
`rules.resolver.ts`, `rules.service.ts`, `rules.model.ts`, `profile-args.ts` (new); `src/country/country.model.ts`,
`country.resolver.ts`; `src/sample-content.ts`; `test/guide.e2e.spec.ts`, `test/research-rules.e2e.spec.ts`;
`schema.gql` and the web's generated types from `npm run contract -w @skipbureau/web`; this plan.

## How it is checked

API lint, `lint:tsc`, build and the full API suite, the card having no parent; the web's `lint:tsc` over the regenerated
types. Then pushed, which Northflank builds because `apps/api/**` changed, and the deployed API asked, once it serves
`reader`, for each reader the exit names, each fact's page read back.

## The steps I am least sure of

1. **Empty `facts` and `notes` on a call with a reader**, where a client reading only those fields sees nothing and has
   to read `reader`.
2. **Sample content deleting a link**, the first time it removes anything, bounded to the two address duties it names.
3. **The research test running `seedContent` again after a load**, to stand for the entrypoint's order.

## Checks

1. **First check** (2026-09-15). Accepted: serving the version for everyone beside a reader's `needsDetail` is the
   provisional answer SB-176 refuses, so a call with a reader returns only the reader's answer and a call without one stays
   static, told apart by an optional input object; a profile is checked for every guide asked with one, not only one that
   resolves rules, and not by resolving rules merely to check; a guide links one address duty, the researched one where it
   exists, with the exact linked slugs asserted on a seeded and a loaded database; `guides()` and the prerender stay
   static, since an empty profile there would resolve every linked guide's rules on every build. It found the places and
   statuses queries and one resolve per guide sound, and confirmed `GuideObligation` enforces only its composite key.
2. **Second check** (2026-09-15), on the approach changed by the first. It found the approach sound and asked for two
   additions, both taken: `facts` and `notes` stay non-null empty lists described as empty whenever a reader is given, and
   `reader: null` answers as the static guide, with a test; and because a link records no owner, the deletion is bounded to
   the two named address duties, the fill-only contract says so, and a test proves an unrelated link survives. It
   confirmed each path checks a profile exactly once and that a place or status of another country is absent for this
   one. Found while building on it: a guide that exists is skipped whole by sample content, so the linking now runs for
   existing guides too, or the deployed guides would never be linked. No third check: nothing in the approach changed.
