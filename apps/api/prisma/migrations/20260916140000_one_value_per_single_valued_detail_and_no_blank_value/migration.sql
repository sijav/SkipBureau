-- SB-181: a rule version cannot carry criteria no reader could satisfy. The reasoning is in this
-- folder's plan, `#SB-181 - A rule version cannot carry criteria no reader could satisfy.md`.

-- One. One value per single valued detail, per version.
--
-- A reader has one nationality, one role, one place where they live, one where they work, and one
-- residence status per country. A version naming two values of any of those can match nobody, and
-- fitToProfile calls it OPEN on that detail rather than impossible, so resolve asks the reader a
-- question no answer could settle. The existing unique triple
-- (ruleVersionId, dimension, value) permits it by construction, because the two values differ.
--
-- A partial unique index, NOT a trigger. A trigger that queries for a competing row is not
-- concurrency safe: two transactions inserting workRegion DE-SN and workRegion DE-BB at the same
-- time each see no competing row, both pass their check, and both commit. It would pass every test
-- in this repository and still admit the exact state this exists to prevent. The index makes the
-- second insert conflict, which is PostgreSQL's own mechanism for uniqueness over a subset of rows.
--
-- nationalityGroup is deliberately NOT in this list. fitOne resolves it as groups.has(value), and
-- one nationality can belong to several groups, so two group criteria on one version can both match
-- a real reader. Do not "complete" the list: the omission is the rule.

CREATE UNIQUE INDEX "EligibilityCriterion_one_value_per_single_valued_dimension"
  ON "EligibilityCriterion" ("ruleVersionId", "dimension")
  WHERE "dimension" IN ('nationality', 'situation', 'residenceRegion', 'workRegion', 'residenceStatus');

-- Two. A value that is not blank.
--
-- A criterion whose value is empty or only whitespace can never match anything, so the rule it
-- scopes silently never applies to anyone. Validated as it is added, so this migration is itself
-- the proof that the existing rows conform, and it fails loudly on deploy if they do not.

ALTER TABLE "EligibilityCriterion" ADD CONSTRAINT "EligibilityCriterion_value_is_not_blank"
  CHECK (btrim(value) <> '');
