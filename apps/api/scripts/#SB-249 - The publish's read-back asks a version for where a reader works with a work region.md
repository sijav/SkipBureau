# SB-249, The publish's read-back asks a version for where a reader works with a work region

**Exit:** `test/publish-research.spec.ts` shows `readerFor` giving a work-region version its work region and a
version with no work region, beside one naming a work region, a Land in which no rule names one; the research spec's
sweep serves every version of a copy of Germany's file holding a work-region version beside a federal one; that
check was watched failing with the change removed.

## Why

SB-226 writes the first researched rule keyed on where a reader works: the care insurance split for employment
located in Saxony (§58 SGB XI). Without this, SB-242's sweep in the research spec, which the publish runs as a check,
fails on Germany's real file; and if it did not, the publish would commit, push and deploy correctly and then report a
failure it did not have.

## What is wrong, read in the code

- `readerFor` (`scripts/publish-research.ts`) copies a `residenceRegion` criterion into `reader.regions`, which `MOVE`
  passes as `toResidenceRegions`. A `workRegion` criterion is not copied, and `MOVE` declares no work regions, so a
  version for a work region is asked with none. The resolver's `treeFit` (`src/rules/eligibility.ts`) answers a place
  criterion the reader has given nothing for with the detail itself, so the version is open, the answer is
  needsDetail with `to` null, and the read-back reports every fact of it missing.
- A version with no work region, whose obligation has one that names a work region, is asked the same way and fails the
  same way, unless its reader says they work in a Land no work-region rule names. `readerFor` already does that for
  residence: a Land in which no rule names a place (SB-229).
- `widerOf`, which gives a place version the facts it takes from the version it narrows, counts only `residenceRegion`
  as a place, while the resolver counts both (`isPlace` in `eligibility.ts`, and the inheritance that filters out place
  criteria before comparing the rest). For a work-region version the read-back would check only its own facts, not
  those it inherits: no false failure, but less than it checks for a residence version.
- The seed's `pay-care-insurance` rows carry a `workRegion` criterion for Saxony, but the seed is not a research file
  and never deploys (`src/bootstrap.ts`), so the read-back has never met one.

## The change

1. `Reader` gains `workRegions`; `readerFor` copies a `workRegion` criterion into it.
2. A version with no work region, whose obligation has a version naming one, is given a work region: the first Land in
   Germany's file with no parent that no `workRegion` criterion of the obligation names or holds, chosen the way
   `elsewhere` is chosen for residence.
3. `MOVE` declares `$workRegions: [String!]` and passes `toWorkRegions: $workRegions`.
4. **What a version's reader must be served is computed by the resolver's own code, not a copy of it.** `answerOf` in
   `src/rules/rules.service.ts` completes a version from every standing version of the same scope (`scopeOf`) that it
   strictly covers (`strictlyCovers`), taking each key it does not state from the most specific of them that states it
   (`mostSpecific`); where they state a key differently the answer is disputed and the resolver serves the reader nothing
   for that obligation. `answerOf`, with its `Candidate` and `Answer` types, moves into an exported module,
   `src/rules/answer.ts`, which `rules.service.ts` imports, so every resolver test keeps proving it, and there gains the
   tie-break of step 5. The read-back then
   builds its candidates from the file: the obligation's versions **in force today** (`validFrom` on or before today, and
   `validTo`, where there is one, after it), each fact in the resolver's `Fact` shape with the page, name and read date
   its source gives, and trees from the file's own regions and statuses, each code to its parent, as `treesOf` builds them
   from the database. It asks only versions in force today, since the resolver answers nothing else today. A disputed
   answer is reported as a problem of the file; otherwise every fact of the answer must be served. `widerOf` and the
   approximation it made go away, and a version with a residence and a work region expects the facts of its residence-only
   and work-only wider versions, as the resolver serves them.
5. **One tie-break both paths know.** Where equally specific wider versions state a key with the same value, `answerOf`
   takes the first by `ruleVersionId`, which in the database is an id the file does not have, while `sameFact` ignores the
   page. The read-back compares the page, so it could expect another page than the one served (the third check). Those
   equal statements are now ordered by their page, its address, name and read date, and only then by version id, so the
   choice rests on what the deployed resolver and the read-back both hold. This changes what the resolver serves only in
   that tie, where its choice was the order ids happened to be created in, and there it changes two things: the page of
   the fact, and, because `noted()` takes an answer's notes from the versions its facts name, the note of the version
   that fact now comes from (the fourth check). A comparison between countries ignores both.

## The tests

