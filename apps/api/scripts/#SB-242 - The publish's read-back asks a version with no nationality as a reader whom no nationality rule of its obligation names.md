# SB-242, The publish's read-back asks a version with no nationality as a reader whom no nationality rule of its obligation names

**Exit:** `test/publish-research.spec.ts` shows `readerFor` giving a version with no nationality a nationality no
version of its obligation names when one does, and nothing when none does; the research spec asks the local API
as each reader `readerFor` builds for every version of Germany's and Turkey's files, and of a copy of Germany's
holding a group version beside an ungrouped one, and each is served its version's facts; that check was watched
failing with the change removed.

## Why

SB-234 writes the first obligation with a version for a nationality group beside one without: the nationalities
§41(1) AufenthV names, and every other visa-free reader. The publish's read-back (SB-232) would commit, push and
deploy that correctly and then report the second version missing, a failure it did not have, so the one command
the owner asked for would stop being trustworthy the first time a rule depends on nationality.

## What is wrong, read in the code

- `readerFor(rules, version)` in `scripts/publish-research.ts` builds the reader the read-back asks the deployed
  API as, from the version's own criteria: its status, situation, nationality, a named group's first member as
  the nationality, its place, and, for a version with no place whose obligation has a place version, a Land in
  which no rule names a place (SB-229).
- It gives a version with no nationality criterion no nationality. The resolver's `fitOne`
  (`src/rules/eligibility.ts`) returns `Detail.nationality` for a nationality or nationalityGroup criterion
  whenever the reader has said none, so a version of the same obligation for a nationality or a group is open
  for that reader. It would add a fact, so the answer is `needsDetail`, `to` is null, `servedFor` returns no
  facts, and the read-back reports every fact of the ungrouped version "not served". The obligation's place
  versions fail the same way, since their readers have no nationality either.
- Neither file has such an obligation yet: Turkey's charge exemption is a group version with no ungrouped
  sibling. And the read-back has only ever run live on Germany's cases, so no Turkish reader was ever asked.

## The change

1. **`readerFor`**: when the reader has no nationality and another version of the same obligation names a
   nationality or a nationality group, the reader's nationality is `xx`. ISO 3166 leaves `xx` to users, so no
   group lists it and no rule names it, and the read-back already asks `move(from: "xx")` with it as a country
   no rule is for. The resolver checks no nationality against a list: `rules.service.ts` reads a reader's groups
   from the memberships and nothing else. A version whose obligation names no nationality keeps a reader with
   none, so every reader built for the files as they are today is unchanged.
2. **What the read-back compares with is exported**, so a test asks exactly what it asks: `MOVE`, `shows`, and
   a version's expected facts, its own and those it takes from a wider version, moved from `main` into
   `expectedOf(rules, version)`, which `main` then calls.

## The tests

1. **`test/publish-research.spec.ts`**: on a copy of Germany's file with a group `spec.group` and a version of
   the D visa's federal criteria plus that group, `readerFor` gives the D visa's federal version and its Munich
   version `nationality: 'xx'`, and the group version the group's member; on Germany's own file the Munich reader
   stays `{ to, regions }`, as it is asserted today.
2. **`test/research-rules.e2e.spec.ts`**, once the files are loaded: for every version of Germany's and Turkey's
   files, the local API asked `MOVE` as `readerFor`'s reader serves every fact `expectedOf` gives, compared by
   `shows`. Then a copy of Germany's file with that group version is loaded, every version of it is asked the
   same way, and Germany's file is loaded again, `ownedBy('germany')` unchanged, as SB-225's spare place does.
3. **Planted**: the `xx` line removed. The unit test and the copy's sweep must fail, on the D visa's federal and
   Munich versions, while the real files' sweep still passes.

## If the real files' sweep fails

It asks Turkey's versions through the reader for the first time, so it may find a reader the resolver answers
with another question: a situation, since Turkey's company formation and work permit name one, or a parent
status. That is this defect in another dimension. If the cause is a line of `readerFor` like the one above, it is
fixed here; otherwise it is filed as its own card before anything else is done, and this card's sweep names the
version it cannot yet ask.

## Files

`scripts/publish-research.ts`, `test/publish-research.spec.ts`, `test/research-rules.e2e.spec.ts`; this plan,
beside the script.

## How it is checked

The two specs, lint, `lint:tsc` and the build, then the full API suite, the card having no parent task. The live
proof is SB-234's publish, whose read-back asks its visa-free versions through this reader.

## The steps I am least sure of

1. **`xx` as a nationality** the deployed API answers like any other, which the local sweep shows for the same
   resolver code and nothing more.
2. **"Another version names a nationality" without asking whether that version is otherwise open** for this
   reader. Giving `xx` to the reader of a version with no nationality criterion can never make that version stop
   fitting, so the broader rule is safe, only less minimal.
3. **Situation and parent statuses left to the sweep** rather than handled now, when the same shape of defect
   could exist for them.
