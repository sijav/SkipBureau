# SB-168, A rule can belong to a province or a state, not only a country

**Exit:** a rule stored for one region is returned for a reader connected to
that region and not for another, and a rule with no region is returned for both.
The connection is explicit, where the reader lives or where they work. Where a
transaction happens is SB-177.

## What the research decided, so this is not a guess

`RuleVersion` has `countryCode` and nothing below it. Ten rule cases (SB-167)
say what belongs underneath, and they say it in three different shapes:

1. **A region attaching its own charge to a national duty.** The Anmeldung
   deadline is federal and no Land may vary it, but Hamburg charges €16 for the
   registration under its own fee ordinance while Berlin, Munich, Düsseldorf,
   Wiesbaden and Freiburg charge nothing. A design allowing only a *note* on a
   national rule has nowhere to put that €16.
2. **A federal rule carrying its own regional variant.** Saxony's care
   insurance split is 2.3% employee and 1.3% employer where everywhere else is
   1.8 and 1.8, written into federal law.
3. **Who sets a rule is not who administers it.** Cologne's €26 trade
   registration fee is *North Rhine-Westphalia's* tariff, collected by the city.

And the trigger is not always residence: **Saxony's split follows the place of
employment.** Somebody living in Brandenburg and working in Dresden pays the
Saxon share. A region keyed on "where the reader lives" returns the wrong
answer for them, silently, which is the failure this product exists to avoid.

## What already exists, which the first version of this plan missed

The first version added `RuleVersion.regionCode` and
`RuleVersion.regionConnection` as nullable columns, a most-specific-wins of its
own, and a unique constraint for the one case it could not order. Reading the
rules code showed that all three already exist in another form, and DESIGN.md
says so in words: "Eligibility is child rows, not nullable columns ...
Specificity is set inclusion, not a count".

- **`EligibilityCriterion`** rows say who a version applies to. The schema's own
  comment on that model argues for rows over nullable columns: as columns "each
  one is another migration and another null to reason about".
- **`mostSpecific`** in `src/rules/eligibility.ts` orders matching versions by
  set inclusion. When neither of two matching versions covers the other,
  `RulesService.resolve` reports the obligation as ambiguous, for a person to
  decide, rather than picking one.
- **`skipbureau_rule_version_clash`**, created by the already applied migration
  `20260911200000_rule_history_is_append_only_throughout`, refuses two versions
  of one obligation and country whose criteria are the same set over
  overlapping dates. Different regions are different sets, so it needs no
  change, and that migration is not touched.

## The change

**Two dimensions, not two columns.** `EligibilityDimension` gains
`residenceRegion`, where the reader lives, which carries Hamburg's €16 for
registering a dwelling there, and `workRegion`, where they work, which carries
Saxony's split. Each criterion is valued by a region code.

**Not a third, for where a transaction happens.** The second version of this plan
had `transactionRegion`, and its check was right that it cannot work on a
profile: `resolve` applies one profile to every obligation in a country, so one
transaction region would put a Cologne business registration onto a Hamburg
address registration. The place of an act belongs to the question about that
act. That is SB-177, and the board's exit condition for this card was narrowed
to say so.

Then, with nothing new in selection:

- A version with `workRegion = DE-SN` strictly covers the national version,
  which has no criteria. A reader working in Saxony gets the Saxon split and
  everyone else gets the national one.
- A reader living in Saxony and working in Brandenburg, where one version is
  scoped by residence to Saxony and another by work to Brandenburg, matches
  both; neither covers the other, and the obligation comes back ambiguous.
- A version scoped to a nationality group and another scoped to a region are
  also incomparable, and also come back ambiguous. That is the safe answer and
  no precedence between dimensions is invented. What it asks of an editor: where
  a nationality and a region together decide one legal effect, the version
  carries both criteria; where they decide separate effects, they are separate
  obligations.
- A reader who has said nothing about a region matches no regional version. They
  get the national version, or nothing where no national version exists. See
  what this card does not do, below.

**`Region`**, a table: `code`, `countryCode` and `name`, with `RegionText` for
the name per locale, like `Country` and `CountryText`, so adding Turkey's 81
provinces or Germany's 16 Länder is rows and no code. Codes are ISO 3166-2,
`DE-SN` and `TR-35`, which carry their country in the code.

**A trigger, because a criterion's `value` is a plain string and cannot carry a
foreign key.** It refuses a region criterion whose value is not a region of the
version's own country, and refuses deleting a region, or changing its code,
while a criterion names it. Without it, a typo in a code is a rule that
silently never matches. It runs before the criterion row is written, when its
version already exists, so it needs no deferral.

**Two new migrations, and no applied migration is edited.**

1. `..._eligibility_by_region` adds the two enum values and nothing else.
2. `..._regions` creates `Region`, `RegionText` and the trigger, which compares
   a criterion's dimension against the new values.

PostgreSQL refuses to use an enum value inside the transaction that added it.
Whether a migration file runs as one transaction depends on how it is sent, and
the two plan checks disagreed with each other on that, so the values get a file
of their own and the question never arises.