1. **`test/publish-research.spec.ts`**: on a copy of Germany's file with a version of Anmeldung's federal criteria plus
   `workRegion` `DE-SN` and a fact of its own, `readerFor` gives that version `workRegions: ['DE-SN']` and a residence
   Land no rule names, and gives the federal Anmeldung version and Hamburg's a work region that is not `DE-SN`. On the
   same copy with a mixed version, `residenceRegion` `DE-HH` and `workRegion` `DE-SN`, stating one key of its own,
   `expectedOf` gives it that key, Hamburg's keys from Hamburg's version, the work version's key from the work version,
   and the federal keys neither states from the federal version. On Germany's own file the Munich reader stays
   `{ to, regions }`.
2. **`test/research-rules.e2e.spec.ts`**: SB-242's sweep also loads that copy, asks every version of it through
   `readerFor` and `expectedOf` as the read-back does, so the resolver itself confirms the mixed version's expected
   facts, and loads Germany's file again, `ownedBy('germany')` unchanged.
3. **Planted**: the work-region lines of `readerFor` removed, which the unit test and the copy's sweep must fail on the
   work, mixed and Anmeldung versions; and, separately, the read-back's answer made to keep only a version with no place,
   as `widerOf` did, which the unit test must fail on the mixed version.
4. **A dispute, a tie and time**: in the unit test, two wider versions of one scope stating one key differently, neither
   covering the other, make the read-back's answer disputed; two stating it equally on different pages make it take the
   page that sorts first; and a version whose `validFrom` is after today is not asked. The research spec's copy holds the
   tie too, the two versions with different pages and different notes, and asks the API for it: the answer serves the
   page that sorts first and the note of the version that page belongs to, which is also what the read-back expects.

## Files

`scripts/publish-research.ts`, `src/rules/answer.ts` (new), `src/rules/rules.service.ts`, `test/publish-research.spec.ts`,
`test/research-rules.e2e.spec.ts`; this plan, beside the script.

## How it is checked

The two specs, lint, `lint:tsc` and the build, then the full API suite, the card having no parent task. The live proof
is SB-226's publish, whose read-back asks its Saxony and federal care versions through this reader.

## The steps I am least sure of

1. **Moving `answerOf` out of `rules.service.ts`**, the resolver's core, for a publish script's sake: the full API suite is
   what says the move changed nothing, and a type the script cannot satisfy honestly would be the sign to stop.
2. **The Land given to a version with no work region**, which the first check found cannot make a work-region version
   open or matching, a rule below a Land included.
3. **A situation beside a version with none** would fail the read-back the same way; the first check advised against
   covering it here, so SB-226's plan must add that reader fallback if it writes that shape.

## Checks

1. **First check** (2026-09-15). Accepted: the `widerOf` generalisation did not match the resolver for a version with a
   residence and a work region, which inherits from its residence-only and work-only wider versions too; a mixed-place
   test and plant were added, and `expectedOf` was to use the resolver's `scopeOf`, `strictlyCovers` and `mostSpecific`,
   which the second check replaced with the shared `answerOf` itself. It
   confirmed the Land fallback and that `toWorkRegions` exists, and advised leaving a situation fallback to SB-226.
2. **Second check** (2026-09-15). Accepted, all three: a disputed answer makes the resolver serve nothing, so it is a
   problem the read-back reports, not one key left out; the resolver answers only versions in force at the moment asked,
   so the read-back builds its candidates, and asks, only from versions in force today; and rather than reimplement part
   of the resolver, `answerOf` moves to a module both use. It confirmed that a matching version's wider versions also
   match its reader, and that Germany's composed file holds every place its versions name.
3. **Third check** (2026-09-15). Accepted: `answerOf` breaks a tie between equal inherited facts by version id, which the
   database and the file spell differently, while the read-back compares pages; the tie is now ordered by page first, and
   tested in both specs. It confirmed the shared module, the versions in force today, the Land fallback and the file's
   trees, and again advised leaving a situation fallback to SB-226.
4. **Fourth check** (2026-09-15). Accepted: the tie-break also changes which note an answer carries, so the plan says so
   and the research spec's tie asserts the served page and its version's note. It confirmed that comparisons between
   countries ignore both, that both paths write the read date the same way, and the rest of the plan.
5. **Fifth check** (2026-09-15). It found the amendment right and the implementation meeting the exit, and asked for two
   wording fixes: `answerOf` does not move unchanged, since it gains the tie-break, and the first check's record named a
   superseded approach. Both are applied in its own words. No sixth check was run for them, since neither changes what is
   built; the reply to the owner says so.