**The profile holds regions as lists.** `Profile` in `eligibility.ts` gains
`residenceRegions` and `workRegions`, and `matchesProfile` accepts a region
criterion whose value is in the list. Lists, because `move(from, to)` resolves
two countries with one profile, and a mover lives somewhere in each: `TR-34`
and `DE-SN` together, where one value would leave the origin answered
nationally. A code names its country, so a Turkish code can never select a
German version. The `move` and `changes` queries take both lists as optional
arguments. No screen calls either query today, so the web changes only by
regenerating its types.

**A contradictory or unknown region is refused, not answered.** Two codes of
one country in the same list say the reader lives, or works, in two Länder at
once, which is input that contradicts itself, not a legal ambiguity to report
per obligation. A code that is not a `Region` row would match nothing and
quietly hand the reader the national rule, which is the silent fallback this
card exists to remove. So `RulesService` checks both before resolving anything:
at most one code per country in each list, and every code a known region. It
lives in the service rather than the resolver so that every caller of `resolve`,
`move` and `changes` is refused the same way, including SB-176 and SB-177 when
they come. `move` and `changes` each resolve twice, so they check once and then
resolve both sides without checking again. The service throws a small domain
error naming the offending codes, and the resolver turns it into a
`GraphQLError` whose `extensions.code` is `BAD_USER_INPUT`, so GraphQL stays at
the boundary. The fourth plan check read `@nestjs/apollo` 14's driver: with no
`formatError` in `AppModule` it rewrites only Nest's own `HttpException`s, so
that error reaches the client with its code and message, where a
`BadRequestException` would arrive as `BAD_REQUEST`.

**The seed** skips any country and obligation it has seeded once, so Saxony's
version would never be written beside the national one. Its check becomes the
country, the obligation and exactly the same set of criteria, the empty set
included. The seed is not run on a deployed database: the container runs the
migrations and `bootstrap`, which does not call it. A second run must add
nothing, and today it would not manage that for a reason older than this card:
`NationalityGroupMember` has no unique constraint, so `createMany` with
`skipDuplicates` inserts the three memberships again every time. The seed
checks for the same group, nationality and dates before inserting one, which
needs no migration. It gains the German Länder
the research names, a `pay-care-insurance` obligation, and the national and
Saxon versions of its split, from `research/agreed/germany/health-insurance.md`.

**What regions cannot hold yet**, recorded in `PHASE-NEXT.md` as a decision:
only first-level divisions. Germany sets some charges a newcomer meets by
municipality, the trade tax multiplier, dog tax and second home tax among them,
and Turkey's municipalities administer licences and fees. None is a researched
rule waiting to be stored, and a parent on `Region` is one nullable column when
one is. What that later work really needs is stable municipal identifiers and
the connection each charge follows.

Files: `prisma/schema.prisma`, the two migrations, `src/rules/eligibility.ts`,
`src/rules/rules.resolver.ts`, `prisma/seed.ts`, a new
`test/region.e2e.spec.ts`, `PHASE-NEXT.md`, and the committed GraphQL schema
and web types, which codegen regenerates.

## What this card does not do, and why

**It does not tell a reader who has not said where they work that the answer
depends on it.** Under strict matching, a Dresden resident who works in Dresden
and has only given their residence is told the national 1.8 and 1.8 split. The
first plan check called that a false answer, and it is.

It is SB-176, not part of this card, for three reasons. This card's exit
condition is that a rule with no region is returned for a reader connected to
no region, which that outcome would contradict. The same gap already exists for
nationality and situation: a reader who has not given a nationality gets
Germany's general residence permit rule where the EU one might apply, so the fix
is one outcome across every dimension rather than one for regions. And nothing
reads a regional answer until SB-154 builds the questions: guides use
`generalVersionAt`, which takes only versions with no criteria, and no screen
calls `move` or `changes`. SB-154 now waits for SB-176.

## The step I am least sure of

**The trigger's refusal on `Region`.** The plan checks settled what to refuse
and where. What is left is the one piece of SQL with a lasting consequence: a
region that a criterion names can never be deleted or recoded, and criteria of a
version that has started are history that can never be removed either. So once
a regional rule has been in force, its region is permanent. That is the same
decision the history triggers already make for obligations and groups, and I
believe it is right, but it means a code entered wrongly and used in force is a
correction by closing the version and recording a new one, never by fixing the
region.

## How it is checked

On PGlite, through the `move` and `changes` queries, in `region.e2e.spec.ts`:

- a version for one region is returned for a reader connected to it and not for
  a reader connected to another, and a version with no region is returned for
  both;
- Saxony: living in Brandenburg and working in Saxony gets the Saxon split,
  and living in Saxony and working in Brandenburg gets the national one;
- a reader matching a residence-scoped version and a work-scoped version of the
  same obligation gets ambiguous;
- a mover from Turkey with a Turkish region and a German one gets each country's
  regional version on its own side;
- two German codes in one list, and a code that is not a region, come back as
  an ordinary GraphQL error, `data` null, with `extensions.code`
  `BAD_USER_INPUT` and a message naming the codes;
- the trigger refuses a criterion naming another country's region, a code that
  does not exist, and deleting a region a criterion names, and the tables are
  read back afterwards rather than the refusal inferred from the error;
- the seed, run a second time on the same database, adds nothing and fails
  nothing, group memberships included, counted before and after.
